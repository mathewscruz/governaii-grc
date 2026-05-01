## Padronizar "Evolução de Riscos" no padrão dos frameworks

Hoje o card **Evolução de Riscos** do dashboard usa um `ComposedChart` com 4 curvas (críticos/altos/médios/baixos) e legenda interativa, enquanto os frameworks usam o `ScoreEvolutionChart` (Gap Analysis): área única com gradiente, seletor Dia/Semana/Mês/Ano, KPI de delta no header e linha de meta. A inconsistência visual quebra a identidade.

### Solução

Reescrever `src/components/dashboard/RiskScoreTimeline.tsx` espelhando o `ScoreEvolutionChart`, consolidando as 4 séries em **um único Score de Risco (0–100, quanto maior, melhor)**.

### Fórmula do Score (0–100)

Calculado por bucket de tempo, sobre os riscos cadastrados até a data do bucket (acumulado, igual ao comportamento atual):

```
peso = críticos×4 + altos×3 + médios×2 + baixos×1
exposição = min(100, (peso / total_riscos) × 25)
score = 100 − exposição     // 100 = sem exposição, 0 = todos críticos
```

- Sem riscos → score = 100.
- Bucketização por `nivel_risco_residual` (com fallback para `nivel_risco_inicial`), cobrindo as variações "Muito Alto", "Moderado", "Muito Baixo".

### Visual (idêntico ao framework)

- Card com `CornerAccent` (mantém identidade Akuris).
- Header: `CardTitle` + valor herói (`97 / 100`) + delta `vs. anterior` com TrendingUp/Down e cor success/destructive (subir o score = verde, pois exposição caiu).
- Subtítulo discreto: `· N riscos`.
- Seletor Dia / Semana / Mês / Ano à direita (mesmos pills do `ScoreEvolutionChart`).
- `AreaChart` com 1 série (`hsl(var(--primary))`), gradiente do mesmo `linearGradient`.
- `ReferenceLine` em **80** com label "Meta".
- `Tooltip` no padrão Akuris mostrando `Score de risco · X crít · Y altos`.
- `EmptyState` ilustrado quando não houver riscos.
- `AkurisPulse` no estado de loading (substitui o `Skeleton` atual, alinhando com a regra "AkurisPulse é o único loader").

### Buckets por período

- Dia: últimos 7 dias.
- Semana: últimas 4 semanas.
- Mês: últimos 6 meses.
- Ano: últimos 5 anos.

### Arquivos afetados

- `src/components/dashboard/RiskScoreTimeline.tsx` — reescrita completa.

Sem mudanças de schema, sem migrações, sem novos hooks. A query já existente (`riscos` com `nivel_risco_*` + `created_at` filtrado por `empresa_id`) é reutilizada.

### Validação

Abrir `/dashboard` e conferir:
1. Card "Evolução de Riscos" com mesmo layout visual do "Evolução do Score" dos frameworks.
2. Score atual e delta no header.
3. Alternar Dia/Semana/Mês/Ano recalcula a curva.
4. Linha tracejada de Meta em 80.
5. Tooltip mostra crít/altos do ponto.
