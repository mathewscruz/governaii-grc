
# Refatoração Visual — Módulo Gap Analysis

## Diagnóstico (o que encontrei revisando 30+ arquivos)

### 1. Cores fora da identidade Akuris
O design system é **Violet (#7552FF) + Navy + neutros**, com tokens semânticos `success/warning/destructive/info` e charts via `chart-1..5`. O módulo usa **cores cruas Tailwind** em dezenas de pontos:
- `FrameworkCard.tsx`: `bg-blue-100`, `bg-emerald-100`, `bg-amber-100`, `bg-purple-100`, `bg-red-100`, `text-emerald-600` etc. (categorias e esforço)
- `CategoryBarChart.tsx`: barras em `bg-blue-200..600` (azul fora da paleta)
- `AreaBarChart.tsx`: 5 tons de verde hardcoded (`#059669`, `#10b981`…)
- `ScoreEvolutionChart.tsx`: linha em `#8b5cf6` hardcoded
- `GenericScoreDashboard.tsx` (donut): `#22c55e/#3b82f6/#f59e0b/#ef4444` hardcoded
- `StatusBlocks.tsx`: `bg-emerald-500 / bg-amber-400 / bg-red-500 / bg-blue-400`
- `FrameworkCard` (status pills): `bg-emerald-100 dark:bg-emerald-900/30…`
- `AdherenceAssessmentView.tsx`: `bg-green-100 / bg-blue-100 / bg-yellow-100 / bg-red-100` para badges (deveria usar `<Badge variant>`)
- `AIRecommendationsCard.tsx`: botão `bg-purple-600` hardcoded em vez de `bg-primary`
- `RequirementDetailDialog`: `text-amber-500`, `bg-emerald-500/10`, `text-blue-500`, `bg-chart-2/chart-4` (mistura tokens novos com cores cruas)
- `AdherenceAssessmentView`: `text-blue-600` para "Processando…"

**Resultado**: o módulo "destoa" do resto do sistema — ele tem cara de "AI default" (azul/verde Tailwind crus), não de Akuris (violet/navy).

### 2. Ícones — não seguem o sistema Akuris
A regra do projeto (memo `Akuris Icon System`) exige:
- **Stroke 1.5** (assinatura visual) — `FrameworkLogos.tsx` segue, mas o resto usa default 2.
- **Catálogo `@/components/icons`** para conceitos (IconEdit, IconSuccess, etc.).
- **Ícones proprietários para módulos GRC** — existe `GapAnalysisIcon` em `@/components/icons/modules`, mas o módulo continua usando `Activity`, `Shield` (Lucide) no header e em vários cards.

Inconsistências de ícones detectadas:
- Header da listagem usa `Activity` (Lucide), deveria usar `GapAnalysisIcon`.
- `WelcomeHero` mistura `Sparkles, Search, Brain, BarChart3` (todos Lucide crus).
- `RequirementDetailDialog` importa **27 ícones Lucide diferentes** numa só linha (CheckSquare, FileCheck, ScanSearch, Brain, Sparkles, Shield…) — sem usar o catálogo.
- `FrameworkOnboarding` importa 16 ícones Lucide para "ilustrar" cada framework — duplica o que já está em `FrameworkLogos.tsx`.
- `Brain` (cérebro) é usado para "Gerador de Documentos IA" — visual genérico de IA, fora da identidade.

### 3. Componentes duplicados / órfãos (código morto)
Confirmado por busca de imports: **7 componentes não são importados em lugar nenhum**:
- `AssessmentDialog.tsx` (187 linhas)
- `AssignmentDialog.tsx` (253 linhas)
- `EvidenceDialog.tsx` (271 linhas)
- `EvidenceUpload.tsx` (211 linhas)
- `RequirementDialog.tsx` (378 linhas)
- `RequirementsManager.tsx` (224 linhas)
- `FrameworkDialog.tsx` (157 linhas)

**Total: ~1.700 linhas de código morto** — vestígios de versões antigas que foram substituídas pelo `RequirementDetailDialog` unificado e pelos templates globais. Manter aumenta confusão e risco.

### 4. Popup principal (RequirementDetailDialog) — campos OK, mas estrutura confusa
**Estrutura atual**: split 40/60, painel esquerdo com orientação IA, painel direito com formulário em `CollapsibleSection`s.

Problemas identificados:
- **Mistura de tokens**: usa `text-chart-2` / `text-chart-4` (tokens) lado a lado com `text-amber-500` / `bg-emerald-500/10` (crus).
- **27 ícones Lucide importados** — sem padrão semântico.
- Hub de evidências (3 ações) usa `Brain`, `Upload`, `ExternalLink` — ok funcionalmente, mas ícones deveriam vir do catálogo.
- `ScanSearch` (Lucide) para "Validar com IA" — substituível por `IconSuccess` ou ícone proprietário.
- Hint "Sparkles" no rodapé — usar ícone Akuris.
- Verdict da validação (`bg-emerald-500/10 text-emerald-700 border-emerald-200`) deveria virar `Badge variant="success/warning/destructive"`.
- `prompt()` nativo do browser para "Adicionar link" — quebra UX. Substituir por mini-dialog Akuris.
- Plano de Ação: alerta usa `text-amber-500` cru.

### 5. Gráficos com tokens errados
- `CategoryBarChart`: usa só azul, sem distinção semântica de score (igual a heatmap monocromático).
- `AreaBarChart`: 5 tons de verde — sem indicação visual de "ruim" (vermelho).
- `FrameworkComparisonRadar`: `fillOpacity={0.5}` muito chapado, falta gradient sutil da identidade.
- `ScoreEvolutionChart`: linha `#8b5cf6` hardcoded em vez de `hsl(var(--primary))`.
- `GenericScoreDashboard` Donut: cores cruas (`#22c55e/#3b82f6/#f59e0b/#ef4444`).

### 6. Outras inconsistências visuais
- `AIRecommendationsButton`: pílula roxa flutuante (`bg-purple-600`) — destoa do resto. Header tem 4 botões diferentes (`AI`, `DocGen`, `Tour`, `Exportar`) sem hierarquia clara.
- `WelcomeHero` usa `bg-gradient-to-br from-primary/5 via-background to-accent/5` (ok) mas badges/ícones internos não seguem.
- `JourneyProgressBar`: usa tokens `chart-2/chart-4` (ok) — bom exemplo a manter.
- `CategoryStatusCards`: `text-emerald-600 / text-amber-600 / text-red-600` cru.
- `RemediationTab`: uso correto de `Badge variant="success/warning/destructive"` — bom padrão a replicar.

---

## Plano de Refatoração

### Sprint 1 — Padronização de Cores (alta prioridade visual)
1. **Centralizar paleta de status** em um helper `src/lib/gap-analysis-tokens.ts`:
   - `STATUS_COLORS_TOKEN` mapeia `conforme/parcial/nao_conforme/nao_aplicavel/nao_avaliado` → tokens semânticos (`success/warning/destructive/info/muted`).
   - `getScoreColor(score, max)` retorna `hsl(var(--success))` / `--warning` / `--destructive` / `--primary`.
   - `getScoreVariant(score, max)` retorna `'success' | 'warning' | 'destructive' | 'info'` para Badges.
2. **Substituir cores cruas** em todos os componentes do módulo:
   - `FrameworkCard`, `CategoryStatusCards`, `StatusBlocks`, `AdherenceAssessmentView`, `RequirementDetailDialog` (verdicts), `AIRecommendationsCard` (botão `bg-primary`), `JourneyProgressBar` (já está ok, manter).
3. **Categorias** (Segurança/Privacidade/Governança/Qualidade) → mover para tokens neutros + `--primary` (sem azul/verde/amarelo/roxo cru). Manter ícones diferenciando.

### Sprint 2 — Sistema de Ícones Akuris
1. **Header do módulo** usa `GapAnalysisIcon` proprietário (em `PageHeader` icon prop ou ao lado do título).
2. **Migrar ícones Lucide para catálogo** (`@/components/icons`) onde aplicável:
   - `Search → IconSearch`, `X → IconClose`, `Trash2 → IconDelete`, `Plus → IconAdd`, `RefreshCw → IconRefresh`, `Upload → IconUpload`, `ExternalLink → IconExternal`, `FileText → IconFile`, `User → IconUser`, `Calendar → IconCalendar`, `CheckCircle2 → IconSuccess`, `AlertTriangle → IconWarning`.
3. **Stroke 1.5** em todos os Lucide remanescentes do módulo (props `strokeWidth={1.5}` ou usar wrapper `<Icon as={...} />`).
4. **`FrameworkLogos.tsx`**: revisar paleta de cores para usar `text-primary / text-chart-1..5` em vez de `text-blue-700 / text-green-700` etc.
5. **`FrameworkOnboarding`**: descartar import de 16 ícones Lucide e reutilizar `FrameworkLogo` (já existe).

### Sprint 3 — Limpeza de Código Morto
Remover (após confirmar via grep que nada importa):
- `AssessmentDialog.tsx`
- `AssignmentDialog.tsx`
- `EvidenceDialog.tsx`
- `EvidenceUpload.tsx`
- `RequirementDialog.tsx`
- `RequirementsManager.tsx`
- `FrameworkDialog.tsx`

**Ganho**: -1.700 linhas, redução de superfície de manutenção.

### Sprint 4 — Refinamento de Gráficos
1. **Donut do Score Geral** (`GenericScoreDashboard`): cores via tokens (`hsl(var(--success/warning/destructive/primary))`), animação de "fill" suave.
2. **`CategoryBarChart`**: gradiente semântico (vermelho→amarelo→verde) em vez de mono-azul. Cor por score.
3. **`AreaBarChart`**: usar paleta semântica (não só verde). `--destructive` quando score < 40, `--warning` 40-60, `--success` > 60.
4. **`ScoreEvolutionChart`**: linha em `hsl(var(--primary))`, dots em `hsl(var(--primary-glow))`.
5. **`FrameworkComparisonRadar`**: usar `--gradient-primary` (variável CSS Akuris) com `fillOpacity` 0.3, stroke `hsl(var(--primary))`.
6. **`StatusBlocks`** (heatmap de quadradinhos): cores via tokens.

### Sprint 5 — Refinamento do Popup do Requisito
1. **Substituir `prompt()` nativo** por mini-dialog Akuris para "Adicionar link" (campo URL + nome).
2. **Verdict de validação IA** vira `<Badge variant="success/warning/destructive" />` + ícone semântico do catálogo, sem cores cruas.
3. **Hub de 3 ações**: ícones `IconUpload / IconExternal` do catálogo; botão "Gerar com IA" mantém ícone `Brain` mas com cor `--primary`.
4. **Header do dialog**: ícone `GapAnalysisIcon` proprietário em vez de `Shield`.
5. **Hint "Sparkles" no rodapé**: substituir por `IconInfo` do catálogo.
6. **Diagnóstico Rápido**: botões "Sim/Parcial/Não" usam `Badge variant` em vez de cores cruas (`bg-chart-2`, `bg-chart-4`).
7. **Alerta "Requisito não conforme"** no Plano de Ação: trocar `text-amber-500` cru por `IconWarning` do catálogo.

### Sprint 6 — Ajustes Finos
1. **Header da página de detalhe**: agrupar 4 botões (`AI`, `DocGen`, `Tour`, `Exportar`) com hierarquia — botão primário `Avaliar com IA` (atual round purple), secundários em outline.
2. **`AIRecommendationsButton`**: trocar `bg-purple-600` por `bg-primary` (já é violet).
3. **Pílulas de status** no `FrameworkCard`: usar `Badge variant` consistente.
4. **`AdherenceAssessmentView`**: badges de status/resultado viram `<Badge variant>`.
5. **`WelcomeHero`**: ícone `Sparkles` → `IconInfo` ou ícone Akuris; passos numerados com `--primary`.
6. **`CategoryStatusCards`** (% no canto): cor via `getScoreColor` token.

---

## Resumo do Impacto

| Métrica | Antes | Depois |
|---|---|---|
| Cores cruas Tailwind | ~80 ocorrências | 0 |
| Lucide direto p/ conceitos | 30+ pontos | catálogo Akuris |
| Componentes órfãos | 7 (~1.700 linhas) | removidos |
| Stroke 1.5 (assinatura) | só `FrameworkLogos` | módulo todo |
| Ícone proprietário do módulo | não usado | usado em header + dialog |
| Campos do popup | OK | OK + UX refinada (sem prompt nativo) |
| Cores de gráfico | mono/cruas | gradiente semântico via tokens |

## Ordem sugerida de execução
Sprint 1 (cores) → Sprint 3 (limpeza, rápido) → Sprint 2 (ícones) → Sprint 4 (gráficos) → Sprint 5 (popup) → Sprint 6 (refinos).

Aprovando, executo todos os sprints em sequência ou posso pausar para feedback após cada um — me diga sua preferência.
