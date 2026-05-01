## Objetivo
Quando o usuário clica em "Entrar" e o login é bem-sucedido, exibir imediatamente o loader oficial da Akuris (AkurisPulse em tela cheia) cobrindo a tela de login, em vez de deixar apenas o spinner dentro do botão até que o `AuthProvider` re-hidrate a sessão e a navegação para `/dashboard` aconteça.

## Onde está o problema
Em `src/pages/Auth.tsx`, o handler `handleSignIn` já marca `setLoginSuccess(true)` após autenticar (com e sem MFA), mas esse estado nunca é usado na renderização. O usuário continua vendo o formulário com o botão em loading até o `Navigate to="/dashboard"` disparar — o que dá a sensação de "travado no botão".

O sistema já tem o componente oficial `LoadingOverlay` (em `src/components/ui/LoadingOverlay.tsx`) que renderiza o `AkurisPulse` em tela cheia sobre `#06060e` — exatamente o padrão usado em Suspense, transições de rota e PageSkeleton. Vamos reutilizá-lo.

## Mudança proposta (escopo cirúrgico)

Arquivo: `src/pages/Auth.tsx`

1. Importar `LoadingOverlay` de `@/components/ui/LoadingOverlay`.
2. Logo após o early-return de `loading` (e antes do form), adicionar:
   - Se `loginSuccess === true` → renderizar `<LoadingOverlay />` e nada mais.
   Isso cobre tanto o caminho sem MFA quanto o pós-MFA verificado, pois ambos setam `setLoginSuccess(true)` antes do `AuthProvider` propagar o `user` que dispara o `Navigate`.
3. Garantir que, no fluxo principal sem MFA, `setLoginSuccess(true)` seja chamado imediatamente após `signInWithPassword` retornar sem erro — antes do `try/catch` do `send-mfa-code` quando aplicável (já é o caso nos branches de sucesso; manter como está). A única ajuste extra: no branch de MFA pendente (`setMfaPending(true)`), NÃO mostrar o overlay (continua a tela de MFA).
4. Manter o `setIsLoading(false)` no `finally` — o overlay tomará a tela antes do botão "voltar ao normal" ser percebido.

Resultado: no instante em que o login é validado, a tela de login é substituída por uma tela cheia com o AkurisPulse pulsando, e em seguida o `Navigate` leva ao `/dashboard` (que também usa o mesmo loader durante o Suspense do módulo). A transição fica contínua e com a identidade da marca.

## Detalhes técnicos

```tsx
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';

// ... dentro do componente, logo após o bloco `if (loading) { ... }`:
if (loginSuccess) {
  return <LoadingOverlay />;
}
```

Nenhuma outra mudança é necessária. Sem alterações em `AuthProvider`, rotas, ou no MFA dialog.

## Fora de escopo
- Não mexer no fluxo de MFA (continua exibindo `MFAVerification`).
- Não mexer em validação, "lembrar-me", recuperação de senha, ou layout do form.
- Não tocar em `Layout.tsx` / Suspense fallback (já usam AkurisPulse).