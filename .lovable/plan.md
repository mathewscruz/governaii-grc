

# Plano: Melhorias Visuais na Tela de Gap Analysis Frameworks

Analisando o screenshot e o código atual, identifiquei melhorias que trariam mais clareza, hierarquia visual e experiência profissional sem alterar a funcionalidade.

## Melhorias Propostas

### 1. StatCards — Adicionar cor semântica e contexto visual

Os 3 StatCards no topo estão todos com a mesma aparência "neutra". Proposta:
- **Conformidade Geral**: variante `success` se >= 70%, `warning` se >= 40%, `destructive` se < 40%
- **Requisitos Críticos**: variante `destructive` (sempre, pois são não conformes)
- **Total Avaliados**: variante `info`

Isso dá feedback visual imediato ao usuário sobre o estado geral.

### 2. Frameworks Ativos — Card mais expressivo

O card ativo atual é funcional mas poderia ter:
- **Barra de progresso colorida** segmentada (conforme/parcial/não conforme) em vez da Progress bar simples azul
- **Ícone de seta** com hover mais visível para indicar clicabilidade
- Grid 1-2 colunas (ao invés de 3) para dar mais espaço ao card ativo — pois geralmente haverá poucos frameworks ativos

### 3. Catálogo de Frameworks — Melhorar hierarquia do Collapsible

O trigger do Collapsible se confunde com o conteúdo. Proposta:
- Adicionar **borda sutil** ao redor da seção colapsável para agrupar visualmente
- Expandir **todas as categorias** por padrão (em vez de só "seguranca") — o usuário precisa ver o catálogo completo
- Melhorar separação entre seções com `border-b` sutil

### 4. Seção "Frameworks Disponíveis" — Ícone de busca rápida

Adicionar um **campo de busca/filtro** simples acima do catálogo para encontrar frameworks rapidamente quando há 20+ opções. Input com `placeholder="Buscar framework..."` que filtra pelo nome.

### 5. Framework Card (variant: available) — Micro-ajustes

- Aumentar levemente o **padding** para respiração
- Adicionar `hover:border-primary/30` para feedback visual ao hover (consistente com o design system)

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/GapAnalysisFrameworks.tsx` | StatCards com variantes semânticas, grid de ativos 1-2 cols, busca no catálogo |
| `src/components/gap-analysis/FrameworkCard.tsx` | Barra segmentada no card ativo, ajuste de padding no available |
| `src/components/gap-analysis/FrameworkCatalog.tsx` | Todas categorias abertas por padrão, borda sutil, receber filtro de busca |

## Complexidade

Baixa — são ajustes de CSS, props e layout. Nenhuma mudança de lógica ou banco de dados.

