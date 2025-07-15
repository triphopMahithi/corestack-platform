package handlers

import (
	"backend/models"
	"context"
	"net/http"
	"sort"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
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

		// ตรวจสอบว่า ID ของแพ็กเกจมีอยู่แล้วในฐานข้อมูลหรือไม่
		var existingPackage models.Package
		err := db.Collection("packages").FindOne(c, bson.M{"id": newPackage.ID}).Decode(&existingPackage)
		if err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "แพ็กเกจนี้มีอยู่แล้ว"})
			return
		}

		// บันทึกแพ็กเกจใหม่ลง MongoDB
		_, err = db.Collection("packages").InsertOne(c, newPackage)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถเพิ่มแพ็กเกจได้"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "เพิ่มแพ็กเกจใหม่สำเร็จ"})
	}
}

// ฟังก์ชันลบแพ็กเกจตามชื่อ
func DeletePackageHandler(db *mongo.Database) gin.HandlerFunc {
	return func(c *gin.Context) {
		// รับค่าจาก Body
		var requestData struct {
			Name string `json:"name"` // ชื่อแพ็กเกจที่ต้องการลบ
		}

		// Bind ข้อมูล JSON ที่ส่งมาจาก client
		if err := c.ShouldBindJSON(&requestData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid data"})
			return
		}

		// ค้นหาแพ็กเกจที่ตรงกับชื่อ
		var packageToDelete models.Package
		err := db.Collection("packages").FindOne(c, bson.M{"name": requestData.Name}).Decode(&packageToDelete)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบแพ็กเกจที่มีชื่อ " + requestData.Name})
			return
		}

		// ลบแพ็กเกจจาก MongoDB
		_, err = db.Collection("packages").DeleteOne(c, bson.M{"name": requestData.Name})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถลบแพ็กเกจได้"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "ลบแพ็กเกจสำเร็จ"})
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
