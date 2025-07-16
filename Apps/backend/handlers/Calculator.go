package handlers

import (
	"backend/models"
	"context"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

// ฟังก์ชันคำนวณราคาเบี้ยประกันหลังจากใช้โปรโมชั่น
func CalculateDiscountedPrice(basePrice float64, promotion models.Promotion, packageId string, categoryId string) (float64, error) {
	// ถ้าเป็นโปรโมชั่นทั่วไป ให้คำนวณจาก DiscountPercentage
	if promotion.Type == "general" {
		// โปรโมชั่นทั่วไป ไม่มีเงื่อนไข packageId หรือ categoryId
		if promotion.PackageID != "" || promotion.CategoryID != "" {
			return 0, fmt.Errorf("โปรโมชั่นทั่วไปต้องไม่มี packageId หรือ categoryId")
		}
		// คำนวณส่วนลดจาก DiscountPercentage
		discount := (promotion.DiscountPercentage / 100) * basePrice
		return basePrice - discount, nil
	}

	// ถ้าเป็นโปรโมชั่นเฉพาะ categoryId
	if promotion.Type == "category" {
		// ตรวจสอบว่า categoryId ตรงกันหรือไม่
		if promotion.CategoryID != "" && promotion.CategoryID == categoryId {
			// คำนวณส่วนลด
			discount := (promotion.DiscountPercentage / 100) * basePrice
			return basePrice - discount, nil
		}
		return 0, fmt.Errorf("โปรโมชั่นเฉพาะ categoryId ไม่ตรง")
	}

	// ถ้าเป็นโปรโมชั่นเฉพาะ packageId
	if promotion.Type == "package" {
		// ตรวจสอบว่า packageId ตรงกันหรือไม่
		if promotion.PackageID != "" && promotion.PackageID == packageId {
			// คำนวณส่วนลด
			discount := (promotion.DiscountPercentage / 100) * basePrice
			return basePrice - discount, nil
		}
		return 0, fmt.Errorf("โปรโมชั่นเฉพาะ packageId ไม่ตรง")
	}

	// ถ้าไม่ตรงกับเงื่อนไขใดๆ
	return 0, fmt.Errorf("โปรโมชั่นไม่สามารถใช้งานได้")
}

// ฟังก์ชันคำนวณราคา
func CalculatePriceHandler(db *mongo.Database) gin.HandlerFunc {
	return func(c *gin.Context) {
		var request struct {
			PromotionName string  `json:"promotionName"`
			BasePrice     float64 `json:"basePrice"`
			PackageId     string  `json:"packageId"`
			CategoryId    string  `json:"categoryId"`
		}

		// รับข้อมูลจาก client
		if err := c.ShouldBindJSON(&request); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
			return
		}

		// ค้นหาข้อมูลโปรโมชั่นโดยใช้ชื่อ (promotionName)
		var promotion models.Promotion
		err := db.Collection("promotions").FindOne(context.Background(), bson.M{"name": request.PromotionName}).Decode(&promotion)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Promotion not found"})
			return
		}

		// คำนวณราคาเบี้ยประกันหลังใช้โปรโมชั่น
		discountedPrice, err := CalculateDiscountedPrice(request.BasePrice, promotion, request.PackageId, request.CategoryId)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// ส่งกลับราคาเบี้ยประกันหลังใช้โปรโมชั่น
		c.JSON(http.StatusOK, gin.H{
			"originalPrice":   request.BasePrice,
			"discountedPrice": discountedPrice,
		})
	}
}

/*
{
  "promotionName": "ลดหนัก ลดดี",
  "basePrice": 25500,
  "packageId": "health-happy-kid-1m",
  "categoryId": ""
}

*/
