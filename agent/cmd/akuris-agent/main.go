// Akuris Endpoint Agent — Windows inventory agent.
// CLI:
//   akuris-agent.exe install --token <TOKEN> --server <URL>
//   akuris-agent.exe uninstall
//   akuris-agent.exe run            (foreground; for debug)
//   akuris-agent.exe checkin        (one-shot collection + send)
package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/akuris/akuris-agent/internal/client"
	"github.com/akuris/akuris-agent/internal/collector"
	"github.com/akuris/akuris-agent/internal/storage"
	"github.com/kardianos/service"
)

const (
	agentVersion = "0.1.0"
	serviceName  = "AkurisAgent"
)

type program struct{}

func (p *program) Start(s service.Service) error { go p.loop(); return nil }
func (p *program) Stop(s service.Service) error  { return nil }

func (p *program) loop() {
	for {
		if err := doCheckin(); err != nil {
			log.Printf("checkin error: %v", err)
		}
		time.Sleep(60 * time.Minute)
	}
}

func doCheckin() error {
	cfg, err := storage.Load()
	if err != nil {
		return fmt.Errorf("load config: %w", err)
	}
	inv := collector.Collect(agentVersion)
	return client.Checkin(cfg.ServerURL, cfg.AgentToken, inv)
}

func doEnroll(server, token string) error {
	inv := collector.Collect(agentVersion)
	resp, err := client.Enroll(server, token, inv)
	if err != nil {
		return err
	}
	return storage.Save(storage.Config{
		ServerURL:  server,
		AgentID:    resp.AgentID,
		AgentToken: resp.AgentToken,
	})
}

func main() {
	if len(os.Args) < 2 {
		fmt.Println("usage: akuris-agent.exe [install|uninstall|run|checkin]")
		os.Exit(2)
	}
	cmd := os.Args[1]
	fs := flag.NewFlagSet(cmd, flag.ExitOnError)
	token := fs.String("token", "", "enrollment token")
	server := fs.String("server", "https://lnlkahtugwmkznasapfd.supabase.co", "server base URL")
	_ = fs.Parse(os.Args[2:])

	svcCfg := &service.Config{
		Name:        serviceName,
		DisplayName: "Akuris Endpoint Agent",
		Description: "Reports endpoint inventory to Akuris GRC.",
	}
	prg := &program{}
	s, err := service.New(prg, svcCfg)
	if err != nil {
		log.Fatal(err)
	}

	switch cmd {
	case "install":
		if *token == "" {
			log.Fatal("--token is required")
		}
		if err := doEnroll(*server, *token); err != nil {
			log.Fatalf("enroll failed: %v", err)
		}
		if err := s.Install(); err != nil {
			log.Fatalf("install failed: %v", err)
		}
		_ = s.Start()
		fmt.Println("Akuris Agent installed and started.")
	case "uninstall":
		_ = s.Stop()
		if err := s.Uninstall(); err != nil {
			log.Fatalf("uninstall failed: %v", err)
		}
		fmt.Println("Akuris Agent uninstalled.")
	case "checkin":
		if err := doCheckin(); err != nil {
			log.Fatal(err)
		}
		fmt.Println("Check-in OK.")
	case "run":
		if err := s.Run(); err != nil {
			log.Fatal(err)
		}
	default:
		fmt.Println("unknown command:", cmd)
		os.Exit(2)
	}
}
