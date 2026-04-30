## Objetivo

1. **Voltar o visual do gauge meia-lua** no Hero Banner, mantendo o cálculo correto da Maturidade GRC e o bloco de informações (status, X/8 módulos, tendência).
2. **Remover o `%` redundante** do card "Maturidade GRC" no radar lateral.
3. **Substituir os 3 KPI Pills redundantes** com o Hero Banner por indicadores mais relevantes.

## 1. Voltar o gauge (visual antigo, dado novo)

**Recriar** `src/components/dashboard/HealthScoreGauge.tsx` no mesmo estilo da imagem original (arco semicircular preenchido, número grande no centro, label de status embaixo). Diferenças vs. versão antiga:
- Recebe o `GrcMaturity` completo (não um número solto), garantindo que mostre **exatamente o mesmo score do card lateral** (no exemplo: 64 / Bom).
- Cor do arco varia por nível: verde (≥80) / roxo (≥60) / amarelo (≥40) / vermelho (<40) / cinza (sem dados).
- Quando `status === 'no_data'` exibe `—` em vez de `0`.

**Editar** `HeroScoreBanner.tsx`:
- Substituir o "bloco compacto" atual pelo novo gauge à esquerda.
- À direita do gauge, manter (em coluna compacta) o que o usuário pediu para preservar:
  - Badge `Bom` + chip `5/8 módulos`
  - Linha de tendência `+18 pts vs. 30d` (quando houver)
- Resultado visual: gauge grande à esquerda, mini-bloco de contexto logo abaixo/ao lado, e o "Olá, Nome" + métricas continuam à direita como antes.

## 2. Remover `%` duplicado do card "Maturidade GRC"

**Editar** `MultiDimensionalRadar.tsx` (cabeçalho do card):
- Manter apenas o badge `Bom` + ícone de status (sem o número grande `64%`), já que o número agora está no gauge do Hero.
- Subtítulo: `5 de 8 módulos com dados` para manter contexto sem repetir o score.
- A lista de módulos individuais (Riscos 100%, Ativos 80% etc.) continua igual — esses % são por módulo, não duplicam o consolidado.

## 3. KPI Pills — remover redundâncias e adicionar indicadores relevantes

### Remover (já aparecem no Hero Banner)
- ❌ **Alertas (OK)** — já exibido como "Alertas Críticos" no Hero
- ❌ **Controles** — já exibido como "Controles Ativos" no Hero
- ❌ **Conformidade 49%** — já exibido como "Conformidade 49%" no Hero

### Manter
- ✅ Ativos · Incidentes · Contratos · Documentos (não estão no Hero)

### Adicionar (4 novos pills relevantes e acionáveis)

| Pill | Valor | Badge contextual | Rota |
|---|---|---|---|
| **Riscos** | total de riscos cadastrados | `X críticos` (destructive) ou `X altos` (warning) | `/riscos` |
| **Planos de Ação** | pendentes em aberto | `X atrasados` (destructive) | `/planos-acao` |
| **Due Diligence** | assessments ativos | `X expirados` (destructive) ou `X em progresso` (info) | `/due-diligence` |
| **Denúncias** | abertas + em andamento | `X novas` (warning) | `/denuncia` |

Esses 4 são **acionáveis** (mostram trabalho a fazer) e não duplicam o Hero. Cobrem os módulos de GRC core que hoje não têm pill.

**Editar** `KPIPills.tsx` e `Dashboard.tsx`:
- Remover os 3 pills redundantes da prop e do array.
- Adicionar as novas props (`totalRiscos`, `riscosCriticos`, `planosPendentes`, `planosAtrasados`, `ddAtivos`, `ddExpirados`, `denunciasAbertas`, `denunciasNovas`).
- `Dashboard.tsx` já usa `useRiscosStats`, `useDueDiligenceStats`, `useDenunciasStats` (via `useRadarChartData`). Para Planos de Ação, vou reusar o hook existente (`usePlanosAcaoStats` se houver) ou contar via Supabase com o filtro `empresa_id` e status pendente.

## Verificações

- Reusar o **hook unificado `useGrcMaturityScore`** — não recriar média.
- Manter a regra zero-base (módulos sem dados não puxam o score pra baixo).
- Manter `.eq('empresa_id', empresaId)` em qualquer query nova.
- i18n: adicionar chaves PT/EN dos novos pills.

## Arquivos afetados

- **Recriado**: `src/components/dashboard/HealthScoreGauge.tsx`
- **Editado**: `src/components/dashboard/HeroScoreBanner.tsx`, `src/components/dashboard/MultiDimensionalRadar.tsx`, `src/components/dashboard/KPIPills.tsx`, `src/pages/Dashboard.tsx`, `src/i18n/pt.ts`, `src/i18n/en.ts`
- **Talvez novo**: `src/hooks/usePlanosAcaoStats.ts` (se ainda não existir)

## Fora de escopo
- Não criar tabela nova de snapshots GRC.
- Não mexer na lista de módulos do card de Maturidade (continua mostrando os 8).

Aprova?