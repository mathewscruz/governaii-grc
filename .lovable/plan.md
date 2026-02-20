
# Corrigir MFA: Nao Mostrar Tela MFA Quando Sessao 24h Valida

## Problema
O fluxo em `Auth.tsx` define `setMfaPending(true)` (linha 111) ANTES de chamar `send-mfa-code`. Isso faz a tela de verificacao MFA aparecer imediatamente, mesmo quando a edge function retorna `skipped: true` (sessao 24h valida).

O usuario ve a tela MFA piscar brevemente a cada login, mesmo que o MFA seja pulado em seguida.

## Evidencia
- A edge function `send-mfa-code` esta funcionando corretamente: retorna `{ success: true, skipped: true }` quando ha sessao valida (testado via curl)
- A sessao MFA no banco esta valida: criada 17:03 com expiracao 2026-02-21 17:03 (24h)
- O problema e puramente de UX no Auth.tsx

## Solucao

**Arquivo**: `src/pages/Auth.tsx`

Reordenar o fluxo do `handleSignIn`:

1. Fazer signIn (como hoje)
2. Fazer signOut (como hoje) -- mas NAO setar `mfaPending = true` ainda
3. Chamar `send-mfa-code`
4. Se resposta `skipped: true`: re-autenticar imediatamente, NUNCA mostrar tela MFA
5. Se resposta `success: true` (sem skipped): AI SIM setar `mfaPending = true` para mostrar tela MFA

### Mudancas especificas:
- Remover `setMfaPending(true)` da linha 111 (antes do signOut)
- Remover `setMfaUserId`, `setMfaEmail`, `setMfaPassword` das linhas 112-114 (antes do signOut)
- Mover essas atribuicoes para DENTRO do bloco `else if (mfaResponse.data?.success)` (linha 150-151), que e quando o MFA realmente e necessario
- Manter `mfaInProgressRef.current = true` na linha 93 para evitar redirect durante o processo
- O botao "Entrar" ja fica desabilitado via `isLoading`, entao o usuario ve "Entrando..." durante a verificacao
