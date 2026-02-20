

# Corrigir Grafico "Aderencia por Categoria" - Nomes Sobrepostos

## Problema

O grafico horizontal de barras (`CategoryBarChart.tsx`) tem dois problemas que causam sobreposicao de nomes:

1. **YAxis com largura fixa de 55px** -- nomes longos de categorias sao cortados e sobrepostos
2. **Altura fixa de 300px** -- com muitas categorias, as barras ficam comprimidas e os labels se sobrepoe verticalmente

## Solucao

Manter o tipo de grafico (barras horizontais e o mais adequado para comparar categorias com nomes longos), mas corrigir o dimensionamento:

**Arquivo**: `src/components/gap-analysis/CategoryBarChart.tsx`

### Mudancas:

1. **Altura dinamica**: calcular a altura com base no numero de categorias (minimo 250px, ~45px por categoria), garantindo que cada barra tenha espaco suficiente
2. **Largura do YAxis aumentada**: de 55px para 140px, acomodando nomes longos
3. **Margem esquerda aumentada**: de 60px para 145px
4. **Truncar nomes muito longos**: limitar a ~22 caracteres com "..." no eixo Y, mostrando o nome completo no tooltip
5. **Tick customizado no YAxis**: usar `tickFormatter` para truncar nomes longos com reticencias, evitando sobreposicao horizontal
6. **Font size reduzido no YAxis**: de 12px para 11px para acomodar melhor textos maiores

Essas mudancas garantem que:
- Categorias com nomes longos aparecem legíveis (truncadas com "..." se necessario)
- O tooltip mostra o nome completo ao passar o mouse
- Com muitas categorias, a altura cresce proporcionalmente evitando sobreposicao vertical

