package models

type FieldDiff struct {
	Field string      `json:"field"`
	Old   interface{} `json:"old"`
	New   interface{} `json:"new"`
}

type Conflict struct {
	ID   string      `json:"id"`
	Diff []FieldDiff `json:"diff"`
	Old  interface{} `json:"old"`
	New  interface{} `json:"new"`
}
