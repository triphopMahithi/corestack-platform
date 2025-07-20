package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID         primitive.ObjectID `bson:"_id,omitempty"`
	Username   string             `bson:"username"`
	Password   string             `bson:"password"`
	LineUserID string             `bson:"lineUserId"`
	Provider   string             `bson:"provider"`
	Role       string             `bson:"role"`
	CreatedAt  time.Time          `bson:"createdAt"`
	UpdatedAt  time.Time          `bson:"updatedAt"`
	LastLogin  time.Time          `bson:"lastLogin"`
}
