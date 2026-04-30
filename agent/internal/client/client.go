// Package client talks to Supabase Edge Functions: agent-enroll and agent-checkin.
package client

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type EnrollResponse struct {
	AgentID                string `json:"agent_id"`
	AgentToken             string `json:"agent_token"`
	CheckinIntervalSeconds int    `json:"checkin_interval_seconds"`
}

var httpClient = &http.Client{Timeout: 30 * time.Second}

func Enroll(serverURL, enrollmentToken string, inv map[string]any) (*EnrollResponse, error) {
	body := map[string]any{
		"enrollment_token": enrollmentToken,
		"hostname":         inv["hostname"],
		"os":               inv["os"],
		"os_version":       inv["os_version"],
		"agent_version":    inv["agent_version"],
		"mac_addresses":    inv["mac_addresses"],
	}
	if hw, ok := inv["hardware"].(map[string]any); ok {
		body["serial_number"] = hw["serial_number"]
		body["manufacturer"] = hw["manufacturer"]
		body["model"] = hw["model"]
	}
	b, _ := json.Marshal(body)
	url := fmt.Sprintf("%s/functions/v1/agent-enroll", serverURL)
	resp, err := httpClient.Post(url, "application/json", bytes.NewReader(b))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("enroll http %d", resp.StatusCode)
	}
	var out EnrollResponse
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, err
	}
	return &out, nil
}

func Checkin(serverURL, agentToken string, inv map[string]any) error {
	b, _ := json.Marshal(inv)
	url := fmt.Sprintf("%s/functions/v1/agent-checkin", serverURL)
	req, _ := http.NewRequest("POST", url, bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Agent-Token", agentToken)
	resp, err := httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		return fmt.Errorf("checkin http %d", resp.StatusCode)
	}
	return nil
}
