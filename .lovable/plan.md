## Diagnóstico — estrutura atual

A boa notícia: a arquitetura já é **fortemente unificada**. Todos os frameworks (NIST, ISO 27001, PCI, SOC 2, LGPD, GDPR, HIPAA, CIS, COBIT, SOX, NIS2, ISO 27701/9001/14001/37301/20000/31000, ITIL, CCPA, COSO ERM/IC) compartilham:

- **Página única**: `GapAnalysisFrameworkDetail.tsx` com as mesmas abas (Avaliação, Análise de Documentos, Remediação, SoA*, Histórico).
- **Hero**: `FrameworkHeroSummary` (donut + sparkline + chips de domínio/seção + linha contextual).
- **Gráfico de categorias**: `CategoryBarChart` (barras horizontais clicáveis).
- **Tabela de requisitos**: `GenericRequirementsTable` (com tabs por seção quando `config.sections` existir, senão tabs por categoria).
- **Dialog de detalhe**: `RequirementDetailDialog` (mesmo layout, IA, evidências, plano de ação).
- **Aderência por documento**: `AdherenceAssessmentView` / `AdherenceResultView`.
- **Histórico**: `FrameworkHistoryTab`.
- **Exports**: `ExportFrameworkPDF` (técnico) e `ExportBoardPDF` (executivo) iguais para todos.

Particularidades vêm 100% de `getFrameworkConfig()` em `src/lib/framework-configs.ts` (escala 0-5 vs %, labels de score, domínios, seções, nomes de pilares). SoA é exclusiva de ISO 27001/27701, conforme regulação. Isso está correto.

## Inconsistências encontradas (precisam ser corrigidas)

1. **Loaders divergentes** — viola a regra "AkurisPulse é o ÚNICO loader":
   - `GapAnalysisFrameworkDetail` usa `animate-pulse` cru (linhas 206-209).
   - `GenericRequirementsTable` usa `animate-pulse` cru (l. 762-765).
   - `FrameworkHeroSummary` usa `<Skeleton/>` em 2 pontos (l. 137, 225).
   - `GenericScoreDashboard` usa 4× `<Skeleton/>` (l. 123-124).
   - `RequirementDetailDialog` define um `GuidanceSkeleton` com 11× `<Skeleton/>` (l. 328-345).
   - `ScoreEvolutionChart` usa `<Skeleton/>` (l. 77).
   - `AdherenceAssessmentView` usa `animate-pulse` (l. 222).
   - `SoATab` usa `animate-pulse` (l. 216).

2. **Título do gráfico de categorias hardcoded** — `CategoryBarChart` mostra sempre "Aderência por Categoria", ignorando `config.domainLabel` / `config.sectionLabel`. NIST deveria dizer "Aderência por Pilar", ISO 27001 "Aderência por Domínio do Anexo A", COBIT "por Domínio COBIT", etc. (os labels já existem no config, só não estão sendo lidos).

3. **Tipo do `config` em `CategoryBarChart` não casa** — declarado como `'decimal' | 'percentage' | 'scale_0_5'`, mas o sistema usa `'percentage' | 'scale_0_5'`. Trocar para o tipo `FrameworkConfig` real para evitar drift.

4. **Componentes mortos** que confundem manutenção:
   - `charts/PrivacyTreemap.tsx` — não importado em lugar nenhum.
   - `GenericScoreDashboard.tsx` — substituído pelo `FrameworkHeroSummary`, sem usos.
   - `ScoreEvolutionChart.tsx` — sparkline já vive dentro do Hero, sem usos.
   - `JourneyProgressBar.tsx`, `StatusBlocks.tsx`, `CategoryStatusCards.tsx`, `WelcomeHero.tsx` — verificar e remover se órfãos.

5. **Hardcode "Requisitos do {frameworkName}"** está OK (é o nome do framework), mas o card usa `Card/CardHeader/CardTitle` enquanto o Hero não — divergência menor de hierarquia visual; manter como está.

## Plano de correção

### A. Substituir todos os loaders por `AkurisPulse`
Em cada arquivo listado em (1):
- Trocar blocos `animate-pulse` + `<Skeleton/>` por `<AkurisPulse/>` centralizado (com label contextual quando fizer sentido, ex.: "Carregando requisitos...", "Calculando aderência...").
- Manter altura/área reservada para evitar layout shift (wrapper com `min-h-[Xpx] flex items-center justify-center`).
- No `RequirementDetailDialog`, substituir o bloco `GuidanceSkeleton` inteiro por um `AkurisPulse` com label "Carregando orientação...".

### B. Tornar o título do `CategoryBarChart` dinâmico
- Importar `FrameworkConfig` e usar `config.sectionLabel ?? config.domainLabel ?? 'Aderência por Categoria'` no `CardTitle`.
- Atualizar a prop `config` para o tipo `FrameworkConfig` (remover o tipo inline divergente).
- Sem mudanças visuais para frameworks sem label customizado.

### C. Remover componentes órfãos
Após `rg` confirmar zero importações, deletar:
- `src/components/gap-analysis/charts/PrivacyTreemap.tsx` (e a pasta `charts/` se vazia)
- `src/components/gap-analysis/GenericScoreDashboard.tsx`
- `src/components/gap-analysis/ScoreEvolutionChart.tsx`
- Demais órfãos confirmados (`JourneyProgressBar`, `StatusBlocks`, `CategoryStatusCards`, `WelcomeHero` se não usados).

### D. Validação final (em todos os frameworks)
Checklist a rodar manualmente em pelo menos 4 frameworks de tipos distintos (NIST escala 0-5, ISO 27001 com seções+domínios, LGPD %, COSO ERM com domínios coloridos):
- Hero: donut, sparkline, chips de domínio/seção exibidos com o `domainLabel`/`sectionLabel` correto.
- Gráfico de categorias: título dinâmico, barras clicáveis filtrando a tabela.
- Tabela: tabs por seção quando aplicável, senão tabs por categoria; colunas Prazo/Responsável aparecem.
- Dialog de requisito: idêntico em todos, com IA, evidências e plano de ação.
- Loader: apenas `AkurisPulse` visível em qualquer estado de loading.
- Export PDF técnico e executivo geram corretamente.

## Arquivos afetados

**Editar**:
- `src/pages/GapAnalysisFrameworkDetail.tsx`
- `src/components/gap-analysis/GenericRequirementsTable.tsx`
- `src/components/gap-analysis/FrameworkHeroSummary.tsx`
- `src/components/gap-analysis/CategoryBarChart.tsx`
- `src/components/gap-analysis/dialogs/RequirementDetailDialog.tsx`
- `src/components/gap-analysis/adherence/AdherenceAssessmentView.tsx`
- `src/components/gap-analysis/SoATab.tsx`

**Remover (após confirmação de zero usos)**:
- `src/components/gap-analysis/charts/PrivacyTreemap.tsx`
- `src/components/gap-analysis/GenericScoreDashboard.tsx`
- `src/components/gap-analysis/ScoreEvolutionChart.tsx`
- + órfãos confirmados na varredura

## Particularidades preservadas (não mexer)
- Escala de score por framework (0-5 NIST vs % nos demais).
- Labels de score (Excelente/Bom/... vs Conforme/Parcial/...).
- Domínios coloridos específicos (ISO 27001 Anexo A, COBIT EDM/APO/BAI/DSS/MEA, COSO, etc.).
- Seções (ISO 27001 SGSI vs Anexo A; ISO 9001/14001 PDCA).
- Aba SoA exclusiva de ISO 27001 e 27701.
- Tradução de pilares NIST (`NIST_PILLAR_NAMES`).
