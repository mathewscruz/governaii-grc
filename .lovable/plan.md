Validação completa do fluxo de onboarding da Akuris — encontrei 7 problemas, alguns críticos. Antes de você liberar pro cliente, precisa que eu corrija. Resumo do que está e do que não está funcionando:

## Status atual

| Etapa | Status | Observação |
|---|---|---|
| Registro público (`/registro`) | Parcialmente funciona | Cria usuário, empresa e profile, mas falha silenciosa nas permissões |
| Criação de usuário interno (admin convida outros) | Funciona, com bugs | Permissões via `apply_default_permissions_for_user` ok; via perfil customizado quebra |
| E-mail de boas-vindas com link "definir senha" | Funciona quando chamado | Resend configurado, template ok |
| Atribuição de perfis (RBAC) | Quebrado em parte | `user_roles` (tabela exigida pelo padrão de segurança) NÃO é populada em novos usuários |
| Licenças / Trial 14 dias | Não expira sozinho | `check-trial-expiration` existe mas não tem cron agendado |
| Stripe checkout (planos pagos) | Funciona | UUIDs dos planos batem com o banco |

## Problemas encontrados

### 1. CRÍTICO — `provision-new-account` insere em tabela inexistente
A Edge Function tenta inserir permissões em `public.user_permissions`, mas a tabela correta no projeto é `user_module_permissions`. O bloco está dentro de um try/catch que engole o erro, então o registro segue, mas o usuário fica com **zero permissões de módulo**. Já há evidência: `mathews@estoca.com.br` foi criado pelo registro e tem 0 permissões, enquanto usuários criados via convite (admin) têm 15.

Correção: trocar a inserção manual por uma chamada ao RPC `apply_default_permissions_for_user(user_id_param)`, que já existe e cobre todos os módulos ativos com base na role.

### 2. CRÍTICO — `create-user` chama RPC com nomes de parâmetros errados
A função chama `supabase.rpc('apply_permission_profile', { profile_id, target_user_id })`, mas a assinatura real é `(_user_id uuid, _profile_id uuid)`. Quando o admin escolhe um perfil de permissão personalizado, **a aplicação falha silenciosamente** e o usuário fica sem permissões customizadas.

Correção: passar `{ _user_id: authData.user.id, _profile_id: permission_profile_id }`.

### 3. CRÍTICO — `user_roles` não é populada no onboarding
A regra de segurança do projeto diz que roles vão em `public.user_roles` (não em `profiles.role`). Tanto `provision-new-account` quanto `create-user` só gravam em `profiles.role`. Se algum dia uma policy passar a usar `has_role()` em vez de `is_admin()`, **todos os usuários novos perdem acesso**. Hoje já está inconsistente: 11 registros em `user_roles` para 19 perfis.

Correção: nas duas funções, após criar o profile, inserir também em `user_roles` (`super_admin` para o admin@governaii, `admin` para o dono da empresa criada via registro, role passada para usuários convidados).

### 4. ALTO — Trial de 14 dias não expira automaticamente
A função `check_trial_expiration()` no banco e a Edge Function `check-trial-expiration` existem, mas **não há cron agendado** (`cron.job` está vazio). Empresas em trial ficam ativas indefinidamente.

Correção: criar um `cron.job` chamando `check_trial_expiration()` diariamente (ex. 03:00 UTC) via migration usando `pg_cron`.

### 5. MÉDIO — `provision-new-account` lista módulos que não existem
A Edge Function lista `relatorios` e `politicas`, mas eles não estão em `system_modules`. Inofensivo hoje (a tabela errada engole tudo), mas vai virar bug depois da correção do item 1.

Correção: ao usar o RPC, ele já consulta `system_modules`, então o problema some.

### 6. MÉDIO — Sem normalização do CNPJ na criação da empresa
O frontend envia só dígitos (ok), mas não há check de duplicidade nem de formato. Risco de duas empresas com mesmo CNPJ.

Correção: validar duplicidade de CNPJ antes de criar empresa e retornar 409 amigável.

### 7. BAIXO — Slug pode colidir
Duas empresas com nomes iguais geram o mesmo slug e há risco de violação de unique. Hoje está funcionando porque várias empresas estão com `slug=null`, mas se ativar a unique vai quebrar.

Correção: gerar slug com sufixo numérico se já existir.

## Plano de implementação

1. **Migration** com:
   - Cron job diário para `check_trial_expiration()`.
   - (Opcional) Garantir unique em `empresas.cnpj` quando não nulo.

2. **Edge Function `provision-new-account`** (registro público):
   - Trocar inserção em `user_permissions` por `rpc('apply_default_permissions_for_user', { user_id_param })`.
   - Inserir registro em `user_roles` com role `admin` (dono da empresa).
   - Validar CNPJ duplicado antes de criar empresa.
   - Garantir slug único.
   - Disparar `send-welcome-email` também para o registro público (hoje só envia se for criado por admin) — opcional, confirmo abaixo.

3. **Edge Function `create-user`** (convite por admin):
   - Corrigir parâmetros do RPC `apply_permission_profile` para `_user_id` e `_profile_id`.
   - Inserir em `user_roles` a role escolhida.

4. **Validação final** rodando uma criação real de empresa de ponta a ponta com um e-mail de teste e checando: profile, permissões, user_roles, e-mail enviado, link de definir senha funcional, trial com data correta.

## Pergunta antes de implementar

No registro público (`/registro` com plano Free), hoje o usuário se loga **com a senha que ele mesmo definiu** — então não recebe e-mail de boas-vindas com link "definir senha". Faz sentido continuar assim ou você quer que **todo novo cadastro receba também um e-mail de boas-vindas** com link de confirmação/login direto? Posso seguir com qualquer um dos dois — só preciso saber.

Posso seguir com a implementação?