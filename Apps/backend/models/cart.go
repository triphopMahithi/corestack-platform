package models

import (
	"time"
<<<<<<< HEAD
)

type PremiumInfo struct {
	Annual int `bson:"annual" json:"annual"`
}

// Struct สำหรับบันทึกลง MongoDB
type CartEntry struct {
	PackageName string      `bson:"packageName" json:"packageName"`
	StartAge    int         `bson:"startAge" json:"startAge"`
	EndAge      int         `bson:"endAge" json:"endAge"`
	Premium     PremiumInfo `bson:"premium" json:"premium"`
	DateAdded   time.Time   `bson:"dateAdded" json:"dateAdded"`
}

type CartItem struct {
	ID       string      `bson:"_id,omitempty" json:"id,omitempty"`
	Username string      `bson:"username" json:"username"`
	UserID   string      `bson:"userId" json:"userId"`
=======

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type PremiumInfo struct {
	Annual float64 `bson:"annual" json:"annual"`
}

type CartEntry struct {
	ID          primitive.ObjectID `bson:"_id" json:"id"`
	PackageName string             `bson:"packageName" json:"packageName"`
	StartAge    int                `bson:"startAge" json:"startAge"`
	EndAge      int                `bson:"endAge" json:"endAge"`
	Premium     PremiumInfo        `bson:"premium" json:"premium"`
	DateAdded   time.Time          `bson:"dateAdded" json:"dateAdded"`
}

type CartItem struct {
	UserID   string      `bson:"userId" json:"userId"`
	Username string      `bson:"username" json:"username"`
>>>>>>> main
	Cart     []CartEntry `bson:"cart" json:"cart"`
}
