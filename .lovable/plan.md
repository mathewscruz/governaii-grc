## Diagnóstico

Validei o módulo Gap Analysis e mapeei o fluxo de documentos em todo o app. Três problemas concretos:

### 1. Popup do Consultor IA cortando conteúdo
- `AIRecommendationsCard.tsx` usa `max-w-2xl` (≈672px). Em telas como o print enviado, badges ("Médio", "Alto") e textos longos vazam para a direita.
- Faltam responsividade real (sem `sm:` / `lg:`) e densidade interna ajustada.

### 2. Fluxo de documentos fragmentado
Hoje o usuário tem que viajar entre 3 lugares para um mesmo objetivo:

```text
Detalhe do requisito (dialog)
  └─ Vê orientação ........................... OK
  └─ Anexa evidência (drag&drop) ............. OK, mas SEM validação por IA
  └─ Quer gerar política?
       Fechar dialog → header → "Gerar Política" → DocGenDialog (sem contexto do requisito)
  └─ Já tem o documento e quer validar aderência?
       Fechar dialog → aba "Análise de Documentos (IA)" → criar assessment do framework inteiro
```

A IA de validação **existe** (`analyze-document-adherence`) mas só atua a nível de framework, nunca a nível de requisito/evidência individual.

### 3. DocGen espalhado e inconsistente
- `src/pages/Documentos.tsx` → botão "**DocGen**"
- `src/pages/GapAnalysisFrameworkDetail.tsx` → botão "**Gerar Política**" (nome diferente!)
- `LandingPage.tsx` → texto fala em "Geração de documentos com IA (DocGen)"
- O componente é único (`DocGenDialog`) mas é instanciado solto em cada página, sem hook ou provider compartilhado, e em cada lugar passa props diferentes.

---

## O que será entregue

### A. Correção visual do popup Consultor IA
- Aumentar para `max-w-3xl lg:max-w-4xl` com `w-[95vw]`.
- Reduzir paddings internos e ajustar quebra de texto para não cortar badges.
- Score atual com formatação `toFixed(1)%` (hoje aparece `47.25806451612903%`).

### B. Centralização do DocGen
1. Criar `src/contexts/DocGenContext.tsx` com provider global e hook `useDocGen()`:
   - `openDocGen({ frameworkId?, frameworkName?, requirementCode?, requirementTitle?, mode: 'generate' | 'validate' })`
   - Um único `<DocGenDialog>` montado no `App.tsx`, eliminando instâncias duplicadas.
2. Renomear o botão e o título em todo o sistema para **"Gerador de Documentos (IA)"** — único nome, único ícone (`Brain`).
   - Atualiza `Documentos.tsx`, `GapAnalysisFrameworkDetail.tsx`, `LandingPage.tsx`.
3. `DocGenDialog` ganha modo `validate`: ao invés de gerar, envia o documento existente para o validador (`analyze-document-adherence`) e mostra o resultado na mesma janela. O usuário não precisa mais ir para outra aba.

### C. Hub de documentos dentro do dialog do requisito
No `RequirementDetailDialog`, na seção "Evidências", adicionar 3 ações claras que cobrem 100% dos cenários:

```text
┌──────────────────────────────────────────────────────┐
│  Como você quer trabalhar a evidência?               │
│                                                       │
│  [📝 Gerar com IA]  [🔍 Validar existente]  [📎 Anexar]│
│                                                       │
│  Após anexar: "Validar aderência com IA" automático  │
└──────────────────────────────────────────────────────┘
```

- **Gerar com IA**: abre o DocGen já com contexto (`requirementCode`, `requirementTitle`, framework). O documento gerado é salvo e automaticamente vinculado como evidência do requisito.
- **Validar existente**: abre o DocGen em modo `validate`, recebe upload, chama `analyze-document-adherence` filtrando pelo requisito atual e devolve um veredito (Conforme / Parcial / Não conforme) + justificativa. Se o usuário aceitar, o doc vira evidência e o status do requisito é sugerido.
- **Anexar diretamente**: fluxo atual + novo botão "Validar com IA" no card de cada arquivo anexado, que reaproveita a mesma função.

### D. Edge function de validação por requisito
Criar (ou estender `analyze-document-adherence`) uma rota `analyze-evidence-against-requirement` que recebe `{ requirementId, fileUrl, empresaId }` e devolve `{ verdict, score, justification }`. Consome 1 crédito de IA via `consume_ai_credit`, retorna 402 se esgotado, log com `logger`.

### E. Limpeza e consistência
- Remover botão "Gerar Política" do header do framework — agora vive no fluxo do requisito (onde faz sentido) e no botão global do DocGen.
- Remover textos duplicados ("DocGen" vs "Gerar Política") da landing.
- Atualizar memória do projeto registrando "DocGen é o nome único e o ponto único de entrada".

---

## Detalhes técnicos

**Arquivos novos**
- `src/contexts/DocGenContext.tsx` — provider + hook + render único do dialog.
- `supabase/functions/analyze-evidence-against-requirement/index.ts` — IA por requisito, com `consume_ai_credit`, 402 e CORS padrão.

**Arquivos editados**
- `src/components/gap-analysis/AIRecommendationsCard.tsx` — width, formatação score.
- `src/components/documentos/DocGenDialog.tsx` — aceita `mode: 'generate' | 'validate'` e `requirementContext`. Em modo validate, mostra área de upload + resultado da IA.
- `src/components/gap-analysis/dialogs/RequirementDetailDialog.tsx` — adiciona o "hub" de 3 ações na seção Evidências e botão "Validar com IA" por arquivo.
- `src/pages/GapAnalysisFrameworkDetail.tsx` — remove botão "Gerar Política" do header (movido para dentro do fluxo do requisito).
- `src/pages/Documentos.tsx` — botão renomeado para "Gerador de Documentos (IA)".
- `src/App.tsx` — wrap com `<DocGenProvider>`.

**Schema / DB**
Sem migration nova nesta sprint. Reaproveita:
- `gap_analysis_evaluations.evidence_files` (jsonb) já guarda anexos.
- `gap_analysis_adherence_assessments` continua para análise full-framework.
- Adicionamos um campo opcional `ai_validation` dentro de cada `evidence_file` (jsonb, livre — não exige migration).

**Segurança**
- Edge function nova com `verify_jwt = true`.
- Toda query Supabase no front com `.eq('empresa_id', empresaId)`.
- `consume_ai_credit` antes de qualquer chamada à Lovable AI; 402 surfaceado via `invokeEdgeFunction`.

**Telemetria/Logging**
- `logger.debug` nos pontos de decisão do hub.
- `logger.error` com `{ error: e instanceof Error ? e.message : String(e) }`.

---

## Resultado para o usuário

Antes: 3 telas, 2 nomes diferentes ("DocGen" / "Gerar Política"), sem IA validando evidência individual.

Depois: **uma janela** (detalhe do requisito) onde, em uma decisão de 1 clique, ele Gera, Valida ou Anexa — e a IA confirma se a evidência atende. Em todo o app, o gerador se chama **"Gerador de Documentos (IA)"** e abre do mesmo lugar.
