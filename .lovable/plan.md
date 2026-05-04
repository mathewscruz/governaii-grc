Vou corrigir o fluxo de MFA para eliminar a corrida entre `signInWithPassword`, `Navigate` e `signOut`, que hoje permite o dashboard aparecer por um instante antes da tela MFA/deslogout.

Plano de implementação:

1. Tornar o fluxo de MFA resistente a race conditions em `src/pages/Auth.tsx`
   - Adicionar uma trava síncrona via `useRef` para marcar imediatamente que o MFA está em andamento antes de qualquer `signOut()`.
   - Persistir temporariamente o desafio MFA em `sessionStorage` enquanto o usuário está entre “senha validada” e “código MFA validado”.
   - Ajustar o redirecionamento do `/auth` para `/dashboard` para só acontecer quando não houver desafio MFA pendente.
   - Resultado esperado: após credenciais corretas e MFA expirado, o usuário fica na tela MFA e não vê o dashboard antes de validar o código.

2. Bloquear a sessão provisória antes de renderizar páginas autenticadas
   - Alterar `src/components/AuthProvider.tsx` para detectar quando existe desafio MFA pendente para o usuário atual.
   - Enquanto existir desafio pendente, o provider não deve expor `user/session` como sessão autenticada para o restante do app.
   - Com isso, mesmo que o Supabase emita uma sessão curta durante a validação de senha, `Layout` e `ProtectedRoute` não recebem acesso autenticado.

3. Finalizar login somente após código MFA correto
   - No callback `handleMFAVerified`, limpar o desafio pendente apenas depois de o código ser aceito e a autenticação final com senha ser refeita com sucesso.
   - Manter o comportamento de bypass legítimo somente quando `send-mfa-code` retornar explicitamente `skipped: true` por existir sessão MFA válida nas últimas 24h.

4. Fortalecer as Edge Functions de MFA
   - Validar melhor o corpo recebido em `send-mfa-code` e `verify-mfa-code`.
   - Garantir que `send-mfa-code` nunca retorne `skipped: true` se a sessão MFA estiver expirada.
   - Garantir que o reuso de código ativo retorne sucesso para direcionar o usuário à tela MFA, não para liberar acesso.

5. Validar o cenário reportado
   - Conferir logs das funções após a correção.
   - Testar o caminho esperado:

```text
Credenciais corretas
  -> envia/reaproveita código por e-mail
  -> derruba/oculta sessão provisória
  -> mostra tela MFA
  -> usuário informa código
  -> cria sessão MFA de 24h
  -> refaz login
  -> entra no dashboard
```

Também validarei o caminho dentro de 24h:

```text
Credenciais corretas
  -> backend confirma sessão MFA válida
  -> entra direto no dashboard
```

Arquivos previstos:
- `src/pages/Auth.tsx`
- `src/components/AuthProvider.tsx`
- `supabase/functions/send-mfa-code/index.ts`
- `supabase/functions/verify-mfa-code/index.ts`

Observação: identifiquei nos logs que o código está sendo enviado/reaproveitado, mas o app ainda está expondo uma sessão provisória ao frontend antes de completar o MFA. A correção principal é impedir que essa sessão provisória seja tratada como login válido.