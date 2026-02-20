

# Avaliacao Completa do Modulo Due Diligence - Gaps e Plano de Melhorias

## Diagnostico Geral

O modulo tem uma base funcional solida: o fluxo completo de criar template, enviar avaliacao, fornecedor responder, e IA calcular score funciona. Porem, a experiencia do usuario e fragmentada, o visual e inconsistente entre as abas, e faltam funcionalidades criticas para uso real em producao.

---

## PROBLEMAS IDENTIFICADOS

### 1. CRITICO - Pagina Principal Sem Contexto (Layout de Abas Pobre)

**Problema:** O usuario entra e ve 3 abas genericas ("Fornecedores", "Avaliacoes", "Templates") sem nenhum dashboard, sem resumo, sem orientacao. Nao ha uma visao geral antes de clicar em qualquer aba. O componente `DueDiligenceDashboard` existe mas NAO e usado em nenhum lugar.

**Solucao:** Redesenhar a pagina principal para ter:
- Dashboard com stat cards relevantes no topo (sempre visivel, fora das abas)
- Cards de acoes rapidas: "Enviar Nova Avaliacao" (acao principal), "Criar Template", "Ver Relatorios"
- Lista de avaliacoes recentes que precisam de atencao (expiradas, pendentes ha muito tempo)
- Mover as 3 abas para baixo do dashboard

### 2. CRITICO - Upload de Arquivos do Fornecedor NAO Funciona

**Problema:** Na pagina `Assessment.tsx` (formulario do fornecedor), quando o tipo da pergunta e `arquivo`, o upload apenas salva o `file.name` como string na resposta. O arquivo NAO e realmente enviado para nenhum storage. Linha 863-868: `handleResponseChange(question.id, file.name)` - salva apenas o nome.

Da mesma forma, o upload de evidencias condicionais (linhas 900-927) tambem salva apenas `file.name`, sem upload real.

**Solucao:**
- Implementar upload real para Supabase Storage (bucket `due-diligence-evidencias`)
- Salvar a URL do arquivo na coluna `arquivo_url` da tabela `due_diligence_responses`
- Na edge function `calculate-assessment-score`, ja existe logica para considerar `arquivo_url`, entao o score ja seria beneficiado

### 3. CRITICO - Edge Function Usa OpenAI Diretamente (Deveria Usar Lovable AI)

**Problema:** A edge function `calculate-assessment-score` chama diretamente `api.openai.com` com `OPENAI_API_KEY`. Deveria usar o Lovable AI Gateway para consistencia e para nao depender de chave OpenAI externa.

**Solucao:** Migrar para `https://ai.gateway.lovable.dev/v1/chat/completions` com `LOVABLE_API_KEY` (ja disponivel automaticamente).

### 4. IMPORTANTE - Criar Avaliacao Exige Muitos Cliques

**Problema:** Para enviar uma avaliacao, o usuario precisa:
1. Ir na aba Templates, criar um template
2. Adicionar perguntas uma a uma
3. Voltar, ir na aba Avaliacoes, clicar "Nova Avaliacao"
4. Selecionar o template, digitar dados do fornecedor
5. Enviar

Nao ha templates pre-prontos para guiar o usuario iniciante. Os templates "padrao" existem na tabela mas sao criados por empresa, nao sao globais.

**Solucao:**
- Adicionar "Templates Sugeridos" na aba Templates (Seguranca da Informacao, LGPD Fornecedores, ESG Basico) que o usuario pode clonar com 1 clique
- Simplificar o fluxo: permitir criar avaliacao diretamente da aba Fornecedores (ja existe botao, mas abre dialog generico sem template pre-selecionado)
- Wizard de criacao de avaliacao: passo 1 escolher template, passo 2 escolher fornecedor, passo 3 configurar prazo e enviar

### 5. IMPORTANTE - Perguntas Sem Agrupamento por Secao

**Problema:** As perguntas do template sao uma lista plana. Em questionarios reais de due diligence, as perguntas sao agrupadas por secao (ex: "Seguranca Fisica", "Seguranca Logica", "Gestao de Incidentes"). Nao existe campo `secao` ou `categoria` nas perguntas.

**Solucao:**
- Adicionar campo `secao` (text) na tabela `due_diligence_questions`
- No QuestionsManager, agrupar perguntas por secao
- No formulario do fornecedor (Assessment.tsx), exibir secoes como separadores visuais
- Na analise de score da IA, gerar breakdown por secao ao inves de "categoria generica"

### 6. IMPORTANTE - Formulario do Fornecedor (Assessment.tsx) - Melhorias Visuais

**Problema:**
- O logo da empresa e repetido 3 vezes na mesma pagina (header, card do questionario, titulo)
- Progress bar nao mostra quais secoes ja foram respondidas
- Nao ha indicador visual de perguntas obrigatorias nao respondidas
- Pagina de "Questionario Concluido" e duplicada (linhas 591-619 e 623-685 sao quase identicas)

**Solucao:**
- Mostrar logo apenas 1 vez no header fixo
- Adicionar stepper lateral ou sidebar com secoes e status de cada uma
- Marcar perguntas obrigatorias nao respondidas com borda vermelha
- Remover duplicacao da tela de conclusao

### 7. IMPORTANTE - Fornecedores Sem Historico de Avaliacoes Visivel

**Problema:** Na aba Fornecedores, o card do fornecedor mostra apenas nome/email/cnpj. Nao ha indicador visual de quantas avaliacoes ele ja teve, qual o ultimo score, se tem avaliacoes pendentes. O botao "Ver Avaliacoes" muda de aba mas nao e intuitivo.

**Solucao:**
- Adicionar mini-resumo no card do fornecedor: "3 avaliacoes | Ultimo score: 78% | Status: Aprovado"
- Badge de risco no card: Verde (score >= 80), Amarelo (60-79), Vermelho (< 60), Cinza (nunca avaliado)
- Ao clicar no fornecedor, abrir um drawer/dialog com historico completo de avaliacoes

### 8. MELHORIA - Configuracao de Prazo na Criacao de Avaliacao

**Problema:** O prazo de expiracao e fixo em 30 dias (hardcoded na linha 152 do AssessmentDialog). O usuario nao pode escolher.

**Solucao:** Adicionar campo "Prazo para resposta" no dialog de criacao com opcoes: 7 dias, 15 dias, 30 dias, 60 dias, 90 dias, ou data personalizada.

### 9. MELHORIA - Exportacao de Relatorios Nao Funciona

**Problema:** Os botoes de exportacao em `ReportsView.tsx` (PDF, Excel, CSV) nao tem funcionalidade implementada - sao apenas botoes visuais. O `ReportsSidebar` exporta apenas JSON basico.

**Solucao:** Implementar exportacao PDF real usando jspdf (ja instalado) com:
- Capa com logo e nome da empresa
- Score geral e breakdown por categoria
- Lista de fornecedores com scores
- Detalhes das avaliacoes concluidas

### 10. MELHORIA - Campo "Categoria" do Fornecedor Nao e Utilizavel

**Problema:** O formulario de fornecedor tem campo `categoria` na tabela mas nao aparece no formulario de criacao/edicao. Nao ha como categorizar fornecedores (TI, Servicos, Financeiro, etc.).

**Solucao:** Adicionar campo "Categoria" no dialog de criacao de fornecedor com opcoes pre-definidas + custom.

---

## Secao Tecnica - Resumo de Implementacao

### Migrations:
1. `ALTER TABLE due_diligence_questions ADD COLUMN secao text DEFAULT 'Geral';` - Agrupamento por secao
2. Criar bucket de storage: `INSERT INTO storage.buckets (id, name, public) VALUES ('due-diligence-evidencias', 'due-diligence-evidencias', false);` + RLS policies

### Edge Functions:
- `supabase/functions/calculate-assessment-score/index.ts` - Migrar de OpenAI direto para Lovable AI Gateway

### Novos componentes:
- Nenhum componente totalmente novo; todas as melhorias sao refatoracoes de componentes existentes

### Arquivos modificados:
- `src/pages/DueDiligence.tsx` - Adicionar dashboard no topo, fora das abas
- `src/pages/Assessment.tsx` - Upload real de arquivos, remover logo duplicado, validacao visual de obrigatorias
- `src/components/due-diligence/AssessmentDialog.tsx` - Campo de prazo configuravel
- `src/components/due-diligence/FornecedoresManager.tsx` - Mini-resumo de avaliacoes no card, campo categoria
- `src/components/due-diligence/QuestionsManager.tsx` - Campo secao, agrupamento visual
- `src/components/due-diligence/TemplatesManager.tsx` - Templates sugeridos
- `src/components/due-diligence/ReportsSidebar.tsx` - Exportacao PDF real
- `supabase/functions/calculate-assessment-score/index.ts` - Migrar para Lovable AI

### Ordem de implementacao:
1. Upload real de arquivos (fix critico - sem isso o score da IA e prejudicado)
2. Migrar edge function para Lovable AI
3. Dashboard no topo da pagina
4. Campo secao nas perguntas + agrupamento
5. Melhorias no formulario do fornecedor (Assessment.tsx)
6. Mini-resumo de avaliacoes no card do fornecedor
7. Prazo configuravel na criacao de avaliacao
8. Categoria do fornecedor
9. Exportacao PDF
10. Templates sugeridos

