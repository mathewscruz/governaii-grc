## Diagnóstico

A tela que você mandou é o card **"Evolução do Score"** (componente `ScoreEvolutionChart`), que aparece principalmente na aba **Histórico** do framework. O motivo de ficar "tudo branco" é simples: quando há apenas **1 registro de score** no banco, o `LineChart` do Recharts não consegue desenhar uma linha (precisa de pelo menos 2 pontos), então sobra só um pontinho perdido no meio do canvas.

Além disso, o componente atual tem outros problemas visuais:

- 4 botões grandes (`Dia / Semana / Mês / Ano`) que pesam o cabeçalho e destoam do segmented control compacto que adotamos no `FrameworkHeroSummary`
- Sem gradiente / sem área preenchida → linha seca
- Sem mostrar o valor atual nem o delta vs. anterior no cabeçalho
- Empty state genérico ("Nenhum histórico disponível ainda") sem orientação
- Sem referência visual da meta (80% / nível "Bom")

## Plano de melhoria

Reescrever o `ScoreEvolutionChart` mantendo a API (props `frameworkId` + `scoreType`), as cores semânticas e o hook `useScoreHistory`. Mudanças visuais:

### 1. Header mais informativo

```text
Evolução do Score                            [Dia][Semana][Mês][Ano]
47% ▲ +3.2% vs. anterior
```

- Título + valor atual em destaque + delta colorido (verde/vermelho/cinza com ícone `TrendingUp/Down/Minus`)
- Toggle de período em formato segmentado compacto (igual ao do hero), em vez de 4 botões grandes
- Quando só há 1 ponto: troca o delta por um chip discreto "primeiro registro"

### 2. Gráfico de área com gradiente (em vez de linha seca)

- `AreaChart` com `linearGradient` primary → transparente (mesmo padrão do hero)
- Linha mais grossa (2.5px), pontos sutis, `activeDot` com halo branco no hover
- `CartesianGrid` apenas horizontal, opacidade reduzida
- `YAxis` sem linha de eixo, ticks discretos
- `ReferenceLine` tracejada na linha de meta (80% percentage / 4.0 decimal) com label "Meta" em verde
- Cursor do tooltip tracejado (não barra cheia)
- Tooltip com sombra suave + labels alinhados ao design system

### 3. Tratamento dos 3 estados de dado

| Estado | Comportamento |
|---|---|
| **0 pontos** | Empty state ilustrado: card pontilhado com ícone `LineChart` em círculo + texto "Sem histórico ainda" + dica "Avalie alguns requisitos para começar a registrar a evolução do seu score nesse período." |
| **1 ponto** | Duplica o ponto internamente (`[{...p, date:'Início'}, p]`) para que a área renderize como uma faixa horizontal preenchida → não fica mais branco. Sobrepõe um chip discreto centralizado: "Registre mais avaliações para visualizar a tendência". O ponto único fica destacado (raio 5, borda branca). |
| **2+ pontos** | Renderização normal com área + linha + pontos + tooltip. |

### 4. Ticks da escala

Reduzir os ticks para `[0, 25, 50, 75, 100]` (em vez de 6 níveis) — menos ruído visual.

### Arquivos alterados

- `src/components/gap-analysis/ScoreEvolutionChart.tsx` — reescrito completo (mantém API e impacta automaticamente o `FrameworkHistoryTab` e o `GenericScoreDashboard`, que continuam funcionando sem mudança).

### Resultado esperado

- Card sempre tem **algo visual relevante** mesmo com 1 ponto (faixa preenchida em vez de branco)
- Cabeçalho passa o "estado" (valor + tendência) sem o usuário precisar olhar o gráfico
- Linha de meta deixa claro "onde a empresa quer chegar"
- Visual coerente com o `FrameworkHeroSummary` (mesmo gradiente, mesmo segmented control)