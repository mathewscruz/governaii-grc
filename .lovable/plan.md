## Problema

Ao clicar em "Sair", o usuário vê:
1. Tela do dashboard
2. **Tela branca** (1-2s)
3. Loader AkurisPulse
4. Tela de login

### Causa raiz

Em `src/components/AppSidebar.tsx` (linha 252), após `signOut()` é executado:

```ts
window.location.replace('/auth');
```

Esse `location.replace` força um **hard reload** do navegador: descarrega o bundle React atual (causando o flash branco), faz novo download do `index.html` + JS, remonta toda a aplicação, e só então a rota `/auth` renderiza com seu próprio loader. Esse intervalo entre o unload e o primeiro paint do novo bundle é o que aparece como tela branca.

## Solução

Substituir o hard reload por uma transição **dentro da SPA**, mantendo um overlay `AkurisPulse` cobrindo a tela durante todo o fluxo de logout — desde o clique de confirmação até o login estar pronto a ser exibido.

### 1. `src/components/AppSidebar.tsx` — `confirmSignOut`

- Antes de chamar `signOut()`, exibir imediatamente um overlay fullscreen com `<AkurisPulse />` (mesmo componente já usado no login). Isso elimina o frame em que o usuário ainda vê o dashboard "vazio" enquanto a sessão é encerrada.
- Trocar `window.location.replace('/auth')` por `navigate('/auth', { replace: true })` (React Router) — navegação client-side, sem unload/reload do bundle.
- Manter o overlay ativo até a navegação concluir (curto delay de ~50ms via `requestAnimationFrame` para garantir que o React aplicou o estado antes de navegar).
- Manter o fallback de `supabase.auth.signOut({ scope: 'local' })` para tokens expirados.

Estado novo no componente:
- `isLoggingOut: boolean` — controla a renderização do overlay.

Renderização (no topo do JSX retornado pelo `AppSidebar`, fora do `<Sidebar>`):
```tsx
{isLoggingOut && (
  <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center">
    <AkurisPulse size="lg" />
  </div>
)}
```

### 2. Garantir que o `ProtectedRoute` não pisque

`src/components/ProtectedRoute.tsx` já redireciona para `/auth` quando `user` vira `null`. Como o overlay do AppSidebar fica por cima (`z-[9999]`) durante a transição, qualquer redirecionamento intermediário do ProtectedRoute fica oculto — sem flash.

Se o `ProtectedRoute` exibir um loader próprio (Loader2/Skeleton) entre estados, conferir e padronizar para `<AkurisPulse />` cobrindo a tela inteira com `bg-background`, conforme a regra de loading do projeto.

### 3. Tela `/auth`

`src/pages/Auth.tsx` já renderiza imediatamente o formulário de login com fundo `bg-background`/gradiente Navy, sem loader inicial. Como a navegação será SPA (sem reload), a transição do overlay para o login será instantânea — sem branco intermediário.

## Resultado esperado

Fluxo do logout passa a ser:
1. Usuário confirma "Sair"
2. Overlay AkurisPulse cobre a tela (instantâneo)
3. `signOut()` executa em background
4. `navigate('/auth')` renderiza a tela de login por baixo do overlay
5. Overlay some → tela de login já pronta

Sem tela branca, sem reload do bundle, sem duplo loader.

## Arquivos alterados

- `src/components/AppSidebar.tsx` — refatorar `confirmSignOut`, adicionar estado `isLoggingOut` e overlay AkurisPulse, trocar `location.replace` por `navigate`.
- (Verificação) `src/components/ProtectedRoute.tsx` — confirmar que loaders intermediários usam `<AkurisPulse />` com `bg-background` fullscreen.
