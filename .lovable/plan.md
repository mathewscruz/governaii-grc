

# Plano: Refinamento UX/UI do Framework Detail (Gap Analysis)

## Diagnóstico Visual (baseado nos screenshots e código)

### 1. Excesso de conteúdo antes da tabela de requisitos
A aba "Avaliação Manual" empilha **7 blocos** antes da tabela: Score Dashboard (2 cards) → Banner motivacional → Recomendações IA → 2 gráficos → CategoryStatusCards. O usuário precisa rolar muito para chegar ao trabalho real (a tabela). Consultorias Big4 priorizam a tabela com um resumo compacto no topo.

### 2. Visualizações redundantes
`PrivacyTreemap`, `CategoryBarChart` e `CategoryStatusCards` mostram essencialmente os mesmos dados (conformidade por categoria) de 3 formas diferentes. Polui a tela sem agregar informação nova.

### 3. Score card sem impacto visual
O score geral é apenas um número + badge + barra de progresso. Falta um elemento visual forte (gauge/donut) que transmita gravidade e progresso de forma imediata.

### 4. Banner motivacional é ruído
O card "Você já avaliou X de Y requisitos!" ocupa espaço entre o dashboard e os gráficos sem valor funcional real.

### 5. Área de filtros da tabela pesada
Search + Select de status + Switch de obrigatórios + Legenda de cores + Tabs de categorias com mini-progress bars. São 5 camadas de controles antes das rows.

### 6. Dialog de detalhe muito longo
O `NISTRequirementDetailDialog` empilha: Assistente IA + Plano de Ação + Responsável + Notas + Observações + Prazo + Riscos + Evidências + Audit Trail em um único scroll vertical.

## Mudanças Propostas

### A. Consolidar dashboard em layout compacto (score + gráfico lado a lado)
- Manter o layout atual de 2 colunas (Score + Evolução) mas adicionar um **donut/gauge mini** dentro do card de score ao lado do número
- Remover o banner motivacional — a JourneyProgressBar já cumpre esse papel
- Mover badge de maturidade para dentro do PageHeader (ao lado do título) para economizar espaço vertical

### B. Unificar visualizações de categoria
- **Remover** `PrivacyTreemap` (mapa de conformidade por capítulo) — dados duplicados
- **Manter** `CategoryBarChart` (aderência por categoria) — mais limpo e legível
- **Manter** `CategoryStatusCards` — funcionam como filtro interativo para a tabela
- Resultado: de 3 blocos visuais → 2, com propósitos distintos (gráfico resumo + filtro interativo)

### C. Compactar filtros da tabela
- Unificar Search + Status filter em uma **única linha** (já está, mas remover espaço extra)
- Mover a **legenda de status** para um **Popover/Tooltip** acionado por ícone `HelpCircle`, em vez de bloco fixo
- Reduzir padding das CategoryTabs para ficarem mais compactas

### D. Reorganizar Dialog de detalhe com seções colapsáveis
- Agrupar em **Accordion/Collapsible**: 
  - Seção 1: Status + Responsável + Prazo (sempre visível)
  - Seção 2: Plano de Ação (colapsável, aberto se não conforme)
  - Seção 3: Evidências (colapsável)
  - Seção 4: Riscos Vinculados (colapsável)
  - Seção 5: Assistente IA (colapsável)
  - Seção 6: Histórico de Alterações (colapsável)
- Isso reduz a altura percebida do dialog e permite foco na tarefa principal

### E. Melhorar visual do Score com mini donut
- Adicionar um **ring/donut SVG simples** (não Recharts, apenas SVG inline) no card de Score Geral para dar impacto visual imediato
- Usar cores consistentes com o sistema de maturidade (verde/amarelo/vermelho)

## Arquivos Afetados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/GapAnalysisFrameworkDetail.tsx` | Remover PrivacyTreemap, remover banner motivacional, mover maturidade pro header |
| `src/components/gap-analysis/GenericScoreDashboard.tsx` | Adicionar mini donut SVG ao card de score |
| `src/components/gap-analysis/GenericRequirementsTable.tsx` | Legenda em Popover, compactar filtros |
| `src/components/gap-analysis/nist/NISTRequirementDetailDialog.tsx` | Seções colapsáveis com Collapsible |

## Impacto Esperado

- ~40% menos scroll vertical na aba de avaliação
- Dialog de detalhe mais organizado e menos intimidador
- Score com impacto visual imediato (donut)
- Interface mais limpa sem perder funcionalidade

