
# Análise UX/Usabilidade — Módulo Gap Analysis

Análise completa das telas (`/gap-analysis/frameworks` e `/gap-analysis/framework/:id`), componentes de avaliação, dialogs, abas e fluxos atuais. A seguir, um diagnóstico organizado por área e um plano de melhorias priorizadas.

---

## 1. Diagnóstico — O que funciona bem

- **WelcomeHero** com "Como funciona em 3 passos" + frameworks recomendados — onboarding inicial claro.
- **FrameworkCard ativo** com score grande, barra segmentada e pílulas de status — leitura rápida.
- **FrameworkOnboarding** específico por framework — explica tempo, passos e dicas (excelente conteúdo).
- **JourneyProgressBar contextual** — muda mensagem conforme estado.
- **Tabela de requisitos** com seleção em massa, barra flutuante de ações e filtros.
- **AIRecommendationsButton** para consultor IA contextual.

---

## 2. Diagnóstico — Problemas e atritos identificados

### 2.1 Tela de listagem (`GapAnalysisFrameworks.tsx`)

- **Catálogo "engole" frameworks ativos**: a lógica `(hasActiveFrameworks || showCatalog) && availableFrameworks.length > 0` mostra TODOS os disponíveis sempre que há um ativo. Não há colapso/seção retraída — usuário com 1 framework iniciado vê uma lista enorme abaixo.
- **Busca só filtra disponíveis**, não os ativos — confunde quando o usuário tem muitos.
- **Sem ordenação/filtro por categoria** no catálogo (segurança, privacidade, qualidade, governança), só busca textual.
- **Stats no topo** (`Conformidade Geral`, `Críticos`, `Total Avaliados`) somam todos frameworks ativos sem permitir drill-down.
- **`SUGGESTED_NAMES` hardcoded** ('ISO 27001', 'LGPD', 'NIST CSF 2.0') — se o nome do template no banco mudar, somem.

### 2.2 Tela de detalhe (`GapAnalysisFrameworkDetail.tsx`)

- **5 abas no topo competem por atenção**: `Avaliação Manual | Análise de Documentos | SoA | Remediação | Histórico`. Sem ordem clara de fluxo. Usuário novo não sabe por onde começar (inclusive porque o onboarding aparece sobre a aba Avaliação, mas há outras abas igualmente acessíveis).
- **3 botões de ação no header** (`Gerar Política`, `Board`, `PDF Técnico`) + botão circular roxo de IA — poluição visual no PageHeader e falta hierarquia (todos `outline`, sem destaque para a ação principal).
- **`FRAMEWORK_DESCRIPTIONS` duplica** o que já existe em `FrameworkOnboarding` e em `FRAMEWORK_AUDIENCES`. 3 fontes de descrição diferentes para o mesmo framework.
- **Onboarding bloqueia a tela inteira** (`showOnboarding` esconde o dashboard). Quando o usuário avalia 1 requisito, o onboarding some e não há como revisitar — útil só uma vez.
- **JourneyProgressBar** mostra "ações" como `Iniciar avaliação`/`Ver remediação` que **não são clicáveis** (são `<span cursor-default>`). Promete interação que não entrega.

### 2.3 Tabela de requisitos (`GenericRequirementsTable.tsx`)

- **Tabs duplicados em duas dimensões** quando o framework tem `sections`: tabs de seção + tabs de categoria + filtros. Difícil entender em qual contexto se está.
- **Coluna "Avaliação" (Select)** + clicar na linha abre dialog de detalhe com OUTRO seletor. Dois caminhos sobrepostos para o mesmo dado, sem indicação clara — Select stopPropagation funciona, mas a UX é confusa.
- **Filtros não persistem** entre navegação (volta para "Todos" ao trocar de aba/voltar à página).
- **`Itens por página` no rodapé** (10 por padrão) — em frameworks com 117 requisitos, força paginação intensa. Sem opção de scroll virtualizado ou densidade compacta.
- **Bulk action bar fixa** sobrepõe rodapé/MobileBottomNav em mobile.
- **Coluna "Área"** mostra texto livre — muitas vezes vazio (`-`); ocupa espaço sem valor consistente.
- **Legenda de ícones** + popover de legenda de status são duas legendas separadas — poderiam ser uma só.
- **`getPriorityBadge`** mistura `obrigatorio` (boolean) com `peso` numérico — usuário não entende a diferença entre "Obrigatório" (vermelho) e "Alta" (amarelo).
- **`console.error`** em vez do `logger.ts` (viola Core memory).
- **Bulk update** faz N queries sequenciais em loop (lento para muitos itens).

### 2.4 Dialogs

- **`RequirementDetailDialog`** (NIST) é usado para todos os frameworks — nome legado mantém pasta `nist/` mas serve como genérico (dívida de naming).
- **`AIRecommendationsButton`** abre dialog que lista até 5 prioridades + quick wins, mas **não permite aplicar** as ações (criar plano de ação direto). É só leitura.
- **`FrameworkDialog`/`RequirementDialog`** existem mas frameworks são **globais (template, empresa_id=NULL)**. Usuários comuns não podem editar — porém os botões "Edit" da `RequirementsManager` aparecem mesmo assim, levando a erro silencioso.

### 2.5 Abas pouco descobertas

- **SoA (Statement of Applicability)** só faz sentido para ISO 27001 — aparece para todos os frameworks (PCI, LGPD, etc.) sem filtro.
- **Análise de Documentos (Adherence)** é uma das funcionalidades mais valiosas (IA lê documento e sugere status) mas está como segunda aba, sem chamada visual no fluxo.
- **Histórico e Evolução** vs `ScoreEvolutionChart` que já aparece dentro do dashboard — duplicação.

### 2.6 Microinterações e feedback

- **`AIRecommendationsButton` desaparece silenciosamente** quando `evaluatedRequirements < 10%` (`canAnalyze=false` retorna `null`). Usuário não sabe que existe a feature.
- **Toasts de sucesso "Status atualizado!"** disparam a cada change — barulho excessivo durante avaliação em massa.
- **Score muda em background** (`scoreRefreshKey++` + recarrega categoria) sem indicador de "atualizando" — pisca.

### 2.7 Mobile

- Tabela de requisitos com 8 colunas força scroll horizontal pesado.
- Bulk action bar fixa no centro inferior choca com `MobileBottomNav`.
- Tabs de seção/categoria quebram em múltiplas linhas e ficam difíceis de tocar.

---

## 3. Plano de melhorias (priorizado)

### Prioridade ALTA — Reduzir atrito do fluxo principal

1. **Reordenar abas + sugerir caminho**
   - Nova ordem: `Avaliação | Análise de Documentos (IA) | Remediação | SoA | Histórico`.
   - Renomear `Avaliação Manual` → `Avaliação`.
   - Mostrar SoA apenas para frameworks que fazem sentido (ISO 27001/27701; flag `supports_soa` no `framework-configs`).
   - Banner pequeno na primeira visita: "Dica: economize tempo usando Análise de Documentos com IA".

2. **JourneyProgressBar realmente clicável**
   - Tornar `state.action` um botão que troca de aba (`Ver remediação` → setActiveTab('remediacao')`) ou abre dialog de filtro.

3. **Catálogo colapsável + filtro por categoria**
   - Quando há frameworks ativos, mostrar `Frameworks Disponíveis` em accordion fechado por padrão com contador.
   - Adicionar chips de filtro por categoria (Segurança/Privacidade/Qualidade/Governança).
   - Busca passa a filtrar tanto ativos quanto disponíveis.

4. **PageHeader do detalhe — hierarquia de ações**
   - Agrupar exports (`Board` + `PDF Técnico`) em um menu dropdown único `Exportar ▾`.
   - `Gerar Política` permanece como ação secundária.
   - Consultor IA vira botão com label, não só ícone, posicionado próximo do score.

5. **Unificar fonte da descrição do framework**
   - Eliminar `FRAMEWORK_DESCRIPTIONS` da página detalhe — usar `FrameworkOnboarding`'s `audience` + `description`.
   - Centralizar em `lib/framework-configs.ts`.

### Prioridade ALTA — Tabela de requisitos

6. **Reduzir colunas / densidade**
   - Esconder coluna "Área" se >70% dos requisitos não tiverem valor; mover para hover/expand.
   - Aplicar `useTableDensity` (já existe no projeto).
   - Aumentar default de itens por página para 25.

7. **Persistir filtros**
   - Salvar `searchTerm`, `statusFilter`, `onlyMandatory`, `activeTab` em URL params.

8. **Unificar legendas**
   - Uma só popover `?` com legenda de status + significado dos ícones (alerta, clipe, prioridade).

9. **Silenciar toasts em mudanças individuais**
   - Substituir toast por feedback inline (linha pisca verde por 600ms). Toast só em ações em lote/erro.

10. **Bulk update com `upsert` em batch**
    - Trocar loop de N queries por um único `upsert` com array (corrige perf e respeita constraints).

11. **Substituir `console.error` por `logger.error`** (Core memory).

### Prioridade MÉDIA — Inteligência e produtividade

12. **AIRecommendationsButton sempre visível**
    - Quando `canAnalyze=false`, mostrar disabled com tooltip "Avalie ao menos X requisitos para liberar".
    - Adicionar botão "Criar plano de ação" diretamente em cada item das `top_5_prioridades`.

13. **Onboarding revisitável**
    - Adicionar botão `?` "Como avaliar este framework" no header que reabre `FrameworkOnboarding` em modal.

14. **Análise de Documentos em destaque**
    - Quando `evaluatedRequirements === 0`, no `Avaliação` mostrar CTA "Quer pular para frente? Envie um documento e a IA avalia para você".

15. **Remediação consolidada**
    - Mostrar progresso dos planos (X de Y concluídos) e CTA para criar plano direto a partir de requisitos não conformes.

### Prioridade MÉDIA — Listagem

16. **Stats com drill-down**
    - StatCards do topo viram clicáveis: `Requisitos Críticos` filtra os ativos por `nao_conforme`.

17. **`SUGGESTED_NAMES` dinâmico**
    - Substituir array hardcoded por flag `is_recommended` na tabela `gap_analysis_frameworks` (ou pelo `tipo_framework`).

18. **Cards de framework disponível — "Iniciar Avaliação" mais explícito**
    - Hoje o botão diz "Iniciar Avaliação" mas o clique no card também navega — manter, mas indicar que clicar em qualquer área entra.

### Prioridade BAIXA — Polish

19. **Renomear pasta `nist/`** para `requirement-detail/` (dívida técnica — `RequirementDetailDialog` é genérico).

20. **Esconder edição de framework/requisito** (`RequirementsManager`) para usuários não super-admin (frameworks são globais).

21. **Mobile**: ocultar bulk-action-bar quando `useIsMobile()` ou movê-la para `bottom-20` para não sobrepor `MobileBottomNav`.

22. **Indicador de "atualizando score"** suave (skeleton no donut por <300ms) em vez de piscar.

23. **Histórico**: remover `ScoreEvolutionChart` duplicado do dashboard quando a aba `Histórico` existe (manter só na aba).

---

## 4. Detalhes técnicos (referência rápida)

| Mudança | Arquivos principais |
|---|---|
| Reordenar/condicionar abas | `src/pages/GapAnalysisFrameworkDetail.tsx`, `src/lib/framework-configs.ts` (flag `supports_soa`) |
| Journey clicável | `src/components/gap-analysis/JourneyProgressBar.tsx` (props `onActionClick`) + parent |
| Catálogo accordion + filtros categoria | `src/pages/GapAnalysisFrameworks.tsx`, `src/components/gap-analysis/FrameworkCatalog.tsx` |
| Header dropdown export | `src/pages/GapAnalysisFrameworkDetail.tsx` (DropdownMenu shadcn) |
| Densidade + URL params | `src/components/gap-analysis/GenericRequirementsTable.tsx` (`useTableDensity`, `useSearchParams`) |
| Bulk upsert | `gap_analysis_evaluations` upsert com `onConflict: 'framework_id,requirement_id,empresa_id'` |
| Logger | substituir `console.error` por `logger.error` em `GenericRequirementsTable.tsx` |
| AI button "criar plano" | `src/components/gap-analysis/AIRecommendationsCard.tsx` + integração com `PlanoAcaoDialog` |
| Onboarding revisitável | botão "Como avaliar" no PageHeader que toggle `showOnboarding` em modal |

---

## 5. Sugestão de ordem de implementação

**Sprint 1 (impacto alto, esforço baixo)**: itens 1, 2, 3, 4, 8, 9, 11, 17.
**Sprint 2 (produtividade IA)**: itens 5, 12, 13, 14, 15.
**Sprint 3 (tabela e perf)**: itens 6, 7, 10.
**Sprint 4 (polish)**: itens 16, 18-23.

---

**Posso iniciar pelo Sprint 1?** Ou prefere priorizar outro conjunto (por exemplo, focar primeiro na tabela de requisitos, ou no fluxo das abas)?
