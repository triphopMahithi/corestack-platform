package models

import (
	"time"
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
	Cart     []CartEntry `bson:"cart" json:"cart"`
}
