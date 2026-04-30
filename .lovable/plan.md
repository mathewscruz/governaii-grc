
# Akuris Endpoint Agent — Inventário Automático de Ativos

Vamos criar um agente leve em **Go** (binário único) instalável como **serviço Windows**, que se registra na empresa via **token de enrollment** e reporta periodicamente um **inventário completo + postura de segurança**. Os dados serão consolidados no módulo de **Ativos** existente, respeitando o isolamento multi-tenant (`empresa_id`).

## Arquitetura

```text
[Endpoint Windows]                       [Supabase / Akuris]
 akuris-agent.exe  --enroll TOKEN  -->   edge: agent-enroll
   (gera device_id + agent_token)        (valida token da empresa,
            |                              cria registro em ativos)
            v
 Serviço Windows (a cada 60 min)  -->   edge: agent-checkin
   coleta WMI/PowerShell                (valida agent_token,
   envia JSON de inventário              upsert em ativos +
                                         endpoint_inventory_snapshots)
                                              |
                                              v
                                    Página: Ativos > Endpoints
                                    (lista, detalhe, status online,
                                     última coleta, postura)
```

## Mudanças de banco (multi-tenant, RLS)

Novas tabelas (todas com `empresa_id` + RLS por `has_empresa_access`):

1. `endpoint_enrollment_tokens`
   - `id`, `empresa_id`, `token_hash` (sha256), `descricao`, `criado_por`, `expira_em`, `max_usos`, `usos`, `revogado`, `created_at`.
   - Token bruto exibido **uma única vez** ao admin no painel.

2. `endpoint_agents`
   - `id` (uuid = device_id), `empresa_id`, `ativo_id` (FK para `ativos`), `agent_token_hash`, `hostname`, `so`, `versao_agente`, `ultimo_checkin`, `ip_publico`, `status` (`online`/`offline`/`stale`), `created_at`, `updated_at`.

3. `endpoint_inventory_snapshots`
   - `id`, `empresa_id`, `agent_id`, `coletado_em`, `payload` (jsonb completo), `hash_payload`. Histórico de coletas (rotação após N dias).

Função RPC `mark_offline_endpoints()` chamada por cron (pg_cron) marca agentes sem check-in há > 2h como `offline`.

## Edge Functions

Todas com `verify_jwt = false` (autenticação custom por token), CORS, validação Zod, rate limit por IP.

- **`agent-enroll`** (POST)
  - Body: `{ enrollment_token, hostname, os_info, mac_addresses }`.
  - Valida hash do token, expiração, usos restantes, empresa.
  - Cria/recupera registro em `ativos` (tipo `tecnologia`, tag `Endpoint:<device_id>`).
  - Cria `endpoint_agents`, gera `agent_token` (retornado uma vez).
  - Incrementa `usos`.

- **`agent-checkin`** (POST)
  - Header: `X-Agent-Token`.
  - Body: payload completo de inventário (schema validado).
  - Faz upsert em `ativos` (campos: nome, versao, fornecedor, modelo, status), insere snapshot, atualiza `ultimo_checkin`.
  - Resposta inclui `next_checkin_seconds` e `config` (intervalo, módulos a coletar).

- **`agent-revoke`** (admin, JWT obrigatório)
  - Revoga `agent_token` ou `enrollment_token`.

## Frontend (módulo Ativos)

Nova aba **"Endpoints"** dentro de `/ativos`:

- **Tabela de agentes**: hostname, SO, status (badge online/offline), último check-in, postura de segurança (BitLocker, AV, Firewall, patches), botão "Ver detalhes" e "Revogar".
- **Diálogo "Detalhes do Endpoint"**: tabs Hardware, Software instalado (com busca), Postura de Segurança, Histórico de coletas.
- **Diálogo "Gerar token de enrollment"**: admin define descrição, validade (7/30/90 dias), max_usos. Mostra token + comando de instalação pronto:

  ```text
  akuris-agent.exe install --token AKR-xxxxxxxxxxxx --server https://...
  ```

- **KPIs no header da aba**: total de endpoints, online agora, sem check-in 24h, com postura crítica.
- Identidade visual padrão (Navy/Purple, DM Sans, StatCards, Sonner toasts, fullscreen mobile).
- i18n PT/EN.

## Notificações

Centralizadas no sino do header (padrão do projeto) e via `useIntegrationNotify`:

- Novo endpoint enrollado.
- Endpoint offline há > 24h.
- Postura crítica detectada (ex.: BitLocker desativado, AV inativo, patches críticos pendentes).

Novos eventos em `src/lib/integration-events.ts`:
`endpoint_enrollado`, `endpoint_offline`, `endpoint_postura_critica`.

## O Agente (Go)

Repositório novo: pasta `agent/` na raiz do projeto (não compilada pelo Vite). Estrutura:

```text
agent/
  cmd/akuris-agent/main.go      # CLI: install / uninstall / enroll / run
  internal/collector/           # WMI, registry, netstat (gopsutil + go-ole)
    hardware.go                 # CPU, RAM, disco, modelo, serial
    os.go                       # versão SO, build, usuário logado
    software.go                 # programas instalados (Uninstall registry)
    security.go                 # BitLocker, Defender/AV, Firewall, patches
    network.go                  # IPs, MACs, portas escutando
  internal/client/              # HTTP client p/ edge functions
  internal/service/             # integração com Windows Service (kardianos/service)
  internal/storage/             # config local em %ProgramData%\Akuris\agent.json
  build.ps1                     # cross-compile + assinatura + MSI (WiX)
```

Bibliotecas: `github.com/shirou/gopsutil/v3`, `github.com/kardianos/service`, `golang.org/x/sys/windows/registry`.

Comportamento:
- Primeiro run: `--enroll TOKEN` → chama `agent-enroll`, salva `device_id` + `agent_token` cifrado com DPAPI em `%ProgramData%\Akuris\`.
- Roda como serviço `AkurisAgent` (LocalSystem). Loop a cada 60 min (configurável pelo servidor): coleta + POST em `agent-checkin`.
- Retry exponencial offline; buffer local de até 24 snapshots.
- Auto-update opcional (fase 2).

Entregáveis:
- `akuris-agent.exe` (binário) e `AkurisAgent.msi` (instalador silencioso para GPO/Intune).
- Documentação em `docs/endpoint-agent.md` (instalação manual, GPO, Intune, desinstalação, troubleshooting).

## Segurança

- Tokens armazenados como **hash SHA-256** no banco (nunca texto puro).
- `agent_token` cifrado no endpoint via **DPAPI** (escopo machine).
- RLS estrita: agente só consegue tocar `ativos`/snapshots da própria `empresa_id` (validado no edge antes de qualquer escrita).
- Rate limit em `agent-enroll` (10/min/IP) e `agent-checkin` (1/min/agent_token).
- Logs de auditoria em `audit_logs` para enroll, revoke e mudanças de postura.

## Escopo desta entrega

Fase 1 (este plano):
1. Migrações (3 tabelas + RLS + RPC + cron).
2. 3 edge functions (`agent-enroll`, `agent-checkin`, `agent-revoke`).
3. UI: aba **Endpoints** em `/ativos` com tabela, detalhe, geração de token e revogação.
4. Notificações (sino + integrações) para os 3 eventos.
5. Esqueleto do agente Go em `agent/` com coletores, modo serviço, build script PowerShell e documentação.

Fase 2 (futura, fora deste plano): assinatura de código do .exe/.msi, auto-update, suporte Linux/macOS, integração com Intune via Graph (já parcialmente existente em `azure-integration`).

## Observações

- O agente em Go **não** roda no sandbox da Lovable; ele é compilado localmente/CI pelo seu time. Vou deixar `build.ps1` pronto e instruções claras.
- Se preferir, podemos publicar o binário em um bucket público do Supabase para download direto pelo painel — me avise se quer isso já na fase 1.
