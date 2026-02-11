

# Correcao de Overflow dos Cards no Dashboard

## Problema
Em monitores menores, os conteudos dos cards do dashboard (Maturidade GRC, Evolucao dos Riscos, Atividades Recentes) ultrapassam os limites dos cards ao inves de se ajustarem ao espaco disponivel. Isso ocorre porque os containers dos graficos e textos nao possuem restricoes de overflow adequadas.

## Causa Raiz
Os cards dentro do grid CSS nao possuem `min-w-0` (necessario para impedir que flex/grid children expandam alem do container) e alguns containers internos nao tem `overflow-hidden`.

## Correcoes

### 1. Dashboard.tsx (grid principal)
- Adicionar `min-w-0` em cada celula do grid para que os cards respeitem os limites da coluna

### 2. MultiDimensionalRadar.tsx
- Adicionar `overflow-hidden` e `min-w-0` no Card raiz
- Garantir que o container do `ResponsiveContainer` tenha `overflow-hidden`

### 3. RiskScoreTimeline.tsx
- Adicionar `overflow-hidden` e `min-w-0` no Card raiz
- Tornar o header com titulo e tabs mais responsivo com `flex-wrap` e `gap` adequado
- Adicionar `overflow-hidden` no container do grafico

### 4. RecentActivities.tsx
- Adicionar `min-w-0` no Card raiz

## Detalhes Tecnicos

Arquivos a editar:
- `src/pages/Dashboard.tsx` -- adicionar `min-w-0` nos wrappers das celulas do grid (linha 118)
- `src/components/dashboard/MultiDimensionalRadar.tsx` -- adicionar `overflow-hidden min-w-0` no Card (linha 121)
- `src/components/dashboard/RiskScoreTimeline.tsx` -- adicionar `overflow-hidden min-w-0` no Card (linha 125) e `overflow-hidden` no container do chart
- `src/components/dashboard/RecentActivities.tsx` -- adicionar `min-w-0` no Card (linha 238)

