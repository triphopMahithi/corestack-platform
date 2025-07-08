package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	CHANNEL_SECRET  string
	CHANNEL_TOKEN   string
	OLLAMA_URL      string
	OLLAMA_MODEL    string
	MongoURI        string
	MongoDBName     string
	MongoCollection string
	Port            string
}

func LoadConfig() *Config {
	_ = godotenv.Load()

	cfg := &Config{
		CHANNEL_SECRET:  os.Getenv("CHANNEL_SECRET"),
		CHANNEL_TOKEN:   os.Getenv("CHANNEL_TOKEN"),
		OLLAMA_URL:      os.Getenv("OLLAMA_URL"),
		OLLAMA_MODEL:    os.Getenv("OLLAMA_MODEL"),
		MongoURI:        os.Getenv("MONGO_URI"),
		MongoDBName:     os.Getenv("MONGO_DB"),
		MongoCollection: os.Getenv("MONGO_DB_COLLECTION"),
		Port:            os.Getenv("PORT"),
	}

	if cfg.MongoURI == "" || cfg.MongoDBName == "" {
		log.Fatal("Missing required environment vars")
	}
	return cfg
}
