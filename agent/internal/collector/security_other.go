//go:build !windows

package collector

func collectSecurity() map[string]any   { return map[string]any{} }
func collectSoftware() []map[string]any { return nil }
