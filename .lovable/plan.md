## Diagnóstico

Olhando o dashboard atual do framework e comparando com as referências (Oneleet, Drata-like) que você mandou, concordo: **está poluído**. Hoje a aba "Avaliação" empilha **5 blocos pesados** antes da tabela de requisitos:

1. `JourneyProgressBar` (banner contextual com ícone IA)
2. `GenericScoreDashboard` — donut + pílula de Maturidade + 4 pílulas de domínios + barra de progresso
3. `ScoreEvolutionChart` — card grande de evolução
4. `CategoryBarChart` — "Aderência por Categoria" em barras
5. `CategoryStatusCards` — "Visão por Categoria" em cards (mesmos dados, formato diferente)

Existe **redundância clara**: itens 4 e 5 mostram aderência por categoria com visuais diferentes; itens 1 e 2 ambos comunicam progresso e próximo passo. Além disso há **ícones genéricos de IA** espalhados (`Sparkles`, `Brain`) no header e no banner, que destoam da identidade Akuris definida (ícones proprietários, stroke 1.5).

A **tela inicial** (escolher framework) tem um Hero longo com 3 cards "Como funciona" + 3 sugestões + radar comparativo + cards ativos + cards disponíveis. As referências mostram um caminho mais limpo: **um card-resumo focado por framework + lista enxuta**.

---

## Plano de redesenho

Mantenho 100% das cores, tipografia (DM Sans), tokens semânticos e ícones proprietários Akuris. Nada de mexer no design system — só na densidade, hierarquia e nos ícones genéricos de IA.

### Parte 1 — Dashboard do framework (`GapAnalysisFrameworkDetail`)

**Nova hierarquia** (do topo para baixo, dentro da aba "Avaliação"):

```text
┌─────────────────────────────────────────────────────────────┐
│ HeroSummary  (1 card único, à la referência Oneleet/Drata)  │
│ ┌────────────┐  ┌──────────────────────────────────────────┐│
│ │  Donut 96  │  │  Sparkline de evolução (últimos 6 m)     ││
│ │  47%       │  │  + período: Dia · Semana · Mês · Ano     ││
│ │  Nível 1   │  │  + delta vs mês anterior (▲ +9%)         ││
│ │  17/131    │  └──────────────────────────────────────────┘│
│ └────────────┘                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Aderência por Categoria  (1 bloco único, lista de barras)   │
│ Contexto      ▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱  0%   0/4 req.        │
│ Liderança     ▰▰▰▰▰▰▰▰▱▱▱▱▱▱▱▱▱▱▱▱▱▱  37%  3/8 req.        │
│ Apoio         ▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰  100% 12/12 req.      │
│ ...           [linha clicável → filtra a tabela abaixo]      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Tabela de requisitos (já existente, sem mudanças)            │
└─────────────────────────────────────────────────────────────┘
```

**O que muda em concreto:**

1. **Novo componente `FrameworkHeroSummary`** que substitui:
   - `JourneyProgressBar` (mensagem fica como uma linha discreta dentro do hero, não banner colorido)
   - O card "Score Geral de Conformidade" do `GenericScoreDashboard`
   - O card `ScoreEvolutionChart` (o gráfico vira sparkline ao lado do donut, no mesmo card)
   - O bloco "Domínios do Anexo A" (vira chips menores na parte inferior do hero, só quando o framework tem domínios)

2. **Remover `CategoryStatusCards`** — a "Visão por Categoria" em cards é redundante com o `CategoryBarChart`, que é mais escaneável (igual à referência). Mantemos só o gráfico de barras, e tornamos cada linha **clicável** para filtrar a tabela.

3. **Remover ícones genéricos de IA do header**:
   - `Brain` do botão "Gerador de Documentos (IA)" → `AkurisAIIcon`
   - `Sparkles` do `AIRecommendationsButton` → `AkurisAIIcon`
   - `PlayCircle`/`Award` do `JourneyProgressBar` (eliminado, ver item 1)
   - `Sparkles`/`Brain`/`BarChart3`/`Search` do `WelcomeHero` → mix de ícones próprios + Lucide neutros (ver Parte 2)

4. **Header da página**: agrupar as 4 ações (Consultor IA, Gerador de Documentos, Tour, Exportar) em **2 ações primárias** (Consultor IA + Exportar) e **mover Tour e Gerador de Documentos para um menu "Mais ações"** (ícone `MoreHorizontal`). Reduz peso visual e segue o padrão das referências.

### Parte 2 — Tela inicial do Gap Analysis (`GapAnalysisFrameworks`)

Hoje, quando o usuário **já tem frameworks ativos**, vemos: 3 StatCards + Radar + barra de busca + grid de ativos + colapsável de disponíveis. As referências sugerem um caminho mais limpo:

1. **Manter os 3 StatCards** (Conformidade Geral, Críticos, Avaliados) — já bem desenhados.
2. **Remover o Radar** quando há ≤3 frameworks ativos (pouco insight, muito espaço). Manter só quando há 3+ ativos, e movê-lo para uma aba "Comparativo" colapsável discreta — não no fluxo principal.
3. **Redesenhar `FrameworkCard` (variante `active`)** seguindo a referência Drata-like:
   - Donut pequeno (40px) à esquerda em vez de só número
   - Barra segmentada mais fina (já existe)
   - Pílulas de status mais sóbrias (sem fundo colorido, só pontinho + número)
   - Mini-sparkline de evolução à direita (4 últimos pontos), opcional se houver histórico

4. **`WelcomeHero`** (quando ainda não há frameworks): hoje tem 3 passos "Como funciona" que são genéricos. Reduzir para **uma linha curta** e dar mais destaque aos 3 cards de frameworks recomendados (que é a ação real). Trocar `Sparkles` do header por `AkurisAIIcon` apenas onde realmente representa IA; nos passos "Como funciona", usar ícones neutros do catálogo Akuris (não inventar significado de IA onde não há).

### Parte 3 — Limpeza de ícones de IA (transversal)

Inventário e substituições no escopo de Gap Analysis:

| Local | Hoje | Vira |
|---|---|---|
| Header → "Gerador de Documentos (IA)" | `Brain` | `AkurisAIIcon` |
| Header → Botão Consultor IA (redondo) | `Sparkles` | `AkurisAIIcon` |
| Diálogo Consultor IA → título | `Sparkles` | `AkurisAIIcon` |
| Diálogo Consultor IA → "Atualizar Análise" | `Sparkles` | `AkurisAIIcon` |
| `WelcomeHero` → badge "Novo" | `Sparkles` | (remover, manter só "Novo") |
| `WelcomeHero` → passo "Avalie com IA" | `Brain` | `AkurisAIIcon` |
| `JourneyProgressBar` | (removido) | — |

### Arquivos que vou alterar

**Criar**
- `src/components/gap-analysis/FrameworkHeroSummary.tsx` — novo card consolidado (donut + sparkline + delta + chips de domínio)

**Editar**
- `src/pages/GapAnalysisFrameworkDetail.tsx` — substituir `JourneyProgressBar` + `GenericScoreDashboard` + `CategoryStatusCards` pelo novo `FrameworkHeroSummary`; trocar ícones IA do header; agrupar ações secundárias em menu
- `src/components/gap-analysis/CategoryBarChart.tsx` — tornar linhas clicáveis (props `onCategoryClick`, `activeCategory`) para substituir o filtro do `CategoryStatusCards`
- `src/components/gap-analysis/AIRecommendationsCard.tsx` — substituir `Sparkles` por `AkurisAIIcon`
- `src/components/gap-analysis/WelcomeHero.tsx` — enxugar passos "Como funciona" e trocar `Sparkles`/`Brain` por `AkurisAIIcon` apenas onde representa IA; ícones neutros nos demais
- `src/components/gap-analysis/FrameworkCard.tsx` — refinar variante `active` com donut pequeno e visual mais sóbrio
- `src/pages/GapAnalysisFrameworks.tsx` — manter `FrameworkComparisonRadar` apenas quando há 3+ ativos e colocá-lo dentro de um `Collapsible` discreto

**Não tocar**
- `GenericScoreDashboard.tsx` continua existindo (pode ser usado por outras telas)
- `JourneyProgressBar.tsx` continua existindo, só é removido do detalhe
- Todos os tokens, cores, fontes, RLS e queries permanecem iguais

### Resultado esperado

- **Dashboard do framework**: de 5 blocos visuais → 3 (hero + categorias + tabela). Menos scroll, mesma informação, sem perder nada.
- **Tela inicial**: cards ativos mais informativos (donut + sparkline), Hero mais direto, comparativo só quando faz sentido (3+ frameworks).
- **Identidade Akuris reforçada**: zero `Sparkles`/`Brain` genéricos onde representa IA do produto; todos viram `AkurisAIIcon` proprietário com stroke 1.5.