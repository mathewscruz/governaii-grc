

# Tornar o Gap Analysis um Consultor Virtual de Certificacao

## Diagnostico: O que falta para substituir um auditor Big4?

Analisei minuciosamente todo o fluxo do modulo e identifiquei **5 lacunas criticas** que impedem um usuario leigo de conduzir uma certificacao sozinho:

### 1. Requisitos sem orientacao (0% preenchido)
Os dados no banco mostram que **nenhum dos 298 requisitos** (ISO 27001: 117, NIST CSF: 116, LGPD: 65) possui `orientacao_implementacao` ou `exemplos_evidencias` preenchidos. Isso significa que quando o usuario abre o detalhe de um requisito, os cards "Como implementar este requisito?" e "Evidencias Sugeridas" (linhas 351-385 do `NISTRequirementDetailDialog`) **nunca aparecem**. O usuario fica sozinho diante de um titulo tecnico como "4.1 - Entendendo a organizacao e seu contexto" sem saber o que fazer.

**Um auditor Big4 explicaria exatamente o que aquele requisito exige e daria exemplos concretos. Nosso sistema nao faz isso.**

### 2. Nenhuma orientacao contextual ao iniciar um framework
Quando o usuario clica em um framework pela primeira vez, ele cai direto na tabela de requisitos com score 0%. Nao ha:
- Explicacao do que e o framework e para que serve
- Roteiro sugerido de por onde comecar
- Estimativa de esforco ou timeline
- Dicas de quick wins

**Um consultor faria uma reuniao de kick-off explicando o framework e o roadmap. Nosso sistema pula direto para a execucao.**

### 3. IA existe mas nao esta integrada no fluxo de avaliacao
O sistema tem a AkurIA (chatbot generico) e o `ai-module-assistant` (com acoes como classify-risk, suggest-controls), mas **nenhuma IA esta integrada diretamente no fluxo de avaliacao de requisitos**. O usuario precisa avaliar cada requisito manualmente sem assistencia inteligente.

**Um auditor analisaria a situacao da empresa e diria "voce provavelmente ja atende parcialmente este requisito porque tem X implementado". Nosso sistema nao faz nenhuma inferencia.**

### 4. Falta de "proximo passo" apos avaliacoes
Apos o usuario marcar varias avaliacoes, nao ha nenhum painel que diga:
- "Voce esta 40% conforme. Para chegar a 70%, foque nestes 5 requisitos prioritarios"
- "Estes requisitos estao parciais e podem ser resolvidos com acoes simples"
- Priorizacao inteligente baseada em peso/impacto

### 5. Analise de Documentos desconectada da avaliacao manual
A aba "Analise de Documentos" analisa PDFs via IA mas **nao alimenta automaticamente** a avaliacao manual. Os resultados ficam isolados -- o usuario precisa manualmente olhar o resultado da analise de documento e ir atualizar cada requisito na aba manual.

---

## Plano de Implementacao

### Fase 1: Assistente IA por Requisito (maior impacto)

**Novo botao "Pedir ajuda a IA" no `NISTRequirementDetailDialog`**

Quando o usuario abre o detalhe de um requisito e nao sabe como avaliar, ele clica em um botao que chama o `ai-module-assistant` com uma nova action `explain-requirement`. A IA retorna:

- O que este requisito exige em linguagem simples
- Exemplos praticos de evidencias aceitas por auditores
- Perguntas que o usuario deve fazer internamente para determinar conformidade
- Sugestao de status baseada em praticas comuns de empresas do mesmo porte

**Arquivos afetados:**
- `supabase/functions/ai-module-assistant/index.ts` -- adicionar action `explain-requirement`
- `src/components/gap-analysis/nist/NISTRequirementDetailDialog.tsx` -- adicionar botao e card de resposta IA

### Fase 2: Painel de Recomendacoes Inteligentes

**Novo componente `AIRecommendationsCard` no dashboard do framework**

Apos o usuario ter avaliado ao menos 10% dos requisitos, um card aparece acima da tabela com:
- Top 5 requisitos prioritarios para focar (baseado em peso + status nao_conforme)
- Quick wins: requisitos parciais que precisam de pouco esforco para virar conforme
- Estimativa de score se os top 5 forem resolvidos
- Botao "Gerar Plano de Acao Automatico" que cria planos de acao para os itens criticos

**Arquivos afetados:**
- `src/components/gap-analysis/AIRecommendationsCard.tsx` -- novo componente
- `src/pages/GapAnalysisFrameworkDetail.tsx` -- integrar na aba "Avaliacao Manual"
- `supabase/functions/ai-module-assistant/index.ts` -- nova action `framework-recommendations`

### Fase 3: Onboarding Guiado por Framework

**Tela de boas-vindas ao entrar em um framework pela primeira vez**

Se `evaluatedRequirements === 0`, ao inves de mostrar direto o dashboard vazio, mostrar:
1. Card explicativo: "O que e a ISO 27001?", "Quanto tempo leva?", "Quanto custa tipicamente?"
2. Roteiro sugerido: "Comece pela Lideranca (capitulo 5), depois Contexto (capitulo 4)"
3. Checklist interativo de pre-requisitos ("Voce ja tem uma politica de seguranca?")
4. Botao "Comecar Avaliacao Guiada" que leva ao primeiro requisito

**Arquivos afetados:**
- `src/components/gap-analysis/FrameworkOnboarding.tsx` -- novo componente
- `src/pages/GapAnalysisFrameworkDetail.tsx` -- renderizar condicionalmente quando `evaluatedRequirements === 0`

### Fase 4: Conectar Analise de Documentos com Avaliacao Manual

**Botao "Aplicar resultados na avaliacao" no `AdherenceResultView`**

Quando a analise de documentos termina e identifica requisitos conformes/parciais, o usuario pode clicar um botao que automaticamente atualiza os status na avaliacao manual correspondente. Isso evita trabalho duplicado e torna a analise de documentos realmente util.

**Arquivos afetados:**
- `src/components/gap-analysis/adherence/AdherenceResultView.tsx` -- adicionar botao e logica de sincronizacao
- Logica de upsert em `gap_analysis_evaluations` baseada nos resultados de `gap_analysis_adherence_details`

---

## Resumo de Prioridade

| Fase | Impacto | Esforco | Descricao |
|------|---------|---------|-----------|
| 1 | Altissimo | Medio | IA explica cada requisito e sugere como avaliar |
| 2 | Alto | Medio | Painel de recomendacoes e priorizacao inteligente |
| 3 | Alto | Baixo | Onboarding guiado para novos frameworks |
| 4 | Medio | Baixo | Conectar analise de documentos com avaliacao manual |

### Arquivos Novos
- `src/components/gap-analysis/AIRecommendationsCard.tsx`
- `src/components/gap-analysis/FrameworkOnboarding.tsx`

### Arquivos Modificados
- `supabase/functions/ai-module-assistant/index.ts` (2 novas actions)
- `src/components/gap-analysis/nist/NISTRequirementDetailDialog.tsx`
- `src/pages/GapAnalysisFrameworkDetail.tsx`
- `src/components/gap-analysis/adherence/AdherenceResultView.tsx`

