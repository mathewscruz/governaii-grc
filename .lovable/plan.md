

# Informações Automáticas de Modelo e Custo IA

## O que será feito

Substituir o campo manual "Custo estimado por requisição" por um card informativo automático que mostra:

1. **Modelos IA em uso** — extraídos das Edge Functions do sistema:
   - `google/gemini-3-flash-preview` (akuria-chat, ai-module-assistant, analyze-document-adherence)
   - `google/gemini-2.5-flash` (calculate-assessment-score, populate-requirement-guidance)
   - `gpt-4.1-2025-04-14` (docgen-chat)
   - `gpt-4o-mini` (suggest-risk-treatment)

2. **Custo médio real por requisição** — calculado automaticamente a partir dos dados reais da tabela `creditos_consumo`, cruzando com uma tabela de preços por modelo (constante no código, baseada nos preços públicos do Lovable AI Gateway).

3. **Custo por modelo** — card detalhado mostrando cada modelo, quais funções o usam, preço estimado por 1K tokens, e total de requisições no mês.

## Abordagem técnica

### Constante de preços por modelo (no componente)
```typescript
const MODEL_PRICING = {
  'google/gemini-3-flash-preview': { inputPer1k: 0.00015, outputPer1k: 0.0006, avgCostPerReq: 0.005 },
  'google/gemini-2.5-flash': { inputPer1k: 0.00015, outputPer1k: 0.0006, avgCostPerReq: 0.004 },
  'gpt-4.1-2025-04-14': { inputPer1k: 0.002, outputPer1k: 0.008, avgCostPerReq: 0.025 },
  'gpt-4o-mini': { inputPer1k: 0.00015, outputPer1k: 0.0006, avgCostPerReq: 0.003 },
};
```

### Mapeamento funcionalidade → modelo (constante)
```typescript
const FUNCTION_MODEL_MAP = {
  'akuria_chat': 'google/gemini-3-flash-preview',
  'docgen_chat': 'gpt-4.1-2025-04-14',
  'ai-assistant:classify-risk': 'google/gemini-3-flash-preview',
  // etc.
};
```

### Cálculo automático do custo
Em vez do input manual, o custo por requisição será calculado como média ponderada: para cada funcionalidade no mês, multiplica-se o número de requisições pelo custo médio do modelo correspondente, e divide-se pelo total de requisições.

### UI Changes em `FinanceiroIATab.tsx`
- Remover o card com Input de custo manual
- Adicionar card "Modelos IA em Uso" com tabela: Modelo | Funções | Custo médio/req | Reqs no mês | Custo total
- O custo por requisição no KPI passa a ser calculado automaticamente
- Manter opção de "override" manual como toggle discreto para simulações

## Arquivo modificado
- `src/components/configuracoes/FinanceiroIATab.tsx`

