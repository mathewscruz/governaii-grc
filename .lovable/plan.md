## Objetivo
Garantir que **toda funcionalidade de IA do Akuris** esteja integrada ao saldo de créditos do plano da empresa, exibir um **banner global** quando os créditos zerarem, e mostrar um **selo informativo "consome 1 crédito"** em todo botão/ação que dispare IA.

## Diagnóstico atual

Backend:
- 9 das 10 funções com IA já chamam `consume_ai_credit` e respondem **HTTP 402** quando o saldo zera (ai-module-assistant, akuria-chat, analyze-document-adherence, analyze-evidence-against-requirement, calculate-assessment-score, docgen-chat, evidence-cross-match, populate-requirement-guidance, suggest-risk-treatment).
- **Lacuna**: `generate-email-content` (usada em campanhas de e-mail) chama o gateway e propaga 402, mas **não debita** o crédito da empresa.
- O wrapper `invokeEdgeFunction` mapeia 402 para um toast genérico; não diferencia "esgotado" de outros erros nem expõe o estado para a UI.

Frontend:
- Não existe hook que leia o saldo atual (`empresas.creditos_consumidos` vs `planos.creditos_franquia`).
- Não há banner global avisando o esgotamento.
- Botões de IA (gerar orientação, sugerir tratamento de risco, cross-match, AkurIA chat, gerar campanha, DocGen, recomendações IA, score de assessment) não comunicam o custo.

## O que será construído

### 1. Backend — fechar a única lacuna
- Adicionar `consume_ai_credit` em `generate-email-content` antes da chamada ao gateway, devolvendo 402 padronizado quando esgotado (mesmo padrão das outras 9 funções).

### 2. Hook de saldo `useAiCredits`
- Lê `empresas.creditos_consumidos` e `planos.creditos_franquia` da empresa do usuário.
- Expõe `{ franquia, consumidos, restantes, percentual, esgotado, loading, refetch }`.
- Realtime opcional via `supabase.channel` na tabela `empresas` para refletir o débito imediatamente após cada chamada.
- Fica em `src/hooks/useAiCredits.ts` e usa `empresa_id` síncrono do `useAuth().profile`.

### 3. Banner global de créditos esgotados
- Componente `AiCreditsExhaustedBanner` montado uma vez no `App.tsx` (logo abaixo do header), só aparece quando `esgotado === true`.
- Mensagem editorial com ícone proprietário Akuris: "Os créditos de IA do seu plano acabaram. Para continuar usando assistentes inteligentes, entre em contato com o administrador da sua conta." + CTA secundário "Ver meu plano" levando para `Configurações → Assinatura`.
- Super-admins veem versão alternativa com link para `Configurações → Créditos de IA`.

### 4. Tratamento global do 402 + atualização do wrapper
- `invokeEdgeFunction` passa a:
  - Detectar 402 lendo `error.context` da resposta da Edge Function.
  - Disparar `akurisToast` editorial específico ("Créditos de IA esgotados — fale com o administrador") em vez do toast genérico.
  - Emitir um evento `window.dispatchEvent('ai-credits-exhausted')` para o `useAiCredits` forçar refetch e o banner aparecer instantaneamente.
  - Após qualquer chamada bem-sucedida a função IA, disparar `ai-credit-consumed` para o hook decrementar localmente.

### 5. Componente `AiCostHint` (selo "consome 1 crédito")
- Pequeno badge inline reutilizável com tooltip:
  - Visual: chip discreto `Sparkles` + texto "1 crédito de IA" no tom `info`.
  - Tooltip: "Esta ação consome 1 crédito do plano. Saldo atual: X de Y."
- Variante `inline` (ao lado do botão) e `block` (acima de seções inteiras como AkurIA chat).
- Quando `esgotado`, o chip fica em tom `destructive` com texto "Sem créditos".

### 6. Integração do `AiCostHint` em todas as superfícies de IA
Pontos de aplicação levantados pelo mapeamento:

| Local | Ação | Onde colocar |
|---|---|---|
| `AkurIAChatbot.tsx` | Cada mensagem ao chat | Hint no input + bloqueio do envio se esgotado |
| `AIRecommendationsCard.tsx` (Gap Analysis) | Botão "Gerar recomendações" | Hint inline no botão |
| `RequirementDetailDialog.tsx` | "Regenerar orientação" + uploads (cross-match) | Hint perto do botão IA |
| `EvidenceLibraryHub` / `EvidenceReusePanel` | "Sugerir reaproveitamento" | Hint inline |
| `AdherenceAssessmentDialog.tsx` | Cálculo de score | Hint no CTA "Calcular" |
| `Assessment.tsx` | `calculate-assessment-score` | Hint no botão Calcular |
| `TratamentoForm.tsx` (Riscos) | "Sugerir tratamento com IA" | Hint inline |
| `DocGenDialog.tsx` | DocGen chat | Hint no header do diálogo |
| `EmailCampanhaEditor.tsx` | "Gerar conteúdo com IA" | Hint inline |
| `analyze-document-adherence` (módulo Documentos do GA) | Botão de análise | Hint inline |

Critérios para todos: usar `AkurisAIIcon` quando aplicável, manter stroke 1.5, respeitar tons editoriais (sem cores Tailwind cruas).

### 7. Bloqueio preventivo opcional (UX)
- Quando `esgotado === true`, o `AiCostHint` desabilita o botão associado via prop `disabled={esgotado}` e mostra tooltip "Créditos esgotados — fale com o administrador". Isso evita o erro 402 + retrabalho do usuário.

### 8. Memória do projeto
- Atualizar `mem://architecture/ai-credit/enforcement-standard` para incluir:
  - "Toda nova feature com IA deve usar `<AiCostHint />` ao lado do disparador."
  - "Wrapper `invokeEdgeFunction` é obrigatório — banner global depende dos eventos que ele emite."
  - "Adicionar `consume_ai_credit` antes do gateway em qualquer Edge Function nova com IA."

## Detalhes técnicos
- Tipos atuais (`integrations/supabase/types.ts`) já expõem `creditos_consumidos`, `plano_id` e `creditos_franquia` — não precisa migration.
- Realtime: requer publicar `empresas` no Realtime (já está, pois outras telas escutam) — verificar e ativar se faltar.
- Banner respeita o ThemeProvider (Light/Dark) e o `DensityProvider`.
- Nenhuma alteração em RLS é necessária; leitura do saldo já é permitida via policies de `empresas` para usuários da própria empresa.
- Sem novas dependências.

## Fora de escopo
- Compra de créditos via portal do usuário (continua sendo ação manual do super-admin em `CreditosIAManager`).
- Cobrança por consumo variável (continua 1 crédito por chamada).
