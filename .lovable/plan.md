## Objetivo

Eliminar a contradição entre o gauge **"Saúde Organizacional" (40)** e a lista **"Maturidade GRC" (64%)** unificando o cálculo. Substituir o gauge gigante por um bloco mais funcional dentro do Hero Banner.

## Diagnóstico (recap)

- Ambos consomem `useRadarChartData` (mesmos 8 módulos).
- **Gauge** divide por 8 (inclui módulos "Sem dados" como 0). → 40
- **Lista** divide só pelos módulos com dados. → 64% (correto, alinhado a `mem://logic/sistema-scoring-base-zero-v2`).
- Mostrar dois números diferentes para o mesmo conceito é o problema central.

## Implementação

### 1. Criar fonte única de verdade

**Novo hook**: `src/hooks/useGrcMaturityScore.ts`
- Reusa `useRadarChartData`.
- Retorna `{ score, status, label, modulesWithData, totalModules, isLoading }`.
- Usa a fórmula correta (média só dos módulos com `hasData`).
- Limiares: ≥80 Excelente / ≥60 Bom / ≥40 Atenção / <40 Crítico.

### 2. Refatorar `MultiDimensionalRadar`
Substituir o cálculo inline pelo hook acima — apenas consumir.

### 3. Substituir o gauge no Hero Banner

**Editar** `src/components/dashboard/HeroScoreBanner.tsx`:
- Remover `<HealthScoreGauge>` (gauge meia-lua de 40).
- Inserir bloco compacto à esquerda do banner (mesma área do gauge atual):
  - **Linha 1**: rótulo `Maturidade GRC` (text-xs muted).
  - **Linha 2**: número grande `64%` + ícone de status (✓ / ⚠ / ✕) na cor do nível.
  - **Linha 3**: badge `Bom` + chip "X de 8 módulos com dados".
  - **Linha 4 (rodapé)**: chip de tendência — comparar score atual com o último snapshot disponível em `gap_analysis_score_history` agregado da empresa (delta percentual com seta ↑/↓ verde/vermelho). Se ainda não houver histórico, ocultar a linha (sem placeholder).

**Editar** `src/pages/Dashboard.tsx`:
- Trocar `healthScore` (média errada) pelo retorno de `useGrcMaturityScore`.
- Passar `score`, `status`, `modulesWithData`, `totalModules` para o `HeroScoreBanner`.

### 4. Limpeza
- `HealthScoreGauge.tsx`: deletar (deixa de ser usado).
- `prop healthScore` no banner: renomear para `maturityScore` para refletir a verdade.

### 5. Memória
Atualizar `mem://logic/sistema-scoring-base-zero-v2` adicionando: "Maturidade GRC do dashboard usa `useGrcMaturityScore` — única fonte; nunca recalcular ad-hoc".

## Tendência: como funciona

- O `gap_analysis_score_history` armazena scores **por framework**. Para o Hero, vou pegar a média ponderada do score por empresa de **30 dias atrás vs. hoje** (proxy razoável, sem precisar criar tabela nova).
- Se quiser uma tendência mais precisa do score GRC consolidado no futuro, podemos criar uma tabela `grc_score_snapshots` rodando via cron — fica como evolução opcional, fora do escopo agora.

## Arquivos afetados

- **Novo**: `src/hooks/useGrcMaturityScore.ts`
- **Editado**: `src/components/dashboard/HeroScoreBanner.tsx`, `src/components/dashboard/MultiDimensionalRadar.tsx`, `src/pages/Dashboard.tsx`
- **Deletado**: `src/components/dashboard/HealthScoreGauge.tsx`
- **Memória**: atualização de `sistema-scoring-base-zero-v2`

## Fora de escopo
- Não cria tabela nova de snapshots GRC consolidados.
- Não mexe nos demais KPIPills nem no Radar (só no card de Maturidade que já consome o mesmo hook).

Aprova que eu implemento?