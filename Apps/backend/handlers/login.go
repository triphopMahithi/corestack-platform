package handlers

import (
	"backend/models"
	"backend/utils"
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

func updateUserLoginStats(db *mongo.Database, userID primitive.ObjectID, c *gin.Context) error {
	_, err := db.Collection("users").UpdateOne(
		context.TODO(),
		bson.M{"_id": userID},
		bson.M{"$set": bson.M{
			"lastLogin":    time.Now(),
			"lastIP":       c.ClientIP(),
			"lastDevice":   c.Request.UserAgent(),
			"lastActivity": time.Now(),
		}, "$inc": bson.M{"loginCount": 1}},
	)
	return err
}
func LoginHandler(db *mongo.Database) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input struct {
			Username string `json:"username"`
			Password string `json:"password"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
			return
		}

		username := strings.TrimSpace(input.Username)
		password := strings.TrimSpace(input.Password)

		if username == "" || password == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ชื่อผู้ใช้และรหัสผ่านห้ามเว้นว่าง"})
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		var user models.User
		err := db.Collection("users").FindOne(ctx, bson.M{
			"username": username,
			"provider": "local",
		}).Decode(&user)
		if err != nil {
			// ไม่ระบุว่า username หรือ password ผิด เพื่อความปลอดภัย
			time.Sleep(500 * time.Millisecond) // ป้องกัน timing attack
			c.JSON(http.StatusUnauthorized, gin.H{"error": "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"})
			return
		}

		err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
		if err != nil {
			time.Sleep(500 * time.Millisecond) // ลดความเร็ว brute-force
			c.JSON(http.StatusUnauthorized, gin.H{"error": "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"})
			return
		}

		// อัปเดตข้อมูลการเข้าใช้งาน
		_ = updateUserLoginStats(db, user.ID, c)

		// สร้าง JWT Token
		token, err := utils.GenerateJWT(user.ID.Hex(), user.Role)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถสร้างโทเค็นได้"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"token":    token,
			"userId":   user.ID.Hex(),
			"username": user.Username,
			"role":     user.Role,
		})
	}
}
