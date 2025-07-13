package main

import (
	"backend/config"
	"backend/database"
	"backend/handlers"
	"log"
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.LoadConfig()
	client, err := database.ConnectToMongoDB(cfg.MongoURI)
	if err != nil {
		log.Fatal("MongoDB connection error", err)
	}
	db := client.Database(cfg.MongoDBName)
	database.UserCollection = db.Collection("users")

	// Gin setup
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:8081", "http://192.168.3.58:8081"}, // ใส่ origin ของ frontend
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	api := r.Group("/api")
	api.GET("/categories", handlers.GetCategoriesHandler(db))
	api.GET("/packages", handlers.GetPackagesHandler(db))
	authHandler := handlers.NewAuthHandler(cfg)
	api.GET("/auth/login/line", authHandler.LineLoginHandler)
	api.GET("/auth/callback", authHandler.HandleCallback)

	api.GET("/profile", handlers.AuthMiddleware(), func(c *gin.Context) {
		userId, _ := c.Get("userId")
		role, _ := c.Get("role")

		c.JSON(http.StatusOK, gin.H{
			"userId": userId,
			"role":   role,
		})
	})
	api.GET("/me", authHandler.GetMe)

	r.Run(":" + cfg.Port)
}
