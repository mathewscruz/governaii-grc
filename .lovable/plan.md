

# Ajuste do Loading do Akuris

## Problemas identificados

1. **Faixa roxa no meio da tela**: O `PageSkeleton` sem `fullScreen` renderiza `min-h-[40vh] rounded-2xl` — uma faixa, não tela cheia
2. **Animação feia**: Anel giratório + logotipo completo sobrepostos
3. **Loading em toda transição**: O `<Suspense>` no `App.tsx` mostra o loader em **cada mudança de rota**, mesmo para páginas leves

## O que será feito

### 1. `src/components/ui/page-skeleton.tsx`
- Fundo roxo (`bg-primary`) **sempre tela cheia** (remover variante de faixa)
- Trocar o logotipo completo (`akuris-logo.png`) pelo **símbolo/favicon** (`/akuris-favicon.png`) — a seta do Akuris
- Animação: apenas o símbolo girando suavemente (`animate-spin` com duração customizada mais lenta)
- Remover o anel giratório separado

### 2. `src/App.tsx` — Remover loading nas transições de rota
- Trocar o `<Suspense fallback={<PageSkeleton />}>` por um fallback **vazio/transparente** (`null` ou `div` mínimo)
- Assim, transições entre páginas são instantâneas (o React.lazy carrega rápido após o primeiro load)
- O loading com símbolo giratório aparece **apenas** no carregamento inicial do auth (`Layout.tsx` linha 57)

### 3. `src/components/Layout.tsx`
- Manter `<PageSkeleton fullScreen />` para o loading de autenticação (que é genuinamente pesado)

## Resultado
- Tela toda roxa com símbolo do Akuris girando — apenas quando necessário (auth loading)
- Transições entre páginas sem loading visual desnecessário

