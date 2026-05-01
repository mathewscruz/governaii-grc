## Diagnóstico

Hoje o sistema tem **dois mundos** de status convivendo:

1. **Padrão Akuris correto**: `<StatusBadge tone="..."/>` (`src/components/ui/status-badge.tsx`) — pílula soft, dot semântico, tokens HSL (`success`, `warning`, `destructive`, `info`, `primary`, `neutral`). Já tem identidade.

2. **Genérico "tipo IA"** (o que você está vendo): badges renderizados via funções helper em `src/lib/text-utils.ts` que retornam classes Tailwind cruas:
   - `getRiscoStatusColor` → `bg-gray-100 text-gray-800`, `bg-blue-100 text-blue-800`...
   - `getNivelRiscoColor` → `bg-red-100`, `bg-orange-100`, `bg-yellow-100`, `bg-green-100`, `bg-emerald-100`...
   - `getTratamentoTipoColor` → `bg-purple-100`, `bg-amber-100`...
   - `getTratamentoStatusColor`, `getDueDiligenceStatusColor`

**Problemas desse padrão**:
- Cores Tailwind cruas (não-HSL) **não respeitam o tema dark** — viram blocos pastéis claros sobre o navy.
- Paleta inflada (gray, blue, teal, amber, orange, yellow, emerald, purple) — sem hierarquia.
- Sem dot semântico, sem ícone — só uma faixa colorida com texto.
- Tipografia fraca (`text-[10px]`/`text-xs` sem peso) — parece auto-gerado.
- Convive lado a lado com `StatusBadge` Akuris na mesma tela → quebra coerência.

## Proposta visual: Status com identidade Akuris

Manter a **legibilidade semântica universal** (verde = bom, vermelho = ruim, âmbar = atenção) mas dentro de uma **linguagem editorial sóbria** alinhada ao restante do sistema.

### Anatomia oficial da nova pílula de status

```text
┌──────────────────────────┐
│ ● Em andamento            │
└──────────────────────────┘
   ↑   ↑
   │   └─ DM Sans 11px, font-medium, tracking normal, sem uppercase
   └────── dot 6px na cor do tom (substitui a faixa colorida cheia)
```

- **Forma**: pílula pill (`rounded-full`), padding `px-2.5 py-0.5`, borda 1px sutil (`border-{tone}/20`).
- **Fundo**: `bg-{tone}/10` (soft, ~10% opacidade) — funciona em light e dark.
- **Texto**: `text-{tone}` em peso `font-medium`, tamanho `text-xs`.
- **Dot**: 6px na cor cheia do tom, sempre presente — é o "selo" que dá ritmo visual.
- **Ícone opcional**: substitui o dot quando o status pede reforço (ex: `AlertTriangle` em Crítico, `CheckCircle2` em Concluído, `Clock` em Pendente). Sempre `strokeWidth={1.5}` (assinatura Akuris).
- **Variante "intensity"** para níveis (Crítico vs Alto vs Médio vs Baixo): mesmo formato, mas o **dot ganha um anel concêntrico** sutil (`ring-2 ring-{tone}/30`) nos níveis altos para dar peso visual sem sair da paleta.

### Mapeamento semântico (5 tons + intensidade)

| Tom               | Quando usar                                              | Exemplos                                                              |
|-------------------|----------------------------------------------------------|-----------------------------------------------------------------------|
| `destructive`     | Crítico, vencido, rejeitado, expirado, cancelado         | Risco Crítico/Muito Alto, Status Vencida, Tratamento Cancelado        |
| `warning`         | Atenção, alto, pendente próximo do prazo, aceito formal  | Risco Alto, Aceito (atenção contínua), Pendente próximo do vencimento |
| `info`            | Em andamento, ativo, analisado, em análise               | Em Andamento, Ativo, Analisado, Em Análise                            |
| `success`         | Concluído, tratado, aprovado, baixo, monitorado          | Tratado, Concluído, Aprovado, Baixo                                   |
| `primary`         | Tipos de ação / categorias funcionais (não estado)       | Tipo de tratamento: Mitigar, Transferir, Evitar                       |
| `neutral`         | Identificado, não avaliado, rascunho, sem dados          | Identificado, Não avaliado, Rascunho                                  |

Para **Nível de Risco** (que precisa de uma escala visual mais forte que estado):
- Crítico → `destructive` + ícone `AlertTriangle`
- Muito Alto / Alto → `destructive` (sem ícone) / `warning` + ring no dot
- Médio → `warning`
- Baixo → `success`
- Muito Baixo → `success` + opacidade reduzida no dot

### O que muda no código

#### 1. Estender `StatusBadge` (`src/components/ui/status-badge.tsx`)
Adicionar:
- Prop `size`: `'sm' | 'md'` (sm para tabelas densas, md para detalhes).
- Prop `intensity`: `'normal' | 'high'` — `high` adiciona ring no dot.
- Mantém props atuais (`tone`, `variant`, `icon`, `children`).

#### 2. Criar resolver semântico (`src/lib/status-tone.ts` — novo)
Funções puras que recebem o valor bruto (snake_case do banco) e retornam `{ tone, intensity, icon? }` — ponto único de mapeamento. Substitui as 5 funções "get…Color" do `text-utils.ts`. Cobre:
- `resolveRiscoStatusTone`
- `resolveNivelRiscoTone`
- `resolveTratamentoStatusTone`
- `resolveTratamentoTipoTone`
- `resolveDueDiligenceStatusTone`
- `resolveAprovacaoTone` (Aprovado/Rejeitado/Pendente — atualmente inline em Riscos.tsx)
- `resolveRevisaoTone` (Vencida/N dias)
- `resolveGenericTone` (fallback para qualquer status snake_case via heurística por palavras-chave)

#### 3. Substituir os usos
Migrar todos os call sites das antigas funções para `<StatusBadge>` + resolver:

```tsx
// antes
<Badge className={`${getNivelRiscoColor(value)} border whitespace-nowrap`}>{value}</Badge>

// depois
<StatusBadge {...resolveNivelRiscoTone(value)}>{formatStatus(value)}</StatusBadge>
```

Arquivos afetados (uso direto das funções `get…Color` ou badges inline ad-hoc):
- `src/pages/Riscos.tsx` (nível, status, aprovação, revisão, aceito)
- `src/components/riscos/TratamentosList.tsx` (tipo + status de tratamento)
- `src/components/riscos/AprovacaoRiscoDialog.tsx`
- `src/components/due-diligence/AssessmentsManager.tsx`, `AssessmentsManagerEnhanced.tsx`, `DueDiligenceDashboard.tsx`
- `src/components/governanca/ControlesContent.tsx`, `AuditoriasContent.tsx`, `SistemasContent.tsx` (auditar inline)
- `src/components/gap-analysis/RemediationTab.tsx`, `GenericRequirementsTable.tsx`, `dialogs/RequirementDetailDialog.tsx`, `AuditTrailTimeline.tsx`
- `src/components/auditorias/ItensAuditoriaDialog.tsx`
- `src/components/dashboard/RecentActivities.tsx`, `KpiDrillDownDrawer.tsx`
- `src/components/documentos/HistoricoVersoesDialog.tsx`
- `src/pages/Contratos.tsx`, `Privacidade.tsx`, `RevisaoAcessos.tsx`, `ContasPrivilegiadas.tsx`, `AtivosChaves.tsx`, `AtivosLicencas.tsx` (já importam StatusBadge — auditar para garantir uso consistente)

#### 4. Depreciar as funções antigas
Marcar `getRiscoStatusColor`, `getNivelRiscoColor`, `getTratamentoStatusColor`, `getTratamentoTipoColor`, `getDueDiligenceStatusColor` com `@deprecated` no JSDoc apontando para o resolver, mantendo o export por 1 ciclo para não quebrar outros pontos não mapeados. Opcional: remover ao final se a varredura `rg` confirmar zero usos.

### Detalhes técnicos

```tsx
// src/components/ui/status-badge.tsx — extensão
interface StatusBadgeProps {
  tone?: StatusTone
  variant?: 'soft' | 'solid' | 'outline'
  size?: 'sm' | 'md'              // novo
  intensity?: 'normal' | 'high'   // novo — ring no dot
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
}

// dot com ring opcional
<span
  className={cn(
    'rounded-full',
    size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2',
    styles.dot,
    intensity === 'high' && `ring-2 ring-${tone}/30`
  )}
/>
```

```ts
// src/lib/status-tone.ts — exemplo
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import type { StatusTone } from '@/components/ui/status-badge'

interface ToneResult { tone: StatusTone; intensity?: 'normal'|'high'; icon?: React.ReactNode }

export const resolveNivelRiscoTone = (raw?: string): ToneResult => {
  const v = (raw ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
  if (v === 'critico') return { tone: 'destructive', intensity: 'high', icon: <AlertTriangle className="h-3 w-3" strokeWidth={1.5}/> }
  if (v === 'muito alto' || v === 'alto') return { tone: 'destructive', intensity: 'normal' }
  if (v === 'medio') return { tone: 'warning' }
  if (v === 'baixo') return { tone: 'success' }
  if (v === 'muito baixo') return { tone: 'success', intensity: 'normal' }
  return { tone: 'neutral' }
}
```

## Critério de aceite

- Nenhum badge de status em qualquer módulo usa cores Tailwind cruas (`bg-red-100`, `bg-blue-100`, etc.) — todas via tokens HSL.
- Todo status visível na UI passa por `<StatusBadge>` (soft + dot + tokens semânticos).
- Light e dark mode renderizam com contraste correto.
- Hierarquia visual: Crítico se destaca de Alto se destaca de Médio (via dot+ring+ícone), sem precisar de paleta inflada.
- Mapeamento semântico unificado num único arquivo (`status-tone.ts`).
- Memória de design atualizada com o novo padrão.

## Memória a salvar

Nova entrada `mem://design/foundations/status-badges-akuris` documentando:
- Os 6 tons oficiais e quando usar cada um.
- Anatomia da pílula (soft + dot + ícone opcional).
- Proibição de cores Tailwind cruas em badges de status.
- Resolver único em `src/lib/status-tone.ts`.
