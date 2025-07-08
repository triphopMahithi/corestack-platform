package handlers

import (
	"backend/models"
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

func GetCategoriesHandler(db *mongo.Database) gin.HandlerFunc {
	return func(c *gin.Context) {
		var results []models.Category
		cursor, err := db.Collection("categories").Find(context.Background(), bson.M{})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer cursor.Close(context.Background())

		for cursor.Next(context.Background()) {
			var cat models.Category
			if err := cursor.Decode(&cat); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			results = append(results, cat)
		}

		c.JSON(http.StatusOK, results)
	}
}
