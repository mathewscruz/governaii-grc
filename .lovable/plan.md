## Diagnóstico — por que os cards parecem "genéricos de IA"

Hoje todo módulo usa um único `StatCard` com:

```text
┌────────────────────────────┐
│ Título (cinza)    [📦]     │  ← ícone numa pílula colorida sempre igual
│                            │
│   42                       │  ← valor médio
│   Críticos: 3 | Altos: 5   │  ← descrição densa e textual
└────────────────────────────┘
```

Problemas:
- Hierarquia plana: o valor não é o herói.
- A "pílula colorida do ícone" no canto direito é o cliché dos templates de SaaS/IA.
- Descrição como `"Críticos: 3 | Altos: 5"` força o usuário a ler texto em vez de ver.
- `loading` usa `animate-pulse` (viola padrão `AkurisPulse`).
- Cards quase nunca são clicáveis — usuário vê o número e fica preso ali.
- Sem comparação temporal padronizada, sem composição visual do total.

## Onda 5 — Cards editoriais com drill-down

### A. Reescrever o `StatCard` com gramática editorial sóbria

Layout novo (padrão "Linear/Stripe/Notion"):

```text
┌─────────────────────────────────┐
│ ◇ Riscos ativos          ↗ +12% │  ← ícone discreto inline + delta
│                                 │
│ 42                              │  ← número HERÓI (4xl, tracking-tight)
│                                 │
│ ████████░░░░ 3 críticos · 5 altos│ ← micro-segmentação visual
│                                 │
│ Ver todos        →              │  ← CTA discreto quando clicável
└─────────────────────────────────┘
```

Mudanças concretas no componente:
- **Ícone inline ao lado do título** (16px, stroke 1.5, cor `text-muted-foreground`), sem pílula colorida. Reforça assinatura Akuris.
- **Valor**: `text-4xl font-semibold tracking-tight`, sem `font-bold`. Mais editorial, menos "ChatGPT card".
- **Delta inline no canto superior direito** (não embaixo): seta + percentual + tooltip "vs período anterior".
- **Nova prop `segments`**: `[{ label: 'Críticos', value: 3, tone: 'destructive' }, ...]` que renderiza uma **barra segmentada fina** (h-1.5) acima da legenda textual condensada. Substitui as descrições `"Críticos: 3 | Altos: 5"`.
- **Variant agora pinta apenas a cor da accent bar lateral** (esquerda, 2px) — sem background colorido, sem pílula. Sutileza > agressividade.
- **Hover real**: borda passa a `border-primary/40`, surge sombra `shadow-elegant`, cursor pointer e a CTA "Ver todos →" aparece com fade. Comunica que é interativo.
- **Loading**: substituir `animate-pulse` por `<AkurisPulse size={32}/>` centralizado dentro do card, com altura reservada.
- **Nova prop `drillDown?: { key: DrillDownKey }`** que conecta direto ao `KpiDrillDownDrawer` já existente. Card vira clicável automaticamente se essa prop existir.
- **CornerAccent sutil** (já existe no projeto) opcional via prop, dando a assinatura Akuris no canto.
- **`emptyHint` ganha tratamento visual** — quando valor é 0 o número fica `text-muted-foreground` e o hint surge como uma linha discreta com ícone `Sparkles` em vez de itálico.

### B. Estender o `KpiDrillDownDrawer` para cobrir todos os módulos

Hoje suporta: `ativos`, `riscos`, `incidentes`, `planos`, `contratos`, `documentos`, `due_diligence`, `denuncias`, `controles`.

Adicionar fetchers para os módulos que ainda não têm:
- `ativos_chaves`, `ativos_licencas` (vencendo, expiradas)
- `auditorias` (itens pendentes/em atraso)
- `continuidade` (planos sem teste, testes vencidos)
- `gap_analysis` (frameworks com pior aderência, requisitos não conformes)
- `revisao_acessos` (revisões pendentes, atrasadas)
- `privacidade` (ROPAs incompletas, solicitações de titular pendentes)
- `riscos_aceite` (aceites próximos da revisão)
- `planos_acao` (atrasados)
- `sistemas` (sem responsável, sem revisão)
- `contas_privilegiadas` (sem rotação recente)

Cada fetcher: top 5 itens reais com título, subtítulo, status colorido e data, mantendo `.eq('empresa_id', empresaId)` (regra core de segurança). CTA "Ver todos" no rodapé navega para a rota do módulo.

### C. Revisão página por página dos ~20 lugares com `StatCard`

Para cada página, fazer 3 coisas:

1. **Eleger o KPI herói** (1 card mais relevante) e dar destaque (`variant="primary"` + `segments` quando faz sentido). Os outros viram secundários.
2. **Conectar `drillDown`** ao drawer correspondente.
3. **Substituir descrições densas por `segments`** quando o card representa um agregado com partes (criticidade, status, prioridade).

Exemplo Ativos:

```text
Antes: "Críticos: 3 | Altos: 5 | Médios: 12 | Baixos: 8"
Depois: segments=[
  { label: 'Críticos', value: 3, tone: 'destructive' },
  { label: 'Altos', value: 5, tone: 'warning' },
  { label: 'Médios', value: 12, tone: 'info' },
  { label: 'Baixos', value: 8, tone: 'success' },
]
→ renderiza barra horizontal segmentada proporcionalmente + legenda compacta.
```

Páginas a revisar (ordem de impacto): `Riscos`, `Incidentes`, `Ativos`, `Documentos`, `Contratos`, `PlanosAcao`, `Continuidade`, `RevisaoAcessos`, `Privacidade`, `Denuncia`, `Ativos*`, `ContasPrivilegiadas`, `RiscosAceite`, `GapAnalysisFrameworks`, `Relatorios`, `governanca/*`, `due-diligence/*`, `gap-analysis/RemediationTab`, `configuracoes/*`.

### D. Garantir consistência

- Atualizar `mem://ux/ui-consistency-standards` com a nova gramática.
- Criar `mem://design/foundations/cards-editorial-onda5` documentando: anatomia (ícone inline, valor herói, segments, delta, CTA hover), proibições (sem pílula colorida, sem `animate-pulse`, descrições densas viram `segments` quando possível) e padrão de drill-down obrigatório quando aplicável.

## Particularidades preservadas

- API atual do `StatCard` continua válida (`title`, `value`, `description`, `icon`, `variant`, `loading`, `emptyHint`, `trend`, `badge`) — props novas (`segments`, `drillDown`) são opcionais. Páginas existentes continuam funcionando até serem migradas.
- Cores/variants seguem os tokens semânticos (`success`, `warning`, `destructive`, `info`, `primary`).
- Acessibilidade: card clicável vira `role="button"`, suporta `Enter`/`Space`, foco visível com `ring-primary`.
- Mobile: barra de segments cai para baixo do valor; delta vai para linha 2; tudo testado em 360px.

## Arquivos afetados

**Editar (componente)**:
- `src/components/ui/stat-card.tsx` — nova anatomia, `segments`, `drillDown`, `AkurisPulse`, hover real.
- `src/components/dashboard/KpiDrillDownDrawer.tsx` — novos fetchers, expor `useKpiDrillDown(key)` para uso externo.

**Editar (consumidores — ~22 arquivos)**:
- Pages: `Riscos`, `Incidentes`, `Ativos`, `AtivosChaves`, `AtivosLicencas`, `Documentos`, `Contratos`, `PlanosAcao`, `Continuidade`, `RevisaoAcessos`, `Privacidade`, `Denuncia`, `ContasPrivilegiadas`, `RiscosAceite`, `GapAnalysisFrameworks`, `Relatorios`.
- Components: `governanca/SistemasContent`, `governanca/ControlesContent`, `governanca/AuditoriasContent`, `due-diligence/DueDiligenceDashboard`, `gap-analysis/RemediationTab`, `configuracoes/FinanceiroIATab`, `configuracoes/CreditosIAManager`, `configuracoes/ReminderSettings`, `configuracoes/GerenciamentoUsuariosEnhanced`, `gap-analysis/adherence/AdherenceAssessmentView`.

**Criar (memória)**:
- `mem://design/foundations/cards-editorial-onda5` — documenta anatomia e regras.

## Não vai mudar

- `Card` base, tokens de cor, `Badge`, `StatusBadge`, `EmptyState`.
- Lógica de cálculo das stats (`useDashboardStats`, `useRiscosStats`, etc.).
- Estrutura de páginas além dos blocos de StatCard.
- Identidade Navy/Purple, DM Sans.
