## Objetivo

1. Garantir que **admins** (não super_admin) não vejam a aba **"Empresas"** em Configurações.
2. Garantir que admins vejam/gerenciem em **"Usuários & Acessos"** apenas usuários da **própria empresa**.
3. Validar e **endurecer** a segregação de dados (multi-tenant) para que uma empresa **nunca** consiga ver/alterar dados de outra.

---

## Diagnóstico

### 1) Aba "Empresas" — JÁ está restrita a super_admin
`src/pages/Configuracoes.tsx` já condiciona o `TabsTrigger` e `TabsContent` de empresas a `isSuperAdmin`. **Nenhuma alteração necessária**, mas vou reforçar com uma verificação dentro do próprio componente `GerenciamentoEmpresas` (defesa em profundidade) para o caso de alguém acessar o componente por outra via.

### 2) Gestão de Usuários — JÁ filtra por empresa, mas com falhas
- `GerenciamentoUsuariosEnhanced.tsx` (linhas 128-138) filtra `profiles` por `empresa_id` quando não é super_admin. ✅
- O filtro "Empresa" e a coluna "Empresa" só aparecem para super_admin. ✅
- Edge function `create-user` força `finalEmpresaId = currentUserProfile.empresa_id` para non-super_admins e bloqueia criação de super_admins por admins. ✅
- **Falhas detectadas**:
  - O campo `empresa` na coluna da tabela ainda é exibido para admins (poderia ser ocultado para reduzir ruído — opcional).
  - A RLS de `profiles` UPDATE permite admins atualizarem usuários de outras empresas se conseguirem o id (existe `is_admin() AND (is_super_admin() OR empresa_id = get_user_empresa_id())` — está correto na verdade).
  - Edge `delete-user-complete` precisa ser auditada para garantir que admin só deleta usuário da própria empresa (a verificar; se faltar, adicionar checagem).

### 3) Segregação multi-tenant — Vulnerabilidades identificadas

Auditei TODAS as tabelas com `empresa_id` (mais de 70). Resultado:

✅ **Bom**: Todas as tabelas com `empresa_id` têm RLS habilitado e policies que filtram via `empresa_id = get_user_empresa_id()` ou helpers `*_pertence_empresa()`.

⚠️ **Problema crítico encontrado — "Tenant Hijack via UPDATE"**:
Aproximadamente **50 policies de UPDATE** filtram a linha por `empresa_id = get_user_empresa_id()` no `USING` (qual), mas têm `WITH CHECK = NULL`. Isso significa que um usuário autenticado pode:
```
UPDATE riscos SET empresa_id = '<id-de-outra-empresa>' WHERE id = '<meu-risco>';
```
e o registro é "movido" para outra empresa. Embora o impacto principal seja perda de dados próprios (não vazamento), também permite **inserir lixo no tenant alheio**. Tabelas afetadas incluem: `riscos`, `controles`, `ativos`, `ativos_*`, `auditorias`, `documentos`, `incidentes`, `contratos`, `dados_pessoais`, `dados_fluxos`, `denuncias`, `fornecedores`, `gap_analysis_*`, `ropa_registros`, `sistemas_*`, `contas_privilegiadas`, `continuidade_*`, `access_reviews`, `api_keys`, `api_inbound_webhooks`, `relatorios_customizados`, `relatorio_agendamentos`, `planos_acao`, `permission_profiles`, `user_invitation_reminders`, `integracoes_config`, `docgen_*` etc.

✅ **Isolamento de SELECT está correto** — nenhuma tabela com `empresa_id` permite SELECT cruzado entre empresas (verificado).

✅ **Tabelas auxiliares por usuário** (`mfa_codes`, `mfa_sessions`, `onboarding_progress`) corretamente restritas por `auth.uid()`.

✅ **Tabelas globais intencionalmente públicas** (`changelog_entries`, `planos`, templates `due_diligence_questions/templates` padrão) — comportamento esperado.

---

## Plano de Implementação

### Frontend (mínimo)
1. **`src/components/configuracoes/GerenciamentoEmpresas.tsx`** — adicionar guarda no topo do componente:
   ```tsx
   if (!isSuperAdmin) return <AccessDenied />;
   ```
   Defesa em profundidade caso alguém renderize o componente fora da aba.

2. **`src/components/configuracoes/GerenciamentoUsuariosEnhanced.tsx`** — ocultar a coluna "Empresa" da tabela quando `!isSuperAdmin` (visualmente já é uma única empresa, fica redundante).

### Backend / Edge Functions
3. **`supabase/functions/delete-user-complete/index.ts`** — auditar e adicionar (se faltar):
   - Verificar role do solicitante.
   - Se não for super_admin, validar que o `user_id` alvo pertence à mesma `empresa_id` do solicitante antes de deletar.
   - Bloquear admin de deletar super_admin.

### Migração SQL — Endurecimento das policies UPDATE
Criar uma única migração que recria todas as policies de UPDATE problemáticas adicionando `WITH CHECK (empresa_id = get_user_empresa_id())`. Isso impede que um UPDATE altere `empresa_id` para outro tenant.

Padrão aplicado a cada tabela:
```sql
DROP POLICY "Users can update X from their empresa" ON public.X;
CREATE POLICY "Users can update X from their empresa"
  ON public.X FOR UPDATE
  USING (empresa_id = get_user_empresa_id())
  WITH CHECK (empresa_id = get_user_empresa_id());
```

Mesma correção aplicada a policies que usam o padrão `empresa_id IN (SELECT … FROM profiles WHERE user_id = auth.uid())` (api_keys, api_inbound_webhooks, planos_acao, relatorios_customizados, relatorio_agendamentos).

Para policies compostas (ex.: `permission_profiles`, `integracoes_config`, `gap_analysis_frameworks` com `is_template = false`, `docgen_conversations` com `user_id = auth.uid()`) — preservar as cláusulas adicionais no `WITH CHECK`.

Adicionalmente, blindar **INSERT**: vou verificar e, onde faltar, adicionar `WITH CHECK (empresa_id = get_user_empresa_id())` nas policies de INSERT (a maioria já tem, mas faremos um sweep defensivo).

### Testes / Validação
4. Executar `supabase--linter` após a migração.
5. Verificar via `supabase--read_query` que todas as policies UPDATE em tabelas com `empresa_id` agora têm `WITH CHECK` adequado.

---

## Detalhes técnicos / Resumo de mudanças

- **Arquivos editados (frontend)**:
  - `src/components/configuracoes/GerenciamentoEmpresas.tsx` (guarda super_admin)
  - `src/components/configuracoes/GerenciamentoUsuariosEnhanced.tsx` (ocultar coluna "Empresa" para non-super_admin)
- **Edge Functions**:
  - `supabase/functions/delete-user-complete/index.ts` (validação de empresa + bloqueio de super_admin por admin)
- **Migração SQL**:
  - Recriação de ~50 policies UPDATE com `WITH CHECK (empresa_id = get_user_empresa_id())` para fechar o vetor de "tenant hijack".
  - Sweep defensivo de policies INSERT para garantir `WITH CHECK` por empresa.

---

## Não-objetivos (não será mexido)

- Tabelas globais públicas (`planos`, `changelog_entries`, templates padrão de due diligence, `gap_analysis_frameworks` com `is_template=true` e `empresa_id IS NULL`) — acesso público é intencional.
- Lógica de aplicação de planos, billing, créditos IA.
- Comportamento atual de super_admin (continua com acesso global).

Confirma que posso seguir?