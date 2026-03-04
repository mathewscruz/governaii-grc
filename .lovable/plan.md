

# Plano: Orientação Detalhada Auto-Gerada por Requisito (On-Demand + Cache em DB)

## Problema
O painel esquerdo do dialog mostra apenas a descrição curta do requisito e uma mensagem vazia "Orientações detalhadas ainda não foram geradas" (Anexo 1). O usuário esperaria ver conteúdo rico como nos Anexos 2-4: explicação em linguagem simples, por que importa para a empresa, exemplos reais, fatores a analisar, etc.

## Solução

### A. Geração automática on-demand no dialog
Quando o usuário abre um requisito e `orientacao_implementacao IS NULL`:
1. Dispara automaticamente uma chamada à Edge Function para gerar o conteúdo
2. Exibe skeleton/loading no painel esquerdo enquanto gera
3. Salva o resultado nos campos `orientacao_implementacao` e `exemplos_evidencias` da tabela `gap_analysis_requirements`
4. Nas próximas aberturas, o conteúdo já está no banco -- zero custo de IA

### B. Reescrever o prompt da Edge Function
O prompt atual gera conteúdo curto e genérico (3-5 parágrafos + lista de evidências). O novo prompt deve gerar conteúdo no formato rico dos exemplos:
- **O que significa este requisito** (linguagem simples, analogias)
- **Por que isso importa para sua empresa** (exemplos reais, consequências)
- **O que acontece se você não faz isso** (riscos concretos)
- **Fatores que você deve analisar** (listas organizadas)
- **Exemplos de evidências aceitas** (lista prática)
- **Dicas de implementação** (passos concretos)

O conteúdo será salvo como **Markdown** no campo `orientacao_implementacao` para permitir formatação rica (headers, bold, listas, separadores).

### C. Migrar Edge Function para Lovable AI Gateway
A função atual usa `api.openai.com` com `OPENAI_API_KEY`. Migrar para `ai.gateway.lovable.dev` com `LOVABLE_API_KEY` que já está disponível no projeto.

### D. Renderizar Markdown no painel esquerdo
Ao invés de exibir texto plano com `whitespace-pre-line`, renderizar o conteúdo com formatação: headers em negrito, listas com bullets, separadores, etc. Usar parsing simples de Markdown (sem biblioteca externa) para manter leve.

### E. Adicionar botão "Regenerar" discreto
Um botão pequeno no topo do painel esquerdo para que o admin possa forçar regeneração do conteúdo caso necessário.

## Arquivos Afetados

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/populate-requirement-guidance/index.ts` | Novo prompt rico + migração para Lovable AI Gateway. Aceitar `requirement_id` para geração individual |
| `src/components/gap-analysis/nist/NISTRequirementDetailDialog.tsx` | Trigger auto-geração quando orientação é null; renderizar Markdown; botão regenerar |

## Fluxo Técnico

```text
Usuário abre requisito
  └─ loadData() busca orientacao_implementacao
       ├─ Se tem conteúdo → renderiza Markdown no painel esquerdo
       └─ Se NULL → mostra skeleton + chama Edge Function
            └─ Edge Function gera via Lovable AI Gateway
                 └─ Salva no DB → atualiza state → renderiza
```

