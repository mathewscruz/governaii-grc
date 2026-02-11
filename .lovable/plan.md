
# Ajuste de Responsividade Global + Padronizacao Visual do Card Maturidade GRC

## Problemas Identificados

### 1. Card "Maturidade GRC" fora do padrao visual
O card de Maturidade GRC tem visual diferente do card "Evolucao de Riscos por Criticidade" ao lado:
- O grafico radar esta centralizado ocupando muito espaco vertical
- Nao tem o mesmo estilo de header (o card de Riscos tem tabs no header, badge de status, metricas de resumo no rodape)
- A legenda de cores (Excelente/Bom/Atencao/Critico) ocupa espaco desnecessario embaixo

**Solucao:** Alinhar visualmente o card de Maturidade com o padrao do card de Riscos -- compactar o radar, remover a legenda extensa (mover para tooltip), e adicionar um rodape com scores resumidos por categoria (similar ao rodape de Criticos/Altos/Medios/Baixos do card de Riscos).

### 2. Responsividade dos elementos comprimidos
Em telas intermediarias (1024px, tablets) e mobile (390px), os elementos estao sendo espremidos em vez de reorganizarem o layout:

**Problemas especificos:**
- **Hero Banner:** Em telas medias, os 3 metric cards ficam apertados
- **KPI Pills:** Em mobile, os pills perdem labels e badges, ficando incompreensiveis (so mostram icone + numero)
- **Grid de 3 colunas:** Em telas de 1024px, o grid `xl:grid-cols-3` colapsa para 1 coluna de uma vez, sem estagio intermediario
- **Header:** Em mobile, os botoes do header (busca, idioma, changelog, notificacoes, perfil) ficam comprimidos
- **Cards de Riscos/Maturidade:** Em telas medias, os graficos sao comprimidos horizontalmente

**Solucao:** Ajustes progressivos de breakpoints:

## Mudancas Propostas

### Arquivo: `src/components/dashboard/MultiDimensionalRadar.tsx`
- Reduzir altura do `ResponsiveContainer` de 280px para 250px
- Remover a legenda de 4 colunas debaixo do grafico (Excelente/Bom/Atencao/Critico)
- Adicionar rodape com grid de scores resumidos (top 4 dimensoes com valores) no mesmo estilo do card de Riscos (grid de 4 colunas com valor + label, separado por border-top)
- Reduzir fontSize dos labels do PolarAngleAxis para 10px
- Remover a `Legend` do recharts (redundante com os dots)

### Arquivo: `src/pages/Dashboard.tsx`
- Linha de Resumo + Vencimentos: trocar `xl:grid-cols-3` para `lg:grid-cols-3` para usar melhor telas de 1024px
- Linha de Maturidade + Riscos + Atividades: adicionar breakpoint intermediario `lg:grid-cols-2` antes de `xl:grid-cols-3` -- em telas medias, Maturidade e Riscos ficam lado a lado (2 cols) com Atividades embaixo
- Ajustar o container principal para `overflow-x-hidden` e garantir `min-w-0` nos grids

### Arquivo: `src/components/dashboard/HeroScoreBanner.tsx`
- Em telas `md` (768-1024px), mudar layout dos metrics para `flex-wrap` com items menores
- Em mobile, empilhar gauge em cima e metrics embaixo em grid 1x3
- Reduzir padding de `p-6 lg:p-8` para `p-4 md:p-6 lg:p-8`

### Arquivo: `src/components/dashboard/KPIPills.tsx`
- Mostrar labels em todas as telas (remover `hidden sm:inline` do label)
- Usar `text-[11px]` no label para caber em mobile
- Adicionar `overflow-x-auto` no container para scroll horizontal em mobile em vez de comprimir
- Adicionar `flex-nowrap` e `min-w-fit` nos pills para evitar quebra

### Arquivo: `src/components/dashboard/RiskScoreTimeline.tsx`
- Em mobile, reduzir altura do chart de `h-72` para `h-52`
- No header, empilhar titulo e tabs verticalmente em mobile em vez de lado a lado
- Rodape: mudar `grid-cols-4` para `grid-cols-2 sm:grid-cols-4` em mobile

### Arquivo: `src/components/dashboard/RecentActivities.tsx`
- Ajustar `max-h-[500px]` para `max-h-[400px]` para consistencia de altura com os cards ao lado

### Arquivo: `src/components/Layout.tsx`
- No header, em mobile esconder breadcrumbs longos (manter so o ultimo item)
- Reduzir gap entre botoes do header em mobile

## Detalhes Tecnicos

### Card Maturidade - Rodape com scores
Adicionar um rodape identico ao do card de Riscos:
```
<div className="mt-4 grid grid-cols-4 gap-4 text-center border-t pt-4">
  <!-- Top 4 dimensoes com score e label -->
</div>
```
Os valores serao extraidos dos dados do radar chart (ex: Riscos 85%, Controles 72%, Ativos 90%, Incidentes 45%).

### Breakpoints progressivos do grid
```
Atual:    grid-cols-1 xl:grid-cols-3
Proposto: grid-cols-1 md:grid-cols-2 xl:grid-cols-3
```
Isso cria um estagio intermediario em tablets e laptops pequenos.

### KPI Pills scroll horizontal
```
Atual:    flex flex-wrap gap-2
Proposto: flex gap-2 overflow-x-auto pb-1 scrollbar-thin
```
Em mobile, os pills fazem scroll horizontal em vez de comprimir.

## Arquivos modificados
| Arquivo | Mudanca |
|---------|---------|
| `src/components/dashboard/MultiDimensionalRadar.tsx` | Padronizar visual com card de Riscos, compactar, adicionar rodape |
| `src/pages/Dashboard.tsx` | Breakpoints intermediarios nos grids |
| `src/components/dashboard/HeroScoreBanner.tsx` | Responsividade mobile/tablet |
| `src/components/dashboard/KPIPills.tsx` | Scroll horizontal mobile, labels visiveis |
| `src/components/dashboard/RiskScoreTimeline.tsx` | Responsividade header e chart |
| `src/components/dashboard/RecentActivities.tsx` | Ajuste de altura maxima |
