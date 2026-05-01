
# Refatoração do Popup de Detalhes do Requisito (Gap Analysis)

## Problema atual

O popup mistura informações de leitura (orientação) com formulário de avaliação sem hierarquia visual. O status de conformidade — informação central — não é editável dentro do popup, o "Diagnóstico Rápido" fica enterrado no painel esquerdo, e os blocos do painel direito têm peso visual igual, deixando o usuário sem saber por onde começar.

## Objetivo

Transformar o popup em uma **jornada de avaliação numerada** onde o usuário: (1) entende o requisito, (2) responde diagnóstico ou define status manualmente, (3) anexa evidência (com IA), (4) cria plano de ação se não-conforme, (5) preenche detalhes administrativos. Status editável inline, sem precisar fechar e voltar à tabela.

## Mudanças no arquivo `RequirementDetailDialog.tsx`

### 1. Header reformulado (Status Bar no topo)

Logo abaixo do título do dialog, adicionar uma **barra de status persistente** que substitui a tira atual de badges "Obrigatório / Peso 3":

```text
┌───────────────────────────────────────────────────────────────┐
│ [Shield] 4.1 — Entendendo a organização e seu contexto    [X] │
├───────────────────────────────────────────────────────────────┤
│ Status:  [Conforme] [Parcial] [Não Conforme] [N/A]           │
│           ↑ ativo (verde)                                     │
│ Obrigatório · Peso 3 · Categoria: Contexto da Organização    │
└───────────────────────────────────────────────────────────────┘
```

- 4 botões segmentados (success / warning / destructive / secondary) — clique muda o status imediatamente, salva no banco em background, atualiza a tabela ao fechar.
- Linha secundária com Obrigatório, Peso, Categoria em texto pequeno.
- Toast ao mudar: "Status atualizado para Conforme".

### 2. Painel esquerdo — apenas leitura/educação

Remover o "Diagnóstico Rápido" daqui (vai para o painel direito). Deixa só:
- Orientação do Requisito (markdown da IA)
- Exemplos de Evidências Aceitas
- Botão Regenerar
- Tipografia mais respirada: `text-[13px] leading-7` em parágrafos, espaçamento maior entre seções.

Largura passa de `w-[40%]` para `w-[42%]` e dialog vai para `size="2xl"` (max-w-7xl) — dá ~1280px em telas grandes, espaço real para os dois painéis.

### 3. Painel direito — jornada numerada em 5 passos

Substituir a estrutura atual ("bloco fixo + divisor de colapsáveis") por **steps visualmente numerados**, cada um com indicador de completude:

```text
┌─ PAINEL DIREITO (w-[58%]) ──────────────────────────────────┐
│                                                              │
│ ① Avaliar Conformidade                          [✓ definido]│
│   ▸ Diagnóstico Rápido (perguntas → status sugerido)        │
│   ▸ Botão "Aplicar sugestão" preenche o status do header    │
│                                                              │
│ ② Evidências                                       [2 itens]│
│   ▸ Hub: Gerar com IA · Anexar arquivo · Adicionar link     │
│   ▸ Lista de evidências com Validar com IA                  │
│                                                              │
│ ③ Plano de Ação                  [condicional: se ≠ Conforme]│
│   ▸ Card do plano vinculado OU botão Criar Plano            │
│   ▸ Notas do Plano (textarea)                               │
│                                                              │
│ ④ Detalhes da Avaliação                                     │
│   ▸ Responsável (UserSelect) · Prazo (date)                 │
│   ▸ Observações (textarea)                                  │
│                                                              │
│ ⑤ Vínculos & Histórico                              [colap.]│
│   ▸ Riscos vinculados                                        │
│   ▸ Histórico de alterações                                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

Cada step é um `<section>` com:
- Número em círculo colorido (success se completo, primary se atual, muted se vazio)
- Título em `font-semibold`
- Badge à direita indicando estado ("✓ definido", "2 itens", "Sem plano", "Pendente")
- Conteúdo expandido por padrão nos steps 1-4; step 5 colapsado.

Lógica de estado:
- Step 1 ✓ quando `conformity_status` ≠ `nao_avaliado`
- Step 2 ✓ quando `evidence_files.length > 0`
- Step 3 ✓ quando há plano vinculado OU status = Conforme/N-A (não obrigatório)
- Step 4 ✓ quando responsável + prazo preenchidos

### 4. Reposicionamento do Diagnóstico Rápido

Move-se do painel esquerdo para dentro do **Step 1 (Avaliar Conformidade)** no painel direito. Quando o usuário responde as perguntas:
- O card "Status sugerido" mostra a sugestão
- Botão **"Aplicar como status"** faz set do status na barra do topo automaticamente
- Mantém-se a lógica atual de cálculo ponderado

### 5. Plano de Ação — só aparece quando faz sentido

Hoje o `Plano de Ação` aparece como collapsible dentro do divisor. Novo comportamento:
- Step 3 fica oculto se status = `conforme` ou `nao_aplicavel`
- Aparece com badge `warning` se status = `parcial` ou `nao_conforme` e ainda não há plano
- Textarea "Notas do Plano" vira sub-campo do step (não compete com Observações)

### 6. Footer contextual

CTA do footer muda de label conforme situação:
- Status vazio → "Salvar rascunho" (variant outline)
- Status definido + step 4 incompleto → "Salvar avaliação"
- Tudo preenchido → "Concluir avaliação" (variant default, success-tinted)

Botão Cancelar permanece como ghost à esquerda.

### 7. Persistência do status inline

Adicionar handler `handleStatusChange(newStatus)` que faz upsert imediato em `gap_analysis_evaluations` com `.eq('empresa_id', empresaId)` (regra Akuris). Reutiliza a lógica que já existe na `GenericRequirementsTable` (`handleStatusChange` em linha ~189). Após sucesso:
- Atualiza `requirement.conformity_status` local
- Dispara `onClose`-like callback opcional `onStatusChange(newStatus)` para a tabela atualizar sem refetch full
- Toast Sonner com a mudança

## Detalhes técnicos

**Componentes novos (inline no arquivo, não criar arquivos novos)**:
- `<StatusSegmentedControl value, onChange, disabled>` — 4 botões com tokens success/warning/destructive/secondary
- `<JourneyStep number, title, status, badge, defaultOpen, children>` — wrapper visual numerado

**Tokens usados** (do `gap-analysis-tokens.ts` já existente):
- `STATUS_BADGE_VARIANT`, `STATUS_LABEL`, `STATUS_TEXT_CLASS`
- Stroke 1.5 mantido em todos os ícones (assinatura Akuris)

**Mudanças de tamanho**:
- `size="xl"` → `size="2xl"` no `DialogShell`
- Painel esquerdo: `md:w-[42%]`, painel direito: `md:w-[58%]`
- `max-h-[60vh]` removido das ScrollAreas (DialogShell já gerencia altura via `max-h-[92vh]`)

**Não muda**:
- Edge function `analyze-evidence-against-requirement`
- Edge function `populate-requirement-guidance`
- Schema do banco
- Lógica de scoring
- DocGen unificado (`useDocGen`)

**Compatibilidade**:
- Props do componente permanecem as mesmas (`open`, `onOpenChange`, `requirement`, `frameworkId`, `onClose`)
- Caller (`GenericRequirementsTable`) não precisa de mudanças, exceto adicionar prop opcional `onStatusChange` para refletir mudanças inline sem refetch

## Resultado esperado

- Status visível e editável em 1 clique no topo
- Fluxo natural top-down: ler → avaliar → evidenciar → planejar → detalhar
- Diagnóstico Rápido posicionado onde gera valor (decisão de status)
- Plano de Ação só ocupa espaço quando relevante
- 30% mais espaço útil com dialog 2xl
- CTA do footer comunica o que vai acontecer
