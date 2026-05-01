Vou atacar as 3 frentes em paralelo. Tudo direto, sem mexer em lógica de dados — só visual/navegação.

## 1. Auditoria e correção de ícones inconsistentes

### Conflitos confirmados na sidebar (`AppSidebar.tsx`)

Mesmo ícone usado para conceitos diferentes — usuário não consegue distinguir:

| Ícone Lucide | Usado para | Problema |
|---|---|---|
| `CheckSquare` | Aceite de Riscos · Revisão de Acessos · grupo Compliance | 3 conceitos diferentes |
| `Users` | Contas Privilegiadas | Conflita com ícone semântico genérico de usuários |
| `RiscosIcon` | Grupo "Gestão de Riscos" **e** subitem "Riscos" | Pai e filho idênticos |
| `AtivosIcon` | Grupo "Gestão de Ativos" **e** subitem "Ativos" | Pai e filho idênticos |
| `Shield` / `ShieldAlert` | Privacidade vs. Continuidade | Quase iguais visualmente |
| `Lock` | Grupo Segurança | Genérico, sem identidade |

### Mudanças propostas

- **Aceite de Riscos** → trocar `CheckSquare` por `ShieldCheck` (proteção aceita)
- **Revisão de Acessos** → trocar `CheckSquare` por `UserCheck` (validação de acessos)
- **Grupo Compliance** → trocar `CheckSquare` por `BadgeCheck` (selo de conformidade)
- **Contas Privilegiadas** → trocar `Users` por `KeyRound` (já usado para Chaves — mover Chaves para `Key`) **OU** usar `UserCog` (administração de usuários)
- **Grupos pai com subitem de mesmo nome**: o ícone do grupo pai vira o ícone proprietário, o subitem "principal" recebe variação Lucide consistente. Solução mais limpa: no estado **expandido**, esconder o ícone do subitem pai redundante (o "Riscos"/"Ativos" raiz exibe só o texto, ganhando espaço). Mantém ícone proprietário no grupo.
- **Continuidade de Negócios** → trocar `ShieldAlert` por `LifeBuoy` (metáfora universal de continuidade/recuperação)
- **Grupo Segurança** → manter `Lock` (semanticamente correto e único nesse contexto)

### Ícones genéricos de IA (21 ocorrências)

Substituir `Sparkles`, `Brain`, `Bot`, `Cpu` por `AkurisAIIcon` em todos os contextos de IA do produto, mantendo Lucide apenas onde NÃO é IA (ex: `Sparkles` em "Mais popular" do plano comercial, `Cpu` em métrica de hardware/tokens).

Arquivos prioritários a atualizar:
- `src/components/riscos/TratamentoForm.tsx` (4 usos — botão "Sugerir tratamento com IA")
- `src/pages/Documentos.tsx` + `src/components/documentos/DocGenDialog.tsx` (geração de documentos)
- `src/components/configuracoes/CreditosIAManager.tsx` + `FinanceiroIATab.tsx` (dashboards de IA)
- `src/components/configuracoes/EmailCampanhaEditor.tsx`, `ChangelogEntryDialog.tsx`, `GerenciamentoChangelog.tsx`
- `src/components/due-diligence/TemplatesManager.tsx`
- `src/pages/Configuracoes.tsx` (3 usos)
- `src/pages/Assessment.tsx`, `src/components/onboarding/OnboardingWizard.tsx`, `src/components/ChangelogPopover.tsx`

**Manter Lucide (NÃO trocar):**
- `src/pages/Planos.tsx` linha 82 — "Mais popular" (badge comercial, não IA)
- `src/components/configuracoes/GerenciamentoPlanos.tsx` — mesma razão
- `src/components/configuracoes/FinanceiroIATab.tsx` linha 300 (`Cpu`) — métrica de hardware

### Limpeza visual — remover ícones decorativos onde texto basta

- Botões de ação secundária dentro de cards já titulados (ex: "Exportar", "Importar" quando o contexto deixa claro)
- Não vou remover ícones de cabeçalhos de seção/tab — eles ajudam na varredura visual
- Cards de métrica que já têm ícone grande no lado, mas repetem ícone pequeno no título

Essa última passagem será cirúrgica e conservadora — só onde realmente há redundância.

## 2. Remover botão "Voltar" do header

Em `src/components/Layout.tsx` linhas 180-200: remover o bloco `Tooltip` com o botão `ArrowLeft`. O usuário tem:
- **Breadcrumb clicável** ao lado (linhas 202+) para navegar entre níveis
- Botões de "voltar" próprios em cada módulo quando relevante

Também removo o import `ArrowLeft` da linha 28 se não houver outro uso no arquivo.

## 3. Gráfico de evolução do score — eliminar tela branca de 1 ponto

O `ScoreEvolutionChart` (aba Histórico) já foi corrigido na rodada anterior. **O que ainda quebra** é o sparkline do **`FrameworkHeroSummary`** (que aparece na aba Avaliação, no banner principal do framework) — ele continua usando `AreaChart` puro com 1 ponto, então fica branco.

### Mudanças no `FrameworkHeroSummary.tsx`

Aplicar o mesmo tratamento já feito no `ScoreEvolutionChart`, mas adaptado para o sparkline compacto (110px de altura):

1. **Quando `history.length === 1`**: duplicar o ponto internamente como `[{...p, date:'Início'}, p]` para que a `Area` desenhe uma faixa horizontal preenchida com o gradiente roxo, em vez de ficar branco
2. **Empty state ilustrado** (`history.length === 0`): substituir o texto solto por mini empty-state com ícone `LineChart` num círculo + texto curto
3. **Adicionar `ReferenceLine` da meta** (80% / 4.0) tracejada sutil para dar referência visual
4. **Pontos visíveis** quando há 1-2 registros (raio 4 com borda branca), invisíveis quando há muitos
5. **Chip discreto sobreposto** ("Registre mais avaliações para ver tendência") quando só há 1 ponto, igual ao já feito no chart maior

### Arquivos modificados

- `src/components/AppSidebar.tsx` — sidebar icons sem colisão + esconder ícone redundante de subitem-pai
- `src/components/Layout.tsx` — remover botão Voltar e import `ArrowLeft`
- `src/components/gap-analysis/FrameworkHeroSummary.tsx` — sparkline com tratamento de 1-ponto + meta + empty state
- ~12 arquivos de IA — substituir `Sparkles`/`Brain`/`Bot` por `AkurisAIIcon`

### Resultado

- Identidade visual mais consistente — cada conceito tem seu próprio ícone
- Header mais limpo, navegação por breadcrumb (que já funciona)
- Sparkline do banner nunca mais aparece "tudo branco", mesmo no primeiro registro
- IA do Akuris fica reconhecível pelo ícone proprietário em todo o sistema