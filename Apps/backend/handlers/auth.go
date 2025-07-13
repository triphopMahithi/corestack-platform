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
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

type AuthHandler struct {
	Config *config.Config
}

func NewAuthHandler(cfg *config.Config) *AuthHandler {
	return &AuthHandler{Config: cfg}
}

// GET /api/auth/login/line
func (h *AuthHandler) LineLoginHandler(c *gin.Context) {
	// #TODO: เพิ่มความปลอดภัยในการเข้ารหัส state โดยใช้ crypto เป็นต้น
	state := "secure_random_state"
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

// #TODO: เพื่อความปลอดภัยของผู้ใช้ควรทำ JWT กับ Middleware
// func (h *AuthHandler) HandleCallback(c *gin.Context) {
//
// 	code := c.Query("code")
// 	if code == "" {
// 		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing code"})
// 		return
// 	}
//
// 	// Step 1: ดึง access token จาก LINE
// 	token, err := h.getAccessToken(code)
// 	if err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get token"})
// 		return
// 	}
//
// 	// Step 2: ดึง user profile จาก LINE ด้วย access token
// 	profile, err := h.getUserProfile(token.AccessToken)
// 	if err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get profile"})
// 		return
// 	}
//
// 	// Step 3: เตรียมข้อมูลผู้ใช้แบบ struct
// 	user := models.User{
// 		Username:   profile.DisplayName,
// 		LineUserID: profile.UserID,
// 		Role:       "user", // ตั้งค่า role พื้นฐาน
// 	}
//
// 	// Step 4: Save หรือ Update ลง MongoDB พร้อม timestamps
// 	err = database.SaveOrUpdateUserWithTimestamp(user, database.UserCollection)
// 	if err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save user to database"})
// 		return
// 	}
//
// 	jwtToken, err := utils.GenerateJWT(profile.UserID, "user")
// 	if err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
// 		return
// 	}
//
// 	// Step 5: Redirect ไปยัง frontend (แนะนำให้ใช้ JWT หรือ session ถ้าระบบจริง)
// 	// redirect พร้อม JWT token ไป frontend
// 	//redirectURL := fmt.Sprintf("%s/login/success?token=%s", h.Config.FRONTEND_URL, jwtToken)
// 	redirectURL := fmt.Sprintf("%s/login/success?token=%s&role=%s", h.Config.FRONTEND_URL, jwtToken, user.Role)
// 	c.Redirect(http.StatusFound, redirectURL)
//
// }

func (h *AuthHandler) HandleCallback(c *gin.Context) {
	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing code"})
		return
	}

	// Step 1: ดึง access token จาก LINE
	token, err := h.getAccessToken(code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get token"})
		return
	}

	// Step 2: ดึง user profile จาก LINE ด้วย access token
	profile, err := h.getUserProfile(token.AccessToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get profile"})
		return
	}

	// Step 3: ตรวจสอบว่า user มีอยู่แล้วหรือไม่
	var existing models.User
	err = database.UserCollection.FindOne(context.TODO(), bson.M{"lineUserId": profile.UserID}).Decode(&existing)

	now := time.Now()
	if err == nil {
		// ✅ พบ user เดิม → อัปเดต LastLogin และ UpdatedAt
		existing.LastLogin = now
		existing.UpdatedAt = now
		_, err = database.UserCollection.ReplaceOne(context.TODO(),
			bson.M{"_id": existing.ID}, existing)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
			return
		}
	} else {
		// ❌ ไม่พบ user เดิม → สร้างใหม่
		newUser := models.User{
			Username:   profile.DisplayName,
			LineUserID: profile.UserID,
			Role:       "user", // ค่าเริ่มต้น หรือจะตั้งเงื่อนไขพิเศษที่นี่
			CreatedAt:  now,
			UpdatedAt:  now,
			LastLogin:  now,
		}
		_, err = database.UserCollection.InsertOne(context.TODO(), newUser)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
			return
		}
		existing = newUser // ใช้สำหรับ JWT ด้านล่าง
	}

	// Step 4: สร้าง JWT
	jwtToken, err := utils.GenerateJWT(existing.LineUserID, existing.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Step 5: Redirect ไป frontend พร้อม JWT และ role
	redirectURL := fmt.Sprintf("%s/login/success?token=%s&role=%s", h.Config.FRONTEND_URL, jwtToken, existing.Role)
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
