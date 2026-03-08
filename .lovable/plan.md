

# Validacao Completa — Modulo Gap Analysis

Analisei em profundidade todos os componentes do modulo: GapAnalysisFrameworks, GapAnalysisFrameworkDetail, GenericRequirementsTable, GenericScoreDashboard, NISTRequirementDetailDialog, SoATab, RemediationTab, FrameworkHistoryTab, AdherenceAssessmentView/Dialog/ResultView, FrameworkOnboarding, WelcomeHero, CategoryBarChart, CategoryStatusCards, JourneyProgressBar, ScoreEvolutionChart, FrameworkCard, FrameworkCatalog, AIRecommendationsCard, e os hooks useGapAnalysisStats, useFrameworkScore, useScoreHistory, useAdherenceStats.

---

## RLS Policies e Banco de Dados

**OK** — As tabelas `gap_analysis_frameworks`, `gap_analysis_requirements`, `gap_analysis_evaluations`, `gap_analysis_score_history`, `gap_analysis_soa`, `gap_analysis_adherence_assessments`, `gap_analysis_adherence_details`, `gap_analysis_audit_log`, `gap_analysis_assignments`, `gap_analysis_evidences`, `gap_evaluation_risks` possuem RLS ativo com policies corretas. A correcao cross-tenant de requirements ja foi aplicada na migration anterior.

---

## Problemas Identificados

### 1. SEGURANCA — `useGapAnalysisStats` sem filtro `empresa_id` e queryKey estatica

O hook busca `gap_analysis_frameworks` e `gap_analysis_evaluations` sem filtrar por `empresa_id`. Como os frameworks sao globais (`empresa_id IS NULL`), o count de frameworks esta correto, mas as evaluations sao buscadas sem `.eq('empresa_id', empresaId)` — depende apenas de RLS. A `cacheKey` e estatica (`'gap-analysis-stats'`), causando cache compartilhado entre empresas.

**Correcao**: Importar `useEmpresaId`, filtrar evaluations por `empresa_id`, incluir `empresaId` na cacheKey.

### 2. UX — SoATab usa `as any` para acessar `gap_analysis_soa`

O `SoATab.tsx` usa `supabase.from('gap_analysis_soa' as any)` em 2 locais (linhas 83 e 175). A tabela existe no banco e no types.ts, entao o cast e desnecessario e esconde erros de tipo.

**Correcao**: Remover `as any` dos 2 locais.

### 3. FUNCIONAL — RemediationTab mostra `responsavel_id` bruto (UUID) em vez do nome

Na linha 159, o componente exibe `plano.responsavel_id` diretamente, que e um UUID. O usuario ve um hash em vez do nome do responsavel.

**Correcao**: Buscar profiles dos responsaveis e exibir o nome.

### 4. UX — RemediationTab sem paginacao

A lista de planos de acao nao tem paginacao. Com muitos requisitos nao conformes, a pagina fica longa e lenta.

**Correcao**: Menor prioridade — manter por ora, mas documentar como melhoria futura.

### 5. DADOS — `useGapAnalysisStats` query de evaluations pode ultrapassar limite de 1000 rows

A query `supabase.from('gap_analysis_evaluations').select(...)` sem limit pode retornar dados truncados em frameworks grandes (ex: ISO 27001 com 121+ requisitos × N empresas). RLS filtra por empresa, mas o select nao tem limit explicito.

**Correcao**: Ja que RLS limita os dados, e frameworks tem ~120 requisitos max, o risco e baixo. Documentar como melhoria.

### 6. UX — NISTRequirementDetailDialog: nome "NIST" no componente mas usado para TODOS os frameworks

O componente `NISTRequirementDetailDialog` e generico (usado por todos os frameworks) mas o nome sugere ser exclusivo do NIST. Isso e confuso para manutencao.

**Correcao**: Menor prioridade — renomear seria ideal mas nao impacta o usuario. Manter.

### 7. FUNCIONAL — FrameworkOnboarding nao tem fallback para frameworks sem onboarding especifico

Quando um framework desconhecido e aberto (ex: ISO 14001, CCPA), o `getOnboardingData` retorna um fallback generico que funciona, entao nao ha bug. **OK**.

### 8. DADOS — `useAdherenceStats` sem filtro empresa_id e queryKey estatica

Similar ao item 1, o hook `useAdherenceStats` busca `gap_analysis_adherence_assessments` sem `.eq('empresa_id', empresaId)` e usa cacheKey estatica.

**Correcao**: Adicionar filtro e incluir empresaId na cacheKey.

---

## Resumo de Acoes a Implementar

| # | Problema | Tipo | Impacto |
|---|----------|------|---------|
| 1 | `useGapAnalysisStats` sem empresa_id | Seguranca/Cache | **Alto** |
| 2 | SoATab `as any` desnecessario | Qualidade codigo | **Baixo** |
| 3 | RemediationTab mostra UUID do responsavel | UX | **Medio** |
| 4 | `useAdherenceStats` sem empresa_id | Seguranca/Cache | **Alto** |

Itens 1, 2, 3 e 4 serao implementados. Os demais sao cosmeticos ou de baixa prioridade.

### Arquivos a editar:
- `src/hooks/useGapAnalysisStats.tsx` — adicionar empresa_id filter e cacheKey
- `src/hooks/useAdherenceStats.tsx` — adicionar empresa_id filter e cacheKey
- `src/components/gap-analysis/SoATab.tsx` — remover `as any`
- `src/components/gap-analysis/RemediationTab.tsx` — resolver nome do responsavel

