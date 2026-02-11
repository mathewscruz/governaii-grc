
# Ajustes Visuais no Dashboard

## 1. Cards com mesma altura (Vencimentos, Maturidade GRC, Evolucao dos Riscos)

Adicionar `h-full` aos componentes `UpcomingExpirations`, `MultiDimensionalRadar` e `RiskScoreTimeline` para que os Cards ocupem 100% da altura da celula do grid, ficando todos alinhados independente do conteudo.

**Arquivo:** `src/components/dashboard/UpcomingExpirations.tsx`
- Adicionar `className="h-full"` no Card raiz (linha 104)

**Arquivo:** `src/components/dashboard/MultiDimensionalRadar.tsx`
- Verificar e adicionar `className="h-full"` no Card raiz

**Arquivo:** `src/components/dashboard/RiskScoreTimeline.tsx`
- Verificar e adicionar `className="h-full"` no Card raiz

## 2. Icone do chatbot sem fundo roxo

O botao FAB do AkurIA usa `bg-primary` (roxo), fazendo o icone parecer um circulo roxo solido. A correcao sera trocar o fundo para branco com borda sutil, deixando o favicon visivel com suas cores originais.

**Arquivo:** `src/components/dashboard/AkurIAChatbot.tsx`
- Linha 163: trocar `bg-primary` por `bg-white shadow-lg border border-border` no botao FAB
- Remover `border-2 border-primary-foreground/20`
- Resultado: botao branco com sombra, exibindo o favicon com cores originais

## Detalhes Tecnicos

### Alteracoes por arquivo

**`src/components/dashboard/UpcomingExpirations.tsx`** (linha 104):
- `<Card>` passa a `<Card className="h-full flex flex-col">` e o CardContent ganha `flex-1` para ocupar espaco restante

**`src/components/dashboard/MultiDimensionalRadar.tsx`**:
- Mesmo padrao: Card com `h-full flex flex-col`, CardContent com `flex-1`

**`src/components/dashboard/RiskScoreTimeline.tsx`**:
- Mesmo padrao: Card com `h-full flex flex-col`, CardContent com `flex-1`

**`src/components/dashboard/AkurIAChatbot.tsx`** (linha 162-163):
- Classe do botao FAB: `bg-white dark:bg-card shadow-lg border border-border hover:shadow-xl`
