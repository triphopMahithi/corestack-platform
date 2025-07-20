package handlers

import (
	"context"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

type RegisterInput struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type User struct {
	Username  string    `bson:"username"`
	Email     string    `bson:"email"`
	Password  string    `bson:"password"`
	Role      string    `bson:"role"`
	Provider  string    `bson:"provider"`
	CreatedAt time.Time `bson:"createdAt"`

	// ข้อมูลพฤติกรรม/การใช้งาน
	LastLogin    time.Time `bson:"lastLogin"`
	LoginCount   int       `bson:"loginCount"`
	LastIP       string    `bson:"lastIP"`
	LastDevice   string    `bson:"lastDevice"`
	IsActive     bool      `bson:"isActive"`
	LastActivity time.Time `bson:"lastActivity"`
}

func RegisterHandler(db *mongo.Database) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input RegisterInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		userCol := db.Collection("users")

		// ตรวจสอบ username ซ้ำ
		var existingUser User
		if err := userCol.FindOne(ctx, bson.M{"username": strings.TrimSpace(input.Username)}).Decode(&existingUser); err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "ชื่อผู้ใช้นี้มีอยู่แล้ว"})
			return
		}

		// ตรวจสอบ email ซ้ำ
		if err := userCol.FindOne(ctx, bson.M{"email": strings.TrimSpace(input.Email)}).Decode(&existingUser); err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "อีเมลนี้มีอยู่แล้ว"})
			return
		}

		// แฮชรหัสผ่าน
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), 12)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถเข้ารหัสรหัสผ่านได้"})
			return
		}

		now := time.Now()
		newUser := User{
			Username:     input.Username,
			Email:        input.Email,
			Password:     string(hashedPassword),
			Provider:     "local",
			Role:         "user",
			CreatedAt:    now,
			LastLogin:    now,
			LastActivity: now,
			LoginCount:   0,
			IsActive:     true,
		}

		_, err = userCol.InsertOne(ctx, newUser)
		if err != nil {
			log.Println("Register error:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "เกิดข้อผิดพลาดในการสมัคร"})
			return
		}

		c.JSON(http.StatusCreated, gin.H{"message": "สมัครสมาชิกสำเร็จ"})
	}
}
