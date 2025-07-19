package handlers

import (
	"context"
	"net/http"
	"time"

	"backend/models" // เปลี่ยนเป็น module path ของโปรเจกต์คุณ

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type CartHandler struct {
	Collection *mongo.Collection
}

// สร้าง CartHandler
func NewCartHandler(db *mongo.Database) *CartHandler {
	return &CartHandler{
		Collection: db.Collection("cart"),
	}
}

// โครงสร้าง input สำหรับ AddToCart
type AddToCartInput struct {
	Username    string             `json:"username"` // เปลี่ยนชื่อ field เป็น Username (ตัว U ใหญ่สำหรับ export)
	UserID      string             `json:"userId"`   // เพิ่ม UserID เพื่อเก็บ ID ของผู้ใช้
	PackageName string             `json:"packageName"`
	StartAge    int                `json:"startAge"`
	EndAge      int                `json:"endAge"`
	Premium     models.PremiumInfo `json:"premium"`
}

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
		c.JSON(http.StatusOK, []models.CartEntry{})
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
	var input struct {
		Username    string             `json:"username"`
		UserID      string             `json:"userId"`
		PackageName string             `json:"packageName"`
		StartAge    int                `json:"startAge"`
		EndAge      int                `json:"endAge"`
		Premium     models.PremiumInfo `json:"premium"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// 🔁 Upsert: ถ้า user มีอยู่แล้ว จะ push รายการใหม่เข้า cart array
	filter := bson.M{"userId": input.UserID}
	update := bson.M{
		"$set": bson.M{
			"userId":   input.UserID,
			"username": input.Username,
		},
		"$push": bson.M{
			"cart": bson.M{
				"packageName": input.PackageName,
				"startAge":    input.StartAge,
				"endAge":      input.EndAge,
				"premium":     input.Premium,
				"dateAdded":   time.Now(),
			},
		},
	}
	opts := options.Update().SetUpsert(true)

	_, err := h.Collection.UpdateOne(ctx, filter, update, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Added to cart"})
}

// DELETE /api/cart/:id?userId=xxx
// ลบรายการหนึ่งจาก cart array ตาม packageName
func (h *CartHandler) DeleteFromCart(c *gin.Context) {
	userId := c.Query("userId")
	packageName := c.Param("id") // ใช้ packageName เป็น ID (หรือเปลี่ยนเป็น item _id ถ้ามี)

	if userId == "" || packageName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing userId or packageName"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"userId": userId}
	update := bson.M{
		"$pull": bson.M{
			"cart": bson.M{"packageName": packageName},
		},
	}

	_, err := h.Collection.UpdateOne(ctx, filter, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Removed from cart"})
}
