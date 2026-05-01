Plano em duas frentes: (A) **bug do "clicar duas vezes"** após login, e (B) **refinamento visual** das telas de Login e MFA. Resolva A primeiro, é o bloqueador.

---

# A) BUG: usuário precisa clicar "Entrar" duas vezes

## Causa raiz
O fluxo atual em `Auth.tsx` força um padrão problemático:

1. `signInWithPassword(email, password)` → cria sessão real no Supabase. O `AuthProvider.onAuthStateChange` dispara `SIGNED_IN`, seta `user`, e o `<Navigate to="/dashboard">` está prestes a executar.
2. **Imediatamente** o código chama `supabase.auth.signOut()` (linha 112 de `Auth.tsx`) para "esconder" a sessão até o MFA ser verificado.
3. Isso dispara um segundo `onAuthStateChange` com `SIGNED_OUT`, zera `user`, e o componente Auth re-renderiza: o overlay `loginSuccess` já foi apresentado (tela cheia AkurisPulse), mas como `user` voltou a ser `null` e o flag `mfaInProgressRef.current` é um *ref* (não dispara re-render), nada garante que a tela do MFA apareça em cima — e dependendo do timing, o `setLoginSuccess(true)` chamado depois pode nem ser executado se houver erro/skip do MFA.
4. O usuário cai de volta no formulário (com `loginSuccess=false` e `user=null`) e precisa clicar de novo. Na segunda tentativa, ou o MFA é pulado (sessão de 24h em `mfa_sessions`), ou o fluxo segue limpo.

A raiz: **misturar `signIn` real + `signOut` + re-`signIn` em sequência** cria múltiplos `auth state changes` que competem com a UI; e o `loginSuccess` overlay é setado tarde demais (apenas após o re-`signIn`).

## Correção

Refatorar `handleSignIn` em `src/pages/Auth.tsx` para um modelo **"verificar antes de logar"**:

1. **Não chamar `signInWithPassword` antes do MFA.** Em vez disso, criar uma única RPC/edge function `pre-auth-mfa-check` que recebe `{ email, password }`, valida as credenciais via `supabase.auth.signInWithPassword` no servidor (service role), checa se o usuário tem MFA-session válida (`mfa_sessions`, 24h), e retorna `{ ok: true, requiresMfa: boolean, userId }`. **Importante**: a edge não devolve token — só decide o caminho.
   - Alternativa mais barata sem edge nova: manter o `signInWithPassword` no client mas **não** chamar `signOut` no caminho de "MFA pulado" nem no caminho de erro. O `signOut` só acontece se `requiresMfa === true`.

2. **Estado único `phase`** substituindo `isLoading + loginSuccess + mfaPending + mfaInProgressRef`:
   ```ts
   type AuthPhase = 'idle' | 'authenticating' | 'mfa_required' | 'verifying_mfa' | 'finalizing';
   const [phase, setPhase] = useState<AuthPhase>('idle');
   ```
   - `idle`: form normal.
   - `authenticating`: usuário clicou "Entrar", validando credenciais + decidindo MFA. **Já mostra `<LoadingOverlay />`** — sem voltar para o form em hipótese alguma.
   - `mfa_required`: mostra `<MFAVerification />`.
   - `verifying_mfa`: mostra `<LoadingOverlay />` enquanto `verify-mfa-code` + re-signIn rodam.
   - `finalizing`: sessão criada, aguardando `AuthProvider` propagar `user` → `<Navigate>` dispara → continua `<LoadingOverlay />`.

3. **Renderização determinística** (substitui `loginSuccess && return overlay`):
   ```tsx
   if (phase === 'authenticating' || phase === 'verifying_mfa' || phase === 'finalizing') {
     return <LoadingOverlay />;
   }
   if (phase === 'mfa_required') {
     return <MFAVerification ... />;
   }
   ```
   Assim **nunca** o usuário vê o form piscar de volta enquanto `auth state` está em transição.

4. **Sequência correta**:
   - `phase=authenticating` → `signInWithPassword` → se erro: `phase=idle` + toast.
   - Se OK: chamar `send-mfa-code`. 
     - Se `skipped` (MFA recente válida): **NÃO fazer signOut + re-signIn**. A sessão já está ativa do passo anterior. Apenas `phase=finalizing` e deixar o `<Navigate>` do AuthProvider levar ao dashboard.
     - Se `success && !skipped` (precisa MFA): **agora sim** `await supabase.auth.signOut()` → `phase=mfa_required`.
     - Se erro do `send-mfa-code`: log, manter sessão, `phase=finalizing`.
   - No `handleMFAVerified`: `phase=verifying_mfa` antes de re-`signInWithPassword`; após sucesso `phase=finalizing`.

5. **Gate no `<Navigate>`**: trocar `mfaInProgressRef.current` por `phase !== 'mfa_required'`:
   ```tsx
   if (!loading && user && phase !== 'mfa_required') return <Navigate to="/dashboard" replace />;
   ```

6. **Limpar `mfaPassword` / `mfaInProgressRef`** — remover, redundantes com `phase`.

7. **Hardening em `AuthProvider.tsx`**: nada a mudar funcionalmente, mas adicionar log `auth.event=SIGNED_OUT` distinto para debug — útil no QA pós-fix.

8. **QA manual**:
   - Login sem MFA prévio → preenche → clica → overlay aparece → tela MFA → digita código → overlay → dashboard. (1 clique no botão Entrar.)
   - Login com MFA válido nas últimas 24h → preenche → clica → overlay → dashboard. (1 clique.)
   - Senha errada → overlay sumir, voltar ao form com toast.
   - Cancelar MFA → volta ao form limpo.

---

# B) Refinamento visual (Login + MFA) — mantém o plano anterior

## Tela de Login — `src/pages/Auth.tsx`

**Painel esquerdo** (substituir os 3 feature-cards genéricos):
- Eyebrow caps: `PLATAFORMA GRC` em `text-primary/70 tracking-[0.2em] text-xs`.
- Headline editorial DM Sans `text-4xl font-semibold leading-[1.05]` com gradiente Akuris no destaque.
- 3 pilares como **lista** (não cards): ícones proprietários `RiscosIcon`, `ControlesIcon`, `GapAnalysisIcon` (stroke 1.5, primary), divisor `w-px h-8 bg-white/10`, título + 1-linha de descrição.
- Selo de confiança no rodapé do painel: `LGPD · ISO 27001 · Multi-tenant` em caps tracking, `text-white/35`.
- Trocar 1 dos blobs blur pelo `<AkurisMarkPattern opacity={0.05} />`.

**Painel direito** (card de login):
- Adicionar `<CornerAccent />` no card.
- Hierarquia tipográfica: eyebrow "Bem-vindo de volta" + H2 `text-2xl font-semibold` "Entre na sua conta" + sub `text-white/45`.
- Inputs `h-12`, foco `border-primary/60 ring-1 ring-primary/30`, ícones em `text-primary/40`.
- Botão Entrar: trocar `gradient` por `bg-primary` sólido com `shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.5)]` + seta `→` no fim com `group-hover:translate-x-0.5`.
- Selo de segurança no rodapé: `<Lock className="w-3 h-3"/> Conexão criptografada · Sessão isolada por empresa`.
- `<AkurisMarkPattern opacity={0.04} />` cobrindo painel direito.

## Tela de MFA — `src/components/MFAVerification.tsx`

- Mesmo gradient + `<AkurisMarkPattern opacity={0.04} />` do login (continuidade visual).
- Substituir o `<ShieldCheck/>` Lucide pelo **símbolo Akuris** (mesmo path do `AkurisPulse`) num container `w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20`. Identidade no lugar de ícone genérico.
- `<CornerAccent />` no card.
- Hierarquia: eyebrow "Verificação em duas etapas" + H2 `text-2xl font-semibold` "Confirme que é você" + sub.
- Email mascarado vira chip `inline-flex gap-2 px-3 py-1.5 rounded-full border border-white/8 bg-white/[0.02]` com Mail em `text-primary/60`.
- OTP slots: fundo `bg-[hsl(230,25%,9%)]`, foco `border-primary ring-2 ring-primary/20`, gap visual entre 3º/4º slots.
- Banda de segurança: `<Lock className="w-3 h-3"/> Código válido por 10 minutos · Nunca compartilhe`, `text-white/35 text-[11px]`.
- Botão "Voltar" vira link `← Voltar ao login`.

## i18n
Novas chaves em `src/i18n/pt.ts` e `src/i18n/en.ts`:
- `auth.eyebrowPlatform`, `auth.eyebrowWelcome`, `auth.heading`, `auth.securityFootnote`, `auth.complianceBadges`.
- `mfaScreen.eyebrow`, `mfaScreen.heading`, `mfaScreen.securityFootnote`, `mfaScreen.backToLogin`.

## Fora de escopo
- Não mexer em `Registro.tsx`, `DefinirSenha.tsx`, `LandingPage`.
- Não trocar paleta nem logo.

---

## Ordem de execução
1. **Primeiro**: corrigir bug do duplo-clique (frente A) — funcional, bloqueador.
2. Depois: refinamento visual (frente B).

Após implementar, validar manualmente os 4 cenários do QA acima e tirar screenshot das 2 telas para conferência.