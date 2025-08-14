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
      supabaseAnonKey: Deno.env.get('SUPABASE_ANON_KEY'),
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
        filename = `GovernAII-Agent-${agentConfig.empresa_name.replace(/[^a-zA-Z0-9]/g, '')}.ps1`;
        contentType = 'application/octet-stream';
        installerContent = generateWindowsPowerShell(agentConfig);
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

function generateWindowsPowerShell(config: any): string {
  return `# GovernAII Agent PowerShell Installer
# Executa com bypass de politica e compila agente C# em tempo real

Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force

Write-Host "===============================================" -ForegroundColor Green
Write-Host "   GovernAII Agent Installer v1.0.0" -ForegroundColor Green  
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""

# Verificar se .NET está instalado
try {
    $dotnetVersion = & dotnet --version 2>$null
    Write-Host "✓ .NET detectado: $dotnetVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ .NET não encontrado!" -ForegroundColor Red
    Write-Host "Por favor, instale o .NET 6.0 ou superior de: https://dotnet.microsoft.com/download" -ForegroundColor Yellow
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Criar diretório temporário
$tempDir = Join-Path $env:TEMP "GovernAII_Build_$(Get-Random)"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
Write-Host "✓ Diretório temporário criado: $tempDir" -ForegroundColor Green

try {
    # Criar arquivo de projeto
    $projectContent = @'
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>WinExe</OutputType>
    <TargetFramework>net6.0-windows</TargetFramework>
    <UseWindowsForms>true</UseWindowsForms>
    <PublishSingleFile>true</PublishSingleFile>
    <SelfContained>false</SelfContained>
    <RuntimeIdentifier>win-x64</RuntimeIdentifier>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="System.Management" Version="7.0.0" />
  </ItemGroup>
</Project>
'@
    
    $projectPath = Join-Path $tempDir "GovernAIIAgent.csproj"
    $projectContent | Out-File -FilePath $projectPath -Encoding UTF8
    Write-Host "✓ Arquivo de projeto criado" -ForegroundColor Green

    # Criar código C# do agente
    $csharpCode = @'
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net.Http;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Win32;

namespace GovernAIIAgent
{
    public class Program
    {
        private static NotifyIcon trayIcon;
        private static Timer heartbeatTimer;
        private static Timer syncTimer;
        private static string installDir;
        private static string logFile;
        private static Config config;
        private static HttpClient httpClient;

        [STAThread]
        public static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            try
            {
                InitializeAgent();
                Application.Run();
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Erro crítico: {ex.Message}", "GovernAII Agent", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private static void InitializeAgent()
        {
            // Configurar diretórios
            installDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "GovernAII", "Agent");
            Directory.CreateDirectory(installDir);
            logFile = Path.Combine(installDir, "agent.log");

            // Criar configuração
            CreateConfiguration();

            // Inicializar HTTP client
            httpClient = new HttpClient();
            httpClient.DefaultRequestHeaders.Add("apikey", config.SupabaseAnonKey);

            // Configurar system tray
            SetupSystemTray();

            // Configurar auto-inicialização
            SetupAutoStart();

            // Iniciar timers
            StartTimers();

            LogMessage("GovernAII Agent iniciado com sucesso");
        }

        private static void CreateConfiguration()
        {
            var configPath = Path.Combine(installDir, "config.json");
            config = new Config
            {
                AgentId = "${config.agent_id}",
                AgentToken = "${config.token}",
                EmpresaId = "${config.empresa_id}",
                EmpresaName = "${config.empresa_name}",
                ApiUrl = "${config.api_url}",
                SupabaseAnonKey = "${config.supabaseAnonKey}",
                HeartbeatInterval = 60,
                SyncInterval = 300
            };

            var jsonString = JsonSerializer.Serialize(config, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(configPath, jsonString);
        }

        private static void SetupSystemTray()
        {
            trayIcon = new NotifyIcon()
            {
                Icon = CreateGovernAIIIcon(),
                Text = "GovernAII Agent",
                Visible = true
            };

            // Menu de contexto
            var contextMenu = new ContextMenuStrip();
            contextMenu.Items.Add("Status", null, ShowStatus);
            contextMenu.Items.Add("Sincronizar Agora", null, SyncNow);
            contextMenu.Items.Add("Ver Logs", null, ShowLogs);
            contextMenu.Items.Add("-");
            contextMenu.Items.Add("Sair", null, ExitApplication);

            trayIcon.ContextMenuStrip = contextMenu;
            trayIcon.DoubleClick += ShowStatus;

            // Mostrar notificação de inicialização
            trayIcon.ShowBalloonTip(3000, "GovernAII Agent", "Agente iniciado e monitorando sistema", ToolTipIcon.Info);
        }

        private static Icon CreateGovernAIIIcon()
        {
            // Criar ícone simples se não conseguir baixar
            var bitmap = new Bitmap(16, 16);
            using (var g = Graphics.FromImage(bitmap))
            {
                g.FillEllipse(Brushes.Blue, 2, 2, 12, 12);
                g.DrawString("G", new Font("Arial", 8, FontStyle.Bold), Brushes.White, 4, 2);
            }
            return Icon.FromHandle(bitmap.GetHicon());
        }

        private static void SetupAutoStart()
        {
            try
            {
                var key = Registry.CurrentUser.OpenSubKey(@"SOFTWARE\Microsoft\Windows\CurrentVersion\Run", true);
                key?.SetValue("GovernAIIAgent", Application.ExecutablePath);
                key?.Close();
            }
            catch (Exception ex)
            {
                LogMessage($"Erro ao configurar auto-inicialização: {ex.Message}");
            }
        }

        private static void StartTimers()
        {
            // Timer de heartbeat (1 minuto)
            heartbeatTimer = new Timer(async _ => await SendHeartbeat(), null, TimeSpan.Zero, TimeSpan.FromSeconds(config.HeartbeatInterval));

            // Timer de sincronização (5 minutos)
            syncTimer = new Timer(async _ => await SyncAssets(), null, TimeSpan.FromMinutes(1), TimeSpan.FromSeconds(config.SyncInterval));
        }

        private static async Task SendHeartbeat()
        {
            try
            {
                var heartbeatData = new
                {
                    agent_token = config.AgentToken,
                    hostname = Environment.MachineName,
                    ip_address = GetLocalIPAddress(),
                    status = "online",
                    system_info = GetSystemInfo()
                };

                var json = JsonSerializer.Serialize(heartbeatData);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await httpClient.PostAsync($"{config.ApiUrl}/functions/v1/agent-heartbeat", content);
                
                if (response.IsSuccessStatusCode)
                {
                    LogMessage("Heartbeat enviado com sucesso");
                }
                else
                {
                    LogMessage($"Erro no heartbeat: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                LogMessage($"Erro ao enviar heartbeat: {ex.Message}");
            }
        }

        private static async Task SyncAssets()
        {
            try
            {
                var assets = DiscoverAssets();
                var syncData = new
                {
                    agent_token = config.AgentToken,
                    hostname = Environment.MachineName,
                    assets = assets
                };

                var json = JsonSerializer.Serialize(syncData);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await httpClient.PostAsync($"{config.ApiUrl}/functions/v1/agent-sync-assets", content);
                
                if (response.IsSuccessStatusCode)
                {
                    LogMessage($"Sincronização concluída - {assets.Count} ativos encontrados");
                    trayIcon.ShowBalloonTip(2000, "GovernAII Agent", $"Sincronizados {assets.Count} ativos", ToolTipIcon.Info);
                }
                else
                {
                    LogMessage($"Erro na sincronização: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                LogMessage($"Erro ao sincronizar ativos: {ex.Message}");
            }
        }

        private static List<object> DiscoverAssets()
        {
            var assets = new List<object>();

            try
            {
                // Informações do computador
                var computerInfo = new
                {
                    name = Environment.MachineName,
                    type = "Computer",
                    os = Environment.OSVersion.ToString(),
                    domain = Environment.UserDomainName,
                    user = Environment.UserName,
                    processors = Environment.ProcessorCount,
                    memory = GetTotalMemory()
                };
                assets.Add(computerInfo);

                // Software instalado
                var installedSoftware = GetInstalledSoftware();
                assets.AddRange(installedSoftware);

            }
            catch (Exception ex)
            {
                LogMessage($"Erro ao descobrir ativos: {ex.Message}");
            }

            return assets;
        }

        private static string GetLocalIPAddress()
        {
            try
            {
                var host = System.Net.Dns.GetHostEntry(System.Net.Dns.GetHostName());
                foreach (var ip in host.AddressList)
                {
                    if (ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
                    {
                        return ip.ToString();
                    }
                }
            }
            catch { }
            return "127.0.0.1";
        }

        private static object GetSystemInfo()
        {
            return new
            {
                os = Environment.OSVersion.ToString(),
                machine_name = Environment.MachineName,
                user_name = Environment.UserName,
                domain_name = Environment.UserDomainName,
                processor_count = Environment.ProcessorCount,
                memory_gb = GetTotalMemory(),
                dotnet_version = Environment.Version.ToString()
            };
        }

        private static string GetTotalMemory()
        {
            try
            {
                var searcher = new System.Management.ManagementObjectSearcher("SELECT TotalPhysicalMemory FROM Win32_ComputerSystem");
                foreach (var obj in searcher.Get())
                {
                    var totalMemory = Convert.ToDouble(obj["TotalPhysicalMemory"]);
                    return Math.Round(totalMemory / (1024 * 1024 * 1024), 2).ToString() + " GB";
                }
            }
            catch { }
            return "Unknown";
        }

        private static List<object> GetInstalledSoftware()
        {
            var software = new List<object>();
            try
            {
                var key = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall");
                if (key != null)
                {
                    foreach (var subkeyName in key.GetSubKeyNames())
                    {
                        var subkey = key.OpenSubKey(subkeyName);
                        var name = subkey?.GetValue("DisplayName")?.ToString();
                        var version = subkey?.GetValue("DisplayVersion")?.ToString();
                        
                        if (!string.IsNullOrEmpty(name))
                        {
                            software.Add(new
                            {
                                name = name,
                                type = "Software",
                                version = version ?? "Unknown",
                                install_location = subkey?.GetValue("InstallLocation")?.ToString()
                            });
                        }
                        subkey?.Close();
                    }
                }
                key?.Close();
            }
            catch (Exception ex)
            {
                LogMessage($"Erro ao listar software: {ex.Message}");
            }
            return software;
        }

        private static void ShowStatus(object sender, EventArgs e)
        {
            var status = $"GovernAII Agent\n\nEmpresa: {config.EmpresaName}\nStatus: Online\nÚltimo heartbeat: {DateTime.Now:HH:mm:ss}\nMáquina: {Environment.MachineName}";
            MessageBox.Show(status, "Status do Agente", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        private static async void SyncNow(object sender, EventArgs e)
        {
            await SyncAssets();
        }

        private static void ShowLogs(object sender, EventArgs e)
        {
            try
            {
                if (File.Exists(logFile))
                {
                    Process.Start("notepad.exe", logFile);
                }
                else
                {
                    MessageBox.Show("Arquivo de log não encontrado", "GovernAII Agent", MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Erro ao abrir logs: {ex.Message}", "GovernAII Agent", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private static void ExitApplication(object sender, EventArgs e)
        {
            trayIcon.Visible = false;
            Application.Exit();
        }

        private static void LogMessage(string message)
        {
            try
            {
                var logEntry = $"{DateTime.Now:yyyy-MM-dd HH:mm:ss} - {message}\n";
                File.AppendAllText(logFile, logEntry);
            }
            catch { }
        }
    }

    public class Config
    {
        public string AgentId { get; set; }
        public string AgentToken { get; set; }
        public string EmpresaId { get; set; }
        public string EmpresaName { get; set; }
        public string ApiUrl { get; set; }
        public string SupabaseAnonKey { get; set; }
        public int HeartbeatInterval { get; set; }
        public int SyncInterval { get; set; }
    }
}
'@

    $csharpPath = Join-Path $tempDir "Program.cs"
    $csharpCode | Out-File -FilePath $csharpPath -Encoding UTF8
    Write-Host "✓ Código C# criado" -ForegroundColor Green

    # Compilar o projeto
    Write-Host "🔧 Compilando agente..." -ForegroundColor Yellow
    Set-Location $tempDir
    & dotnet publish -c Release -o output 2>$null

    if ($LASTEXITCODE -eq 0 -and (Test-Path "output/GovernAIIAgent.exe")) {
        # Criar diretório de instalação
        $installDir = Join-Path $env:LOCALAPPDATA "GovernAII\Agent"
        if (!(Test-Path $installDir)) {
            New-Item -ItemType Directory -Path $installDir -Force | Out-Null
        }

        # Copiar executável
        Copy-Item "output/GovernAIIAgent.exe" "$installDir/GovernAIIAgent.exe" -Force
        Write-Host "✓ Agente compilado e instalado com sucesso!" -ForegroundColor Green

        Write-Host ""
        Write-Host "===============================================" -ForegroundColor Green
        Write-Host "   GovernAII Agent instalado com sucesso!" -ForegroundColor Green
        Write-Host "===============================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Iniciando agente..." -ForegroundColor Yellow
        
        # Iniciar o agente
        Start-Process "$installDir/GovernAIIAgent.exe"
        
        Write-Host "✓ O ícone do GovernAII deve aparecer na barra de tarefas." -ForegroundColor Green
        Write-Host ""
        Write-Host "Localização: $installDir" -ForegroundColor Cyan
        Write-Host "Token: ${config.token}" -ForegroundColor Cyan
        Write-Host ""
    } else {
        Write-Host "✗ Erro na compilação do agente." -ForegroundColor Red
        Write-Host "Verifique se o .NET 6.0 ou superior está instalado." -ForegroundColor Yellow
    }

} finally {
    # Limpeza
    Set-Location $env:TEMP
    if (Test-Path $tempDir) {
        Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Write-Host ""
Write-Host "Pressione Enter para finalizar..." -ForegroundColor Yellow
Read-Host`;
}

// Função removida - usando generateWindowsPowerShell agora
{
    public class Program
    {
        private static NotifyIcon trayIcon;
        private static Timer heartbeatTimer;
        private static Timer syncTimer;
        private static string installDir;
        private static string logFile;
        private static Config config;
        private static HttpClient httpClient;

        [STAThread]
        public static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            try
            {
                InitializeAgent();
                Application.Run();
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Erro crítico: {ex.Message}", "GovernAII Agent", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private static void InitializeAgent()
        {
            // Configurar diretórios
            installDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "GovernAII", "Agent");
            Directory.CreateDirectory(installDir);
            logFile = Path.Combine(installDir, "agent.log");

            // Criar configuração
            CreateConfiguration();

            // Inicializar HTTP client
            httpClient = new HttpClient();
            httpClient.DefaultRequestHeaders.Add("apikey", config.SupabaseAnonKey);

            // Configurar system tray
            SetupSystemTray();

            // Configurar auto-inicialização
            SetupAutoStart();

            // Iniciar timers
            StartTimers();

            LogMessage("GovernAII Agent iniciado com sucesso");
        }

        private static void CreateConfiguration()
        {
            var configPath = Path.Combine(installDir, "config.json");
            config = new Config
            {
                AgentId = "${config.agent_id}",
                AgentToken = "${config.token}",
                EmpresaId = "${config.empresa_id}",
                EmpresaName = "${config.empresa_name}",
                ApiUrl = "${config.api_url}",
                SupabaseAnonKey = "${config.supabaseAnonKey}",
                HeartbeatInterval = 60,
                SyncInterval = 300
            };

            var jsonString = JsonSerializer.Serialize(config, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(configPath, jsonString);
        }

        private static void SetupSystemTray()
        {
            trayIcon = new NotifyIcon()
            {
                Icon = CreateGovernAIIIcon(),
                Text = "GovernAII Agent",
                Visible = true
            };

            // Menu de contexto
            var contextMenu = new ContextMenuStrip();
            contextMenu.Items.Add("Status", null, ShowStatus);
            contextMenu.Items.Add("Sincronizar Agora", null, SyncNow);
            contextMenu.Items.Add("Ver Logs", null, ShowLogs);
            contextMenu.Items.Add("-");
            contextMenu.Items.Add("Sair", null, ExitApplication);

            trayIcon.ContextMenuStrip = contextMenu;
            trayIcon.DoubleClick += ShowStatus;

            // Mostrar notificação de inicialização
            trayIcon.ShowBalloonTip(3000, "GovernAII Agent", "Agente iniciado e monitorando sistema", ToolTipIcon.Info);
        }

        private static Icon CreateGovernAIIIcon()
        {
            // Criar ícone simples se não conseguir baixar
            var bitmap = new Bitmap(16, 16);
            using (var g = Graphics.FromImage(bitmap))
            {
                g.FillEllipse(Brushes.Blue, 2, 2, 12, 12);
                g.DrawString("G", new Font("Arial", 8, FontStyle.Bold), Brushes.White, 4, 2);
            }
            return Icon.FromHandle(bitmap.GetHicon());
        }

        private static void SetupAutoStart()
        {
            try
            {
                var key = Registry.CurrentUser.OpenSubKey("SOFTWARE\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Run", true);
                key?.SetValue("GovernAIIAgent", Application.ExecutablePath);
                key?.Close();
            }
            catch (Exception ex)
            {
                LogMessage($"Erro ao configurar auto-inicialização: {ex.Message}");
            }
        }

        private static void StartTimers()
        {
            // Timer de heartbeat (1 minuto)
            heartbeatTimer = new Timer(async _ => await SendHeartbeat(), null, TimeSpan.Zero, TimeSpan.FromSeconds(config.HeartbeatInterval));

            // Timer de sincronização (5 minutos)
            syncTimer = new Timer(async _ => await SyncAssets(), null, TimeSpan.FromMinutes(1), TimeSpan.FromSeconds(config.SyncInterval));
        }

        private static async Task SendHeartbeat()
        {
            try
            {
                var heartbeatData = new
                {
                    agent_token = config.AgentToken,
                    hostname = Environment.MachineName,
                    ip_address = GetLocalIPAddress(),
                    status = "online",
                    system_info = GetSystemInfo()
                };

                var json = JsonSerializer.Serialize(heartbeatData);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await httpClient.PostAsync($"{config.ApiUrl}/functions/v1/agent-heartbeat", content);
                
                if (response.IsSuccessStatusCode)
                {
                    LogMessage("Heartbeat enviado com sucesso");
                }
                else
                {
                    LogMessage($"Erro no heartbeat: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                LogMessage($"Erro ao enviar heartbeat: {ex.Message}");
            }
        }

        private static async Task SyncAssets()
        {
            try
            {
                var assets = DiscoverAssets();
                var syncData = new
                {
                    agent_token = config.AgentToken,
                    hostname = Environment.MachineName,
                    assets = assets
                };

                var json = JsonSerializer.Serialize(syncData);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await httpClient.PostAsync($"{config.ApiUrl}/functions/v1/agent-sync-assets", content);
                
                if (response.IsSuccessStatusCode)
                {
                    LogMessage($"Sincronização concluída - {assets.Count} ativos encontrados");
                    trayIcon.ShowBalloonTip(2000, "GovernAII Agent", $"Sincronizados {assets.Count} ativos", ToolTipIcon.Info);
                }
                else
                {
                    LogMessage($"Erro na sincronização: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                LogMessage($"Erro ao sincronizar ativos: {ex.Message}");
            }
        }

        private static List<object> DiscoverAssets()
        {
            var assets = new List<object>();

            try
            {
                // Informações do computador
                var computerInfo = new
                {
                    name = Environment.MachineName,
                    type = "Computer",
                    os = Environment.OSVersion.ToString(),
                    domain = Environment.UserDomainName,
                    user = Environment.UserName,
                    processors = Environment.ProcessorCount,
                    memory = GetTotalMemory()
                };
                assets.Add(computerInfo);

                // Software instalado
                var installedSoftware = GetInstalledSoftware();
                assets.AddRange(installedSoftware);

            }
            catch (Exception ex)
            {
                LogMessage($"Erro ao descobrir ativos: {ex.Message}");
            }

            return assets;
        }

        private static string GetLocalIPAddress()
        {
            try
            {
                var host = System.Net.Dns.GetHostEntry(System.Net.Dns.GetHostName());
                foreach (var ip in host.AddressList)
                {
                    if (ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
                    {
                        return ip.ToString();
                    }
                }
            }
            catch { }
            return "127.0.0.1";
        }

        private static object GetSystemInfo()
        {
            return new
            {
                os = Environment.OSVersion.ToString(),
                machine_name = Environment.MachineName,
                user_name = Environment.UserName,
                domain_name = Environment.UserDomainName,
                processor_count = Environment.ProcessorCount,
                memory_gb = GetTotalMemory(),
                dotnet_version = Environment.Version.ToString()
            };
        }

        private static string GetTotalMemory()
        {
            try
            {
                var searcher = new System.Management.ManagementObjectSearcher("SELECT TotalPhysicalMemory FROM Win32_ComputerSystem");
                foreach (var obj in searcher.Get())
                {
                    var totalMemory = Convert.ToDouble(obj["TotalPhysicalMemory"]);
                    return Math.Round(totalMemory / (1024 * 1024 * 1024), 2).ToString() + " GB";
                }
            }
            catch { }
            return "Unknown";
        }

        private static List<object> GetInstalledSoftware()
        {
            var software = new List<object>();
            try
            {
                var key = Registry.LocalMachine.OpenSubKey("SOFTWARE\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Uninstall");
                if (key != null)
                {
                    foreach (var subkeyName in key.GetSubKeyNames())
                    {
                        var subkey = key.OpenSubKey(subkeyName);
                        var name = subkey?.GetValue("DisplayName")?.ToString();
                        var version = subkey?.GetValue("DisplayVersion")?.ToString();
                        
                        if (!string.IsNullOrEmpty(name))
                        {
                            software.Add(new
                            {
                                name = name,
                                type = "Software",
                                version = version ?? "Unknown",
                                install_location = subkey?.GetValue("InstallLocation")?.ToString()
                            });
                        }
                        subkey?.Close();
                    }
                }
                key?.Close();
            }
            catch (Exception ex)
            {
                LogMessage($"Erro ao listar software: {ex.Message}");
            }
            return software;
        }

        private static void ShowStatus(object sender, EventArgs e)
        {
            var status = $"GovernAII Agent\\n\\nEmpresa: {config.EmpresaName}\\nStatus: Online\\nÚltimo heartbeat: {DateTime.Now:HH:mm:ss}\\nMáquina: {Environment.MachineName}";
            MessageBox.Show(status, "Status do Agente", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        private static async void SyncNow(object sender, EventArgs e)
        {
            await SyncAssets();
        }

        private static void ShowLogs(object sender, EventArgs e)
        {
            try
            {
                if (File.Exists(logFile))
                {
                    Process.Start("notepad.exe", logFile);
                }
                else
                {
                    MessageBox.Show("Arquivo de log não encontrado", "GovernAII Agent", MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Erro ao abrir logs: {ex.Message}", "GovernAII Agent", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private static void ExitApplication(object sender, EventArgs e)
        {
            trayIcon.Visible = false;
            Application.Exit();
        }

        private static void LogMessage(string message)
        {
            try
            {
                var logEntry = $"{DateTime.Now:yyyy-MM-dd HH:mm:ss} - {message}\\n";
                File.AppendAllText(logFile, logEntry);
            }
            catch { }
        }
    }

    public class Config
    {
        public string AgentId { get; set; }
        public string AgentToken { get; set; }
        public string EmpresaId { get; set; }
        public string EmpresaName { get; set; }
        public string ApiUrl { get; set; }
        public string SupabaseAnonKey { get; set; }
        public int HeartbeatInterval { get; set; }
        public int SyncInterval { get; set; }
    }
}`;

  // Criar script de compilação que será incluído no executável
  const compileScript = `@echo off
echo Compilando GovernAII Agent...

REM Verificar se .NET está instalado
dotnet --version >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo ERRO: .NET 6.0 ou superior nao encontrado.
    echo Por favor, instale o .NET Runtime de: https://dotnet.microsoft.com/download
    echo.
    pause
    exit /b 1
)

REM Criar diretório temporário
set "TEMP_DIR=%TEMP%\\GovernAII_Build_%RANDOM%"
mkdir "%TEMP_DIR%"

REM Criar arquivo de projeto
echo ^<Project Sdk="Microsoft.NET.Sdk"^> > "%TEMP_DIR%\\GovernAIIAgent.csproj"
echo   ^<PropertyGroup^> >> "%TEMP_DIR%\\GovernAIIAgent.csproj"
echo     ^<OutputType^>WinExe^</OutputType^> >> "%TEMP_DIR%\\GovernAIIAgent.csproj"
echo     ^<TargetFramework^>net6.0-windows^</TargetFramework^> >> "%TEMP_DIR%\\GovernAIIAgent.csproj"
echo     ^<UseWindowsForms^>true^</UseWindowsForms^> >> "%TEMP_DIR%\\GovernAIIAgent.csproj"
echo     ^<PublishSingleFile^>true^</PublishSingleFile^> >> "%TEMP_DIR%\\GovernAIIAgent.csproj"
echo     ^<SelfContained^>false^</SelfContained^> >> "%TEMP_DIR%\\GovernAIIAgent.csproj"
echo     ^<RuntimeIdentifier^>win-x64^</RuntimeIdentifier^> >> "%TEMP_DIR%\\GovernAIIAgent.csproj"
echo   ^</PropertyGroup^> >> "%TEMP_DIR%\\GovernAIIAgent.csproj"
echo   ^<ItemGroup^> >> "%TEMP_DIR%\\GovernAIIAgent.csproj"
echo     ^<PackageReference Include="System.Management" Version="7.0.0" /^> >> "%TEMP_DIR%\\GovernAIIAgent.csproj"
echo   ^</ItemGroup^> >> "%TEMP_DIR%\\GovernAIIAgent.csproj"
echo ^</Project^> >> "%TEMP_DIR%\\GovernAIIAgent.csproj"

REM Salvar código C#
echo ${csharpCode.replace(/`/g, '^^^`').replace(/"/g, '""')} > "%TEMP_DIR%\\Program.cs"

REM Compilar
echo Compilando...
cd "%TEMP_DIR%"
dotnet publish -c Release -o output

REM Copiar executável para diretório final
set "INSTALL_DIR=%LOCALAPPDATA%\\GovernAII\\Agent"
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

if exist "output\\GovernAIIAgent.exe" (
    copy "output\\GovernAIIAgent.exe" "%INSTALL_DIR%\\GovernAIIAgent.exe"
    echo.
    echo ===============================================
    echo   GovernAII Agent instalado com sucesso!
    echo ===============================================
    echo.
    echo Iniciando agente...
    start "" "%INSTALL_DIR%\\GovernAIIAgent.exe"
    echo.
    echo O icone do GovernAII deve aparecer na barra de tarefas.
    echo.
) else (
    echo.
    echo ERRO: Falha na compilacao do agente.
    echo Verifique se o .NET 6.0 ou superior esta instalado.
    echo.
    pause
)

REM Limpeza
cd /
rmdir /s /q "%TEMP_DIR%"

pause`;

  return compileScript;
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