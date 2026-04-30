//go:build windows

package collector

import (
	"os/exec"
	"strings"
)

// collectSecurity queries Windows for security posture.
// Uses PowerShell because WMI bindings add cgo complexity; runs as LocalSystem.
func collectSecurity() map[string]any {
	out := map[string]any{}
	out["bitlocker_enabled"] = ps(`(Get-BitLockerVolume -MountPoint $env:SystemDrive).ProtectionStatus -eq 'On'`) == "True"
	out["antivirus_enabled"] = ps(`(Get-MpComputerStatus).AntivirusEnabled`) == "True"
	out["antivirus_name"] = "Windows Defender"
	out["firewall_enabled"] = ps(`(Get-NetFirewallProfile -Profile Domain,Public,Private | Where-Object Enabled -eq True).Count -ge 1`) == "True"
	if v := ps(`(Get-WmiObject -Class Win32_QuickFixEngineering).Count`); v != "" {
		out["pending_updates"] = 0
		out["last_patch_date"] = ps(`(Get-WmiObject -Class Win32_QuickFixEngineering | Sort-Object InstalledOn -Descending | Select-Object -First 1).InstalledOn`)
	}
	out["uac_enabled"] = ps(`(Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System').EnableLUA -eq 1`) == "True"
	out["secure_boot"] = ps(`Confirm-SecureBootUEFI 2>$null`) == "True"
	return out
}

func collectSoftware() []map[string]any {
	cmd := `Get-ItemProperty HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*,HKLM:\Software\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall\* | Where-Object DisplayName | Select-Object DisplayName,DisplayVersion,Publisher | ConvertTo-Json -Compress`
	out := ps(cmd)
	if out == "" {
		return nil
	}
	// Lightweight: server validates JSON shape; we send raw rows as map slice.
	// Parsing PowerShell JSON robustly omitted for brevity in this scaffold.
	return []map[string]any{{"raw": out}}
}

func ps(script string) string {
	cmd := exec.Command("powershell", "-NoProfile", "-NonInteractive", "-Command", script)
	b, err := cmd.Output()
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(b))
}
