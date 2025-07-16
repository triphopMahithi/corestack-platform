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
	// setup
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

	// Cross-origin resource sharing (CORS)
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:8081", "http://192.168.3.58:8081"}, // ใส่ origin ของ frontend
		AllowMethods:     []string{"GET", "POST", "OPTIONS", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// route
	api := r.Group("/api")

	// Show data
	api.GET("/categories", handlers.GetCategoriesHandler(db))
	api.GET("/packages", handlers.GetPackagesHandler(db))

	// Query
	api.POST("/packages", handlers.CreatePackageHandler(db))
	api.POST("/packages/delete", handlers.DeletePackageHandler(db))

	api.POST("/packages/add-pricing", handlers.AddPricingToPackageHandler(db))
	api.POST("/packages/delete-pricing", handlers.DeletePricingFromPackageHandler(db))

	r.GET("/api/promotions", handlers.GetPromotionsHandler(db))
	r.POST("/api/promotions", handlers.AddPromotionHandler(db))
	r.POST("/api/calculate-price", handlers.CalculatePriceHandler(db))
	r.DELETE("/api/promotions/:id", handlers.DeletePromotionHandler(db))
	// Authentication
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

	// Port
	r.Run(":" + cfg.Port)
}
