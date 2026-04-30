## Objetivo

Refinar visualmente a lista de Maturidade GRC: paleta sóbria padronizada (sem verde/amarelo berrantes), tipografia mais leve e barras mais finas — alinhada com a identidade do sistema (Navy + Primary Purple).

## Mudanças

### 1. Paleta unificada (em `MultiDimensionalRadar.tsx`)

Trocar a escala atual (verde/roxo/amarelo/vermelho saturados) por **variações de opacidade do `primary`**, mantendo apenas o `destructive` atenuado para "Crítico":

| Faixa      | Cor da barra atual     | Nova cor (sóbria)        |
|------------|------------------------|--------------------------|
| ≥ 80%      | `bg-green-500`         | `bg-primary` (cheio)     |
| 60–79%     | `bg-primary`           | `bg-primary/70`          |
| 40–59%     | `bg-yellow-500`        | `bg-primary/40`          |
| < 40%      | `bg-destructive`       | `bg-destructive/70`      |
| Sem dados  | `bg-muted`             | `bg-muted-foreground/20` |

**Texto do %**: `text-foreground` para ≥60%, `text-muted-foreground` para 40-59%, `text-destructive` apenas para <40%. Acaba o contraste agressivo de cor por linha — fica monocromático com pequenos sinais.

### 2. Refinamento tipográfico e de espaçamento

- Barra de progresso: altura `h-1.5` → **`h-1`** (mais discreta, padrão "premium").
- Track das barras: `bg-muted` → **`bg-muted/60`** (menos contraste).
- % do score: `font-bold` → **`font-semibold`** + `tabular-nums` (números alinhados verticalmente).
- Nome do módulo: adicionar `tracking-tight` e usar `text-foreground/90` para suavizar.
- "Sem dados": remover o `italic`, usar `text-muted-foreground/70` mais leve.
- Padding da linha: `p-2` → **`px-2 py-2.5`** (respiro vertical).
- Hover: `hover:bg-muted/50` → **`hover:bg-muted/40`** + `rounded-md` (era `rounded-lg`).
- Ícone do módulo: `text-foreground/70` → **`text-muted-foreground`** (deixa o nome em destaque, não o ícone).
- Chevron: opacidade reduzida (`text-muted-foreground/40` no idle).

### 3. Sem mexer

- Estrutura/dados (continua usando `useRadarChartData` e `useGrcMaturityScore`).
- Tooltip de detalhes (já está bom).
- Lógica de classificação (>=80 / 60 / 40).

## Arquivo afetado

- `src/components/dashboard/MultiDimensionalRadar.tsx` (apenas as funções `getScoreColor`, `getScoreTextColor` e o JSX do `MaturityRow`).

## Resultado esperado

Lista monocromática roxa com gradação por opacidade, barras finas, números alinhados, hover discreto. Mantém legibilidade dos status (cheio = excelente, 70% opacidade = bom, 40% = atenção, vermelho atenuado = crítico) sem o "arco-íris" atual.

Aprova?