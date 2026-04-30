#requires -Version 5
# Build the Akuris Endpoint Agent for Windows x64.
# Usage: .\build.ps1
$ErrorActionPreference = 'Stop'
$env:GOOS = 'windows'
$env:GOARCH = 'amd64'
$env:CGO_ENABLED = '0'

Push-Location $PSScriptRoot
try {
    Write-Host "Downloading deps..."
    go mod tidy
    Write-Host "Building akuris-agent.exe..."
    go build -ldflags "-s -w -H=windowsgui" -o ".\dist\akuris-agent.exe" ".\cmd\akuris-agent"
    Write-Host "Done: $(Resolve-Path .\dist\akuris-agent.exe)"
} finally {
    Pop-Location
}
