## Diagnóstico

Hoje, toasts e o NotificationCenter são funcionais mas têm uma cara genérica de SaaS:

**Toaster (`src/components/ui/sonner.tsx`)**
- Glassmorphism + border-l de 3px colorido por tipo + ícone Lucide CheckCircle/XCircle (igual a centenas de produtos).
- Tipografia simples (title + description) sem hierarquia editorial.
- Sem assinatura visual da marca, sem eyebrow, sem acento.

**NotificationCenter (`src/components/NotificationCenter.tsx`)**
- Botão `Bell` cru do Lucide.
- Popover de 80 (320px) com cabeçalho minimalista "Notificações + Marcar todas".
- Cada item é um bloco vertical com título + mensagem + StatusBadge + data — sem agrupamento por módulo, sem ícone proprietário, sem leitura visual da fonte (qual módulo originou).
- Estado vazio é apenas texto "Nenhuma notificação".

## Princípios da identidade Akuris a aplicar

1. **Editorial, não decorativo**: micro-eyebrows uppercase tracking-[0.18em] indicando o módulo origem ("RISCOS · Revisão", "DOCUMENTOS · Vencimento").
2. **Ícones proprietários**: usar os 8 ícones de módulo já existentes em `@/components/icons` (RiscosIcon, ControlesIcon, DocumentosIcon, ContratosIcon, AtivosIcon, IncidentesIcon, etc.) em vez de Bell/CheckCircle genéricos.
3. **Tons sóbrios HSL** dos resolvers `status-tone` (success, warning, destructive, info) — sem cores Tailwind cruas.
4. **Acento de marca**: barra vertical lateral fina (2px) na cor do tom + chip de ícone proprietário no canto, em vez do border-l-3 padrão.
5. **Densidade controlada**: tipografia DM Sans, peso semibold 13px no título, regular 12px na descrição, eyebrow 10px primary/70.

## Solução

### 1. Toaster Akuris (`src/components/ui/sonner.tsx`)

Reescrever o Toaster para um layout editorial:

```text
┌───────────────────────────────────────────┐
│ ┃ [▣ icon]  RISCOS · ATUALIZAÇÃO       ✕ │
│ ┃          Risco salvo com sucesso       │
│ ┃          Próxima revisão em 30 dias    │
└───────────────────────────────────────────┘
  ↑ acento vertical 2px tom-do-status
```

- Acento vertical de 2px na esquerda (cor do tom: `--success`, `--warning`, `--destructive`, `--info`) em vez do border-l-3.
- Chip 28x28 arredondado com ícone proprietário e fundo `tom/8 + ring tom/20` (mantém a leitura semântica imediata).
- Eyebrow opcional via `description` formatada — para isso adicionamos um helper `akurisToast({ module, title, description, tone })` que monta o JSX com a estrutura editorial.
- `position="top-right"`, `gap={10}`, `duration={4500}`, sombra mais densa: `0_12px_32px_-8px_hsl(var(--primary)/0.18)`.
- Animação de entrada já existente `animate-toast-slide-in` — reaproveitar.
- Background: `bg-background/95 backdrop-blur-2xl` + `border border-border/50`. Cantos `rounded-xl`.
- Substituir border-l por: pseudo-elemento via classe `before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[2px] before:rounded-full before:bg-{tone}` (definidos por tipo).
- Suporte a CornerAccent sutil (4x4 no canto sup. direito) para reforçar marca em toasts persistentes (`duration: Infinity` / loading).

Manter compatibilidade com `toast.success(...)`, `toast.error(...)` etc. — apenas evoluir os classNames e ícones.

### 2. Helper `akurisToast` (novo: `src/lib/akuris-toast.tsx`)

API enxuta para chamadas que querem o layout editorial completo:

```ts
akurisToast({
  module: 'riscos',           // mapeia para ícone proprietário + label do módulo
  tone: 'success',            // success | warning | destructive | info
  title: 'Risco salvo',
  description: 'Próxima revisão em 30 dias.',
  action?: { label, onClick }
})
```

Internamente chama `toast.custom()` do Sonner renderizando o layout editorial. Os toasts simples (`toast.success("...")`) continuam funcionando sem mudanças nos consumidores — apenas com o novo visual herdado dos classNames.

### 3. NotificationCenter Akuris (`src/components/NotificationCenter.tsx`)

**Trigger (Bell)**: substituir `Bell` cru por uma versão com micro-glow quando há não-lidas:
- Anel sutil `ring-1 ring-primary/30` quando `unreadCount > 0`.
- Badge: trocar a bolinha vermelha por um chip pill `h-4 px-1.5 text-[10px] font-semibold` com `bg-destructive text-destructive-foreground tabular-nums`.

**Popover (largura 384px, antes 320)**:

```text
┌──────────────────────────────────────────┐
│ NOTIFICAÇÕES                             │  ← eyebrow uppercase tracking-[0.18em]
│ 12 não lidas        [ Marcar todas →]    │
├──────────────────────────────────────────┤
│ URGENTES (3)                             │  ← seção colapsável por prioridade
│ ┃ [▣]  RISCOS · CRÍTICO                  │
│ ┃      Revisão de "Risco X" atrasada     │
│ ┃      há 4 dias                ‹15:42›  │
│ ──────────────────────────────────────── │
│ ┃ [▣]  INCIDENTES · CRÍTICO              │
│ ┃      Incidente "Y" requer atenção      │
│                                          │
│ ATENÇÃO (5)                              │
│  ...                                     │
│                                          │
│ INFORMATIVO (4)                          │
│  ...                                     │
├──────────────────────────────────────────┤
│ [ ver todas no histórico → ]             │
└──────────────────────────────────────────┘
```

Mudanças concretas:
- **Header reformulado**: título "NOTIFICAÇÕES" como eyebrow + linha de contagem + ação "Marcar todas como lidas" como link textual (não mais botão com ícone genérico).
- **Agrupamento por prioridade**: três grupos visualmente distintos (Urgentes/Atenção/Informativo) com header de seção em uppercase.
- **Cada item editorial**:
  - Acento vertical 2px na cor do tom (igual ao toast).
  - Chip 32x32 com ícone proprietário do módulo (RiscosIcon, DocumentosIcon, etc.) — mapeado a partir do `link_to` ou `id` da notificação (`risco-`, `doc-`, `contrato-`, `controle-`, `incidente-`, `ativo-`, `licenca-`, `chave-`, `manutencao-`, `aprovacao-doc-`).
  - Eyebrow com módulo+contexto: "RISCOS · REVISÃO ATRASADA".
  - Título 13px semibold leading-tight.
  - Mensagem 12px muted-foreground line-clamp-2.
  - Timestamp relativo (`há 4 dias`, `agora`) usando `date-fns/formatDistanceToNow` em vez de data absoluta — mais humano.
  - Indicador de não-lida: ponto 6px primary à direita do eyebrow (mais discreto que o atual).
- **Estado vazio editorial**: usar `EmptyState` com ícone proprietário (CheckCircle2 stroke 1.5 grande + texto "Tudo em dia. Nenhuma notificação pendente.").
- **Estado de loading**: substituir o "Carregando..." por `<AkurisPulse size={48} />` centralizado.

### 4. Mapa módulo → ícone proprietário (novo: `src/lib/notification-icons.ts`)

Função `getModuleMetaForNotification(notif)` que retorna `{ Icon, moduleLabel }` baseado em prefixo do `id` ou `link_to`:

| Prefixo / link            | Módulo            | Ícone               |
|---------------------------|-------------------|---------------------|
| `risco-`, `/riscos`       | Riscos            | RiscosIcon          |
| `doc-`, `/documentos`     | Documentos        | DocumentosIcon      |
| `contrato-`, `/contratos` | Contratos         | ContratosIcon       |
| `controle-`, `/controles` | Controles         | ControlesIcon       |
| `incidente-`, `/incidentes`| Incidentes       | IncidentesIcon      |
| `ativo-`, `licenca-`, `chave-`, `manutencao-`, `/ativos` | Ativos | AtivosIcon |
| `aprovacao-doc-`          | Aprovações        | DocumentosIcon      |
| fallback                  | Sistema           | Bell stroke 1.5     |

### 5. Tokens CSS adicionais (`src/index.css`)

Adicionar (se ainda não existirem):
- Animação `toast-slide-in` já existe — manter.
- Pseudo-acentos: nada de novo, usar `before:` inline com cores HSL dos tokens.

## Arquivos alterados

- `src/components/ui/sonner.tsx` — novo layout editorial (acento vertical, chip ícone, eyebrow), classNames atualizados.
- `src/lib/akuris-toast.tsx` (novo) — helper `akurisToast({ module, tone, title, description, action })`.
- `src/lib/notification-icons.ts` (novo) — mapeamento centralizado prefixo→ícone+label do módulo.
- `src/components/NotificationCenter.tsx` — header editorial, agrupamento por prioridade, itens com chip de ícone proprietário + eyebrow + timestamp relativo, estado vazio com EmptyState, loading com AkurisPulse.
- `src/i18n/pt.ts` / `src/i18n/en.ts` — chaves novas:
  - `notifications.eyebrow` ("NOTIFICAÇÕES" / "NOTIFICATIONS")
  - `notifications.allCaughtUp` ("Tudo em dia.")
  - `notifications.allCaughtUpDesc`
  - `notifications.groupUrgent`, `groupAttention`, `groupInfo`
  - `notifications.viewAllHistory`
  - `notifications.modules.*` (riscos, documentos, contratos, controles, incidentes, ativos, aprovacoes, sistema)
  - `notifications.contexts.*` (vencimento, revisaoAtrasada, criticoAberto, rotacao, etc.)

## Compatibilidade

Não quebra nenhum chamador existente: `toast.success()`, `toast.error()`, `toast()` continuam exatamente com a mesma API, só ganham o novo visual via classNames atualizados. O helper `akurisToast` é opcional para quem quiser o layout completo com módulo+eyebrow.

## Memória a registrar

`mem://design/foundations/notifications-editorial-akuris` documentando:
- Toaster com acento vertical 2px tom-do-status, chip 28x28 com ícone proprietário, eyebrow uppercase do módulo.
- NotificationCenter agrupado por prioridade (Urgentes/Atenção/Informativo) com ícone proprietário por módulo.
- Helper `akurisToast` para chamadas com identidade editorial completa.
- Estados vazios sempre via `EmptyState` ilustrado; loading sempre via `AkurisPulse`.
