package handlers

import (
	"context"
	"net/http"
	"time"

	"backend/models" // เปลี่ยนเป็น module path ของโปรเจกต์คุณ

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
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

// GET /api/cart
func (h *CartHandler) GetCart(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cur, err := h.Collection.Find(ctx, bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer cur.Close(ctx)

	var items []models.CartItem
	for cur.Next(ctx) {
		var item models.CartItem
		if err := cur.Decode(&item); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		items = append(items, item)
	}

	c.JSON(http.StatusOK, items)
}

// POST /api/cart
func (h *CartHandler) AddToCart(c *gin.Context) {
	var input AddToCartInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// validation กัน field ว่าง
	if input.Username == "" || input.PackageName == "" || input.Premium.Annual <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required fields"})
		return
	}

	newItem := models.CartItem{
		Username:    input.Username, // เปลี่ยนจาก userId → Username
		UserID:      input.UserID,
		PackageName: input.PackageName,
		StartAge:    input.StartAge,
		EndAge:      input.EndAge,
		Premium:     input.Premium,
		DateAdded:   time.Now(),
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	res, err := h.Collection.InsertOne(ctx, newItem)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// แปลง InsertedID เป็น string เพื่อ return ให้ frontend
	if oid, ok := res.InsertedID.(primitive.ObjectID); ok {
		newItem.ID = oid.Hex()
	}

	c.JSON(http.StatusOK, newItem)
}

// DELETE /api/cart/:id
func (h *CartHandler) DeleteFromCart(c *gin.Context) {
	id := c.Param("id")
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err = h.Collection.DeleteOne(ctx, bson.M{"_id": objID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
}
