package handlers

import (
	"backend/models"
	"context"
	"net/http"

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
