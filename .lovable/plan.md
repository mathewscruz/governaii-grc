

# Melhoria Visual dos Toasts + Validação de Feedback em Configurações

## Diagnóstico

### Problema 1: Dois sistemas de toast coexistindo
O projeto usa **Sonner** (via `toast` de `sonner`) e **Radix Toast** (via `useToast` de `@/hooks/use-toast`) simultaneamente. Isso causa:
- Visual inconsistente (Sonner tem border-left colorido, Radix tem outro estilo)
- 4 arquivos em Configurações ainda usam `useToast` (Radix): `ApiKeysManager`, `InboundWebhooksManager`, `ReminderSettings`, `IntegrationHub`

### Problema 2: Visual genérico
Os toasts atuais são caixas brancas simples sem ícones, sem alinhamento com o design system Akuris (violet/navy, glassmorphism, gradients).

### Problema 3: Toasts faltantes
- `handleToggle` em ApiKeys e InboundWebhooks não dá feedback ao ativar/desativar
- `IntegrationHub.fetchIntegrations` falha silenciosamente (só `console.error`)

---

## Plano de Implementação

### 1. Redesign do Sonner Toaster (arquivo único)
Atualizar `src/components/ui/sonner.tsx` com visual premium:
- Fundo com glassmorphism (`backdrop-blur`) alinhado ao design system
- Ícones automáticos por tipo (CheckCircle, XCircle, AlertTriangle, Info) renderizados via `icons` prop do Sonner
- Border-left colorido mais espesso (4px) usando as cores do design system (`--success`, `--destructive`, `--warning`, `--info`)
- Sombra com glow sutil (`--shadow-elegant`)
- Animação de entrada mais sofisticada via CSS keyframes customizados

### 2. Adicionar CSS de animação para toasts
Adicionar em `src/index.css` keyframes para:
- `toast-slide-in`: slide + fade + scale suave da direita
- `toast-progress`: barra de progresso que diminui durante a duração

### 3. Migrar 4 arquivos de `useToast` para Sonner
Substituir em cada arquivo:
- `import { useToast } from '@/hooks/use-toast'` → `import { toast } from 'sonner'`
- `const { toast } = useToast()` → remover
- `toast({ title: '...', description: '...' })` → `toast.success('...', { description: '...' })`
- `toast({ ..., variant: 'destructive' })` → `toast.error('...')`

Arquivos: `ApiKeysManager.tsx`, `InboundWebhooksManager.tsx`, `ReminderSettings.tsx`, `IntegrationHub.tsx`

### 4. Adicionar toasts faltantes
- `ApiKeysManager.handleToggle`: `toast.success('API Key ativada/desativada')`
- `InboundWebhooksManager.handleToggle`: `toast.success('Webhook ativado/desativado')`
- `IntegrationHub.fetchIntegrations` catch: `toast.error('Erro ao carregar integrações')`

### 5. Remover Radix Toaster do App.tsx
Após migração completa, remover `<Toaster />` (Radix) do `App.tsx` e manter apenas `<SonnerToaster />`. Verificar se nenhum outro arquivo no projeto ainda usa `useToast`.

---

## Arquivos Modificados
- `src/components/ui/sonner.tsx` — redesign visual completo
- `src/index.css` — keyframes de animação para toasts
- `src/components/configuracoes/ApiKeysManager.tsx` — migrar para Sonner + toast em toggle
- `src/components/configuracoes/InboundWebhooksManager.tsx` — migrar para Sonner + toast em toggle
- `src/components/configuracoes/ReminderSettings.tsx` — migrar para Sonner
- `src/components/configuracoes/IntegrationHub.tsx` — migrar para Sonner + toast em fetch error
- `src/App.tsx` — remover `<Toaster />` Radix (se nenhum outro arquivo depender)

