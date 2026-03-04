

# Plano: UX Intuitiva do Gap Analysis — Jornada Guiada + Dialog Split-Panel

## Problemas Identificados

### 1. Jornada de Certificação pouco útil
A barra de progresso atual é estática e genérica. Mostra 4 etapas sem orientar o usuário sobre **o que fazer agora**. Não gera ação.

### 2. Score card desproporcional
O donut (96px) + texto ocupam ~30% de um card que tem 50% da largura da tela. Muito espaço vazio.

### 3. Dialog de detalhe precisa ser split-panel
O pedido é claro: lado esquerdo = contexto educativo (descrição, orientação, exemplos, o que fazer), lado direito = formulário de avaliação. Isso elimina o botão "Assistente IA" e reduz consumo de créditos.

### 4. Orientação estática pré-carregada
Em vez de chamar a IA a cada clique, usar os campos `orientacao_implementacao` e `exemplos_evidencias` que já existem na tabela `gap_analysis_requirements`. Para requisitos que não têm esses campos populados, gerar em batch via Edge Function (one-time) e salvar no banco.

## Mudanças Propostas

### A. Substituir JourneyProgressBar por banner de ação contextual
Em vez de uma barra de 4 etapas estática, mostrar um **banner slim de próxima ação** que muda conforme o estado:
- 0 avaliados: "Comece avaliando os requisitos — clique em qualquer linha para iniciar"
- <50% avaliados: "Continue avaliando — X de Y concluídos. Foque nos obrigatórios primeiro."
- >50% sem planos de ação: "Crie planos de ação para os X itens não conformes"
- >80% conforme: "Sua organização está pronta para auditoria externa"

Compacto: 1 linha com ícone + texto + botão de ação. Sem o stepper visual pesado.

### B. Aumentar impacto visual do Score card
- Donut maior (120px) com texto centralizado mais legível
- Adicionar barra de progresso de avaliação (117/117) abaixo do donut
- Reorganizar layout interno para preencher o card

### C. Dialog split-panel (lado esquerdo educativo + lado direito formulário)
Transformar o `NISTRequirementDetailDialog` de `max-w-3xl` para `max-w-6xl` com layout de 2 colunas:

**Coluna esquerda (40%)** — Contexto e orientação (read-only):
- Código + título + badge de status
- Descrição do requisito
- "O que este controle exige" (campo `orientacao_implementacao`)
- "Exemplos de evidências aceitas" (campo `exemplos_evidencias`)
- "Perguntas de autoavaliação" (lista estática por categoria/framework)
- Tudo em linguagem simples, sem jargão técnico

**Coluna direita (60%)** — Ações do usuário:
- Responsável + Prazo + Observações (fixo no topo)
- Plano de Ação (colapsável)
- Evidências (colapsável)
- Riscos Vinculados (colapsável)
- Histórico (colapsável)

**Remover** o botão "Assistente IA" e a seção colapsável de IA. As informações que ele gera (`explicacao_simples`, `exemplos_evidencias`, `dicas_implementacao`) já existem nos campos estáticos do requisito ou devem ser pré-populadas.

### D. Pré-popular orientações para requisitos sem conteúdo
Criar uma Edge Function `populate-requirement-guidance` que:
1. Busca requisitos onde `orientacao_implementacao IS NULL`
2. Chama a IA uma vez por requisito para gerar orientação + exemplos
3. Salva no campo `orientacao_implementacao` e `exemplos_evidencias` da `gap_analysis_requirements`
4. Executada uma vez pelo admin, ou automaticamente ao criar um framework

Isso é um **custo único** por framework, não por empresa nem por clique.

## Arquivos Afetados

| Arquivo | Mudança |
|---------|---------|
| `src/components/gap-analysis/JourneyProgressBar.tsx` | Reescrever como banner de ação contextual slim |
| `src/components/gap-analysis/GenericScoreDashboard.tsx` | Donut maior, layout mais preenchido |
| `src/components/gap-analysis/nist/NISTRequirementDetailDialog.tsx` | Split-panel: esquerda educativo, direita formulário. Remover seção IA |
| `supabase/functions/populate-requirement-guidance/index.ts` | Nova Edge Function para popular orientações em batch |

## Resultado Esperado
- Usuário leigo abre um requisito e vê imediatamente **o que precisa fazer** sem gastar créditos de IA
- Jornada de certificação se torna um guia acionável, não decorativo
- Score card aproveita o espaço visual disponível
- Dialog profissional estilo "consultor ao lado" — informação à esquerda, ação à direita

