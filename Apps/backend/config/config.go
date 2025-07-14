package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	CHANNEL_SECRET            string
	CHANNEL_TOKEN             string
	LINE_LOGIN_CHANNEL_SECRET string
	CHANNEL_ID                string
	REDIRECT_URI              string
	FRONTEND_URL              string
	JWT_SECRET                string
	JWT_ISSUER                string
	JWT_AUDIENCE              string
	OLLAMA_URL                string
	OLLAMA_MODEL              string
	MongoURI                  string
	MongoDBName               string
	MongoCollection           string
	users                     string
	Port                      string
}

func LoadConfig() *Config {
	_ = godotenv.Load()

	cfg := &Config{
		CHANNEL_SECRET:            os.Getenv("CHANNEL_SECRET"),
		LINE_LOGIN_CHANNEL_SECRET: os.Getenv("LINE_LOGIN_CHANNEL_SECRET"),
		CHANNEL_TOKEN:             os.Getenv("CHANNEL_TOKEN"),
		CHANNEL_ID:                os.Getenv("CHANNEL_ID"),
		REDIRECT_URI:              os.Getenv("REDIRECT_URI"),
		FRONTEND_URL:              os.Getenv("FRONTEND_URL"),
		JWT_SECRET:                os.Getenv("JWT_SECRET"),
		JWT_ISSUER:                os.Getenv("JWT_ISSUER"),
		JWT_AUDIENCE:              os.Getenv("JWT_AUDIENCE"),
		OLLAMA_URL:                os.Getenv("OLLAMA_URL"),
		OLLAMA_MODEL:              os.Getenv("OLLAMA_MODEL"),
		MongoURI:                  os.Getenv("MONGO_URI"),
		MongoDBName:               os.Getenv("MONGO_DB"),
		MongoCollection:           os.Getenv("MONGO_DB_COLLECTION"),
		users:                     os.Getenv("users"),
		Port:                      os.Getenv("PORT"),
	}

	if cfg.MongoURI == "" || cfg.MongoDBName == "" {
		log.Fatal("Missing required environment vars")
	}
	return cfg
}
