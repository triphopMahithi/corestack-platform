package handlers

import (
	"backend/config"
	"backend/database"
	"backend/models"
	"backend/utils"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type AuthHandler struct {
	Config *config.Config
}

func NewAuthHandler(cfg *config.Config) *AuthHandler {
	return &AuthHandler{Config: cfg}
}

// GET /api/auth/login/line
func (h *AuthHandler) LineLoginHandler(c *gin.Context) {
	state := utils.GenerateSecureState()

	// ✅ Step 2: เก็บ state ลง session
	session := sessions.Default(c)
	session.Set("oauthState", state)
	if err := session.Save(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save session"})
		return
	}

	authURL := fmt.Sprintf(
		"https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=%s&redirect_uri=%s&state=%s&scope=%s",
		h.Config.CHANNEL_ID,
		h.Config.REDIRECT_URI,
		state,
		"profile openid email",
	)
	c.Redirect(http.StatusFound, authURL)
}

// GET /api/me
func (h *AuthHandler) GetMe(c *gin.Context) {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing token"})
		return
	}

	tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
	claims, err := utils.ParseJWT(tokenStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
		return
	}

	var user models.User
	err = database.UserCollection.FindOne(context.TODO(), bson.M{"lineUserId": claims.UserID}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"userId":   user.LineUserID,
		"username": user.Username,
		"role":     user.Role,
	})
	log.Printf(">>> GetMe - claims.UserID = %s", claims.UserID)
	log.Printf(">>> GetMe - user: %+v", user)
}

func (h *AuthHandler) HandleCallback(c *gin.Context) {
	session := sessions.Default(c)
	storedState := session.Get("oauthState")
	queryState := c.Query("state")

	if storedState == nil || queryState != storedState {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid state (CSRF protection)"})
		return
	}

	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing code from LINE"})
		return
	}

	// ✅ Step 1: ขอ access token จาก LINE
	token, err := h.getAccessToken(code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get LINE access token"})
		return
	}

	// ✅ Step 2: ขอข้อมูลโปรไฟล์ผู้ใช้จาก LINE
	profile, err := h.getUserProfile(token.AccessToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch LINE profile"})
		return
	}

	// ✅ Step 3: ตรวจสอบหรือสร้าง user ใน MongoDB
	ctx := context.TODO()
	now := time.Now()
	var user models.User

	err = database.UserCollection.FindOne(ctx, bson.M{"lineUserId": profile.UserID}).Decode(&user)
	if err == mongo.ErrNoDocuments {
		// ไม่พบ user → สร้างใหม่
		user = models.User{
			Username:   profile.DisplayName,
			LineUserID: profile.UserID,
			Role:       "user",
			Provider:   "Line",
			CreatedAt:  now,
			UpdatedAt:  now,
			LastLogin:  now,
		}
		if _, err := database.UserCollection.InsertOne(ctx, user); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create new user"})
			return
		}
	} else if err == nil {
		// ✅ พบ user เดิม → อัปเดต lastLogin
		update := bson.M{
			"$set": bson.M{
				"lastLogin":  now,
				"updatedAt":  now,
				"lastIP":     c.ClientIP(),
				"lastDevice": c.Request.UserAgent(),
			},
			"$inc": bson.M{"loginCount": 1},
		}
		if _, err := database.UserCollection.UpdateOne(ctx, bson.M{"_id": user.ID}, update); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user login info"})
			return
		}
	} else {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// ✅ Step 4: สร้าง JWT จาก LineUserID + Role
	jwtToken, err := utils.GenerateJWT(user.LineUserID, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate JWT"})
		return
	}

	// ✅ Step 5: Redirect กลับไปยัง frontend พร้อม token, userId, username, role
	redirectURL := fmt.Sprintf(
		"%s/login/success?token=%s&userId=%s&username=%s&role=%s",
		h.Config.FRONTEND_URL,
		url.QueryEscape(jwtToken),
		url.QueryEscape(user.LineUserID),
		url.QueryEscape(user.Username),
		url.QueryEscape(user.Role),
	)
	c.Redirect(http.StatusFound, redirectURL)
}

// --- Internal helpers ---
type tokenResponse struct {
	AccessToken string `json:"access_token"`
	IDToken     string `json:"id_token"`
}

func (h *AuthHandler) getAccessToken(code string) (*tokenResponse, error) {
	data := fmt.Sprintf(
		"grant_type=authorization_code&code=%s&redirect_uri=%s&client_id=%s&client_secret=%s",
		code,
		h.Config.REDIRECT_URI,
		h.Config.CHANNEL_ID,
		h.Config.LINE_LOGIN_CHANNEL_SECRET,
	)
	req, err := http.NewRequest("POST", "https://api.line.me/oauth2/v2.1/token", bytes.NewBufferString(data))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	var token tokenResponse
	err = json.Unmarshal(body, &token)
	return &token, err
}

type userProfile struct {
	UserID      string `json:"userId"`
	DisplayName string `json:"displayName"`
	PictureURL  string `json:"pictureUrl"`
}

func (h *AuthHandler) getUserProfile(accessToken string) (*userProfile, error) {
	req, _ := http.NewRequest("GET", "https://api.line.me/v2/profile", nil)
	req.Header.Set("Authorization", "Bearer "+accessToken)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	var profile userProfile
	err = json.Unmarshal(body, &profile)
	return &profile, err
}

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Missing Authorization header"})
			return
		}

		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
		claims, err := utils.ParseJWT(tokenStr)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			return
		}

		// ใส่ข้อมูลลง context
		c.Set("userId", claims.UserID)
		c.Set("role", claims.Role)
		c.Next()
	}
}
