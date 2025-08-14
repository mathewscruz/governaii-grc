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
      .select('empresa_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile?.empresa_id) {
      throw new Error('User profile not found');
    }

    // Obter platform do body da requisição
    const { platform } = await req.json();

    if (!platform || !['windows', 'linux', 'macos'].includes(platform)) {
      throw new Error('Invalid platform specified');
    }

    // Gerar token único para o agente
    const agentToken = crypto.randomUUID();

    // Registrar agente pendente
    const { error: insertError } = await supabaseClient
      .from('asset_agents')
      .insert({
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
      empresa_id: profile.empresa_id,
      api_url: Deno.env.get('SUPABASE_URL'),
      api_key: Deno.env.get('SUPABASE_ANON_KEY'),
      platform: platform,
      heartbeat_interval: 300, // 5 minutos
      sync_interval: 86400, // 24 horas
    };

    // Gerar instalador baseado na plataforma
    let installerContent = '';
    let filename = '';
    let contentType = '';

    switch (platform) {
      case 'windows':
        filename = `GovernAII-Agent-Setup-${agentToken}.exe`;
        contentType = 'application/octet-stream';
        installerContent = generateWindowsInstaller(agentConfig);
        break;
      case 'linux':
        filename = `governaii-agent-${agentToken}.deb`;
        contentType = 'application/x-debian-package';
        installerContent = generateLinuxInstaller(agentConfig);
        break;
      case 'macos':
        filename = `GovernAII Agent ${agentToken}.dmg`;
        contentType = 'application/x-apple-diskimage';
        installerContent = generateMacOSInstaller(agentConfig);
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

function generateWindowsInstaller(config: any): string {
  return `# GovernAII Asset Discovery Agent - Windows Installer
# Este script instala e configura o agente de descoberta de ativos

param(
    [switch]$Uninstall
)

$ServiceName = "GovernAIIAgent"
$InstallPath = "$env:ProgramFiles\\GovernAII\\Agent"
$ConfigFile = "$InstallPath\\config.json"

if ($Uninstall) {
    Write-Host "Removendo GovernAII Agent..."
    Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
    Remove-Service -Name $ServiceName -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force $InstallPath -ErrorAction SilentlyContinue
    Write-Host "Agent removido com sucesso!"
    exit 0
}

Write-Host "Instalando GovernAII Asset Discovery Agent..."

# Criar diretório de instalação
New-Item -ItemType Directory -Force -Path $InstallPath | Out-Null

# Criar arquivo de configuração
$config = @{
    token = "${config.token}"
    empresa_id = "${config.empresa_id}"
    api_url = "${config.api_url}"
    api_key = "${config.api_key}"
    platform = "windows"
    heartbeat_interval = ${config.heartbeat_interval}
    sync_interval = ${config.sync_interval}
}

$config | ConvertTo-Json | Set-Content $ConfigFile

# Script principal do agente (PowerShell)
$agentScript = @'
# GovernAII Agent - Main Script
$ConfigPath = "$PSScriptRoot\\config.json"
$config = Get-Content $ConfigPath | ConvertFrom-Json

function Send-Heartbeat {
    $body = @{
        agent_token = $config.token
        hostname = $env:COMPUTERNAME
        ip_address = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" } | Select-Object -First 1).IPAddress
        status = "online"
    } | ConvertTo-Json

    try {
        Invoke-RestMethod -Uri "$($config.api_url)/functions/v1/agent-heartbeat" -Method POST -Body $body -ContentType "application/json" -Headers @{"Authorization"="Bearer $($config.api_key)"}
    } catch {
        Write-EventLog -LogName Application -Source "GovernAII Agent" -EventID 1001 -EntryType Error -Message "Failed to send heartbeat: $_"
    }
}

function Sync-Assets {
    $assets = @()
    
    # Coletar informações do sistema
    $computerInfo = Get-ComputerInfo
    $installedSoftware = Get-WmiObject -Class Win32_Product | Select-Object Name, Version, Vendor
    
    $assetData = @{
        agent_token = $config.token
        hostname = $env:COMPUTERNAME
        assets = @{
            computer_info = $computerInfo
            installed_software = $installedSoftware
        }
    } | ConvertTo-Json -Depth 10
    
    try {
        Invoke-RestMethod -Uri "$($config.api_url)/functions/v1/agent-sync-assets" -Method POST -Body $assetData -ContentType "application/json" -Headers @{"Authorization"="Bearer $($config.api_key)"}
    } catch {
        Write-EventLog -LogName Application -Source "GovernAII Agent" -EventID 1002 -EntryType Error -Message "Failed to sync assets: $_"
    }
}

# Loop principal
while ($true) {
    Send-Heartbeat
    
    # Sincronizar ativos uma vez por dia
    $lastSync = Get-ItemProperty -Path "HKLM:\\SOFTWARE\\GovernAII" -Name "LastSync" -ErrorAction SilentlyContinue
    if (-not $lastSync -or ((Get-Date) - [DateTime]$lastSync.LastSync).TotalSeconds -gt $config.sync_interval) {
        Sync-Assets
        Set-ItemProperty -Path "HKLM:\\SOFTWARE\\GovernAII" -Name "LastSync" -Value (Get-Date) -Force
    }
    
    Start-Sleep -Seconds $config.heartbeat_interval
}
'@

$agentScript | Set-Content "$InstallPath\\agent.ps1"

# Criar registro para logs
New-EventLog -LogName Application -Source "GovernAII Agent" -ErrorAction SilentlyContinue

# Instalar como serviço Windows
$servicePath = "powershell.exe -ExecutionPolicy Bypass -File \\"$InstallPath\\agent.ps1\\""
New-Service -Name $ServiceName -BinaryPathName $servicePath -DisplayName "GovernAII Asset Discovery Agent" -StartupType Automatic -Description "Agente de descoberta automática de ativos para GovernAII"

# Iniciar serviço
Start-Service -Name $ServiceName

Write-Host "GovernAII Agent instalado e iniciado com sucesso!"
Write-Host "Token do agente: ${config.token}"
Write-Host ""
Write-Host "Para desinstalar, execute: .\\$($MyInvocation.MyCommand.Name) -Uninstall"
`;
}

function generateLinuxInstaller(config: any): string {
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

function generateMacOSInstaller(config: any): string {
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