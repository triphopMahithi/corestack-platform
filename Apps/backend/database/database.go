package database

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func ConnectToMongoDB(uri string) (*mongo.Client, error) {
	clientOptions := options.Client().ApplyURI(uri)
	client, err := mongo.Connect(context.TODO(), clientOptions)
	return client, err
}

func CreateDatabase(client *mongo.Client, DB_NAME string, COLLECTION_NAME string) *mongo.Collection {
	return client.Database(DB_NAME).Collection(COLLECTION_NAME)
}

func GetAllDocuments(collection *mongo.Collection) gin.HandlerFunc {
	return func(c *gin.Context) {
		cursor, err := collection.Find(context.TODO(), bson.M{}) // ไม่มี filter ดึงทั้งหมด
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
			return
		}
		defer cursor.Close(context.TODO())

		var results []bson.M
		if err := cursor.All(context.TODO(), &results); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Cursor error"})
			return
		}

		c.JSON(http.StatusOK, results)
	}
}
