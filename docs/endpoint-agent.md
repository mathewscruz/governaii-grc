# Akuris Endpoint Agent — Guia de Implantação

Agente Windows leve (Go, binário único) que coleta inventário e postura de
segurança de endpoints e reporta automaticamente ao Akuris GRC. Os dados
ficam visíveis em **Ativos → Endpoints**.

## Visão geral

```
[Endpoint Windows] --(HTTPS)--> agent-enroll  / agent-checkin  --> Supabase
        |                                                              |
        +---- akuris-agent.exe (serviço Windows: AkurisAgent) ----------+
```

- **Coleta**: hardware (CPU/RAM/disco/serial), SO, software instalado,
  postura (BitLocker, Defender, Firewall, UAC, SecureBoot, patches),
  IPs/MACs.
- **Frequência**: check-in a cada 60 minutos (configurável pelo servidor).
- **Autenticação**: token de enrollment por empresa (uso único ou múltiplo,
  com validade) → gera `agent_token` exclusivo por máquina.
- **Privacidade**: tokens trafegam só por HTTPS e ficam **hashed (SHA-256)**
  no banco. Apenas administradores da empresa enxergam os endpoints dela
  (RLS multi-tenant).

## 1. Gerar token de enrollment

1. Entre no Akuris como administrador.
2. Vá em **Ativos → Endpoints → Gerar token**.
3. Defina descrição, validade (7/30/90 dias) e máximo de usos.
4. Copie o token exibido (mostrado **uma única vez**) e o comando de
   instalação.

## 2. Instalação manual (1 máquina)

Baixe `akuris-agent.exe`, abra um PowerShell **como Administrador** e
execute:

```powershell
.\akuris-agent.exe install --token AKR-xxxxxxxxxxxx `
  --server https://lnlkahtugwmkznasapfd.supabase.co
```

O comando faz:
1. Coleta inicial + chamada a `agent-enroll`.
2. Cria registro em **Ativos** e em `endpoint_agents`.
3. Salva config em `C:\ProgramData\Akuris\agent.json` (modo 0600).
4. Instala e inicia o serviço Windows `AkurisAgent` (LocalSystem).

Para forçar uma coleta imediata: `akuris-agent.exe checkin`.
Para desinstalar: `akuris-agent.exe uninstall` (também remove o serviço).

## 3. Implantação em massa

### GPO (Active Directory)

1. Coloque `akuris-agent.exe` em um share de leitura (`\\dc\akuris\`).
2. Crie um Script de Inicialização (Computer Configuration → Policies →
   Windows Settings → Scripts → Startup) chamando:

   ```bat
   if not exist "C:\Program Files\Akuris\akuris-agent.exe" (
     mkdir "C:\Program Files\Akuris"
     copy /Y "\\dc\akuris\akuris-agent.exe" "C:\Program Files\Akuris\"
     "C:\Program Files\Akuris\akuris-agent.exe" install ^
       --token AKR-xxxxxxxxxxxx ^
       --server https://lnlkahtugwmkznasapfd.supabase.co
   )
   ```

3. Aplique o GPO no OU desejado e force `gpupdate /force` ou aguarde reboot.

### Microsoft Intune

1. Empacote o `.exe` como Win32 app (`IntuneWinAppUtil.exe`).
2. Comando de instalação:
   `akuris-agent.exe install --token AKR-... --server https://...`
3. Comando de desinstalação: `akuris-agent.exe uninstall`
4. Regra de detecção: arquivo `C:\ProgramData\Akuris\agent.json` existe.

### Script SCCM / outros

Mesmo padrão: copie o binário, rode `install --token ... --server ...`.
O serviço sobe sozinho.

## 4. Operação no painel

Em **Ativos → Endpoints** o admin vê:

- KPIs: total, online agora, offline 24h, postura crítica.
- Tabela com hostname, SO, status (online/offline/stale), último check-in,
  badges de postura (BitLocker, AV, Firewall).
- **Detalhes**: tabs Hardware, Software instalado (busca), Postura,
  Histórico de coletas.
- **Revogar**: invalida o `agent_token` daquela máquina (a próxima
  tentativa de check-in retorna 403 e o agente para).

Notificações no sino do header:
`endpoint_enrollado`, `endpoint_offline`, `endpoint_postura_critica`.

## 5. Troubleshooting

| Sintoma | Verificação |
|---|---|
| "enroll http 401" | Token expirou ou usos esgotados — gere outro. |
| "enroll http 403" | Token revogado pelo admin. |
| Serviço não sobe | `sc query AkurisAgent` / Visualizador de Eventos → Application. |
| Sem check-ins há horas | Firewall de saída bloqueando `*.supabase.co:443`. |
| Software vazio | Execução em conta sem acesso ao registry — confirme que o serviço roda como LocalSystem. |

Logs do agente: por padrão vão para o Event Log do Windows
(source `AkurisAgent`). Para debug em foreground:

```powershell
.\akuris-agent.exe run
```

## 6. Desinstalação completa

```powershell
.\akuris-agent.exe uninstall
Remove-Item -Recurse -Force "C:\ProgramData\Akuris"
```

No painel, revogue o agente correspondente para liberar a vaga.

## 7. Build (para o time de engenharia)

Pré-requisitos: Go 1.22+ no Windows ou Linux com cross-compile.

```powershell
cd agent
.\build.ps1            # gera dist\akuris-agent.exe
```

Para gerar `.msi` assinado, ver `agent/build.ps1` (WiX + signtool — fase 2).
