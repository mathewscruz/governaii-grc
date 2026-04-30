## Plano — Refinos UX (Sair, Sidebar, Riscos, Dashboard, Transições)

### 1. Botão "Sair" sem efeito
**Diagnóstico:** `confirmSignOut` em `AppSidebar.tsx` chama `signOut()` (`AuthProvider`) que executa apenas `supabase.auth.signOut()`. Se a chamada lançar (sessão já invalidada por inatividade, MFA, etc.) o erro vai só pro `console.error` e o `AlertDialogAction` fecha o dialog sem feedback. Resultado para o usuário: clica e "nada acontece".

**Correções em `confirmSignOut`:**
- Limpar storage local sensível: `localStorage.removeItem('akuris.focusMode')`, manter apenas tokens necessários ao Supabase fazer cleanup.
- Forçar `supabase.auth.signOut({ scope: 'local' })` como fallback se a primeira chamada falhar (sessão expirada).
- Após sucesso/falha, fechar o `ConfirmDialog` (`setShowLogoutConfirm(false)`) e navegar com `window.location.replace('/auth')` — garante reset completo do estado de React Query, contextos e service worker.
- Mostrar `toast.error(t('sidebar.signOutFailed'))` em caso de erro real (não silencioso).
- Adicionar estado `isSigningOut` e propagar `loading` ao `<ConfirmDialog>` para feedback visual (já suportado pelo componente).

### 2. Animação suave ao abrir submenu
**Atual:** já usa `Collapsible` com `animate-accordion-down/up` (200ms), mas a entrada parece "seca" porque os itens internos aparecem instantaneamente.

**Refinos em `AppSidebar.tsx`:**
- Adicionar fade-in + leve translate nos sub-itens com delay escalonado: cada `<NavLink>` recebe `style={{ animationDelay: `${index * 30}ms` }}` + classe `animate-fade-in`.
- Suavizar a curva do collapsible aumentando para `0.25s ease-out` (override em `tailwind.config.ts` ou via classe utilitária local).
- Adicionar `transition-transform duration-200` ao `ChevronDown` que indica abertura, com `rotate-180` quando aberto (verificar se já existe; reforçar).

### 3. Card e gráfico "Evolução de Riscos"
Análise do `RiskScoreTimeline.tsx`:

**Problemas atuais:**
- Header poluído: título + tabs + número grande + ícone trend + badge tudo empilhado, sem hierarquia clara.
- Linhas do `LineChart` competem visualmente (4 cores próximas) e os `dot` permanentes adicionam ruído.
- Tooltip custom usa `bg-card` sem blur/sombra elegante.
- Eixos sem labels e sem grid sutil.
- Footer com 4 colunas duplica a informação que já está no gráfico.
- `text-green-600` hardcoded em "trend down" (viola design tokens).

**Melhorias propostas:**
- **Header simplificado:** título à esquerda, tabs (Semana/Mês/Ano) à direita compactas (`size="sm"`). Sub-linha única: "X críticos · Y altos · variação ▲/▼ Z% vs período anterior" com ícone trend usando `text-success`/`text-destructive` (token).
- **Gráfico:**
  - Trocar `LineChart` por `AreaChart` com gradient sutil (violeta primário para "altos+críticos") + linha de "críticos" sobreposta destacada — visual moderno tipo Linear/Vercel.
  - Remover `dot` padrão; manter apenas `activeDot` no hover.
  - Curva `monotone` mantida; `strokeWidth={2}`.
  - `CartesianGrid` apenas horizontal (`vertical={false}`), `stroke="hsl(var(--border))"`, opacity 0.4.
  - YAxis com `width={28}` e tick discreto; XAxis com `padding={{ left: 8, right: 8 }}`.
  - Tooltip Akuris: `bg-popover/95 backdrop-blur border border-border shadow-elegant rounded-lg`, dot colorido + label + valor, com data formatada.
  - Legenda inline acima do gráfico (chips clicáveis para mostrar/ocultar séries).
- **Footer:** substituir grid de 4 números pelos mesmos chips da legenda, evitando duplicação. Ou remover se a legenda já cobrir.
- Aplicar `<CornerAccent />` no card para reforçar identidade Akuris.
- Substituir `Loader2 animate-spin` por `Skeleton` no estado de loading (consistência com o resto).

### 4. Header do Dashboard
**Em `DashboardHeader.tsx`:** remover totalmente o parágrafo de sumário (`<p>` linhas 51-58 com ícone + "Tudo certo / X críticos"). Manter apenas o `<h1>Dashboard</h1>`. O timestamp e ações ficam à direita inalterados. A informação de itens críticos já é exposta pelo Hero Score Banner e pelos KPI Pills logo abaixo, então não há perda funcional.

Ajustar também a prop `criticalCount` para `undefined`-friendly (mantém compat). Pode-se simplificar removendo a prop, mas para evitar quebra mantemos o tipo e ignoramos no render.

### 5. Transição suave entre módulos
**Diagnóstico:** `PageTransition.tsx` aplica `animate-page-enter` (definido em `tailwind.config.ts` com 0.12s). O efeito existe, mas:
- Duração curta demais (120ms) — quase imperceptível.
- A animação não re-dispara entre rotas porque o `<div>` não tem `key={routeKey}` — React reusa o mesmo nó, então a classe `animate-*` só roda uma vez no mount inicial. Isso explica por que parece funcionar no primeiro acesso ao Dashboard mas não nas trocas seguintes.

**Correções:**
- Em `PageTransition.tsx`: adicionar `key={children-route}` ou aceitar `routeKey` (já recebido) e aplicar como `key` no `<div>` — força remount → animação re-dispara.
- Aumentar duração da `page-enter` de 0.12s para 0.22s `ease-out` em `tailwind.config.ts` para sensação mais perceptível, mas ainda snappy.
- Adicionar leve `translate-y` (já está no keyframe) e garantir `will-change: opacity, transform` via classe `animate-page-enter` para suavidade em GPU.

### Resumo de arquivos
```text
src/components/AppSidebar.tsx              — confirmSignOut robusto + fade escalonado nos sub-itens
src/components/dashboard/DashboardHeader.tsx — remove sumário "Nada crítico"
src/components/dashboard/RiskScoreTimeline.tsx — AreaChart + header limpo + tooltip Akuris + tokens
src/components/PageTransition.tsx          — key={routeKey} para re-disparar animação
tailwind.config.ts                         — page-enter 0.22s ease-out
src/i18n/pt.ts + en.ts                     — chave `sidebar.signOutFailed`
```

Sem mudanças em backend/RLS.
