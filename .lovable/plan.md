## Objetivo

Permitir que o usuário **reaproveite uma mesma evidência (documento) em múltiplos requisitos**, dentro do mesmo framework ou entre frameworks diferentes do Gap Analysis. A IA sugere automaticamente onde a evidência também serve, acelerando a adequação a múltiplas normas.

## Diagnóstico do modelo atual

```text
gap_analysis_evidences (1:N com gap_analysis_evaluations)
   └─ evaluation_id (UUID, único pai)
   └─ arquivo_url, arquivo_nome, arquivo_tipo, link_externo

gap_analysis_evaluations
   └─ requirement_id, framework_id, empresa_id, conformity_status
   └─ evidence_files (jsonb — duplica metadata)

gap_analysis_requirements (do template global)
   └─ titulo, descricao, categoria, exemplos_evidencias, orientacao_implementacao
```

**Problemas hoje:**
1. Cada evidência tem **um único `evaluation_id`** — não dá pra associá-la a vários requisitos sem re-uploadar.
2. `evidence_files` em `evaluations` é jsonb redundante com `gap_analysis_evidences`.
3. Não existe biblioteca/repositório central de evidências por empresa.
4. Já existe a edge function `analyze-evidence-against-requirement` (perfeita para reuso no matching IA).

## Solução proposta

### 1. Novo modelo de dados (biblioteca + vínculos N:N)

```text
evidence_library                         ← repositório central por empresa
  id, empresa_id, nome, descricao,
  arquivo_url, arquivo_nome, arquivo_tipo, arquivo_tamanho,
  link_externo, hash_arquivo (sha256), tags text[],
  origem_evaluation_id (origem do upload), created_by, created_at, updated_at

evidence_library_links                   ← N:N evidência ↔ requisito avaliado
  id, empresa_id, evidence_id → evidence_library,
  evaluation_id → gap_analysis_evaluations,
  requirement_id, framework_id (denormalizado p/ filtros),
  vinculo_tipo ('manual' | 'sugestao_ia'),
  ia_score numeric(3,2),  ← 0.00 – 1.00
  ia_justificativa text,
  aceito_em timestamptz, aceito_por uuid,
  UNIQUE (evidence_id, evaluation_id)
```

Migração de dados: importar evidências existentes em `gap_analysis_evidences` para `evidence_library`, criando 1 link por registro (mantém compat). `gap_analysis_evidences` continua existindo (legado) durante a transição; novas evidências passam pela biblioteca.

RLS: ambas as tabelas com `empresa_id` obrigatório, policies espelhando o padrão multi-tenant do projeto (`auth.uid()` na empresa via `is_user_in_empresa`).

### 2. Edge function nova: `evidence-cross-match`

Recebe `{ evidence_id }` e devolve a lista de **requisitos candidatos** (do mesmo framework e de outros frameworks que a empresa tem ativos), ordenados por relevância.

Pipeline:
1. Carrega evidência (nome, descrição, tags, primeiras N páginas via `parse_document` se PDF, ou texto plain).
2. Busca todos os requisitos da empresa **ainda não vinculados** a essa evidência, agrupados por framework.
3. Pré-filtro lexical (palavras-chave em `titulo + descricao + categoria + exemplos_evidencias`) para reduzir candidatos a top ~40.
4. Reusa **`analyze-evidence-against-requirement`** (já existente) em batch — uma chamada IA com prompt comparativo único que retorna JSON `[{ requirement_id, score, justificativa, sugere_status }]`.
5. Persiste sugestões em `evidence_library_links` com `vinculo_tipo='sugestao_ia'` e `aceito_em=NULL` (rascunho).
6. Custo controlado via `consume_ai_credit` (padrão Akuris, 402 se sem crédito).

### 3. UI — três pontos de entrada

**a) Hub "Biblioteca de Evidências"** (nova aba dentro do Framework Detail e atalho global no Gap Analysis):
- Lista as evidências da empresa, com chip "usada em N requisitos" e breakdown por framework.
- Botão **"Sugerir reaproveitamento (IA)"** por evidência → roda `evidence-cross-match`.
- Painel lateral mostra requisitos candidatos com **score IA**, framework, justificativa, e botões **"Vincular"** / **"Ignorar"** / **"Vincular e marcar Conforme"**.

**b) `RequirementDetailDialog`** (existente):
- Acima do upload, novo card **"Reaproveitar evidência existente"**:
  - Tab 1: **Sugestões da IA** (evidências da biblioteca que a IA acha que servem para este requisito, com score).
  - Tab 2: **Buscar na biblioteca** (search por nome/tag, com filtro por framework de origem).
- Selecionar = cria link em `evidence_library_links` em vez de novo upload.

**c) Após upload novo no `RequirementDetailDialog`**:
- Toast com CTA **"Esta evidência pode servir em outros requisitos. Analisar com IA?"** → dispara `evidence-cross-match` e abre o painel de sugestões.

### 4. Comportamento e regras

- Vincular não altera automaticamente o `conformity_status` do requisito de destino — é decisão humana (botão extra "Vincular e marcar Conforme").
- Desvincular: remove apenas o link, mantém a evidência na biblioteca.
- Excluir evidência da biblioteca: bloqueado se houver links ativos; UI mostra os requisitos afetados e exige confirmação em cascata.
- Auditoria: cada link gera entrada em `gap_analysis_audit_log` (`acao='evidencia_vinculada'` / `'evidencia_sugerida_ia'` / `'evidencia_aceita_ia'`).
- Multi-tenant: TODA query inclui `.eq('empresa_id', empresaId)` (regra Core).

### 5. Detalhes técnicos

- Frontend: novo hook `useEvidenceLibrary(empresaId)` (CRUD + sugestões), componente `EvidenceLibraryPanel`, sub-componente `CrossMatchSuggestions`.
- Edge function envolvida em `invokeEdgeFunction` (padrão Akuris, trata 402/429/timeout).
- IA: Gemini 3 Flash (rotina, comparação textual) — custo baixo. Strategy memo aprovada.
- `hash_arquivo` permite deduplicar uploads idênticos automaticamente (mesmo arquivo = mesma entrada na biblioteca).
- Score thresholds (UI): `>= 0.80` "Alta aderência" (verde), `0.60–0.79` "Possível" (amarelo), `< 0.60` não exibido.
- Loader: `<AkurisPulse/>`. Badges: `<StatusBadge/>` com tons semânticos. Toasts: `akurisToast`.

### 6. Entregáveis

1. Migração SQL: 2 tabelas novas + RLS + índices (`evidence_id`, `requirement_id`, `framework_id`, `empresa_id`).
2. Backfill: copia `gap_analysis_evidences` → `evidence_library` + 1 link cada.
3. Edge function `evidence-cross-match` (com `consume_ai_credit`).
4. Hook + componentes: `useEvidenceLibrary`, `EvidenceLibraryPanel`, `CrossMatchSuggestions`, `EvidencePickerInline`.
5. Integração no `RequirementDetailDialog` (tab "Reaproveitar") e nova aba "Biblioteca" no Framework Detail.
6. Memória: `mem://features/gap-analysis/evidence-library-cross-match` documentando o fluxo.
7. i18n PT/EN das novas strings.

### 7. Fora do escopo (próximas fases)

- Versionamento de evidências (substituir arquivo mantendo links).
- Reaproveitamento entre módulos (Auditorias, Controles, Incidentes) — modelo já permite, mas requer adapters.
- OCR/embeddings vetoriais para matching mais profundo (hoje cobrimos com prompt textual).

## Resumo executivo

Criamos uma **biblioteca de evidências por empresa** com vínculos N:N para requisitos, e a IA analisa proativamente onde cada evidência também se aplica — no mesmo framework e entre frameworks diferentes. O usuário ganha um "use uma vez, vincule em vários" com sugestões automáticas, acelerando drasticamente a conformidade multi-norma (ISO 27001 + LGPD + NIST etc.).
