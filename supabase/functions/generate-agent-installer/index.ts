import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader);
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Buscar empresa do usuário
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('empresa_id, nome')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile?.empresa_id) {
      throw new Error('User profile not found');
    }

    // Buscar nome da empresa
    const { data: empresa, error: empresaError } = await supabaseClient
      .from('empresas')
      .select('nome')
      .eq('id', profile.empresa_id)
      .single();

    if (empresaError) {
      throw new Error('Company not found');
    }

    // Obter platform do body da requisição
    const { platform } = await req.json();

    if (!platform || !['windows', 'linux', 'macos'].includes(platform)) {
      throw new Error('Invalid platform specified');
    }

    // Gerar token único para o agente
    const agentToken = crypto.randomUUID();
    const agentId = crypto.randomUUID();

    // Registrar agente pendente
    const { error: insertError } = await supabaseClient
      .from('asset_agents')
      .insert({
        id: agentId,
        empresa_id: profile.empresa_id,
        agent_token: agentToken,
        hostname: 'pending-install',
        operating_system: platform,
        status: 'offline'
      });

    if (insertError) {
      console.error('Error inserting agent:', insertError);
      throw new Error('Failed to register agent');
    }

    // Configuração do agente baseada na plataforma
    const agentConfig = {
      token: agentToken,
      agent_id: agentId,
      empresa_id: profile.empresa_id,
      empresa_name: empresa?.nome || 'GovernAII',
      api_url: Deno.env.get('SUPABASE_URL'),
      api_key: Deno.env.get('SUPABASE_ANON_KEY'),
      platform: platform,
      heartbeat_interval: 300, // 5 minutos
      sync_interval: 86400, // 24 horas
      version: '1.0.0',
      user_name: profile.nome || 'Usuário'
    };

    // Gerar instalador baseado na plataforma
    let installerContent = '';
    let filename = '';
    let contentType = '';

    switch (platform) {
      case 'windows':
        filename = `GovernAII-Agent-${agentConfig.empresa_name.replace(/[^a-zA-Z0-9]/g, '')}.bat`;
        contentType = 'application/octet-stream';
        installerContent = generateWindowsBatchFile(agentConfig);
        break;
      case 'linux':
        filename = `governaii-agent_${agentConfig.version}_amd64.deb`;
        contentType = 'application/x-debian-package';
        installerContent = generateLinuxDebPackage(agentConfig);
        break;
      case 'macos':
        filename = `GovernAII-Agent-${agentConfig.version}.pkg`;
        contentType = 'application/x-newton-compatible-pkg';
        installerContent = generateMacOSPackage(agentConfig);
        break;
    }

    return new Response(installerContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Error generating agent installer:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateWindowsBatchFile(config: any): string {
  return `@echo off
setlocal enabledelayedexpansion

echo ===============================================
echo   GovernAII Asset Discovery Agent - Installer
echo ===============================================
echo.
echo Instalando agente de descoberta de ativos...
echo Empresa: ${config.empresa_name}
echo.

REM Verificar se tem privilegios administrativos
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo ATENCAO: Este script precisa ser executado como administrador.
    echo Clique com o botao direito no arquivo e selecione "Executar como administrador"
    echo.
    pause
    exit /b 1
)

REM Criar diretório de instalação
set "INSTALL_DIR=%LOCALAPPDATA%\\GovernAII\\Agent"
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

REM Criar arquivo de log inicial
echo %date% %time% - Iniciando instalacao do GovernAII Agent > "%INSTALL_DIR%\\install.log"
echo %date% %time% - Empresa: ${config.empresa_name} >> "%INSTALL_DIR%\\install.log"
echo %date% %time% - Token: ${config.token.substring(0, 8)}... >> "%INSTALL_DIR%\\install.log"

echo Criando configuracao...
REM Salvar configuração em JSON
(
echo {
echo   "agentId": "${config.agent_id}",
echo   "agentToken": "${config.token}",
echo   "empresaId": "${config.empresa_id}",
echo   "empresaName": "${config.empresa_name}",
echo   "apiUrl": "${config.api_url}",
echo   "supabaseAnonKey": "${config.supabaseAnonKey}",
echo   "heartbeatInterval": 60,
echo   "syncInterval": 300
echo }
) > "%INSTALL_DIR%\\config.json"

echo Criando script PowerShell...
REM Criar script PowerShell principal
(
echo # GovernAII Agent PowerShell Script
echo Add-Type -AssemblyName System.Windows.Forms
echo Add-Type -AssemblyName System.Drawing
echo.
echo # Configuracao global
echo try {
echo     $script:config = Get-Content "$env:LOCALAPPDATA\\GovernAII\\Agent\\config.json" ^| ConvertFrom-Json
echo     $script:logFile = "$env:LOCALAPPDATA\\GovernAII\\Agent\\agent.log"
echo     $script:installDir = "$env:LOCALAPPDATA\\GovernAII\\Agent"
echo } catch {
echo     [System.Windows.Forms.MessageBox]::Show("Erro ao carregar configuracao: $($_.Exception.Message)", "GovernAII Agent", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error^)
echo     exit 1
echo }
echo.
echo # Funcao de logging melhorada
echo function Write-Log {
echo     param([string]$Message^)
echo     $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
echo     $logEntry = "$timestamp - $Message"
echo     try {
echo         if (!(Test-Path (Split-Path $script:logFile^)^)^) {
echo             New-Item -ItemType Directory -Path (Split-Path $script:logFile^) -Force ^| Out-Null
echo         }
echo         Add-Content -Path $script:logFile -Value $logEntry -Encoding UTF8
echo         Write-Host $logEntry
echo     } catch {
echo         Write-Host "ERRO LOG: $($_.Exception.Message^)"
echo     }
echo }
echo.
echo # Funcao para testar conectividade
echo function Test-Connectivity {
echo     try {
echo         Write-Log "Testando conectividade com $($script:config.apiUrl^)..."
echo         $response = Invoke-WebRequest -Uri "$($script:config.apiUrl^)/health" -Method GET -TimeoutSec 10 -UseBasicParsing
echo         Write-Log "Conectividade OK - Status: $($response.StatusCode^)"
echo         return $true
echo     } catch {
echo         Write-Log "Teste de conectividade falhou: $($_.Exception.Message^)"
echo         try {
echo             Write-Log "Tentando ping DNS..."
echo             $ping = Test-NetConnection -ComputerName "google.com" -Port 80 -WarningAction SilentlyContinue
echo             if ($ping.TcpTestSucceeded^) {
echo                 Write-Log "Internet OK, problema pode ser com API"
echo             } else {
echo                 Write-Log "Sem conexao com internet"
echo             }
echo         } catch {
echo             Write-Log "Erro no teste de ping"
echo         }
echo         return $false
echo     }
echo }
echo.
echo # Funcao para enviar heartbeat
echo function Send-Heartbeat {
echo     try {
echo         Write-Log "Enviando heartbeat..."
echo         
echo         $hostname = $env:COMPUTERNAME
echo         $ipAddress = try {
echo             (Get-NetIPAddress -AddressFamily IPv4 ^| Where-Object {$_.IPAddress -ne "127.0.0.1" -and $_.AddressState -eq "Preferred"} ^| Select-Object -First 1^).IPAddress
echo         } catch { "127.0.0.1" }
echo         
echo         $macAddress = try {
echo             (Get-NetAdapter ^| Where-Object Status -eq "Up" ^| Select-Object -First 1^).MacAddress
echo         } catch { "00:00:00:00:00:00" }
echo         
echo         $body = @{
echo             agent_token = $script:config.agentToken
echo             hostname = $hostname
echo             ip_address = $ipAddress
echo             status = "online"
echo             system_info = @{
echo                 mac_address = $macAddress
echo                 operating_system = "Windows"
echo                 os_version = [System.Environment]::OSVersion.VersionString
echo             }
echo         } ^| ConvertTo-Json -Depth 3
echo         
echo         $headers = @{
echo             "apikey" = $script:config.supabaseAnonKey
echo             "Content-Type" = "application/json"
echo         }
echo         
echo         Write-Log "Enviando para: $($script:config.apiUrl^)/functions/v1/agent-heartbeat"
echo         Write-Log "Headers: apikey = $($script:config.supabaseAnonKey.Substring(0,10^)^)..."
echo         Write-Log "Body: $body"
echo         
echo         $response = Invoke-RestMethod -Uri "$($script:config.apiUrl^)/functions/v1/agent-heartbeat" -Method POST -Body $body -Headers $headers -TimeoutSec 30
echo         Write-Log "Heartbeat enviado com sucesso: $($response ^| ConvertTo-Json^)"
echo         return $true
echo     } catch {
echo         Write-Log "ERRO no heartbeat: $($_.Exception.Message^)"
echo         Write-Log "Response: $($_.Exception.Response^)"
echo         if ($_.Exception.Response^) {
echo             try {
echo                 $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream(^)^)
echo                 $responseBody = $reader.ReadToEnd(^)
echo                 Write-Log "Response Body: $responseBody"
echo             } catch { }
echo         }
echo         return $false
echo     }
echo }
echo.
echo # Funcao para sincronizar assets
echo function Sync-Assets {
echo     try {
echo         Write-Log "Iniciando sincronizacao de assets..."
echo         
echo         $hostname = $env:COMPUTERNAME
echo         $computerInfo = Get-ComputerInfo
echo         
echo         # Coletar software instalado de forma mais segura
echo         $installedSoftware = @(^)
echo         try {
echo             Write-Log "Coletando software instalado..."
echo             $apps = Get-ItemProperty "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*" ^|
echo                 Where-Object { $_.DisplayName -and $_.DisplayName.Trim(^) -ne "" } ^|
echo                 Select-Object DisplayName, DisplayVersion, Publisher -First 50
echo             
echo             foreach ($app in $apps^) {
echo                 $installedSoftware += @{
echo                     name = $app.DisplayName
echo                     version = if ($app.DisplayVersion^) { $app.DisplayVersion } else { "Unknown" }
echo                     vendor = if ($app.Publisher^) { $app.Publisher } else { "Unknown" }
echo                 }
echo             }
echo             Write-Log "Coletados $($installedSoftware.Count^) aplicativos"
echo         } catch {
echo             Write-Log "Erro ao coletar software: $($_.Exception.Message^)"
echo         }
echo         
echo         $assets = @{
echo             hostname = $hostname
echo             operating_system = $computerInfo.WindowsProductName
echo             os_version = $computerInfo.WindowsVersion
echo             total_memory = $computerInfo.TotalPhysicalMemory
echo             processor = if ($computerInfo.CsProcessors^) { $computerInfo.CsProcessors[0].Name } else { "Unknown" }
echo             installed_software = $installedSoftware
echo             ip_address = try {
echo                 (Get-NetIPAddress -AddressFamily IPv4 ^| Where-Object {$_.IPAddress -ne "127.0.0.1" -and $_.AddressState -eq "Preferred"} ^| Select-Object -First 1^).IPAddress
echo             } catch { "127.0.0.1" }
echo         }
echo         
echo         $body = @{
echo             agent_token = $script:config.agentToken
echo             hostname = $hostname
echo             assets = $assets
echo         } ^| ConvertTo-Json -Depth 5
echo         
echo         $headers = @{
echo             "apikey" = $script:config.supabaseAnonKey
echo             "Content-Type" = "application/json"
echo         }
echo         
echo         Write-Log "Enviando assets para: $($script:config.apiUrl^)/functions/v1/agent-sync-assets"
echo         
echo         $response = Invoke-RestMethod -Uri "$($script:config.apiUrl^)/functions/v1/agent-sync-assets" -Method POST -Body $body -Headers $headers -TimeoutSec 60
echo         Write-Log "Assets sincronizados com sucesso: $($response ^| ConvertTo-Json^)"
echo         return $true
echo     } catch {
echo         Write-Log "ERRO na sincronizacao: $($_.Exception.Message^)"
echo         return $false
echo     }
echo }
echo.
echo # Funcao para baixar icone
echo function Download-Icon {
echo     try {
echo         $iconUrl = "https://lnlkahtugwmkznasapfd.supabase.co/storage/v1/object/sign/logotipo/Governiaa%20(500%20x%20200%20px^)%20(60%20x%2060%20px^).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82NTdhMjYzYS1jZjc1LTQ3OGYtYjNkMy01NWM2ODViMTQ0MTEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJsb2dvdGlwby9Hb3Zlcm5pYWEgKDUwMCB4IDIwMCBweCkgKDYwIHggNjAgcHgpLnBuZyIsImlhdCI6MTc1NTE5NzkyNSwiZXhwIjoxNzg2NzMzOTI1fQ.k7J54Hs_6D_LzkPNLYvvmYbMRX-cF7B5K9pp9kkEZf8"
echo         $iconPath = "$script:installDir\\governaii-icon.png"
echo         $icoPath = "$script:installDir\\governaii-icon.ico"
echo         
echo         Write-Log "Baixando icone do GovernAII..."
echo         $webClient = New-Object System.Net.WebClient
echo         $webClient.DownloadFile($iconUrl, $iconPath^)
echo         
echo         # Converter PNG para ICO
echo         Add-Type -AssemblyName System.Drawing
echo         $bitmap = New-Object System.Drawing.Bitmap($iconPath^)
echo         $resized = New-Object System.Drawing.Bitmap(32, 32^)
echo         $graphics = [System.Drawing.Graphics]::FromImage($resized^)
echo         $graphics.DrawImage($bitmap, 0, 0, 32, 32^)
echo         $icon = [System.Drawing.Icon]::FromHandle($resized.GetHicon(^)^)
echo         
echo         $fileStream = New-Object System.IO.FileStream($icoPath, [System.IO.FileMode]::Create^)
echo         $icon.Save($fileStream^)
echo         $fileStream.Close(^)
echo         $graphics.Dispose(^)
echo         $bitmap.Dispose(^)
echo         $resized.Dispose(^)
echo         
echo         Write-Log "Icone baixado e convertido com sucesso"
echo         return $icoPath
echo     } catch {
echo         Write-Log "Erro ao baixar icone: $($_.Exception.Message^), usando icone padrao"
echo         return $null
echo     }
echo }
echo.
echo # Funcao para criar system tray
echo function Create-SystemTray {
echo     Write-Log "Criando icone na bandeja do sistema..."
echo     
echo     $iconPath = Download-Icon
echo     
echo     $script:notifyIcon = New-Object System.Windows.Forms.NotifyIcon
echo     $script:contextMenu = New-Object System.Windows.Forms.ContextMenuStrip
echo     
echo     # Definir icone
echo     if ($iconPath -and (Test-Path $iconPath^)^) {
echo         $script:notifyIcon.Icon = New-Object System.Drawing.Icon($iconPath^)
echo     } else {
echo         $script:notifyIcon.Icon = [System.Drawing.SystemIcons]::Information
echo     }
echo     
echo     $script:notifyIcon.Text = "GovernAII Agent - ${config.empresa_name}"
echo     $script:notifyIcon.Visible = $true
echo     
echo     # Menu de contexto
echo     $menuStatus = $script:contextMenu.Items.Add("Status: Inicializando..."^)
echo     $menuStatus.Enabled = $false
echo     
echo     $script:contextMenu.Items.Add("-"^)
echo     
echo     $menuEmpresa = $script:contextMenu.Items.Add("Empresa: ${config.empresa_name}"^)
echo     $menuEmpresa.Enabled = $false
echo     
echo     $script:contextMenu.Items.Add("-"^)
echo     
echo     $menuSync = $script:contextMenu.Items.Add("Sincronizar Agora"^)
echo     $menuSync.Add_Click({
echo         Write-Log "Sincronizacao manual solicitada"
echo         if (Sync-Assets^) {
echo             $script:notifyIcon.ShowBalloonTip(3000, "GovernAII Agent", "Sincronizacao concluida!", [System.Windows.Forms.ToolTipIcon]::Info^)
echo         } else {
echo             $script:notifyIcon.ShowBalloonTip(3000, "GovernAII Agent", "Erro na sincronizacao!", [System.Windows.Forms.ToolTipIcon]::Error^)
echo         }
echo     }^)
echo     
echo     $menuHeartbeat = $script:contextMenu.Items.Add("Testar Conexao"^)
echo     $menuHeartbeat.Add_Click({
echo         Write-Log "Teste de conexao manual"
echo         if (Send-Heartbeat^) {
echo             $script:notifyIcon.ShowBalloonTip(3000, "GovernAII Agent", "Conexao OK!", [System.Windows.Forms.ToolTipIcon]::Info^)
echo         } else {
echo             $script:notifyIcon.ShowBalloonTip(3000, "GovernAII Agent", "Erro de conexao!", [System.Windows.Forms.ToolTipIcon]::Error^)
echo         }
echo     }^)
echo     
echo     $menuLogs = $script:contextMenu.Items.Add("Ver Logs"^)
echo     $menuLogs.Add_Click({
echo         if (Test-Path $script:logFile^) {
echo             Start-Process notepad $script:logFile
echo         } else {
echo             [System.Windows.Forms.MessageBox]::Show("Arquivo de log nao encontrado.", "GovernAII Agent"^)
echo         }
echo     }^)
echo     
echo     $script:contextMenu.Items.Add("-"^)
echo     
echo     $menuSair = $script:contextMenu.Items.Add("Sair"^)
echo     $menuSair.Add_Click({
echo         Write-Log "Aplicacao encerrada pelo usuario"
echo         $script:notifyIcon.Visible = $false
echo         $script:notifyIcon.Dispose(^)
echo         [System.Windows.Forms.Application]::Exit(^)
echo     }^)
echo     
echo     $script:notifyIcon.ContextMenuStrip = $script:contextMenu
echo     
echo     # Mostrar balao de boas-vindas
echo     $script:notifyIcon.ShowBalloonTip(5000, "GovernAII Agent", "Agente iniciado para ${config.empresa_name}!", [System.Windows.Forms.ToolTipIcon]::Info^)
echo     
echo     Write-Log "System tray criado com sucesso"
echo }
echo.
echo # Funcao principal
echo function Main {
echo     Write-Log "==== GovernAII Agent Iniciado ===="
echo     Write-Log "Empresa: $($script:config.empresaName^)"
echo     Write-Log "API URL: $($script:config.apiUrl^)"
echo     Write-Log "Hostname: $env:COMPUTERNAME"
echo     
echo     # Testar conectividade inicial
echo     if (!(Test-Connectivity^)^) {
echo         Write-Log "AVISO: Problemas de conectividade detectados"
echo     }
echo     
echo     # Criar system tray
echo     Create-SystemTray
echo     
echo     # Sincronizacao inicial
echo     Write-Log "Executando sincronizacao inicial..."
echo     Start-Sleep -Seconds 2
echo     if (Sync-Assets^) {
echo         $script:notifyIcon.ShowBalloonTip(3000, "GovernAII Agent", "Primeira sincronizacao concluida!", [System.Windows.Forms.ToolTipIcon]::Info^)
echo         $menuStatus.Text = "Status: Online - Sincronizado"
echo     } else {
echo         $script:notifyIcon.ShowBalloonTip(3000, "GovernAII Agent", "Erro na primeira sincronizacao!", [System.Windows.Forms.ToolTipIcon]::Warning^)
echo         $menuStatus.Text = "Status: Erro - Verifique logs"
echo     }
echo     
echo     # Timer para heartbeat e sync periodicos
echo     $timer = New-Object System.Windows.Forms.Timer
echo     $timer.Interval = 60000  # 1 minuto
echo     $script:syncCounter = 0
echo     
echo     $timer.Add_Tick({
echo         $script:syncCounter++
echo         
echo         # Heartbeat a cada minuto
echo         $heartbeatOK = Send-Heartbeat
echo         
echo         if ($heartbeatOK^) {
echo             $menuStatus.Text = "Status: Online - Conectado"
echo             $script:notifyIcon.Text = "GovernAII Agent - ${config.empresa_name} (Online^)"
echo         } else {
echo             $menuStatus.Text = "Status: Offline - Sem conexao"
echo             $script:notifyIcon.Text = "GovernAII Agent - ${config.empresa_name} (Offline^)"
echo         }
echo         
echo         # Sync a cada 5 minutos
echo         if ($script:syncCounter % 5 -eq 0^) {
echo             Write-Log "Sincronizacao automatica executada"
echo             Sync-Assets
echo         }
echo     }^)
echo     
echo     $timer.Start(^)
echo     Write-Log "Timer iniciado - Heartbeat: 1min, Sync: 5min"
echo     
echo     # Manter aplicacao rodando
echo     [System.Windows.Forms.Application]::Run(^)
echo }
echo.
echo # Iniciar aplicacao
echo try {
echo     Main
echo } catch {
echo     Write-Log "ERRO CRITICO: $($_.Exception.Message^)"
echo     [System.Windows.Forms.MessageBox]::Show("Erro critico no GovernAII Agent: $($_.Exception.Message^)\\n\\nVerifique os logs em: $script:logFile", "Erro Critico", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error^)
echo }
) > "%INSTALL_DIR%\\agent.ps1"

echo Configurando inicializacao automatica...
REM Criar atalho na pasta de inicialização
set "STARTUP_DIR=%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup"
powershell -Command "& {
    $WshShell = New-Object -comObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut('%STARTUP_DIR%\\GovernAII Agent.lnk')
    $Shortcut.TargetPath = 'powershell.exe'
    $Shortcut.Arguments = '-WindowStyle Hidden -ExecutionPolicy Bypass -File \"%INSTALL_DIR%\\agent.ps1\"'
    $Shortcut.WorkingDirectory = '%INSTALL_DIR%'
    $Shortcut.Description = 'GovernAII Asset Discovery Agent'
    $Shortcut.Save()
    Write-Host 'Atalho de inicializacao criado'
}"

echo Iniciando agente em modo visivel para debug...
REM Iniciar agente em modo normal (não oculto) para debug
powershell.exe -ExecutionPolicy Bypass -File "%INSTALL_DIR%\\agent.ps1"

echo.
echo ===============================================
echo   Instalacao finalizada!
echo ===============================================
echo.
echo Se o agente nao apareceu na bandeja, verifique:
echo 1. Os logs em: %INSTALL_DIR%\\agent.log
echo 2. Configuracoes de firewall
echo 3. Conexao com internet
echo.
echo Arquivos instalados em: %INSTALL_DIR%
echo.
pause
`;
}

function generateLinuxDebPackage(config: any): string {
  return `#!/bin/bash
# GovernAII Asset Discovery Agent - Linux Installer

INSTALL_DIR="/opt/governaii-agent"
CONFIG_FILE="$INSTALL_DIR/config.json"
SERVICE_FILE="/etc/systemd/system/governaii-agent.service"

if [ "$1" = "uninstall" ]; then
    echo "Removendo GovernAII Agent..."
    sudo systemctl stop governaii-agent 2>/dev/null
    sudo systemctl disable governaii-agent 2>/dev/null
    sudo rm -f $SERVICE_FILE
    sudo rm -rf $INSTALL_DIR
    sudo systemctl daemon-reload
    echo "Agent removido com sucesso!"
    exit 0
fi

echo "Instalando GovernAII Asset Discovery Agent..."

# Verificar se é root
if [ "$EUID" -ne 0 ]; then
    echo "Por favor, execute como root (sudo)"
    exit 1
fi

# Criar diretório de instalação
mkdir -p $INSTALL_DIR

# Criar arquivo de configuração
cat > $CONFIG_FILE << EOF
{
    "token": "${config.token}",
    "empresa_id": "${config.empresa_id}",
    "api_url": "${config.api_url}",
    "api_key": "${config.api_key}",
    "platform": "linux",
    "heartbeat_interval": ${config.heartbeat_interval},
    "sync_interval": ${config.sync_interval}
}
EOF

# Script principal do agente
cat > $INSTALL_DIR/agent.py << 'EOF'
#!/usr/bin/env python3
import json
import time
import requests
import subprocess
import socket
import platform
import logging
import sys
import os

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/governaii-agent.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

class GovernAIIAgent:
    def __init__(self, config_path):
        with open(config_path, 'r') as f:
            self.config = json.load(f)
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f"Bearer {self.config['api_key']}",
            'Content-Type': 'application/json'
        })
    
    def send_heartbeat(self):
        try:
            hostname = socket.gethostname()
            ip_address = socket.gethostbyname(hostname)
            
            data = {
                'agent_token': self.config['token'],
                'hostname': hostname,
                'ip_address': ip_address,
                'status': 'online'
            }
            
            response = self.session.post(
                f"{self.config['api_url']}/functions/v1/agent-heartbeat",
                json=data
            )
            
            if response.status_code == 200:
                logging.info("Heartbeat sent successfully")
            else:
                logging.error(f"Heartbeat failed: {response.status_code}")
                
        except Exception as e:
            logging.error(f"Failed to send heartbeat: {e}")
    
    def collect_system_info(self):
        try:
            # Informações básicas do sistema
            system_info = {
                'hostname': socket.gethostname(),
                'platform': platform.platform(),
                'architecture': platform.architecture(),
                'processor': platform.processor(),
                'python_version': platform.python_version()
            }
            
            # Informações de hardware
            try:
                # CPU Info
                with open('/proc/cpuinfo', 'r') as f:
                    cpu_info = f.read()
                system_info['cpu_info'] = cpu_info
                
                # Memory Info
                with open('/proc/meminfo', 'r') as f:
                    mem_info = f.read()
                system_info['memory_info'] = mem_info
                
            except Exception as e:
                logging.warning(f"Could not read hardware info: {e}")
            
            # Software instalado (se dpkg disponível)
            try:
                result = subprocess.run(['dpkg', '-l'], capture_output=True, text=True)
                if result.returncode == 0:
                    system_info['installed_packages'] = result.stdout
            except Exception:
                try:
                    result = subprocess.run(['rpm', '-qa'], capture_output=True, text=True)
                    if result.returncode == 0:
                        system_info['installed_packages'] = result.stdout
                except Exception:
                    logging.warning("Could not get package list")
            
            return system_info
            
        except Exception as e:
            logging.error(f"Failed to collect system info: {e}")
            return {}
    
    def sync_assets(self):
        try:
            system_info = self.collect_system_info()
            
            data = {
                'agent_token': self.config['token'],
                'hostname': socket.gethostname(),
                'assets': system_info
            }
            
            response = self.session.post(
                f"{self.config['api_url']}/functions/v1/agent-sync-assets",
                json=data
            )
            
            if response.status_code == 200:
                logging.info("Assets synced successfully")
            else:
                logging.error(f"Asset sync failed: {response.status_code}")
                
        except Exception as e:
            logging.error(f"Failed to sync assets: {e}")
    
    def run(self):
        logging.info("GovernAII Agent started")
        last_sync = 0
        
        while True:
            try:
                # Send heartbeat
                self.send_heartbeat()
                
                # Sync assets once a day
                current_time = time.time()
                if current_time - last_sync > self.config['sync_interval']:
                    self.sync_assets()
                    last_sync = current_time
                
                time.sleep(self.config['heartbeat_interval'])
                
            except KeyboardInterrupt:
                logging.info("Agent stopped by user")
                break
            except Exception as e:
                logging.error(f"Unexpected error: {e}")
                time.sleep(60)  # Wait before retrying

if __name__ == "__main__":
    agent = GovernAIIAgent("/opt/governaii-agent/config.json")
    agent.run()
EOF

chmod +x $INSTALL_DIR/agent.py

# Criar arquivo de serviço systemd
cat > $SERVICE_FILE << EOF
[Unit]
Description=GovernAII Asset Discovery Agent
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/bin/python3 $INSTALL_DIR/agent.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Recarregar systemd e iniciar serviço
systemctl daemon-reload
systemctl enable governaii-agent
systemctl start governaii-agent

echo "GovernAII Agent instalado e iniciado com sucesso!"
echo "Token do agente: ${config.token}"
echo ""
echo "Status: systemctl status governaii-agent"
echo "Logs: journalctl -u governaii-agent -f"
echo "Para desinstalar: sudo $0 uninstall"
`;
}

function generateMacOSPackage(config: any): string {
  return `#!/bin/bash
# GovernAII Asset Discovery Agent - macOS Installer

INSTALL_DIR="/usr/local/opt/governaii-agent"
CONFIG_FILE="$INSTALL_DIR/config.json"
PLIST_FILE="$HOME/Library/LaunchAgents/com.governaii.agent.plist"

if [ "$1" = "uninstall" ]; then
    echo "Removendo GovernAII Agent..."
    launchctl unload $PLIST_FILE 2>/dev/null
    rm -f $PLIST_FILE
    sudo rm -rf $INSTALL_DIR
    echo "Agent removido com sucesso!"
    exit 0
fi

echo "Instalando GovernAII Asset Discovery Agent..."

# Criar diretório de instalação
sudo mkdir -p $INSTALL_DIR

# Criar arquivo de configuração
sudo tee $CONFIG_FILE > /dev/null << EOF
{
    "token": "${config.token}",
    "empresa_id": "${config.empresa_id}",
    "api_url": "${config.api_url}",
    "api_key": "${config.api_key}",
    "platform": "macos",
    "heartbeat_interval": ${config.heartbeat_interval},
    "sync_interval": ${config.sync_interval}
}
EOF

# Script principal do agente
sudo tee $INSTALL_DIR/agent.py > /dev/null << 'EOF'
#!/usr/bin/env python3
import json
import time
import requests
import subprocess
import socket
import platform
import logging
import sys
import os

# Configurar logging
log_file = os.path.expanduser('~/Library/Logs/governaii-agent.log')
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler(sys.stdout)
    ]
)

class GovernAIIAgent:
    def __init__(self, config_path):
        with open(config_path, 'r') as f:
            self.config = json.load(f)
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f"Bearer {self.config['api_key']}",
            'Content-Type': 'application/json'
        })
    
    def send_heartbeat(self):
        try:
            hostname = socket.gethostname()
            ip_address = socket.gethostbyname(hostname)
            
            data = {
                'agent_token': self.config['token'],
                'hostname': hostname,
                'ip_address': ip_address,
                'status': 'online'
            }
            
            response = self.session.post(
                f"{self.config['api_url']}/functions/v1/agent-heartbeat",
                json=data
            )
            
            if response.status_code == 200:
                logging.info("Heartbeat sent successfully")
            else:
                logging.error(f"Heartbeat failed: {response.status_code}")
                
        except Exception as e:
            logging.error(f"Failed to send heartbeat: {e}")
    
    def collect_system_info(self):
        try:
            # Informações básicas do sistema
            system_info = {
                'hostname': socket.gethostname(),
                'platform': platform.platform(),
                'architecture': platform.architecture(),
                'processor': platform.processor(),
                'python_version': platform.python_version()
            }
            
            # Informações específicas do macOS
            try:
                result = subprocess.run(['system_profiler', 'SPHardwareDataType', '-json'], 
                                      capture_output=True, text=True)
                if result.returncode == 0:
                    system_info['hardware_info'] = result.stdout
                    
                result = subprocess.run(['system_profiler', 'SPSoftwareDataType', '-json'], 
                                      capture_output=True, text=True)
                if result.returncode == 0:
                    system_info['software_info'] = result.stdout
                    
            except Exception as e:
                logging.warning(f"Could not get system profiler info: {e}")
            
            # Aplicações instaladas
            try:
                result = subprocess.run(['ls', '/Applications'], capture_output=True, text=True)
                if result.returncode == 0:
                    system_info['installed_applications'] = result.stdout.split('\n')
            except Exception as e:
                logging.warning(f"Could not get applications list: {e}")
            
            return system_info
            
        except Exception as e:
            logging.error(f"Failed to collect system info: {e}")
            return {}
    
    def sync_assets(self):
        try:
            system_info = self.collect_system_info()
            
            data = {
                'agent_token': self.config['token'],
                'hostname': socket.gethostname(),
                'assets': system_info
            }
            
            response = self.session.post(
                f"{self.config['api_url']}/functions/v1/agent-sync-assets",
                json=data
            )
            
            if response.status_code == 200:
                logging.info("Assets synced successfully")
            else:
                logging.error(f"Asset sync failed: {response.status_code}")
                
        except Exception as e:
            logging.error(f"Failed to sync assets: {e}")
    
    def run(self):
        logging.info("GovernAII Agent started")
        last_sync = 0
        
        while True:
            try:
                # Send heartbeat
                self.send_heartbeat()
                
                # Sync assets once a day
                current_time = time.time()
                if current_time - last_sync > self.config['sync_interval']:
                    self.sync_assets()
                    last_sync = current_time
                
                time.sleep(self.config['heartbeat_interval'])
                
            except KeyboardInterrupt:
                logging.info("Agent stopped by user")
                break
            except Exception as e:
                logging.error(f"Unexpected error: {e}")
                time.sleep(60)  # Wait before retrying

if __name__ == "__main__":
    agent = GovernAIIAgent("/usr/local/opt/governaii-agent/config.json")
    agent.run()
EOF

sudo chmod +x $INSTALL_DIR/agent.py

# Criar arquivo plist para LaunchAgent
mkdir -p "$HOME/Library/LaunchAgents"
tee $PLIST_FILE > /dev/null << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.governaii.agent</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/python3</string>
        <string>$INSTALL_DIR/agent.py</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$HOME/Library/Logs/governaii-agent.log</string>
    <key>StandardErrorPath</key>
    <string>$HOME/Library/Logs/governaii-agent.log</string>
</dict>
</plist>
EOF

# Carregar o agente
launchctl load $PLIST_FILE

echo "GovernAII Agent instalado e iniciado com sucesso!"
echo "Token do agente: ${config.token}"
echo ""
echo "Logs: tail -f ~/Library/Logs/governaii-agent.log"
echo "Para desinstalar: $0 uninstall"
`;
}