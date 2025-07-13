package services

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
)

type TokenResponse struct {
	AccessToken string `json:"access_token"`
	IDToken     string `json:"id_token"`
}

func ExchangeCodeForToken(code string) (*TokenResponse, error) {
	url := "https://api.line.me/oauth2/v2.1/token"
	req, _ := http.NewRequest("POST", url, nil)

	q := req.URL.Query()
	q.Add("grant_type", "authorization_code")
	q.Add("code", code)
	q.Add("redirect_uri", os.Getenv("REDIRECT_URI"))
	q.Add("client_id", os.Getenv("CHANNEL_ID"))
	q.Add("client_secret", os.Getenv("CHANNEL_SECRET"))
	req.URL.RawQuery = q.Encode()

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	client := &http.Client{}
	resp, err := client.Do(req)

	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var token TokenResponse
	body, _ := io.ReadAll(resp.Body)
	err = json.Unmarshal(body, &token)
	return &token, err
}
