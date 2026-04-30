# Ajuste do gráfico e padronização dos cards do dashboard

## Problemas identificados

**1. Gráfico "Evolução dos Riscos" cortado nas bordas**
- O `ResponsiveContainer` está dentro de um `div` com `overflow-hidden`, e a margem esquerda do `ComposedChart` está em `-16` — isso empurra o eixo Y para fora e corta os labels (`0`, `1`, `2`...) e a primeira coluna (`Sem 1`).
- A linha vermelha de "Críticos" também está colada à borda inferior porque não há `domain` definido no `YAxis`, e a margem inferior é `0`.

**2. Cards do dashboard inconsistentes**
Os 3 cards da grid (`UpcomingExpirations`, `MultiDimensionalRadar`, `RiskScoreTimeline`) têm estilos diferentes:

| Item | Vencimentos | Maturidade | Evolução Riscos |
|---|---|---|---|
| Tamanho do título | `text-base` | `text-sm` | `text-base` |
| Padding header | default (`p-6`) | `pb-3` | `pb-3` |
| CornerAccent (identidade) | não | não | sim |
| Ícone no título | sim (Calendar) | não | não |
| Altura mínima | `h-full` | `h-full` | `h-full` (mas conteúdo varia) |

## Mudanças

### 1. `RiskScoreTimeline.tsx` — corrigir corte do gráfico
- Remover `overflow-hidden` do wrapper do chart e ajustar margens: `{ top: 8, right: 12, bottom: 4, left: 4 }`.
- Aumentar `width` do `YAxis` de `28` para `32` para acomodar os números sem corte.
- Adicionar `domain={[0, 'auto']}` no `YAxis` e `padding={{ top: 8, bottom: 8 }}` para a linha de Críticos não ficar colada na base.
- Reduzir altura do chart container ligeiramente para caber melhor (`h-56 sm:h-64`).

### 2. Padronização dos 3 cards (`UpcomingExpirations`, `MultiDimensionalRadar`, `RiskScoreTimeline`)
Aplicar o mesmo "shell" visual, usando o RiskScoreTimeline como referência (já tem `CornerAccent` da identidade Onda 2):

- **Estrutura uniforme**: `Card` com `relative h-full w-full flex flex-col overflow-hidden min-w-0` + `<CornerAccent />` no topo.
- **Header padronizado**: `CardHeader className="pb-3"` com `CardTitle className="text-base font-semibold"` e ícone proprietário/lucide na cor `text-muted-foreground` à esquerda do título.
- **Subtítulo opcional** com micro-stats em `text-xs text-muted-foreground` (já existe nos 3, só padronizar tamanho).
- **CardContent**: `flex-1 pt-0` para que o conteúdo ocupe o espaço restante e os 3 cards alinhem a base.

### 3. Pequenos ajustes de consistência
- Título do `MultiDimensionalRadar` passa de `text-sm` para `text-base font-semibold` e ganha ícone (`BarChart3` ou ícone proprietário de Maturidade).
- Título do `UpcomingExpirations` mantém o ícone `Calendar`, mas com cor `text-muted-foreground` (não warning) para uniformizar — a cor de status fica nos badges dos itens.
- Adicionar `<CornerAccent />` em `UpcomingExpirations` e `MultiDimensionalRadar` para reforçar a identidade visual em todo o trio.

## Arquivos afetados
- `src/components/dashboard/RiskScoreTimeline.tsx` — corrigir corte do gráfico.
- `src/components/dashboard/UpcomingExpirations.tsx` — adicionar CornerAccent, padronizar header.
- `src/components/dashboard/MultiDimensionalRadar.tsx` — adicionar CornerAccent, ajustar tamanho do título e ícone.

## Não escopo
- Lógica de dados, queries Supabase e i18n permanecem inalterados.
- A grid do `Dashboard.tsx` (`grid-cols-1 md:grid-cols-2 xl:grid-cols-3`) já está correta e não muda.
