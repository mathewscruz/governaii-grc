

# Dashboard — Remoção do Resumo IA + Correção dos Cálculos

## 1. Remover ExecutiveSummaryAI

**Arquivo deletado:** `src/components/dashboard/ExecutiveSummaryAI.tsx`

**`src/pages/Dashboard.tsx`:** Remover import e JSX `<ExecutiveSummaryAI />` (linhas 12 e 128-129).

**`src/i18n/pt.ts` e `en.ts`:** Remover chaves `summaryWithAI`, `summaryDesc`, `generateAnalysis`, `generatingAnalysis`, `summaryGenerated`, `summaryUpdated`, `errorGenerating` (linhas 92-99 em ambos).

---

## 2. Causa raiz dos scores zerados

O problema é de **comparação de strings com acentos**. Os dados no banco são salvos sem acento (ex: `critico`, `medio`), mas os hooks comparam com acento (`crítico`, `médio`), resultando em zero matches.

### `src/hooks/useRiscosStats.tsx` — Corrigir `normalizeNivel`

A função atual:
```ts
const normalizeNivel = (nivel: string): string => {
  return (nivel || '').toLowerCase().trim();
};
```
Retorna `'critico'`, mas depois compara com `'crítico'` (com acento). Corrigir adicionando remoção de acentos:
```ts
const normalizeNivel = (nivel: string): string => {
  return (nivel || '').toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};
```
E atualizar todas as comparações para usar strings sem acento:
- `'crítico'` → `'critico'`
- `'médio'` → `'medio'`
- `'muito alto'` permanece (sem acento)

### `src/hooks/useDashboardStats.tsx` — Corrigir filtro de riscos

A query atual filtra:
```ts
.in('nivel_risco_inicial', ['Alto', 'Crítico', 'Muito Alto'])
```
Mas o banco guarda `critico`, `alto`, `medio` (lowercase, sem acento). Corrigir para:
```ts
.in('nivel_risco_inicial', ['alto', 'Alto', 'critico', 'Crítico', 'Critico', 'muito alto', 'Muito Alto'])
```
Ou melhor: buscar todos os riscos e filtrar no JS com normalização.

### `src/hooks/useRadarChartData.tsx` — queryKey sem empresa_id

O `queryKey` é `['radar-chart-data']` fixo, sem incluir `empresa_id`. Isso causa cache incorreto se o usuário trocar de empresa. Corrigir para incluir o identificador da empresa no key.

---

## Resumo de alterações

| Arquivo | Ação |
|---------|------|
| `src/components/dashboard/ExecutiveSummaryAI.tsx` | **Deletar** |
| `src/pages/Dashboard.tsx` | Remover import e uso do ExecutiveSummaryAI |
| `src/i18n/pt.ts` | Remover 7 chaves de i18n do resumo IA |
| `src/i18n/en.ts` | Remover 7 chaves de i18n do resumo IA |
| `src/hooks/useRiscosStats.tsx` | Adicionar strip de acentos no `normalizeNivel` + corrigir comparações |
| `src/hooks/useDashboardStats.tsx` | Buscar riscos sem filtro de nível e classificar no JS com normalização |
| `src/hooks/useRadarChartData.tsx` | Adicionar empresa_id ao queryKey |

