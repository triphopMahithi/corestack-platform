package models

type Pricing struct {
	AgeFrom int     `json:"ageFrom" bson:"ageFrom"`
	AgeTo   int     `json:"ageTo" bson:"ageTo"`
	Female  float64 `json:"female" bson:"female"`
	Male    float64 `json:"male" bson:"male"`
}

type Package struct {
	ID                string    `json:"id" bson:"id"`
	Name              string    `json:"name" bson:"name"`
	CategoryID        string    `json:"categoryId" bson:"categoryId"`
	BaseMonthly       float64   `json:"baseMonthly" bson:"baseMonthly"`
	BaseAnnual        float64   `json:"baseAnnual" bson:"baseAnnual"`
	Special           bool      `json:"special" bson:"special"`
	SubPackages       []string  `json:"subPackages" bson:"subPackages"`
	GenderRestriction string    `json:"genderRestriction" bson:"genderRestriction"`
	MinAge            int       `json:"minAge" bson:"minAge"`
	MaxAge            int       `json:"maxAge" bson:"maxAge"`
	Pricing           []Pricing `json:"pricing" bson:"pricing"`
}
