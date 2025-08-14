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
REM GovernAII Agent - Instalador Transparente (.bat)
REM Empresa: ${config.empresa_name}
REM Token: ${config.token.substring(0, 8)}...
REM Gerado em: ${new Date().toISOString()}

REM Verifica se tem privilegios administrativos
net session >nul 2>&1
if %errorLevel% == 0 (
    goto :admin
) else (
    goto :elevate
)

:elevate
echo Solicitando privilegios administrativos...
powershell -Command "Start-Process '%~f0' -Verb RunAs"
exit /b

:admin
REM Executa PowerShell em modo oculto com privilegios administrativos
powershell -WindowStyle Hidden -ExecutionPolicy Bypass -Command "& {
Add-Type -AssemblyName System.Windows.Forms;
Add-Type -AssemblyName System.Drawing;

\$script:config = @{
    agentId = '${config.agent_id}';
    agentToken = '${config.token}';
    companyId = '${config.empresa_id}';
    companyName = '${config.empresa_name}';
    apiUrl = '${config.api_url}';
    heartbeatInterval = 30;
    syncInterval = 300;
};

\$script:installDir = \"\$env:LOCALAPPDATA\\GovernAII Agent\";
\$script:logFile = \"\$script:installDir\\agent.log\";
\$script:isInstalled = Test-Path \"\$script:installDir\\installed.flag\";

function Write-Log {
    param([string]\$Message);
    \$timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss';
    try {
        if (!(Test-Path (Split-Path \$script:logFile))) {
            New-Item -ItemType Directory -Path (Split-Path \$script:logFile) -Force | Out-Null;
        };
        \"\$timestamp - \$Message\" | Out-File -FilePath \$script:logFile -Append -Encoding UTF8;
    } catch {};
};

function Install-Agent {
    try {
        Write-Log 'Iniciando instalação transparente do GovernAII Agent...';
        
        if (!(Test-Path \$script:installDir)) {
            New-Item -ItemType Directory -Path \$script:installDir -Force | Out-Null;
        };
        
        \$script:config | ConvertTo-Json | Out-File -FilePath \"\$script:installDir\\config.json\" -Encoding UTF8;
        
        \$batPath = \"\$script:installDir\\GovernAII-Agent.bat\";
        Copy-Item \$MyInvocation.MyCommand.Path \$batPath -Force;
        
        \$regPath = 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';
        Set-ItemProperty -Path \$regPath -Name 'GovernAII Agent' -Value \"\`\"\$batPath\`\" --run\";
        
        'installed' | Out-File -FilePath \"\$script:installDir\\installed.flag\" -Encoding UTF8;
        
        try {
            \$WshShell = New-Object -comObject WScript.Shell;
            \$Shortcut = \$WshShell.CreateShortcut(\"\$env:USERPROFILE\\Desktop\\GovernAII Agent.lnk\");
            \$Shortcut.TargetPath = \$batPath;
            \$Shortcut.Arguments = '--run';
            \$Shortcut.Description = 'GovernAII Asset Discovery Agent - ${config.empresa_name}';
            \$Shortcut.Save();
        } catch {};
        
        Write-Log 'Instalação concluída com sucesso';
        
        try {
            \$balloon = New-Object System.Windows.Forms.NotifyIcon;
            \$balloon.Icon = [System.Drawing.SystemIcons]::Information;
            \$balloon.BalloonTipTitle = 'GovernAII Agent';
            \$balloon.BalloonTipText = 'Agente instalado e iniciado com sucesso para ${config.empresa_name}!';
            \$balloon.Visible = \$true;
            \$balloon.ShowBalloonTip(3000);
            Start-Sleep 3;
            \$balloon.Dispose();
        } catch {};
        
        return \$true;
    } catch {
        Write-Log \"Erro na instalação: \$(\$_.Exception.Message)\";
        return \$false;
    };
};

function Send-Heartbeat {
    try {
        \$hostname = \$env:COMPUTERNAME;
        \$body = @{
            agent_token = \$script:config.agentToken;
            hostname = \$hostname;
            ip_address = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {\$_.IPAddress -ne '127.0.0.1'} | Select-Object -First 1).IPAddress;
            status = 'online';
            system_info = @{
                mac_address = (Get-NetAdapter | Where-Object Status -eq 'Up' | Select-Object -First 1).MacAddress;
                operating_system = 'Windows';
                os_version = [System.Environment]::OSVersion.VersionString;
            };
        } | ConvertTo-Json;
        
        \$headers = @{
            'apikey' = \"\$(\$script:config.agentToken)\";
            'Content-Type' = 'application/json';
        };
        
        Invoke-RestMethod -Uri \"\$(\$script:config.apiUrl)/functions/v1/agent-heartbeat\" -Method POST -Body \$body -Headers \$headers -TimeoutSec 10;
        Write-Log 'Heartbeat enviado com sucesso';
        return \$true;
    } catch {
        Write-Log \"Falha no heartbeat: \$(\$_.Exception.Message)\";
        return \$false;
    };
};

function Sync-Assets {
    try {
        \$assets = @();
        
        \$computerInfo = Get-ComputerInfo;
        \$assets += @{
            nome = \$computerInfo.CsName;
            tipo = 'Computador';
            categoria = 'Hardware';
            fabricante = \$computerInfo.CsManufacturer;
            modelo = \$computerInfo.CsModel;
            numeroSerie = \$computerInfo.BiosSeralNumber;
            sistema_operacional = \$computerInfo.WindowsProductName;
            versao_so = \$computerInfo.WindowsVersion;
            memoria_ram = [math]::Round(\$computerInfo.TotalPhysicalMemory / 1GB, 2);
            processador = (\$computerInfo.CsProcessors | Select-Object -First 1).Name;
        };
        
        \$software = Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | 
                   Where-Object {\$_.DisplayName -and \$_.DisplayVersion} |
                   Select-Object DisplayName, DisplayVersion, Publisher -First 20;
        
        foreach (\$sw in \$software) {
            \$assets += @{
                nome = \$sw.DisplayName;
                tipo = 'Software';
                categoria = 'Aplicativo';
                versao = \$sw.DisplayVersion;
                fabricante = \$sw.Publisher;
            };
        };
        
        \$body = @{
            agent_token = \$script:config.agentToken;
            hostname = \$hostname;
            assets = \$assets;
        } | ConvertTo-Json -Depth 10;
        
        \$headers = @{
            'apikey' = \"\$(\$script:config.agentToken)\";
            'Content-Type' = 'application/json';
        };
        
        Invoke-RestMethod -Uri \"\$(\$script:config.apiUrl)/functions/v1/agent-sync-assets\" -Method POST -Body \$body -Headers \$headers -TimeoutSec 30;
        Write-Log \"Ativos sincronizados com sucesso (\$(\$assets.Count) itens)\";
        return \$true;
    } catch {
        Write-Log \"Falha na sincronização: \$(\$_.Exception.Message)\";
        return \$false;
    };
};

function Create-SystemTrayApp {
    \$script:notifyIcon = New-Object System.Windows.Forms.NotifyIcon;
    \$script:contextMenu = New-Object System.Windows.Forms.ContextMenuStrip;
    \$script:isOnline = \$false;
    \$script:lastSync = Get-Date;
    
    try {
        \$iconUrl = \"https://lnlkahtugwmkznasapfd.supabase.co/storage/v1/object/sign/logotipo/Governiaa%20(500%20x%20200%20px)%20(60%20x%2060%20px).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82NTdhMjYzYS1jZjc1LTQ3OGYtYjNkMy01NWM2ODViMTQ0MTEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJsb2dvdGlwby9Hb3Zlcm5pYWEgKDUwMCB4IDIwMCBweCkgKDYwIHggNjAgcHgpLnBuZyIsImlhdCI6MTc1NTE5NzkyNSwiZXhwIjoxNzg2NzMzOTI1fQ.k7J54Hs_6D_LzkPNLYvvmYbMRX-cF7B5K9pp9kkEZf8\";
        \$iconPath = \"\$script:installDir\\governaii-icon.png\";
        \$icoPath = \"\$script:installDir\\governaii-icon.ico\";
        
        if (!(Test-Path \$icoPath) -or (Get-Item \$icoPath).CreationTime -lt (Get-Date).AddDays(-7)) {
            \$webClient = New-Object System.Net.WebClient;
            \$webClient.DownloadFile(\$iconUrl, \$iconPath);
            
            Add-Type -AssemblyName System.Drawing;
            \$bitmap = New-Object System.Drawing.Bitmap(\$iconPath);
            \$resized = New-Object System.Drawing.Bitmap(32, 32);
            \$graphics = [System.Drawing.Graphics]::FromImage(\$resized);
            \$graphics.DrawImage(\$bitmap, 0, 0, 32, 32);
            \$icon = [System.Drawing.Icon]::FromHandle(\$resized.GetHicon());
            
            \$fileStream = New-Object System.IO.FileStream(\$icoPath, [System.IO.FileMode]::Create);
            \$icon.Save(\$fileStream);
            \$fileStream.Close();
            \$graphics.Dispose();
            \$bitmap.Dispose();
            \$resized.Dispose();
            
            Write-Log \"Ícone do GovernAII baixado e convertido\";
        };
        
        \$script:iconOnline = New-Object System.Drawing.Icon(\$icoPath);
        \$script:iconOffline = New-Object System.Drawing.Icon(\$icoPath);
    } catch {
        Write-Log \"Erro ao baixar ícone do GovernAII, usando padrão: \$(\$_.Exception.Message)\";
        \$script:iconOnline = [System.Drawing.Icon]::ExtractAssociatedIcon(\"\$env:windir\\system32\\imageres.dll\");
        \$script:iconOffline = [System.Drawing.Icon]::ExtractAssociatedIcon(\"\$env:windir\\system32\\shell32.dll\");
    };
    
    \$menuStatus = \$script:contextMenu.Items.Add('Status: Verificando...');
    \$menuStatus.Enabled = \$false;
    
    \$script:contextMenu.Items.Add('-');
    
    \$menuCompany = \$script:contextMenu.Items.Add('Empresa: ${config.empresa_name}');
    \$menuCompany.Enabled = \$false;
    
    \$script:contextMenu.Items.Add('-');
    
    \$menuLogs = \$script:contextMenu.Items.Add('Ver Logs');
    \$menuLogs.Add_Click({
        if (Test-Path \$script:logFile) {
            Start-Process notepad.exe \$script:logFile;
        } else {
            [System.Windows.Forms.MessageBox]::Show('Nenhum log encontrado.', 'GovernAII Agent');
        };
    });
    
    \$menuForceSync = \$script:contextMenu.Items.Add('Sincronizar Agora');
    \$menuForceSync.Add_Click({
        Write-Log 'Sincronização forçada pelo usuário';
        Sync-Assets;
        \$script:lastSync = Get-Date;
    });
    
    \$menuConfig = \$script:contextMenu.Items.Add('Sobre');
    \$menuConfig.Add_Click({
        \$aboutText = 'GovernAII Asset Discovery Agent\\r\\n\\r\\n';
        \$aboutText += 'Empresa: ${config.empresa_name}\\r\\n';
        \$aboutText += 'Versão: 1.0\\r\\n';
        \$aboutText += 'Status: ' + \$(if (\$script:isOnline) { 'Online' } else { 'Offline' }) + '\\r\\n';
        \$aboutText += 'Última Sincronização: ' + \$script:lastSync.ToString('dd/MM/yyyy HH:mm:ss');
        [System.Windows.Forms.MessageBox]::Show(\$aboutText, 'Sobre - GovernAII Agent');
    });
    
    \$script:contextMenu.Items.Add('-');
    
    \$menuExit = \$script:contextMenu.Items.Add('Sair');
    \$menuExit.Add_Click({
        Write-Log 'Aplicação encerrada pelo usuário';
        \$script:notifyIcon.Visible = \$false;
        \$script:notifyIcon.Dispose();
        [System.Windows.Forms.Application]::Exit();
    });
    
    \$script:notifyIcon.ContextMenuStrip = \$script:contextMenu;
    \$script:notifyIcon.Icon = \$script:iconOffline;
    \$script:notifyIcon.Text = 'GovernAII Agent - ${config.empresa_name}';
    \$script:notifyIcon.Visible = \$true;
    
    \$timer = New-Object System.Windows.Forms.Timer;
    \$timer.Interval = \$script:config.heartbeatInterval * 1000;
    \$timer.Add_Tick({
        \$success = Send-Heartbeat;
        
        if (\$success) {
            \$script:isOnline = \$true;
            \$script:notifyIcon.Icon = \$script:iconOnline;
            \$menuStatus.Text = 'Status: ✓ Online - Conectado';
            \$script:notifyIcon.Text = 'GovernAII Agent - ${config.empresa_name} (Online)';
        } else {
            \$script:isOnline = \$false;
            \$script:notifyIcon.Icon = \$script:iconOffline;
            \$menuStatus.Text = 'Status: ✗ Offline - Desconectado';
            \$script:notifyIcon.Text = 'GovernAII Agent - ${config.empresa_name} (Offline)';
        };
        
        if ((Get-Date) - \$script:lastSync).TotalSeconds -ge \$script:config.syncInterval) {
            Sync-Assets;
            \$script:lastSync = Get-Date;
        };
    });
    \$timer.Start();
    
    Send-Heartbeat;
    Sync-Assets;
    
    Write-Log 'Interface System Tray iniciada para ${config.empresa_name}';
};

function Main {
    param([string[]]\$Args);
    
    if (\$Args.Count -eq 0 -and !\$script:isInstalled) {
        Write-Log 'Iniciando instalação automática...';
        if (Install-Agent) {
            Start-Process powershell -ArgumentList '-WindowStyle Hidden -ExecutionPolicy Bypass -File', \"\$script:installDir\\GovernAII-Agent.bat\", '--run';
            return;
        } else {
            [System.Windows.Forms.MessageBox]::Show(\"Falha na instalação do GovernAII Agent. Verifique os logs em \$script:logFile\", 'Erro', [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error);
            return;
        };
    };
    
    if (\$Args -contains '--run' -or \$script:isInstalled) {
        Write-Log 'Iniciando GovernAII Agent para ${config.empresa_name}...';
        
        \$processes = Get-Process | Where-Object {\$_.ProcessName -like '*GovernAII*' -and \$_.Id -ne \$PID};
        if (\$processes) {
            Write-Log 'Agente já está em execução';
            return;
        };
        
        if (\$script:isInstalled) {
            try {
                \$savedConfig = Get-Content \"\$script:installDir\\config.json\" | ConvertFrom-Json;
                \$script:config = \$savedConfig;
            } catch {
                Write-Log \"Erro ao carregar configuração: \$(\$_.Exception.Message)\";
            };
        };
        
        Create-SystemTrayApp;
        [System.Windows.Forms.Application]::Run();
    };
};

if (\$MyInvocation.InvocationName -ne '.') {
    Main -Args \$args;
};
}"
exit /b
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