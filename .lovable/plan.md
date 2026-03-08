

# Validação de Contabilização de Créditos IA

## Situação Atual

| Edge Function | Usa IA? | Consome crédito? | Status |
|---|---|---|---|
| `akuria-chat` | Sim (Lovable AI) | ✅ Sim | OK |
| `suggest-risk-treatment` | Sim (OpenAI) | ✅ Sim | OK |
| `analyze-document-adherence` | Sim (Lovable AI) | ✅ Sim | OK |
| `ai-module-assistant` | Sim (Lovable AI) | ❌ Não | **CORRIGIR** |
| `populate-requirement-guidance` | Sim (Lovable AI) | ❌ Não | **CORRIGIR** |
| `calculate-assessment-score` | Sim (Lovable AI) | ❌ Não | **CORRIGIR** |
| `docgen-chat` | Sim (OpenAI) | ❌ Não | **CORRIGIR** |

4 funções usam IA sem contabilizar créditos.

## Correções

### 1. `ai-module-assistant/index.ts`
- Adicionar autenticação via `Authorization` header para obter `user_id`
- Buscar `empresa_id` do perfil
- Chamar `consume_ai_credit` antes da chamada à IA
- Retornar 402 se créditos esgotados
- O caller (`AIRecommendationsCard.tsx`) já passa os dados via session, basta extrair do token

### 2. `populate-requirement-guidance/index.ts`
- Adicionar autenticação via header
- Chamar `consume_ai_credit` por requisito processado (em batch, cada requisito = 1 crédito pois faz 3 chamadas AI por requisito)
- Retornar 402 se créditos esgotados
- Atualizar caller `NISTRequirementDetailDialog.tsx` para tratar erro 402

### 3. `calculate-assessment-score/index.ts`
- Buscar `empresa_id` do assessment via join com `due_diligence_assessments`
- Adicionar `consume_ai_credit` antes da chamada AI
- Atualizar caller `Assessment.tsx` para tratar erro 402

### 4. `docgen-chat/index.ts`
- Já recebe `user_id` e `empresa_id` no body
- Adicionar `consume_ai_credit` antes de cada chamada OpenAI (chat e generate_document)
- Retornar 402 se créditos esgotados
- Atualizar caller `DocGenDialog.tsx` para tratar erro 402 com `CreditsExhaustedDialog`

### 5. Atualizar callers no frontend
- `AIRecommendationsCard.tsx` — tratar resposta 402 com toast/dialog
- `NISTRequirementDetailDialog.tsx` — tratar resposta 402
- `Assessment.tsx` — tratar resposta 402 (graceful, pois assessment já foi concluído)
- `DocGenDialog.tsx` — tratar resposta 402 com `CreditsExhaustedDialog`

## Arquivos a editar
- `supabase/functions/ai-module-assistant/index.ts`
- `supabase/functions/populate-requirement-guidance/index.ts`
- `supabase/functions/calculate-assessment-score/index.ts`
- `supabase/functions/docgen-chat/index.ts`
- `src/components/gap-analysis/AIRecommendationsCard.tsx`
- `src/components/gap-analysis/nist/NISTRequirementDetailDialog.tsx`
- `src/pages/Assessment.tsx`
- `src/components/documentos/DocGenDialog.tsx`

