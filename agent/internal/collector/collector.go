// Package collector gathers Windows endpoint inventory.
// Uses gopsutil for cross-cutting data; Windows-specific posture (BitLocker,
// Defender, Firewall, patches) is implemented in security_windows.go.
package collector

import (
	"os"
	"os/user"
	"runtime"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/mem"
	"github.com/shirou/gopsutil/v3/net"
)

func Collect(agentVersion string) map[string]any {
	hostname, _ := os.Hostname()
	hi, _ := host.Info()
	vm, _ := mem.VirtualMemory()
	cpus, _ := cpu.Info()
	parts, _ := disk.Partitions(false)
	ifs, _ := net.Interfaces()

	disks := []map[string]any{}
	for _, p := range parts {
		u, err := disk.Usage(p.Mountpoint)
		if err != nil {
			continue
		}
		disks = append(disks, map[string]any{
			"name":     p.Mountpoint,
			"total_gb": float64(u.Total) / (1 << 30),
			"free_gb":  float64(u.Free) / (1 << 30),
		})
	}

	macs := []string{}
	ips := []string{}
	for _, i := range ifs {
		if i.HardwareAddr != "" {
			macs = append(macs, i.HardwareAddr)
		}
		for _, a := range i.Addrs {
			ips = append(ips, a.Addr)
		}
	}

	loggedUser := ""
	if u, err := user.Current(); err == nil {
		loggedUser = u.Username
	}

	cpuModel := runtime.GOARCH
	if len(cpus) > 0 {
		cpuModel = cpus[0].ModelName
	}

	return map[string]any{
		"hostname":      hostname,
		"os":            hi.Platform,
		"os_version":    hi.PlatformVersion,
		"agent_version": agentVersion,
		"logged_user":   loggedUser,
		"ip_addresses":  ips,
		"mac_addresses": macs,
		"hardware": map[string]any{
			"cpu":           cpuModel,
			"cpu_cores":     runtime.NumCPU(),
			"ram_total_mb":  int(vm.Total / (1 << 20)),
			"disks":         disks,
			"manufacturer":  hi.VirtualizationSystem,
			"model":         hi.KernelVersion,
			"serial_number": "",
		},
		"security": collectSecurity(),
		"software": collectSoftware(),
		"open_ports": []int{},
	}
}
