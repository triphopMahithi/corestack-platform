package handlers

import (
	"backend/models"
	"context"
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/xuri/excelize/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type UploadHandler struct {
	DB *mongo.Database
}

func NewUploadHandler(db *mongo.Database) *UploadHandler {
	return &UploadHandler{DB: db}
}

// ===== PARSERS =====
func parseJSON(r io.Reader) ([]interface{}, error) {
	var result []map[string]interface{}
	err := json.NewDecoder(r).Decode(&result)
	if err != nil {
		return nil, err
	}
	records := make([]interface{}, len(result))
	for i, v := range result {
		records[i] = v
	}
	return records, nil
}

func parseCSV(r io.Reader) ([]interface{}, error) {
	reader := csv.NewReader(r)
	lines, err := reader.ReadAll()
	if err != nil || len(lines) < 2 {
		return nil, errors.New("ไฟล์ CSV ไม่ถูกต้อง")
	}

	headers := lines[0]
	var records []interface{}
	for _, line := range lines[1:] {
		obj := make(map[string]interface{})
		for i, val := range line {
			if i < len(headers) {
				obj[headers[i]] = val
			}
		}
		records = append(records, obj)
	}
	return records, nil
}

func parseExcel(r io.Reader) ([]interface{}, error) {
	f, err := excelize.OpenReader(r)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	sheetName := f.GetSheetName(0)
	rows, err := f.GetRows(sheetName)
	if err != nil || len(rows) < 2 {
		return nil, errors.New("ไม่สามารถอ่านข้อมูลจาก Excel ได้")
	}

	headers := rows[0]
	var records []interface{}
	for _, row := range rows[1:] {
		obj := make(map[string]interface{})
		for i, val := range row {
			if i < len(headers) {
				obj[headers[i]] = val
			}
		}
		records = append(records, obj)
	}
	return records, nil
}

func (h *UploadHandler) HandleUpload(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(400, gin.H{"error": "ไม่พบไฟล์"})
		return
	}

	f, err := file.Open()
	if err != nil {
		c.JSON(500, gin.H{"error": "ไม่สามารถเปิดไฟล์ได้"})
		return
	}
	defer f.Close()

	ext := strings.ToLower(filepath.Ext(file.Filename))
	var records []interface{}
	var parseErr error

	switch ext {
	case ".json":
		records, parseErr = parseJSON(f)
	case ".csv":
		records, parseErr = parseCSV(f)
	case ".xlsx":
		records, parseErr = parseExcel(f)
	default:
		c.JSON(400, gin.H{"error": "รองรับเฉพาะไฟล์ .json, .csv, .xlsx เท่านั้น"})
		return
	}

	if parseErr != nil {
		c.JSON(400, gin.H{"error": "อ่านไฟล์ไม่สำเร็จ: " + parseErr.Error()})
		return
	}

	force := c.Query("force") == "true"
	collection := h.DB.Collection("packages")

	var newItems []interface{}
	var conflicts []models.Conflict
	var updatedCount int

	for _, rec := range records {
		m, ok := rec.(map[string]interface{})
		if !ok {
			continue
		}
		delete(m, "_id")

		id, ok := m["id"].(string)
		if !ok || id == "" {
			continue
		}

		var existing map[string]interface{}
		err := collection.FindOne(context.Background(), bson.M{"id": id}).Decode(&existing)
		if err == mongo.ErrNoDocuments {
			newItems = append(newItems, m)
		} else if err == nil {
			diffs := CompareDocuments(existing, m)
			if len(diffs) > 0 {
				if force {
					_, err := collection.UpdateOne(
						context.Background(),
						bson.M{"id": id},
						bson.M{"$set": m},
					)
					if err == nil {
						updatedCount++
					}
				} else {
					conflicts = append(conflicts, models.Conflict{
						ID:   id,
						Diff: CompareDocuments(existing, m),
						Old:  existing,
						New:  m,
					})
				}
			}
		} else {
			// unexpected db error, skip
			continue
		}
	}

	if len(newItems) > 0 {
		_, err := collection.InsertMany(context.TODO(), newItems)
		if err != nil {
			c.JSON(500, gin.H{"error": "บันทึกข้อมูลล้มเหลว: " + err.Error()})
			return
		}
	}

	c.JSON(200, gin.H{
		"message":   "อัปโหลดและบันทึกสำเร็จ",
		"inserted":  len(newItems),
		"updated":   updatedCount,
		"conflicts": conflicts,
	})
}

func CompareDocuments(oldDoc, newDoc map[string]interface{}) []models.FieldDiff {
	var diffs []models.FieldDiff
	for key, newVal := range newDoc {
		if key == "_id" {
			continue
		}
		oldVal, exists := oldDoc[key]
		if !exists || fmt.Sprintf("%v", oldVal) != fmt.Sprintf("%v", newVal) {
			diffs = append(diffs, models.FieldDiff{
				Field: key,
				Old:   oldVal,
				New:   newVal,
			})
		}
	}
	return diffs
}
