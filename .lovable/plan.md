

# Relatório de Pentest — Auditoria de Segurança do Akuris

## Resumo Executivo

Foram identificadas **13 vulnerabilidades**, sendo **4 críticas**, **5 de severidade alta** e **4 médias**. As mais graves envolvem exposição de dados entre empresas (quebra de isolamento multi-tenant), XSS via injeção de HTML, e edge functions sem autenticação que permitem ações destrutivas.

---

## Vulnerabilidades Críticas (Severidade: CRITICAL)

### 1. XSS (Cross-Site Scripting) no Chatbot AkurIA
**Arquivo:** `src/components/dashboard/AkurIAChatbot.tsx` (linha 18-29)
**Vetor:** A resposta da IA é renderizada via `dangerouslySetInnerHTML` sem sanitização. Se um atacante conseguir influenciar a resposta da IA (prompt injection) ou se a API retornar conteúdo malicioso, JavaScript arbitrário será executado no navegador da vítima.
**Impacto:** Roubo de sessão (token JWT), exfiltração de dados, ações em nome do usuário.
**Correção:** Sanitizar o HTML com uma lib como DOMPurify, ou usar uma abordagem text-only para renderização.

### 2. XSS no DocGenDialog
**Arquivo:** `src/components/documentos/DocGenDialog.tsx` (linha 524)
**Vetor:** Conteúdo gerado por IA renderizado via `dangerouslySetInnerHTML` sem sanitização.
**Impacto:** Mesmo do item 1.
**Correção:** Sanitizar com DOMPurify antes de injetar HTML.

### 3. Edge Function `delete-user-complete` sem JWT (verify_jwt = false)
**Arquivo:** `supabase/config.toml` (linha 149)
**Vetor:** A função valida autenticação internamente via header Authorization, MAS com `verify_jwt = false` no config, a camada de proteção do Supabase Gateway é removida. Um atacante poderia tentar requests com tokens forjados ou manipulados. Embora a função faça verificação interna, a defesa em profundidade é comprometida.
**Impacto:** Exclusão não autorizada de usuários do sistema.
**Correção:** Alterar para `verify_jwt = true` — a função já recebe o token Authorization e pode funcionar com JWT validado pelo gateway.

### 4. Tabela `denuncias_configuracoes_public` sem RLS
**Fonte:** Security Scan
**Vetor:** Todos os tokens públicos de portais de denúncia de TODAS as empresas ficam acessíveis sem autenticação. Um atacante pode enumerar todas as empresas da plataforma e seus tokens.
**Impacto:** Acesso indevido a configurações de portais, possível manipulação do canal de denúncias.
**Correção:** Habilitar RLS nesta tabela e restringir acesso anônimo apenas ao slug/empresa necessário.

---

## Vulnerabilidades Altas (Severidade: HIGH)

### 5. Categorias de denúncias expostas publicamente para todas as empresas
**Fonte:** Security Scan — `denuncias_categorias` policy anônima usa apenas `(ativo = true)` sem filtro de empresa.
**Impacto:** Enumeração de `empresa_id` de todos os clientes da plataforma.
**Correção:** Adicionar filtro por contexto (token ou empresa_slug) na policy anônima.

### 6. Inserção anônima de anexos em denúncias sem verificação de token
**Fonte:** Security Scan — `denuncias_anexos` INSERT policy não exige `token_publico`.
**Impacto:** Qualquer pessoa com um UUID de denúncia pode injetar arquivos na investigação.
**Correção:** Exigir validação do `x-token-publico` header na policy INSERT.

### 7. Questões de Due Diligence expostas anonimamente
**Fonte:** Security Scan — Policy SELECT em `due_diligence_questions` não é scoped por token específico.
**Impacto:** Todas as perguntas de assessment ficam visíveis quando qualquer assessment está ativo.
**Correção:** Exigir `x-assessment-token` header que corresponda ao assessment específico.

### 8. Edge Function `provision-new-account` sem rate limiting
**Arquivo:** `supabase/functions/provision-new-account/index.ts`
**Vetor:** Não há rate limiting nem CAPTCHA. Um atacante pode criar milhares de contas automaticamente, consumindo recursos (Supabase Auth, Stripe, storage).
**Impacto:** Abuso de recursos, pollution de dados, custos financeiros (Stripe).
**Correção:** Implementar rate limiting por IP ou CAPTCHA (hCaptcha/Turnstile).

### 9. Senha armazenada em estado React durante fluxo MFA
**Arquivo:** `src/pages/Auth.tsx` (linhas 36, 145-146, 182-183)
**Vetor:** A senha do usuário é armazenada em `mfaPassword` (React state) durante todo o fluxo MFA para re-autenticação posterior. Se houver qualquer extensão de browser maliciosa ou acesso ao React DevTools, a senha fica exposta em plain-text.
**Impacto:** Exposição de credenciais.
**Correção:** Usar um approach baseado em token temporário do servidor ao invés de guardar a senha no client.

---

## Vulnerabilidades Médias (Severidade: MEDIUM)

### 10. Políticas RLS com `USING (true)` / `WITH CHECK (true)`
**Fonte:** Security Scan — Policies overly permissive em operações UPDATE/DELETE/INSERT.
**Impacto:** Possível bypass de isolamento multi-tenant em tabelas afetadas.
**Correção:** Auditar e restringir todas as policies que usam `(true)` em operações de escrita.

### 11. Security Definer View detectada
**Fonte:** Security Scan — Views com SECURITY DEFINER executam com permissões do criador, não do usuário.
**Impacto:** Pode permitir acesso a dados que o usuário não deveria ver.
**Correção:** Converter para SECURITY INVOKER ou garantir que a view filtra por `empresa_id`.

### 12. Leaked Password Protection desabilitado
**Fonte:** Security Scan — Supabase Auth não verifica senhas vazadas em bases públicas (HaveIBeenPwned).
**Impacto:** Usuários podem usar senhas já comprometidas.
**Correção:** Habilitar no Supabase Dashboard > Auth > Settings.

### 13. XSS no NISTRequirementDetailDialog (risco menor)
**Arquivo:** `src/components/gap-analysis/nist/NISTRequirementDetailDialog.tsx`
**Vetor:** `dangerouslySetInnerHTML` com conteúdo de `inlineMd()`. O risco é menor pois os dados vêm do banco/guidance (controlados), mas uma injeção no banco comprometeria os usuários.
**Correção:** Sanitizar com DOMPurify por precaução.

---

## Plano de Correção Proposto

Priorizo as correções que posso implementar no código sem quebrar funcionalidades:

### Fase 1 — Correções de código (implementáveis agora)
1. **Instalar DOMPurify** e sanitizar todos os `dangerouslySetInnerHTML` (items 1, 2, 13)
2. **Alterar `delete-user-complete` para `verify_jwt = true`** no config.toml (item 3)

### Fase 2 — Correções de banco (requerem migrations)
3. **Habilitar RLS em `denuncias_configuracoes_public`** com policy adequada (item 4)
4. **Restringir policy anônima de `denuncias_categorias`** por contexto de empresa (item 5)
5. **Adicionar verificação de token em `denuncias_anexos`** INSERT policy (item 6)
6. **Restringir policy de `due_diligence_questions`** por token específico (item 7)
7. **Auditar e corrigir policies `USING (true)`** em operações de escrita (item 10)

### Fase 3 — Melhorias de configuração
8. **Habilitar Leaked Password Protection** no Supabase Dashboard (item 12)
9. **Adicionar rate limiting ao `provision-new-account`** (item 8)

### Nota sobre item 9 (senha em state)
Essa correção requer redesenho do fluxo MFA e será documentada para implementação futura, pois é mais complexa e o risco é mitigado pelo fato de que o state React não persiste e a sessão é de curta duração.

---

Deseja que eu implemente a **Fase 1** (sanitização XSS + fix config.toml) agora? As correções de banco (Fase 2) podem ser implementadas em seguida.

