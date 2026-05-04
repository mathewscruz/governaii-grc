## Causa raiz

Os logs da edge function `send-mfa-code` mostram: **"Código MFA ativo encontrado para userId ... - reaproveitando"** — e a função retorna `{ success: true, alreadySent: true }` **sem reenviar o e-mail**.

Isso foi introduzido na correção anterior para evitar 429. O efeito colateral é: se já existe um código válido no banco (de uma tentativa anterior), o login atual nunca dispara um novo e-mail, então o usuário fica esperando um código que nunca chega.

## Correção

Em `supabase/functions/send-mfa-code/index.ts`, mudar a lógica para:

1. **Sempre enviar o e-mail** durante o login (exceto quando há sessão MFA válida de 24h — esse caso continua pulando o MFA).
2. **Reusar o código** se ainda houver um ativo e não expirado (não invalida o que o usuário pode já ter no inbox).
3. **Gerar novo código** apenas quando não há ativo OU quando `force = true` (botão "Reenviar").
4. **Rate limit (60s)** aplica-se apenas ao botão "Reenviar" (`force = true`), nunca ao login normal.

Resultado: a cada login fora das 24h, o usuário recebe o e-mail com o código (novo ou reusado), e o botão de reenviar continua protegido contra abuso.

## Arquivos alterados

- `supabase/functions/send-mfa-code/index.ts` — substituir o bloco de "alreadySent" por reuso-com-reenvio e reordenar o rate limit.

## Validação

1. Login fora das 24h → e-mail chega com código → MFA verifica → dashboard.
2. Login com código ainda ativo (ex.: tentativa anterior) → e-mail é reenviado com o mesmo código.
3. Botão "Reenviar" em <60s → 429 com mensagem amigável.
4. Login dentro das 24h → continua pulando MFA.