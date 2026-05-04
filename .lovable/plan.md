# Corrigir bypass de MFA no login

## O que aconteceu (diagnóstico real)

Reconstruí a sequência exata pelos logs do auth + edge function + sessões MFA do banco:

```
10:36:24  POST /token 200      → Login #1 OK (signInWithPassword)
10:36:26  POST send-mfa-code   → 200, "Código MFA enviado" (success: true → requiresMfa=true)
10:36:28  POST /logout 204     → signOut() do Auth.tsx (preparando tela MFA)
            ⚠ Aqui o usuário viu "deslogou sozinho após 1s"
10:36:31  POST /token 200      → Login #2 (usuário tentou de novo)
10:36:33  POST send-mfa-code   → 429 (rate-limit de 60s no envio)
            ⚠ Front IGNOROU o erro e deixou entrar SEM MFA
```

Banco confirma: nenhuma sessão MFA válida existia em 10:36:24 (a última expirou em 02/05 15:18, ~43h antes). Ou seja, MFA realmente deveria ter sido exigido — e a tela chegou a aparecer brevemente, mas o usuário interrompeu e ao retentar caiu no bypass.

## Causas

1. **Bypass de segurança em `src/pages/Auth.tsx` (linhas 147-166)**: quando `send-mfa-code` retorna erro (incluindo rate-limit `429`), o front apenas mostra `toast.warning` e **prossegue para o dashboard sem MFA**. Isso quebra o requisito de MFA obrigatório a cada 24h.
2. **Transição visual instável**: o `await supabase.auth.signOut()` (linha 170) dispara `onAuthStateChange` → `user=null`, que pode renderizar o form por um frame antes de `setPhase('mfa_required')` ser aplicado. O usuário interpreta como "logou e deslogou".
3. **Rate-limit de envio bloqueia o fluxo**: o limite de 60s entre envios em `send-mfa-code` é correto para anti-spam, mas não deve impedir a continuidade do MFA quando já existe um código válido recente.

## Correções

### 1. `src/pages/Auth.tsx` — fechar o bypass

- Quando `requiresMfa` não puder ser determinado com certeza como `false`, **forçar `mfa_required`**.
- Tratar `429` (rate-limit) como "código já foi enviado há pouco, siga para a tela de MFA" — não como sucesso de login direto.
- Tratar erros genéricos de `send-mfa-code` (network, 500) como **falha de login**: signOut + toast de erro + voltar para `idle`. Nunca deixar entrar sem MFA quando o sistema esperava MFA.
- Manter o caminho `skipped: true` (sessão MFA válida nas últimas 24h) como o único caso legítimo de pular MFA.

### 2. `src/pages/Auth.tsx` — estabilizar a transição

- Trocar a ordem: `setPhase('mfa_required')` e setar `mfaUserId/mfaEmail/mfaPassword` **antes** de chamar `supabase.auth.signOut()`. Como a guarda no topo já é `phase !== 'mfa_required'`, isso impede o `<Navigate>` de disparar mesmo que `user` ainda esteja momentaneamente preenchido.
- Garantir que durante `'authenticating'` → `'mfa_required'` o `LoadingOverlay` continua coberto (já está).

### 3. `supabase/functions/send-mfa-code/index.ts` — não falhar quando há código válido

- Antes do rate-limit de envio, checar se já existe um código MFA **não usado e não expirado** para o usuário. Se existir, retornar `200 { success: true, alreadySent: true }` em vez de `429`. Assim o front segue para a tela de MFA naturalmente — o código já está no inbox do usuário.
- Manter o `429` real apenas para tentativas de "reenviar" (ex.: o botão Reenviar do `MFAVerification`), que pode passar uma flag `force: true`.

### 4. `src/components/MFAVerification.tsx` — alinhar com o backend

- No `handleResend`, passar `{ userId, email, force: true }` para o `send-mfa-code`, mantendo o rate-limit anti-spam apenas no botão de reenvio explícito.

## Arquivos alterados

- `src/pages/Auth.tsx` — lógica de decisão MFA + ordem de transição.
- `supabase/functions/send-mfa-code/index.ts` — `alreadySent` em vez de `429` na primeira chamada.
- `src/components/MFAVerification.tsx` — `force: true` no reenviar.

## Por que isso resolve

- O usuário **nunca mais entra sem MFA** quando o sistema deveria exigir.
- A tela de MFA aparece de forma estável, sem o "flash" de logout.
- Se algo der errado no envio do e-mail, o login falha de forma explícita (com mensagem) em vez de silenciosamente liberar acesso.
- O rate-limit de 60s continua protegendo contra spam do botão "Reenviar", sem afetar o fluxo normal de login.
