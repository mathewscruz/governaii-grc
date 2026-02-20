

# Substituir Grafico de Barras por Lista de Progress Bars

## Problema

O grafico de barras horizontais do Recharts tem limitacoes intrinsecas para exibir nomes longos de categorias: o eixo Y trunca nomes, a area do grafico fica comprimida, e os labels se sobrepoem. Nenhum ajuste de margem/largura resolve bem todos os cenarios.

## Solucao

Substituir o `BarChart` do Recharts por uma **lista estilizada com Progress bars nativas** (componente `Progress` que ja existe no projeto). Cada categoria vira uma linha com:

- Nome completo da categoria (sem truncar, com texto que quebra linha se necessario)
- Barra de progresso colorida proporcional ao score
- Valor do score e contagem de avaliados a direita

Esse padrao ja e usado em outros lugares do sistema (ex: `ScoreVisualization`, `ReportsView`) e resolve todos os problemas de sobreposicao, pois cada item ocupa sua propria linha com espaco suficiente.

## Arquivo

`src/components/gap-analysis/CategoryBarChart.tsx`

### Mudancas

1. **Remover imports do Recharts** (BarChart, Bar, XAxis, YAxis, etc.)
2. **Importar `Progress`** de `@/components/ui/progress`
3. **Importar `Tooltip`** de `@/components/ui/tooltip` para mostrar detalhes ao hover
4. **Renderizar lista scrollavel** com `max-h-[320px] overflow-y-auto` e cada item contendo:
   - Nome completo da categoria (text-sm, sem truncar)
   - `Progress` bar com cor baseada no score (usando CSS variable ou className)
   - Badge/texto com score e "X/Y avaliados"
5. **Manter a mesma logica de cores** (tons de azul baseados no score)
6. **Manter a mesma interface** (`CategoryBarChartProps`) para nao quebrar nada externamente

### Resultado visual

Cada categoria sera uma linha legivel assim:

```
Contexto Organizacional          [=========-------] 2.3  3/7
Estrategia de Gestao de Riscos   [================] 4.8  7/7
Papeis e Responsabilidades       [===-------------] 1.2  2/5
```

Compacto, legivel, sem sobreposicao, nomes completos visiveis.

