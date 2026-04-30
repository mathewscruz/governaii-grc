// Package storage persists agent config in %ProgramData%\Akuris\agent.json.
// TODO: encrypt AgentToken with Windows DPAPI (CryptProtectData) before writing.
package storage

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
)

type Config struct {
	ServerURL  string `json:"server_url"`
	AgentID    string `json:"agent_id"`
	AgentToken string `json:"agent_token"`
}

func configPath() string {
	base := os.Getenv("ProgramData")
	if base == "" {
		base = "."
	}
	return filepath.Join(base, "Akuris", "agent.json")
}

func Save(c Config) error {
	p := configPath()
	if err := os.MkdirAll(filepath.Dir(p), 0o700); err != nil {
		return err
	}
	b, err := json.MarshalIndent(c, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(p, b, 0o600)
}

func Load() (Config, error) {
	var c Config
	b, err := os.ReadFile(configPath())
	if err != nil {
		return c, err
	}
	if err := json.Unmarshal(b, &c); err != nil {
		return c, err
	}
	if c.AgentToken == "" {
		return c, errors.New("agent not enrolled")
	}
	return c, nil
}
