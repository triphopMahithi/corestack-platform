package models

type Category struct {
	ID       string   `json:"id" bson:"id"`
	Name     string   `json:"name" bson:"name"`
	Packages []string `json:"packages" bson:"packages"`
}
