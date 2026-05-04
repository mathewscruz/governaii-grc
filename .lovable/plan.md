## Problema

Quando o usuário tem uma sessão MFA válida nas últimas 24h, o backend retorna `skipped: true` e o login deveria seguir direto para o dashboard. Hoje:

1. Aparece o toast "Login efetuado com sucesso"
2. Tela fica travada no overlay `<AkurisPulse />` (a marca pulsando)
3. Só sai dela com um refresh manual da página

## Causa raiz

O fluxo em `src/pages/Auth.tsx > handleSignIn` faz, nesta ordem:

1. `setMfaPendingFlag(true)` — marca `sessionStorage.MFA_PENDING_KEY = '1'` **antes** do login
2. `supabase.auth.signInWithPassword(...)` — isso dispara `onAuthStateChange('SIGNED_IN', session)` no `AuthProvider`
3. O `AuthProvider` lê a flag, vê `mfaPending = true`, e força `effectiveSession = null` (correto, para evitar flash do dashboard)
4. Backend responde `skipped: true` → caminho de bypass
5. `setMfaPendingFlag(false)` + `setPhase('finalizing')` → renderiza `<LoadingOverlay />`

O problema: o evento `SIGNED_IN` já foi consumido com a flag ativa, e **nenhum novo evento é emitido**. O `AuthProvider` nunca volta a olhar a sessão, então `user` continua `null` e o `<Navigate to="/dashboard">` (linha 97 de `Auth.tsx`) nunca dispara. Refresh resolve porque o `getSession()` inicial roda de novo, agora com a flag limpa.

O caminho "MFA verificado" (`handleMFAVerified`) não tem esse problema porque limpa a flag **antes** de chamar `signInWithPassword` novamente, fazendo o `SIGNED_IN` ser consumido com a flag já desativada.

## Correção

Aplicar o mesmo padrão do `handleMFAVerified` ao caminho de bypass de 24h: depois de limpar a flag, **forçar uma re-emissão da sessão** para o `AuthProvider` enxergar.

A forma mais simples e segura, consistente com o resto do código, é chamar `supabase.auth.refreshSession()` logo após limpar a flag. Isso dispara um novo evento `TOKEN_REFRESHED` no `onAuthStateChange`, e dessa vez a flag já estará `false`, então `effectiveSession` recebe a sessão real, `user` é populado, e o `<Navigate to="/dashboard">` executa.

### Mudança em `src/pages/Auth.tsx` (caminho `mfaSkipped`)

Substituir o bloco atual (linhas ~222-228):

```ts
// Fluxo direto (sessão MFA válida nas últimas 24h).
setMfaPendingFlag(false);
mfaInProgressRef.current = false;
toast.success(t('auth.loginSuccess'));
setPhase('finalizing');
```

Por:

```ts
// Fluxo direto (sessão MFA válida nas últimas 24h).
// A flag MFA estava ativa quando o SIGNED_IN foi disparado, então o
// AuthProvider descartou aquela sessão. Limpamos a flag e forçamos
// um refresh para que um novo evento (TOKEN_REFRESHED) seja emitido
// e o AuthProvider passe a expor a sessão.
setMfaPendingFlag(false);
mfaInProgressRef.current = false;
try {
  await supabase.auth.refreshSession();
} catch (refreshError) {
  logger.warn('Falha ao refrescar sessão pós-bypass MFA', {
    module: 'Auth',
    error: String(refreshError),
  });
}
toast.success(t('auth.loginSuccess'));
setPhase('finalizing');
```

### Salvaguarda extra (defesa em profundidade)

Para evitar qualquer regressão futura desse tipo, adicionar em `src/pages/Auth.tsx` um `useEffect` que, sempre que `phase === 'finalizing'` e `user` ainda for `null` após 1.5s, dispara um `supabase.auth.refreshSession()` automaticamente. Isso garante que, mesmo que algum caminho futuro esqueça de re-emitir, o usuário não fica preso no overlay.

```ts
useEffect(() => {
  if (phase !== 'finalizing' || user) return;
  const t = setTimeout(() => {
    supabase.auth.refreshSession().catch(() => {});
  }, 1500);
  return () => clearTimeout(t);
}, [phase, user]);
```

## Arquivos alterados

- `src/pages/Auth.tsx` — corrigir caminho de bypass MFA 24h + salvaguarda no `finalizing`

Nenhuma mudança em `AuthProvider.tsx`, na Edge Function `send-mfa-code` ou no banco. O comportamento de proteção contra "flash do dashboard" durante o login é preservado integralmente.

## Validação

1. Login com MFA válido nas últimas 24h → deve cair no dashboard direto, sem ficar no pulse
2. Login com MFA expirado → deve continuar indo para a tela de código
3. Login com credenciais inválidas → deve voltar para o form com toast de erro
4. Refresh em `/auth` durante MFA pendente → deve continuar não vazando para o dashboard
