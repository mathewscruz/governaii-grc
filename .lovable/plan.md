

# Plano: Otimização de Performance Global do Sistema

## Problemas Identificados

### 1. Tela de Login — Lentidão ao carregar

**Causa raiz**: O fluxo de login faz 3 round-trips de rede obrigatórios:
- `signInWithPassword` → `signOut` → `send-mfa-code` (Edge Function) → `signInWithPassword` novamente
- Após login, o `AuthProvider` executa sequencialmente: `checkTemporaryPassword` → `fetchProfile` → `initializeUserPermissions` (3 queries em série)

**Correções**:
- Paralelizar `checkTemporaryPassword` e `fetchProfile` usando `Promise.all` no AuthProvider (economiza ~200-400ms)
- No fluxo MFA quando `skipped=true`, evitar o `signOut` prévio — re-autenticar direto sem destruir sessão

### 2. GapAnalysis — Travamento ao atualizar status

**Causa raiz**: `handleStatusChange` faz **5 queries sequenciais** ao Supabase:
1. Verifica se avaliação existe (`select`)
2. Faz `update` ou `insert`
3. `loadRequirements()` — recarrega TODOS os requisitos + avaliações
4. Busca `freshReqs` novamente
5. Busca `freshEvals` novamente
6. `saveScoreHistory`
7. `onStatusChange()` → dispara reload do pai (mais 2 queries)

Total: **~7 queries sequenciais** para mudar UM status. Sem updates otimistas — a UI congela esperando tudo terminar.

**Correções**:
- Implementar **update otimista**: atualizar o state local imediatamente com o novo status, fazer a persistência em background
- Eliminar queries redundantes (3, 4, 5): após o upsert, atualizar o array local ao invés de recarregar tudo do banco
- Calcular score localmente com os dados que já temos em memória
- Chamar `onStatusChange()` com debounce para evitar cascata de reloads

### 3. Dashboard — Excesso de queries paralelas

**Causa raiz**: `useRadarChartData` instancia **8 hooks de stats** separados, cada um fazendo sua própria query. Somados ao `useDashboardStats`, são **~12 queries** simultâneas no carregamento do Dashboard.

**Correções**:
- Adicionar `staleTime` nos hooks que não têm (useAtivosStats, useControlesStats) para evitar refetch desnecessário
- Os hooks já usam React Query, então adicionar `staleTime: 5 * 60 * 1000` (5 min) em todos

### 4. Bug no `useGapAnalysisStats` — Cache desconfigurado

**Causa raiz**: O `useOptimizedQuery` interpreta `staleTime` em **minutos**, mas `useGapAnalysisStats` passa `5 * 60 * 1000` (300.000 minutos = ~208 dias). Isso faz com que a cache nunca seja considerada stale, potencialmente mostrando dados desatualizados.

**Correção**: Corrigir para `staleTime: 5` (5 minutos) e `cacheDuration: 5`.

### 5. `useInactivityTimeout` — Event listeners sem throttle

**Causa raiz**: `resetTimer` é chamado a cada `mousedown`, `keydown`, `scroll`, `touchstart`, `click` sem nenhum throttle. Cada chamada limpa e recria 2 `setTimeout`. Em uso normal, scroll pode disparar 60+ vezes/segundo.

**Correção**: Adicionar throttle de 30 segundos — resetar timer no máximo 1x a cada 30s.

### 6. Logger escrevendo no localStorage em produção

**Causa raiz**: `sendToMonitoring` escreve no `localStorage` a cada `error` ou `warn`. localStorage é síncrono e bloqueia a main thread. Com muitos logs isso degrada performance.

**Correção**: Remover escrita em localStorage (não há serviço de monitoramento real configurado). Manter apenas console.

### 7. `forceLogoUpdate` com double setState

**Causa raiz**: Chama `setLogoUpdateKey` duas vezes (imediato + setTimeout 100ms) causando 2 re-renders desnecessários da árvore inteira.

**Correção**: Remover o setTimeout duplicado.

## Resumo de Arquivos Afetados

| Arquivo | Mudança |
|---------|---------|
| `src/components/AuthProvider.tsx` | Paralelizar queries pós-login, remover forceLogoUpdate duplicado |
| `src/components/gap-analysis/GenericRequirementsTable.tsx` | Update otimista + eliminar queries redundantes |
| `src/pages/GapAnalysisFrameworkDetail.tsx` | Debounce no handleScoreChange |
| `src/hooks/useGapAnalysisStats.tsx` | Corrigir valores staleTime/cacheDuration |
| `src/hooks/useAtivosStats.tsx` | Adicionar staleTime |
| `src/hooks/useControlesStats.tsx` | Adicionar staleTime |
| `src/hooks/useIncidentesStats.tsx` | Adicionar staleTime |
| `src/hooks/useContratosStats.tsx` | Adicionar staleTime |
| `src/hooks/useDocumentosStats.tsx` | Adicionar staleTime |
| `src/hooks/useInactivityTimeout.tsx` | Throttle nos event listeners |
| `src/lib/logger.ts` | Remover localStorage sync write |

## Impacto Esperado

- **Login**: ~40% mais rápido (queries paralelas)
- **GapAnalysis status update**: de ~2-3s para ~instant (otimista)
- **Dashboard**: queries com cache de 5min evitam refetch em navegação
- **Geral**: menos re-renders, menos bloqueio de main thread

