

# Painel Financeiro IA — Visão de Rentabilidade (super_admin)

## Objetivo
Nova aba "Financeiro IA" em Configurações, visível apenas para super_admin, com análise de rentabilidade do consumo de IA por empresa, por funcionalidade, e recomendações automáticas via IA.

## Dados Disponíveis
- `creditos_consumo`: cada requisição IA registrada (empresa_id, funcionalidade, created_at)
- `empresas` + `planos`: receita mensal por empresa e franquia de créditos
- `stripe-plans.ts`: preços por plano (R$ 99, 249, 499)
- Custo estimado por requisição IA: ~US$ 0.01-0.05 por chamada ao gateway (configurável como constante)

## Estrutura do Componente

### `src/components/configuracoes/FinanceiroIATab.tsx`

**KPI Cards (topo):**
- Receita Total Mensal (soma dos planos ativos)
- Custo Estimado IA (total de requisições x custo médio por req)
- Margem Bruta (receita - custo)
- Custo Médio por Requisição

**Tabela principal — Rentabilidade por Empresa:**
| Empresa | Plano | Receita/mês | Requisições | Custo Estimado | Margem | Status |
Cada linha mostra se a empresa é rentável (verde), no limite (amarelo) ou deficitária (vermelho).

**Gráfico de barras — Consumo por Funcionalidade:**
Usando Recharts, mostra quais funcionalidades (akuria_chat, docgen_chat, suggest_risk_treatment, etc.) mais consomem.

**Botão "Análise IA":**
Chama a Edge Function `ai-module-assistant` com action `pricing_analysis`, passando os dados agregados. Retorna recomendações em texto sobre:
- Se o pricing está cobrindo custos
- Quais empresas estão consumindo acima da média
- Sugestão de ajuste de preço ou franquia

### Edge Function update: `ai-module-assistant/index.ts`
Adicionar novo case `pricing_analysis` que recebe os dados financeiros e retorna análise estruturada.

### Configurações editáveis
Constante de custo por requisição (default R$ 0.15) editável no componente para simular cenários.

## Arquivos

| Ação | Arquivo |
|------|---------|
| Criar | `src/components/configuracoes/FinanceiroIATab.tsx` |
| Editar | `src/pages/Configuracoes.tsx` — nova aba "Financeiro IA" (super_admin) |
| Editar | `supabase/functions/ai-module-assistant/index.ts` — novo case `pricing_analysis` |

Sem alterações no banco de dados — usa tabelas existentes.

