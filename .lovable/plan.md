# Eliminar telas brancas em transições e carregamentos

## Diagnóstico

Mapeei o sistema e encontrei 4 momentos onde o usuário pode ver tela branca (mesmo que por frações de segundo):

### 1. Rotas públicas têm fallback de Suspense vazio
Em `src/App.tsx`, todas as 14 rotas públicas (`/auth`, `/`, `/registro`, `/planos`, `/denuncia/...`, `/assessment/:token`, `/review/:token`, etc.) usam:
```tsx
<Suspense fallback={<div className="min-h-screen bg-background" />}>
```
Isso é literalmente uma div vazia enquanto o chunk JS é baixado — em conexões médias/lentas o usuário vê uma tela completamente em branco/escura por 200-1500ms.

### 2. Animação `page-enter` parte de `opacity: 0`
Em `tailwind.config.ts`, o keyframe começa com `opacity: 0`. Como o `PageTransition` usa `key={routeKey}`, a cada troca de rota o wrapper é remontado e fica invisível por ~110ms (metade da animação de 220ms). Em telas com bom skeleton isso passa, mas combinado com Suspense rápido cria um "flash escuro".

### 3. Sem `animation-fill-mode`
A animação `page-enter` não tem `both`, então em remount há um frame onde o estado inicial não é aplicado — pode causar flash de conteúdo já em opacity 1 antes de cair para 0.4 e voltar.

### 4. Public routes sem ErrorBoundary
Se o lazy import falhar (chunk 404 após deploy), a rota pública quebra silenciosamente. O Layout protege as rotas autenticadas, mas as públicas não têm rede de segurança.

## Mudanças

### A. Criar `src/components/ui/route-fallback.tsx`
Componente compartilhado para Suspense de rotas públicas: fundo `bg-background`, logo Akuris centralizada com leve animação de spin e texto "Carregando…". Usa as mesmas classes/tokens já existentes — sem dependências novas.

### B. Atualizar `src/App.tsx`
- Importar `RouteFallback`.
- Substituir todos os 14 `<div className="min-h-screen bg-background" />` por `<RouteFallback />`.
- Envolver o conjunto de rotas públicas dentro de um `ErrorBoundary` com fallback amigável (reaproveita o já existente em `src/components/ErrorBoundary.tsx`).

### C. Suavizar transição entre páginas (`tailwind.config.ts`)
- Mudar `page-enter` de `opacity: 0` para `opacity: 0.4` para evitar flash totalmente invisível entre rotas.
- Adicionar `both` ao `animation-fill-mode` (`'page-enter 0.22s cubic-bezier(0.22, 1, 0.36, 1) both'`) para garantir que o estado inicial seja aplicado já no primeiro frame após remount.

### D. `Layout.tsx` — manter `PageSkeleton` para `loading=true`
Já está correto, sem mudanças.

### E. Não mexer
- `ErrorBoundary` (já tem fallback rico).
- `PageSkeleton` e `ModuleLoadingSkeleton` (já bons).
- `ProtectedRoute` loading (spinner em h-64 dentro do Layout, não causa tela branca pois sidebar/header continuam visíveis).

## Arquivos afetados
- **Criar**: `src/components/ui/route-fallback.tsx`
- **Editar**: `src/App.tsx` (substituir fallbacks + envolver públicas em ErrorBoundary)
- **Editar**: `tailwind.config.ts` (suavizar `page-enter`)

## Não escopo
- Não alterar a lógica de auth, queries ou roteamento.
- Não introduzir novas dependências.
- Sem mudanças em rotas autenticadas (já protegidas pelo Layout + Suspense interno com `ModuleLoadingSkeleton`).
