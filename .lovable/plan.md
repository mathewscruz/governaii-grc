

# Otimização de Modelos IA + Integração Claude Anthropic

## Situação Atual

O sistema não possui `ANTHROPIC_API_KEY` nem `OPENAI_API_KEY` nos secrets do Supabase. Há apenas `LOVABLE_API_KEY`. As Edge Functions `docgen-chat` e `suggest-risk-treatment` referenciam `OPENAI_API_KEY` diretamente do `Deno.env`, o que significa que essa chave foi configurada em outro lugar ou essas funções podem estar falhando.

## Plano de Otimização

### Mapeamento Final: Funcionalidade → Modelo Ideal

| Funcionalidade | Modelo Atual | Modelo Proposto | Razão |
|---|---|---|---|
| Análise Aderência Documentos | gemini-3-flash | **Claude 3.5 Sonnet** (Anthropic) | Melhor em análise documental longa, citação precisa, raciocínio jurídico |
| DocGen Chat + Geração | gpt-4.1 (OpenAI) | **Claude 3.5 Sonnet** (Anthropic) | Superior em geração de texto estruturado PT-BR, elimina OPENAI_API_KEY |
| Orientação Requisitos (3 calls) | gemini-2.5-flash (x3) | **gemini-3-flash-preview** (1 call) | Consolidar 3→1 chamada, ~66% economia |
| Score Due Diligence | gemini-2.5-flash | **gemini-3-flash-preview** | Unificar, modelo mais recente |
| Sugestão Tratamento Risco | gpt-4o-mini (OpenAI) | **gemini-3-flash-preview** | Elimina OPENAI_API_KEY, custo equivalente |
| AkurIA Chat | gemini-3-flash | (sem mudança) | Já ideal |
| AI Module Assistant | gemini-3-flash | (sem mudança) | Já ideal |

### Onde o Claude agrega valor real

1. **Análise de Aderência de Documentos** — Analisa documentos longos (até 30K chars) contra 60+ requisitos. Claude é reconhecidamente o melhor em: compreensão de documentos extensos, citação precisa de trechos, raciocínio de conformidade jurídica/regulatória.

2. **DocGen (Geração de Documentos)** — Gera políticas, procedimentos e manuais corporativos completos. Claude produz texto mais natural e estruturado em português, com melhor aderência a templates complexos.

### Custo estimado Claude

| Modelo | Input/1M tokens | Output/1M tokens | Custo médio/req (BRL) |
|---|---|---|---|
| Claude 3.5 Sonnet | US$ 3.00 | US$ 15.00 | ~R$ 0.20 |

Comparação: gemini-3-flash ~R$ 0.03, GPT-4.1 ~R$ 0.15. Claude custa mais que Flash mas menos que GPT-4.1 para a mesma qualidade superior.

## Arquivos a Modificar

| Arquivo | Mudança |
|---|---|
| **Secret** | Adicionar `ANTHROPIC_API_KEY` via tool |
| `supabase/functions/analyze-document-adherence/index.ts` | Trocar Lovable Gateway → API Anthropic (Claude 3.5 Sonnet) |
| `supabase/functions/docgen-chat/index.ts` | Trocar OpenAI → API Anthropic (Claude 3.5 Sonnet) |
| `supabase/functions/suggest-risk-treatment/index.ts` | Trocar OpenAI → Lovable Gateway (gemini-3-flash-preview) |
| `supabase/functions/calculate-assessment-score/index.ts` | Trocar gemini-2.5-flash → gemini-3-flash-preview |
| `supabase/functions/populate-requirement-guidance/index.ts` | Consolidar 3 chamadas → 1 + trocar para gemini-3-flash-preview |
| `src/components/configuracoes/FinanceiroIATab.tsx` | Adicionar Claude ao MODEL_PRICING + atualizar mapeamentos |

## Resumo de Economia Estimada

- **DocGen**: R$ 0.15 → R$ 0.20 (sobe, mas qualidade muito superior e elimina dependência OpenAI)
- **Análise Documentos**: R$ 0.05 → R$ 0.20 (sobe, mas precisão significativamente melhor)
- **Orientação Requisitos**: R$ 0.075 → R$ 0.03 (cai 60%, consolidação 3→1)
- **Sugestão Risco**: R$ 0.02 → R$ 0.03 (equivalente, elimina OPENAI_API_KEY)
- **Score DD**: R$ 0.025 → R$ 0.03 (equivalente, unifica)
- **Resultado**: Remove dependência total do `OPENAI_API_KEY`, fica com 2 provedores (Lovable/Gemini + Anthropic/Claude), cada um no que faz melhor

