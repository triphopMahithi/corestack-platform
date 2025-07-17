package main

import (
	"backend/config"
	"backend/database"
	"backend/handlers"
	"log"
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
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

	// Middleware สำหรับ session
	store := cookie.NewStore([]byte(cfg.SECRET_KEY))
	r.Use(sessions.Sessions("mysession", store))

	// ✅ CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:8081", "http://192.168.3.58:8081"}, // ใส่ origin ของ frontend
		AllowMethods:     []string{"GET", "POST", "OPTIONS", "DELETE"},
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

	//  เพิ่ม cart handler
	cartHandler := handlers.NewCartHandler(db)
	api.GET("/cart", cartHandler.GetCart)
	api.POST("/cart", cartHandler.AddToCart)
	api.DELETE("/cart/:id", cartHandler.DeleteFromCart)

	r.Run(":" + cfg.Port)
}
