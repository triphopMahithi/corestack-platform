package handlers

import (
	"context"
	"net/http"
	"time"

<<<<<<< HEAD
	"backend/models" // 🔁 เปลี่ยนเป็น path ของคุณจริงๆ

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
=======
	"backend/models" // เปลี่ยนเป็น module path ของโปรเจกต์คุณ

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
>>>>>>> main
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type CartHandler struct {
	Collection *mongo.Collection
}

<<<<<<< HEAD
=======
// สร้าง CartHandler
>>>>>>> main
func NewCartHandler(db *mongo.Database) *CartHandler {
	return &CartHandler{
		Collection: db.Collection("cart"),
	}
}

<<<<<<< HEAD
=======
type AddToCartInput struct {
	Username    string             `json:"username"`
	UserID      string             `json:"userId"`
	PackageName string             `json:"packageName"`
	StartAge    int                `json:"startAge"`
	EndAge      int                `json:"endAge"`
	Premium     models.PremiumInfo `json:"premium"`
}

>>>>>>> main
// GET /api/cart?userId=xxx
func (h *CartHandler) GetCart(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userId := c.Query("userId")
	if userId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "userId is required"})
		return
	}

	var cartItem models.CartItem
	err := h.Collection.FindOne(ctx, bson.M{"userId": userId}).Decode(&cartItem)
	if err == mongo.ErrNoDocuments {
<<<<<<< HEAD
		c.JSON(http.StatusOK, []models.CartEntry{})
=======
		c.JSON(http.StatusOK, []models.CartEntry{}) // ส่ง array ว่างกลับไป
>>>>>>> main
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, cartItem.Cart)
}

// POST /api/cart
func (h *CartHandler) AddToCart(c *gin.Context) {
<<<<<<< HEAD
	var input struct {
		Username    string             `json:"username"`
		UserID      string             `json:"userId"`
		PackageName string             `json:"packageName"`
		StartAge    int                `json:"startAge"`
		EndAge      int                `json:"endAge"`
		Premium     models.PremiumInfo `json:"premium"`
	}
=======
	var input AddToCartInput
>>>>>>> main

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

<<<<<<< HEAD
	// 🔁 Upsert: ถ้า user มีอยู่แล้ว จะ push รายการใหม่เข้า cart array
	filter := bson.M{"userId": input.UserID}
=======
	// สร้าง ObjectID ใหม่ให้ item ใน cart
	itemID := primitive.NewObjectID()

>>>>>>> main
	update := bson.M{
		"$set": bson.M{
			"userId":   input.UserID,
			"username": input.Username,
		},
		"$push": bson.M{
			"cart": bson.M{
<<<<<<< HEAD
=======
				"_id":         itemID,
>>>>>>> main
				"packageName": input.PackageName,
				"startAge":    input.StartAge,
				"endAge":      input.EndAge,
				"premium":     input.Premium,
				"dateAdded":   time.Now(),
			},
		},
	}
<<<<<<< HEAD
	opts := options.Update().SetUpsert(true)

	_, err := h.Collection.UpdateOne(ctx, filter, update, opts)
=======

	opts := options.Update().SetUpsert(true)
	_, err := h.Collection.UpdateOne(ctx, bson.M{"userId": input.UserID}, update, opts)
>>>>>>> main
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Added to cart"})
}

// DELETE /api/cart/:id?userId=xxx
<<<<<<< HEAD
// 🔁 ลบรายการหนึ่งจาก cart array ตาม packageName
func (h *CartHandler) DeleteFromCart(c *gin.Context) {
	userId := c.Query("userId")
	packageName := c.Param("id") // ใช้ packageName เป็น ID (หรือเปลี่ยนเป็น item _id ถ้ามี)

	if userId == "" || packageName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing userId or packageName"})
=======
func (h *CartHandler) DeleteFromCart(c *gin.Context) {
	userId := c.Query("userId")
	itemIDStr := c.Param("id") // ตอนนี้ id คือ ObjectID ของแต่ละรายการใน cart

	if userId == "" || itemIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing userId or item id"})
		return
	}

	itemID, err := primitive.ObjectIDFromHex(itemIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid item id"})
>>>>>>> main
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"userId": userId}
	update := bson.M{
		"$pull": bson.M{
<<<<<<< HEAD
			"cart": bson.M{"packageName": packageName},
		},
	}

	_, err := h.Collection.UpdateOne(ctx, filter, update)
=======
			"cart": bson.M{"_id": itemID},
		},
	}

	_, err = h.Collection.UpdateOne(ctx, filter, update)
>>>>>>> main
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Removed from cart"})
}
