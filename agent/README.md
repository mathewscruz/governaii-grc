# Akuris Endpoint Agent

Agente Windows em Go que coleta inventário (hardware, SO, softwares instalados,
postura de segurança) e reporta automaticamente ao módulo **Ativos** do Akuris.

## Build

Requisitos: Go 1.22+ instalado na máquina de build.

```powershell
cd agent
.\build.ps1
# saída: agent/dist/akuris-agent.exe
```

> O agente **não** é compilado pela Lovable. Compile localmente ou em CI
> e distribua o `.exe` (ou empacote em MSI via WiX) para os endpoints.

## Instalação em um endpoint

1. No painel Akuris, acesse **Ativos → Endpoints → Gerar token de instalação**
   e copie o token gerado.
2. Em um PowerShell **Administrador** no endpoint Windows:

```powershell
.\akuris-agent.exe install --token AKE-xxxxxxxx --server https://lnlkahtugwmkznasapfd.supabase.co
```

O comando faz o enrollment, registra o serviço **AkurisAgent** (LocalSystem) e
inicia o primeiro check-in. A partir daí, o agente reporta a cada 60 minutos.

## Comandos

| Comando | Descrição |
|---------|-----------|
| `install --token <T> --server <URL>` | Enrolla e instala como serviço |
| `uninstall` | Para e remove o serviço |
| `checkin` | Coleta + envio único (debug) |
| `run` | Roda em foreground (debug) |

## Distribuição em massa (GPO / Intune)

- **GPO**: empacote `akuris-agent.exe` em uma pasta de software e use uma
  *Startup Script* PowerShell que execute `install` se o serviço ainda não
  existir.
- **Intune**: empacote como Win32 app e use o comando de instalação acima.
  Comando de detecção: `sc query AkurisAgent`.

## Segurança

- O `agent_token` é gerado pelo servidor e armazenado em
  `%ProgramData%\Akuris\agent.json` com permissões restritas (0600).
- TODO de produção: cifrar o token com **DPAPI** (escopo machine).
- Comunicação 100% HTTPS contra Edge Functions Supabase.
- Cada token é vinculado a uma `empresa_id` específica — isolamento
  multi-tenant garantido server-side.

## Coletores

- `hardware.go` / `collector.go`: CPU, RAM, discos, MAC, IPs (gopsutil).
- `security_windows.go`: BitLocker, Defender, Firewall, UAC, Secure Boot,
  patches (PowerShell).
- `software`: lista de programas via registro `Uninstall`.

Próximas fases: assinatura de código do .exe, MSI WiX, auto-update,
suporte Linux/macOS.
