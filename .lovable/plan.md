

# Auditoria Completa: Modulo de Integracoes

## Resumo Executivo

O modulo de Integracoes tem uma boa estrutura base (conectores, API keys, webhooks de entrada, log viewer), mas apresenta **lacunas criticas de funcionalidade** -- varias integracoes estao apenas "cosmeticas" (UI existe, backend nao funciona) e faltam mecanismos essenciais para que dados externos realmente fluam para dentro do Akuris.

---

## 1. Problemas Criticos (Funcionalidade Quebrada)

### 1.1 Jira: Configuracao salva mas nao faz nada
- O `JiraConfigDialog` salva credenciais na tabela `integracoes_config`, mas:
  - O `integration-webhook-dispatcher` **nao tem case para 'jira'** -- so suporta `slack`, `teams`, `webhooks`
  - Nao existe nenhuma Edge Function que crie tickets no Jira
  - O token da API e simplesmente **descartado** -- a config salva `has_token: true` mas nao armazena o token real (linha 121 do JiraConfigDialog: `has_token: true`)
  - A coluna `credenciais_encrypted` na tabela existe mas nunca e usada
- **Resultado**: O usuario configura tudo, testa conexao com sucesso, salva... e nada acontece. Zero funcionalidade real.

### 1.2 Azure/Intune: Sincronizacao usa dados simulados
- A Edge Function `azure-integration` no caso `sync` (linha ~170) usa **dados demo hardcoded** em vez dos dados reais da API do Intune
- O teste de conexao (`action: 'test'`) funciona com a API real, mas a sincronizacao retorna dispositivos falsos
- O campo `credenciais_encrypted` tambem nao e usado -- as credenciais Azure nao sao persistidas de forma segura

### 1.3 Denuncia: Hook importado mas nunca chamado
- `DenunciaDialog.tsx` importa `useIntegrationNotify` e desestrutura `{ notify }`, mas **nunca chama** `await notify('denuncia_recebida', ...)` -- logo, denuncias nunca disparam notificacoes externas

### 1.4 API Keys: Sem validacao real no backend
- As API Keys sao geradas e armazenadas em texto plano no banco
- O `api-inbound-webhook` valida apenas o `webhook_token`, nao API Keys
- Nao existe **nenhuma Edge Function de API publica** que valide as API Keys geradas -- elas sao criadas mas nao servem para nada funcional
- As permissoes (`riscos:read`, `controles:write`, etc.) nunca sao verificadas em nenhum endpoint

### 1.5 Inbound Webhooks: Modulos parcialmente suportados
- O `api-inbound-webhook` Edge Function so suporta 3 modulos: `incidentes`, `riscos`, `ativos`
- O UI permite selecionar `controles` e `denuncias` como destino, mas o backend ignora esses casos (cai no `default` que so faz `console.log`)

---

## 2. Problemas de Seguranca

### 2.1 Credenciais Jira/Azure em texto plano
- O campo `credenciais_encrypted` na tabela `integracoes_config` existe mas nunca e usado
- Credenciais Jira (email + API token) e Azure (client_id + client_secret) deveriam ser armazenadas como Supabase Secrets ou no campo criptografado, nao em `configuracoes` JSON

### 2.2 API Keys em texto plano no banco
- A coluna `api_key` na tabela `api_keys` armazena a chave completa em texto plano
- Qualquer usuario com acesso de leitura (via RLS da empresa) ve todas as chaves
- Deveria armazenar apenas um hash e mostrar o prefixo

---

## 3. Lacunas de UX

### 3.1 Falta indicacao clara do que cada integracao faz concretamente
- Os cards dizem "Receba notificacoes" mas nao explicam **quais dados** sao enviados, em que formato, ou com que frequencia
- Um usuario leigo nao sabe a diferenca pratica entre Slack Webhook, Teams Webhook e Webhook Generico

### 3.2 Falta status de saude das integracoes
- Nao ha indicacao de "ultima notificacao enviada ha X horas" ou "3 falhas nas ultimas 24h" nos cards de integracao
- O usuario precisa abrir o Log Viewer manualmente para saber se algo esta funcionando

### 3.3 Log Viewer sem filtros
- O `IntegrationLogViewer` mostra todos os logs misturados, sem filtro por tipo de integracao, por sucesso/falha ou por periodo
- Com muitos eventos, fica impossivel encontrar um problema especifico

### 3.4 Falta documentacao/payload de exemplo nos Inbound Webhooks
- Quando o usuario cria um webhook de entrada, nao ha exemplo de payload que o sistema externo deve enviar
- Nao ha "Enviar evento de teste" para validar que o webhook funciona

---

## 4. Plano de Implementacao

### Fase 1: Corrigir o que esta quebrado (Alta prioridade)

**4.1 Completar Inbound Webhooks (backend)**
- Adicionar cases para `controles` e `denuncias` no `api-inbound-webhook/index.ts`
- Adicionar botao "Enviar evento de teste" na UI e exibir payload de exemplo

**4.2 Corrigir notify no DenunciaDialog**
- Adicionar a chamada `await notify('denuncia_recebida', {...})` no fluxo de criacao de denuncia

**4.3 Corrigir Jira -- Armazenamento seguro + Dispatcher**
- Armazenar API Token Jira como Supabase Secret (ou no campo `credenciais_encrypted`)
- Adicionar case `jira` no `integration-webhook-dispatcher` que cria tickets via API REST do Jira
- Remover label "Beta" quando funcional

**4.4 Corrigir Azure -- Sincronizacao real**
- Substituir dados demo por chamadas reais a API do Intune na action `sync`
- Armazenar credenciais Azure de forma segura

### Fase 2: Melhorar UX (Media prioridade)

**4.5 Status de saude nos cards de integracao**
- Mostrar "Ultima notificacao: ha 2h" e "5 envios / 1 falha (24h)" no card de cada conector
- Buscar dados de `integracoes_webhook_logs` agrupados por `integracao_id`

**4.6 Filtros no Log Viewer**
- Adicionar filtro por tipo de integracao (Slack, Teams, etc.)
- Adicionar filtro por sucesso/falha
- Adicionar filtro por periodo (hoje, 7 dias, 30 dias)

**4.7 Payload de exemplo nos Inbound Webhooks**
- Ao criar um webhook, exibir o payload JSON esperado baseado no modulo destino
- Adicionar botao "Testar Webhook" que envia um evento de teste para a propria URL

**4.8 Descricoes mais claras nos cards**
- Trocar descricoes genericas por descricoes que expliquem o fluxo concreto (ex: "Quando um incidente critico e criado, uma mensagem formatada e enviada ao canal Slack configurado com detalhes e link direto")

### Fase 3: Funcionalidades novas (Baixa prioridade)

**4.9 Dashboard de integracao no topo**
- Card resumo com: "3 integracoes ativas | 47 eventos enviados hoje | 2 falhas"
- Grafico sparkline de eventos/dia nos ultimos 7 dias

**4.10 Retry automatico para falhas**
- Quando uma notificacao falha (status_code >= 400), programar retry automatico (1x apos 5min, 1x apos 30min)
- Marcar integracao como "erro" se 3 falhas consecutivas

---

## Resumo de Prioridades

| Prioridade | Item | Tipo |
|------------|------|------|
| Critica | Inbound Webhook nao suporta controles/denuncias (4.1) | Bug |
| Critica | DenunciaDialog nao chama notify (4.2) | Bug |
| Critica | Jira salva config mas nao funciona (4.3) | Bug |
| Alta | Azure sync usa dados demo (4.4) | Bug |
| Media | Status de saude nos cards (4.5) | UX |
| Media | Filtros no Log Viewer (4.6) | UX |
| Media | Payload de exemplo + teste nos Inbound Webhooks (4.7) | UX |
| Media | Descricoes mais claras nos cards (4.8) | UX |
| Baixa | Dashboard resumo de integracoes (4.9) | UX |
| Baixa | Retry automatico (4.10) | Feature |

### Arquivos Afetados
- `supabase/functions/api-inbound-webhook/index.ts` -- adicionar cases controles/denuncias
- `supabase/functions/integration-webhook-dispatcher/index.ts` -- adicionar case jira
- `src/components/denuncia/DenunciaDialog.tsx` -- adicionar chamada notify
- `src/components/configuracoes/IntegrationHub.tsx` -- status de saude, descricoes, dashboard
- `src/components/configuracoes/integrations/IntegrationLogViewer.tsx` -- filtros
- `src/components/configuracoes/InboundWebhooksManager.tsx` -- payload exemplo, teste
- `src/components/configuracoes/integrations/JiraConfigDialog.tsx` -- armazenamento seguro de credenciais
- `supabase/functions/azure-integration/index.ts` -- implementar sync real

