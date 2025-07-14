package utils

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var jwtSecret = []byte(os.Getenv("JWT_SECRET"))
var jwtIssuer = os.Getenv("JWT_ISSUER")
var jwtAudience = os.Getenv("JWT_AUDIENCE")

type CustomClaims struct {
	UserID string `json:"userId"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

func GenerateJWT(userID, role string) (string, error) {
	now := time.Now()
	claims := CustomClaims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(now.Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(now),
			Issuer:    jwtIssuer,
			Audience:  []string{jwtAudience},
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func ParseJWT(tokenString string) (*CustomClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &CustomClaims{}, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*CustomClaims)
	if !ok || !token.Valid {
		return nil, err
	}

	// ตรวจสอบ issuer และ audience ให้ตรงตามที่กำหนดไว้ใน GenerateJWT
	if claims.Issuer != jwtIssuer {
		return nil, fmt.Errorf("invalid issuer: %s", claims.Issuer)
	}

	// ตรวจสอบให้แน่ใจว่า audience มี jwtAudience
	found := false
	for _, aud := range claims.Audience {
		if aud == jwtAudience {
			found = true
			break
		}
	}
	if !found {
		return nil, fmt.Errorf("invalid audience: %v", claims.Audience)
	}

	return claims, nil
}

func GenerateSecureState() string {
	b := make([]byte, 32)
	_, err := rand.Read(b)
	if err != nil {
		return "fallback_state"
	}
	return base64.URLEncoding.EncodeToString(b)
}
