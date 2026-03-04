

# Análise: Documento de Contexto vs. Estado Atual do Gap Analysis

## Mapeamento completo das 13 sugestões do documento

| # | Sugestão do Documento | Status Atual | Veredicto |
|---|----------------------|-------------|-----------|
| 1 | **Onboarding da Organização** (setor, porte, sistemas, objetivo, data alvo) | Temos `OnboardingWizard` mas focado em setup inicial da conta, não do contexto de compliance | **Melhorar** — Adicionar campos de setor/porte/objetivo no perfil da empresa para alimentar contexto da IA |
| 2 | **Tela de Requisito Split-Panel** com seções fixas de IA | **Já temos** — `NISTRequirementDetailDialog` com split-panel: esquerda (orientação IA, evidências aceitas) e direita (formulário de avaliação) | **OK — já implementado** |
| 3 | **Integração bidirecional com Riscos** | **Já temos** — O dialog tem seção "Riscos Vinculados" com checkboxes ligando a `gap_evaluation_risks` | **OK — já implementado** |
| 4 | **Plano de Ação com geração automática por IA** | **Parcial** — Temos criação de plano de ação vinculado, mas não é pré-preenchido pela IA automaticamente | **Melhorar** — IA poderia sugerir plano quando status é parcial/não conforme |
| 5 | **Workflow de Aprovação e Papéis** (Avaliador → Gestor → Auditor) | **Não temos** — Avaliações são salvas diretamente sem fluxo de aprovação | **Futuro** — Complexidade alta, requer redesign de fluxo |
| 6 | **Declaração de Aplicabilidade (SoA)** | **Não temos** — Documento exigido pela ISO 27001 | **Adicionar** — Gerar SoA automaticamente a partir das avaliações |
| 7 | **Relatório Executivo** (versão Board 5pg + versão Técnica) | **Parcial** — Temos `ExportFrameworkPDF` com relatório técnico, mas não há versão Board separada | **Melhorar** — Adicionar opção de relatório Board resumido |
| 8 | **Análise de Documentos com IA** | **Já temos** — `AdherenceAssessmentDialog` faz upload, extrai texto, analisa via IA e vincula a requisitos | **OK — já implementado** |
| 9 | **Trilha de Auditoria Imutável** | **Já temos** — `AuditTrailTimeline` no dialog de requisito + tabela `gap_analysis_audit_trail` | **OK — já implementado** |
| 10 | **Notificações e Gestão de Prazos** | **Parcial** — Temos `NotificationCenter` centralizado e reminders, mas não há alertas específicos de gap analysis (prazo vencido, score abaixo de threshold) | **Melhorar** |
| 11 | **Histórico e Evolução** | **Já temos** — `ScoreEvolutionChart` + `FrameworkHistoryTab` com gráfico temporal de score | **OK — já implementado** |
| 12 | **Benchmarking de Maturidade** | **Não temos** — Comparativo anônimo com empresas do mesmo setor | **Futuro** — Requer massa crítica de dados |
| 13 | **Extensibilidade para outros Frameworks** | **Já temos** — 21 frameworks configurados como templates globais, tudo genérico por design | **OK — já implementado** |

---

## Resumo: O que já está pronto (7/13)

Items 2, 3, 8, 9, 11, 13 estão implementados. O sistema já tem o "coração" que o documento descreve: split-panel com IA, riscos vinculados, análise documental, trilha de auditoria e multi-framework.

## O que faz sentido melhorar agora (4 items viáveis)

### 1. Contexto da Organização para IA (Item 1 — simplificado)
Adicionar na tabela `empresas` (ou criar `empresa_contexto_compliance`) campos: `setor_atuacao`, `porte_empresa`, `objetivo_compliance`, `data_alvo_certificacao`. Esses campos alimentam o prompt da IA no `populate-requirement-guidance` para gerar orientações personalizadas ao setor.

**Arquivo**: Criar dialog simples em `src/components/gap-analysis/CompanyContextDialog.tsx` acessível pelo header do framework detail.

### 2. Diagnóstico por Perguntas Objetivas (Item 2 — seção nova)
Adicionar no painel esquerdo do `NISTRequirementDetailDialog` uma seção "Diagnóstico Rápido" com 4-6 perguntas sim/não/parcial geradas pela IA (armazenadas junto com a guidance). As respostas sugerem automaticamente o status do requisito. O usuário pode aceitar ou ajustar.

**Arquivo**: Expandir o edge function `populate-requirement-guidance` para retornar também `perguntas_diagnostico` (JSON array).

### 3. Declaração de Aplicabilidade — SoA (Item 6)
Criar aba "SoA" no `GapAnalysisFrameworkDetail` que gera automaticamente a tabela de aplicabilidade: código, título, status, justificativa (IA sugere texto para itens N/A), responsável, evidências. Exportável em PDF.

**Arquivo**: Novo componente `src/components/gap-analysis/SoATab.tsx`.

### 4. Relatório Board (Item 7 — versão resumida)
Adicionar opção no export PDF: "Relatório Executivo (5 páginas)" com capa, sumário executivo com parecer IA, radar por domínio, top 5 não conformidades, e recomendação estratégica.

**Arquivo**: Expandir `ExportFrameworkPDF.tsx` com parâmetro `variant: 'board' | 'technical'`.

## O que NÃO faz sentido agora (2 items)

- **Item 5 (Workflow de Aprovação)**: Complexidade muito alta, requer redesign de todo o fluxo de avaliação, gestão de papéis adicionais, e mudaria a experiência atual. Melhor implementar em fase posterior.
- **Item 12 (Benchmarking)**: Requer massa crítica de empresas usando o sistema. Sem dados suficientes, o comparativo seria sem valor.

---

## Plano de implementação recomendado

Sugiro implementar em **2 fases** para não sobrecarregar:

**Fase 1 (agora)**: Items 1 (Contexto) + 3 (SoA) — são independentes e agregam valor imediato.

**Fase 2 (próxima iteração)**: Items 2 (Diagnóstico) + 4 (Relatório Board) — dependem de ajustes no edge function e PDF.

### Arquivos a criar/modificar na Fase 1:

```text
src/components/gap-analysis/CompanyContextDialog.tsx  [NOVO]
src/components/gap-analysis/SoATab.tsx                [NOVO]
src/pages/GapAnalysisFrameworkDetail.tsx               [MODIFICAR - adicionar aba SoA]
```

### Arquivos a criar/modificar na Fase 2:

```text
supabase/functions/populate-requirement-guidance/index.ts  [MODIFICAR - adicionar perguntas]
src/components/gap-analysis/nist/NISTRequirementDetailDialog.tsx  [MODIFICAR - seção diagnóstico]
src/components/gap-analysis/ExportFrameworkPDF.tsx          [MODIFICAR - variante board]
```

