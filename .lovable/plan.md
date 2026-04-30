## Plano revisado — sem Stripe, com gestão própria de planos

Você confirmou que não usa mais Stripe. Vou (1) **remover toda a integração Stripe** e (2) **transformar o módulo "Planos" em uma área de gestão própria** onde você (super-admin) cria planos, define preços, limites e módulos liberados, e atribui às empresas manualmente.

---

## Parte 1 — Remoção do Stripe

### Arquivos a deletar
- `supabase/functions/create-checkout/` (Edge Function)
- `supabase/functions/customer-portal/` (Edge Function)
- `supabase/functions/check-subscription/` (Edge Function)
- `src/lib/stripe-plans.ts` (mapeamento hardcoded)
- `src/pages/CheckoutSuccess.tsx` (página de retorno do Stripe)

### Arquivos a editar (remover referências)
- `src/pages/Registro.tsx` — remover `plano_codigo` que ia para Stripe; trial Free vira único caminho público (ou desabilita auto-registro pago).
- `src/pages/Planos.tsx` — vira página de catálogo apenas (sem botão "Assinar"), ou redireciona para "Fale conosco".
- `src/components/configuracoes/AssinaturaTab.tsx` — remover `check-subscription` e `customer-portal`; mostrar plano atual da empresa direto da tabela `empresas` + `planos`.
- `src/components/configuracoes/FinanceiroIATab.tsx` — remover dependências do Stripe (manter custo de IA por modelo, que é cálculo interno).
- `supabase/functions/provision-new-account/index.ts` — remover Stripe SDK e `priceId`; criar empresa em `trial` com plano definido pelo super-admin.
- `src/pages/LandingPage.tsx` — remover CTAs de "Assinar agora" se houver, manter "Fale conosco".

### Variáveis a remover
- Secret `STRIPE_SECRET_KEY` (vou avisar para você remover manualmente nas configurações).
- Tipos de Stripe em arquivos compartilhados.

---

## Parte 2 — Gestão própria de planos

### Migração de banco — enriquecer tabela `planos`
Adicionar colunas:
- `preco_mensal` numeric (default 0)
- `preco_anual` numeric (default 0)
- `moeda` text default `'BRL'`
- `limite_usuarios` integer (null = ilimitado)
- `limite_creditos_ia` integer (renomear de `creditos_franquia` ou manter como alias)
- `modulos_habilitados` jsonb default `'[]'` (array de chaves de módulos: `riscos`, `controles`, `documentos`, `gap_analysis`, `due_diligence`, etc.)
- `recursos_destacados` jsonb default `'[]'` (lista de bullets para exibição)
- `is_destaque` boolean default false (marca o "popular")
- `ordem` integer default 0 (ordenação na exibição)

Backfill: popular os 3 planos atuais (`compliance_start`, `grc_manager`, `governaii_enterprise`) com valores razoáveis baseados no que existia em `stripe-plans.ts` (R$ 99 / R$ 249 / R$ 499) e módulos habilitados conforme tier.

### Nova tela: "Planos" em Configurações (super-admin only)
Substituir a aba "Financeiro IA" como uma sub-aba ou adicionar **nova aba "Planos"** com:
- Lista de planos com cards (nome, preço, créditos, limite usuários, módulos habilitados).
- Botão **"Novo Plano"** → dialog para criar com todos os campos da migração.
- Botão **"Editar"** em cada card.
- Toggle "Ativo" para esconder planos descontinuados sem deletar.
- Aviso quando tentar desativar um plano com empresas vinculadas.

### Atribuição de plano à empresa
- Em `GerenciamentoEmpresas` → dialog de empresa → select de plano (já existe, vai pegar dinamicamente da tabela atualizada).
- Adicionar campos: `data_inicio_assinatura`, `data_fim_assinatura` (opcional, controle manual).

### Enforcement dos limites no app
- `limite_usuarios`: ao criar usuário em `create-user`, verificar se a empresa não estourou. Bloquear com mensagem clara.
- `limite_creditos_ia`: já existe via `consume_ai_credit` — só vincular ao novo campo.
- `modulos_habilitados`: criar hook `useModuleAccess(moduleKey)` que checa o plano da empresa e bloqueia acesso a módulos não inclusos (com upsell amigável "Fale com seu admin para upgrade").

### Página pública `/planos` (opcional)
Vira tabela comparativa **read-only** lendo da tabela `planos` com CTA "Fale conosco" → leva para landing/contato. Sem checkout.

---

## Parte 3 — Itens do plano anterior que **mantenho**

Tudo que estava no plano original e não depende de Stripe continua:

### A. Limpar órfãos
- `Fast2Mine` recebe plano padrão (vou perguntar qual abaixo).
- Listar/limpar 2 usuários órfãos no `auth.users` via ferramenta para super-admin.

### B. Exclusão segura de empresa
- Edge function `delete-empresa-safe` com cleanup transacional.
- Dialog de confirmação mostrando impacto.

### C. Convites com observabilidade
- Coluna "Convite enviado em" + "Expira em".
- Botão "Copiar link de convite" no menu de cada usuário pendente.
- Toast diferenciado quando e-mail falha.

### D. Card de trial em Assinatura + e-mails de aviso
- Card no topo com dias restantes, data de expiração, CTA "Fale com seu admin para escolher um plano" (no lugar de "Escolher plano no Stripe").
- Cron D-3 e D-0 → e-mail aviso.

### E. Onboarding em 1 clique
- Dialog "Nova Empresa" passa a aceitar opcionalmente nome+e-mail do admin inicial e cria os dois em sequência.

### F. Coluna "Usuários" em Empresas
- Contagem clicável que filtra a aba Usuários.

### G. Confirmação para "Restaurar Permissões para Todos"
- ConfirmDialog antes de aplicar.

---

## Itens **removidos** do plano original
- ~~Unificar códigos Stripe ↔ banco~~ — não faz mais sentido, banco vira fonte única.
- ~~Atualizar `PlanBadge` para códigos Stripe~~ — `PlanBadge` vai ler `cor_primaria` e `icone` direto da tabela `planos` (já existe).

---

## Detalhes técnicos

**Migrations a criar:**
1. `enriquecer_tabela_planos.sql` — colunas novas + backfill dos 3 planos existentes.
2. `backfill_fast2mine.sql` — associa empresa órfã ao plano padrão.
3. `trial_expiring_reminders.sql` — pg_cron D-3 e D-0.

**Edge Functions a criar:**
- `delete-empresa-safe`
- `send-trial-reminder` + template `trial-expiring.tsx`

**Edge Functions a deletar:**
- `create-checkout`, `customer-portal`, `check-subscription`

**Componentes a criar:**
- `src/components/configuracoes/GerenciamentoPlanos.tsx` — CRUD visual de planos (super-admin only)
- `src/components/configuracoes/PlanoFormDialog.tsx`
- `src/hooks/useModuleAccess.ts` — enforcement de módulos por plano

**Componentes a editar:**
- `GerenciamentoEmpresas.tsx`, `GerenciamentoUsuariosEnhanced.tsx`, `AssinaturaTab.tsx`, `Configuracoes.tsx` (nova aba), `Registro.tsx`, `LandingPage.tsx`, `Planos.tsx`, `PlanBadge.tsx`, `provision-new-account/index.ts`, `create-user/index.ts`, `FinanceiroIATab.tsx`.

**Componentes a deletar:**
- `CheckoutSuccess.tsx`, `stripe-plans.ts`.

---

## Perguntas antes de implementar

1. **Para `Fast2Mine` (empresa sem plano)**, qual plano associar? `compliance_start` (o mais básico) ou outro?
2. **Auto-registro público** (`/registro`) hoje deixa qualquer um criar empresa Free de 14 dias. Quer **manter** esse fluxo (usuário se cadastra sozinho em trial) ou **bloquear** e forçar todo cliente novo a passar por contato comercial + super-admin criar manualmente?
3. **Enforcement de limites**: começo aplicando "soft" (só avisa o admin no dashboard) ou já bloqueio criação ao atingir limite de usuários/créditos?

Posso seguir com tudo isso?
