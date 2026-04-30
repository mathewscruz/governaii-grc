## Objetivo

Remover tudo que foi criado nos últimos prompts referente ao **módulo Endpoints** e ao **executável do agente Windows**, sem mexer em nada mais. As demais ocorrências da palavra "endpoint" no código (categoria de ativo em `Ativos.tsx`, `AtivoDialog.tsx`, `ImportacaoAtivos.tsx`, e o conceito genérico em `api-public` / `api-inbound-webhook`) são pré-existentes e **não serão tocadas**.

## O que será deletado

### 1. Código do agente Windows (Go)
- Pasta inteira `agent/` (build.ps1, README.md, go.mod, cmd/akuris-agent/, internal/client/, internal/collector/, internal/storage/)

### 2. GitHub Action de build
- `.github/workflows/build-agent.yml`

### 3. Página do painel + rota
- `src/pages/AtivosEndpoints.tsx` (deletar arquivo)
- `src/App.tsx`: remover o `React.lazy` de `AtivosEndpoints` (linha 17) e o bloco `<Route path="/ativos/endpoints">` (linhas ~143–148)
- `src/components/AppSidebar.tsx`: remover o item de menu `{ title: 'Endpoints', url: '/ativos/endpoints', ... }` (linha 73)

### 4. Eventos de integração relacionados
- `src/lib/integration-events.ts`: remover as 3 entradas `endpoint_enrollado`, `endpoint_offline`, `endpoint_postura_critica` (linhas 48–50)

### 5. Edge Functions
- Apagar pastas `supabase/functions/agent-enroll/`, `supabase/functions/agent-checkin/`, `supabase/functions/agent-revoke/`
- Chamar `supabase--delete_edge_functions(["agent-enroll","agent-checkin","agent-revoke"])` para remover do Supabase
- Remover as 3 entradas correspondentes em `supabase/config.toml` (se existirem)

### 6. Documentação
- `docs/endpoint-agent.md` (deletar)
- `.lovable/plan.md` (deletar — era o plano deste módulo)

### 7. Banco de dados
Criar **uma nova migration** que desfaz as duas migrations criadas (`20260430123033` tabelas e `20260430125123` bucket). A migration nova fará:
- `DROP TABLE IF EXISTS public.endpoint_agent_inventory CASCADE;`
- `DROP TABLE IF EXISTS public.endpoint_agents CASCADE;`
- `DROP TABLE IF EXISTS public.endpoint_enrollment_tokens CASCADE;`
- `DROP FUNCTION` de quaisquer triggers/RPCs criadas naquelas migrations (vou ler o conteúdo completo antes para listar com precisão)
- `DELETE FROM storage.objects WHERE bucket_id = 'endpoint-agent-binaries';`
- `DROP POLICY` policies do bucket + `DELETE FROM storage.buckets WHERE id = 'endpoint-agent-binaries';`

Não vou apagar os arquivos `.sql` antigos — migrations passadas ficam no histórico; a migration nova é o "undo" oficial.

### 8. Tipos gerados do Supabase
`src/integrations/supabase/types.ts` é regenerado automaticamente após a migration de drop, então as referências a `endpoint_agents` etc. desaparecem sozinhas.

## O que NÃO será tocado

- Categoria `'endpoint'` em `Ativos.tsx`, `AtivoDialog.tsx`, `ImportacaoAtivos.tsx` (existia antes).
- Bucket `endpoint-agent-binaries` no painel do Supabase, se você quiser manter os binários: a migration de drop apaga. Se preferir manter o bucket, me avisa antes de eu rodar.

## Confirmação

Posso prosseguir com a remoção completa conforme acima?
