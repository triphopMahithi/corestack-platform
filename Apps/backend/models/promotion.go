package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type Promotion struct {
	ID                 primitive.ObjectID `bson:"_id,omitempty"`
	Name               string             `bson:"name"`
	Description        string             `bson:"description"`
	Type               string             `bson:"type"`                 // ประเภทของโปรโมชั่น: "general", "package", "category"
	DiscountPercentage float64            `bson:"discountPercentage"`   // ตัวคูณสำหรับการคำนวณ
	ValidFrom          string             `bson:"validFrom"`            // วันที่เริ่มต้น
	ValidTo            string             `bson:"validTo"`              // วันที่สิ้นสุด
	PackageID          string             `bson:"packageId,omitempty"`  // สำหรับโปรโมชั่นเฉพาะแพ็กเกจ
	CategoryID         string             `bson:"categoryId,omitempty"` // สำหรับโปรโมชั่นเฉพาะ category
}
