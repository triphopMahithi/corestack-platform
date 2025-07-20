package handlers

import (
	"backend/models"
	"context"
	"fmt"
	"net/http"
	"sort"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func GetPackagesHandler(db *mongo.Database) gin.HandlerFunc {
	return func(c *gin.Context) {
		var results []models.Package
		cursor, err := db.Collection("packages").Find(context.Background(), bson.M{})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer cursor.Close(context.Background())

		for cursor.Next(context.Background()) {
			var p models.Package
			if err := cursor.Decode(&p); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			results = append(results, p)
		}

		c.JSON(http.StatusOK, results)
	}
}

func SearchPackagesHandler(db *mongo.Database) gin.HandlerFunc {
	return func(c *gin.Context) {
		query := c.DefaultQuery("query", "") // รับค่าค้นหาจาก URL (เช่น `?query=health`)

		// ใช้ regex ในการค้นหาชื่อแพ็กเกจ
		filter := bson.M{
			"name": bson.M{
				"$regex":   query,
				"$options": "i", // "i" คือการค้นหาที่ไม่สนใจตัวพิมพ์เล็ก/ใหญ่
			},
		}

		// ค้นหาแพ็กเกจจากฐานข้อมูล
		var results []models.Package
		cursor, err := db.Collection("packages").Find(context.Background(), filter)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer cursor.Close(context.Background())

		for cursor.Next(context.Background()) {
			var p models.Package
			if err := cursor.Decode(&p); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			results = append(results, p)
		}

		c.JSON(http.StatusOK, results)
	}
}

// เพิ่มแพ็กเกจใหม่พร้อมการเรียงลำดับราคา
func CreatePackageHandler(db *mongo.Database) gin.HandlerFunc {
	return func(c *gin.Context) {
		var newPackage models.Package

		// Bind JSON request body ไปยัง struct Package
		if err := c.ShouldBindJSON(&newPackage); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid data"})
			return
		}

		// เรียงลำดับ pricing ตาม ageFrom (จากน้อยไปหามาก)
		sort.SliceStable(newPackage.Pricing, func(i, j int) bool {
			return newPackage.Pricing[i].AgeFrom < newPackage.Pricing[j].AgeFrom
		})

		// บันทึกแพ็กเกจใหม่ลง MongoDB
		result, err := db.Collection("packages").InsertOne(context.Background(), newPackage)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถเพิ่มแพ็กเกจได้"})
			return
		}

		// แปลง ObjectID เป็น string ก่อนส่งกลับ
		newPackage.ID = result.InsertedID.(primitive.ObjectID)

		c.JSON(http.StatusOK, gin.H{
			"message": "เพิ่มแพ็กเกจใหม่สำเร็จ",
			"package": newPackage,
		})
	}
}

// ฟังก์ชันลบแพ็กเกจตามชื่อ
func DeletePackageHandler(db *mongo.Database) gin.HandlerFunc {
	return func(c *gin.Context) {
		// รับค่า ID จาก URL
		packageID := c.Param("id")
		if packageID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Package ID is required"})
			return
		}

		// แปลง string ID เป็น ObjectID
		objectID, err := primitive.ObjectIDFromHex(packageID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ObjectID"})
			return
		}

		// ลบแพ็กเกจจากฐานข้อมูล
		result, err := db.Collection("packages").DeleteOne(context.Background(), bson.M{"_id": objectID})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete package"})
			return
		}

		if result.DeletedCount == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "Package not found"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Package deleted successfully"})
	}
}

// ฟังก์ชันเพิ่ม/อัปเดต pricing ตามชื่อแพ็กเกจ
func AddPricingToPackageHandler(db *mongo.Database) gin.HandlerFunc {
	return func(c *gin.Context) {
		// รับค่าจาก Body
		var pricingData struct {
			Name    string  `json:"name"`
			AgeFrom int     `json:"ageFrom"`
			AgeTo   int     `json:"ageTo"`
			Female  float64 `json:"female"`
			Male    float64 `json:"male"`
		}

		// Bind ข้อมูล JSON ที่ส่งมาจาก client
		if err := c.ShouldBindJSON(&pricingData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid data"})
			return
		}

		// ค้นหาแพ็กเกจที่ตรงกับชื่อ
		var packageToUpdate models.Package
		err := db.Collection("packages").FindOne(c, bson.M{"name": pricingData.Name}).Decode(&packageToUpdate)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบแพ็กเกจที่มีชื่อ " + pricingData.Name})
			return
		}

		// เพิ่ม pricing ใหม่ใน array pricing
		newPricing := models.Pricing{
			AgeFrom: pricingData.AgeFrom,
			AgeTo:   pricingData.AgeTo,
			Female:  pricingData.Female,
			Male:    pricingData.Male,
		}

		// อัปเดต pricing ใหม่ลงใน array pricing
		_, err = db.Collection("packages").UpdateOne(
			c,
			bson.M{"name": pricingData.Name}, // ค้นหาจากชื่อ
			bson.M{
				"$push": bson.M{
					"pricing": newPricing, // เพิ่มข้อมูลใหม่ลงใน pricing
				},
			},
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถเพิ่มราคาได้"})
			return
		}

		// เรียงลำดับ pricing ตาม AgeFrom (จากน้อยไปหามาก)
		sort.SliceStable(packageToUpdate.Pricing, func(i, j int) bool {
			return packageToUpdate.Pricing[i].AgeFrom < packageToUpdate.Pricing[j].AgeFrom
		})

		// อัปเดตข้อมูลใน MongoDB โดยการจัดเรียง pricing ใหม่
		_, err = db.Collection("packages").UpdateOne(
			c,
			bson.M{"name": pricingData.Name}, // ค้นหาจากชื่อ
			bson.M{
				"$set": bson.M{
					"pricing": packageToUpdate.Pricing, // อัปเดต pricing ใหม่ที่เรียงแล้ว
				},
			},
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถอัปเดตราคาได้หลังจากเรียงลำดับ"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "เพิ่ม pricing สำเร็จและเรียงลำดับตามอายุ"})
	}
}

// ฟังก์ชันลบ pricing จากแพ็กเกจตามชื่อแพ็กเกจ
func DeletePricingFromPackageHandler(db *mongo.Database) gin.HandlerFunc {
	return func(c *gin.Context) {
		// รับค่าจาก Body
		var pricingData struct {
			Name    string `json:"name"`
			AgeFrom int    `json:"ageFrom"`
			AgeTo   int    `json:"ageTo"`
		}

		// Bind ข้อมูล JSON ที่ส่งมาจาก client
		if err := c.ShouldBindJSON(&pricingData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid data"})
			return
		}

		// ค้นหาแพ็กเกจที่ตรงกับชื่อ
		var packageToUpdate models.Package
		err := db.Collection("packages").FindOne(c, bson.M{"name": pricingData.Name}).Decode(&packageToUpdate)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบแพ็กเกจที่มีชื่อ " + pricingData.Name})
			return
		}

		// ใช้ $pull เพื่อลบ pricing ที่ตรงกับ ageFrom และ ageTo
		_, err = db.Collection("packages").UpdateOne(
			c,
			bson.M{"name": pricingData.Name}, // ค้นหาจากชื่อ
			bson.M{
				"$pull": bson.M{
					"pricing": bson.M{
						"ageFrom": pricingData.AgeFrom,
						"ageTo":   pricingData.AgeTo,
					},
				},
			},
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถลบราคาได้"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "ลบ pricing สำเร็จ"})
	}
}

// ฟังก์ชันสำหรับการลบโปรโมชั่น
func DeleteOnePackage(db *mongo.Database) gin.HandlerFunc {
	return func(c *gin.Context) {
		// รับ promotionId จาก URL parameter
		promotionID := c.Param("id")

		// ตรวจสอบว่า promotionId ที่ส่งมามีค่า
		if promotionID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Package ID is required"})
			return
		}

		// แปลง promotionID จาก string เป็น primitive.ObjectID
		id, err := primitive.ObjectIDFromHex(promotionID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Package ID format"})
			return
		}

		// เชื่อมต่อกับ MongoDB collection ที่ชื่อ "promotions"
		collection := db.Collection("packages")

		// ลบโปรโมชั่นจากฐานข้อมูล
		filter := bson.M{"_id": id}
		result, err := collection.DeleteOne(context.Background(), filter)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete Package"})
			return
		}

		if result.DeletedCount == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "Package not found"})
			return
		}

		// ส่งผลลัพธ์เมื่อการลบสำเร็จ
		c.JSON(http.StatusOK, gin.H{"message": "Package deleted successfully"})
	}
}

// ฟังก์ชันเพิ่มโปรโมชั่น
func AddPromotionHandler(db *mongo.Database) gin.HandlerFunc {
	return func(c *gin.Context) {
		var promotion models.Promotion

		// รับข้อมูล JSON จาก frontend
		if err := c.ShouldBindJSON(&promotion); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
			return
		}

		// ตรวจสอบประเภทของโปรโมชั่น
		if promotion.Type != "general" && promotion.Type != "package" && promotion.Type != "category" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid promotion type"})
			return
		}

		// ตรวจสอบข้อมูลโปรโมชั่นเพิ่มเติม เช่น วันเริ่มต้นและสิ้นสุด
		if promotion.ValidFrom == "" || promotion.ValidTo == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Please provide valid dates"})
			return
		}

		// สร้างโปรโมชั่นใหม่
		collection := db.Collection("promotions")
		result, err := collection.InsertOne(context.Background(), promotion)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to insert promotion"})
			return
		}

		// เพิ่ม _id ที่ MongoDB สร้างให้ลงในข้อมูลโปรโมชั่น
		promotion.ID = result.InsertedID.(primitive.ObjectID) // Type assertion

		// ส่งข้อมูลโปรโมชั่นที่สร้างใหม่พร้อม _id กลับไปที่ frontend
		c.JSON(http.StatusOK, gin.H{"message": "Promotion added successfully", "promotion": promotion})
	}
}

// ฟังก์ชันดึงข้อมูลโปรโมชั่นทั้งหมดจากฐานข้อมูล
func GetPromotionsHandler(db *mongo.Database) gin.HandlerFunc {
	return func(c *gin.Context) {
		// ค้นหาข้อมูลโปรโมชั่นทั้งหมด
		var promotions []models.Promotion
		cursor, err := db.Collection("promotions").Find(context.Background(), bson.M{})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to fetch promotions: %v", err)})
			return
		}
		defer cursor.Close(context.Background())

		// อ่านข้อมูลจาก cursor และเก็บลงใน slice promotions
		for cursor.Next(context.Background()) {
			var promotion models.Promotion
			if err := cursor.Decode(&promotion); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to decode promotion: %v", err)})
				return
			}
			promotions = append(promotions, promotion)
		}

		// ถ้ามีข้อผิดพลาดจากการดึงข้อมูล
		if err := cursor.Err(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Cursor error: %v", err)})
			return
		}

		// ส่งข้อมูลโปรโมชั่นทั้งหมดกลับไปยัง client
		c.JSON(http.StatusOK, promotions)
	}
}

// ฟังก์ชันสำหรับการลบโปรโมชั่น
func DeletePromotionHandler(db *mongo.Database) gin.HandlerFunc {
	return func(c *gin.Context) {
		// รับ promotionId จาก URL parameter
		promotionID := c.Param("id")

		// ตรวจสอบว่า promotionId ที่ส่งมามีค่า
		if promotionID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Promotion ID is required"})
			return
		}

		// แปลง promotionID จาก string เป็น primitive.ObjectID
		id, err := primitive.ObjectIDFromHex(promotionID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Promotion ID format"})
			return
		}

		// เชื่อมต่อกับ MongoDB collection ที่ชื่อ "promotions"
		collection := db.Collection("promotions")

		// ลบโปรโมชั่นจากฐานข้อมูล
		filter := bson.M{"_id": id}
		result, err := collection.DeleteOne(context.Background(), filter)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete promotion"})
			return
		}

		if result.DeletedCount == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "Promotion not found"})
			return
		}

		// ส่งผลลัพธ์เมื่อการลบสำเร็จ
		c.JSON(http.StatusOK, gin.H{"message": "Promotion deleted successfully"})
	}
}
