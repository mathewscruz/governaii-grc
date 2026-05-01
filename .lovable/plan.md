## Diagnóstico

Os cards de KPI ficam com alturas diferentes por **três razões** que se somam (visíveis em `/riscos`):

1. **Conteúdo da Linha 3 varia entre cards na mesma linha**:
   - "Total de riscos" usa `segments` → renderiza barra de 6px + legenda que **quebra em 2 linhas** quando os 3 itens (críticos, altos, demais) não cabem.
   - "Tratamentos Concluídos" e "Riscos Aceitos" usam `description` → 1 linha de texto.
   - Resultado: card 1 fica ~30px mais alto que os cards 2 e 3.

2. **Cards customizados fora do `StatCard` quebram o padrão**:
   - O 4º card de Riscos é o `RiskScoreCard` (componente próprio com gauge SVG 90px + legenda), com paddings, header e tipografia totalmente diferentes do `StatCard`. Ele também não respeita `self-start` nem a anatomia editorial.

3. **`self-start` (aplicado na correção anterior) deixou os cards "soltos" no grid**: cada card colapsa para sua altura natural, expondo as diferenças de conteúdo. O resultado é "três tamanhos diferentes na mesma linha".

Outros módulos (Documentos, Privacidade, Continuidade etc.) sofrem do mesmo problema #1 sempre que misturam `segments` com `description`.

## Solução

Padronizar a altura mínima do `StatCard` para que todos os cards da linha tenham o mesmo tamanho visual, **independentemente de o conteúdo ser segments, description, ambos ou nenhum**. E refazer o `RiskScoreCard` reutilizando o `StatCard` para herdar a mesma anatomia.

### 1. `src/components/ui/stat-card.tsx` — altura mínima padronizada

- Remover `self-start` da base (estava forçando colapso individual).
- Adicionar `min-h-[148px]` ao card e `h-full` ao `Card` raiz, garantindo que todos os cards do grid tenham a **mesma altura mínima** e que o grid os estique uniformemente quando algum tiver mais conteúdo.
- Reservar a Linha 3 com `min-h-[44px]` (cabe 2 linhas de legenda de segments OU 2 linhas de description, sem saltos).
- Manter o CTA "Ver detalhes" em `absolute` (já está) — não conta para altura.

Resultado: cards com `segments`, `description` ou nenhum dos dois ficam **idênticos em altura** dentro de uma mesma linha do grid.

### 2. `src/components/riscos/RiskScoreCard.tsx` — alinhar à anatomia do StatCard

Reescrever para envolver o `StatCard` (ou imitar sua estrutura externa) usando o mesmo `Card variant="elevated"`, mesmo padding (`p-5 pl-6`), mesma `min-h-[148px]` e mesma linha de título (ícone + label uppercase). O gauge SVG passa a ser o "valor herói" — reduzir para 120×68 e mover a legenda de níveis para o rodapé compacto, ocupando o mesmo slot que `segments`/`description` ocupam nos demais cards.

Manter a lógica de cálculo (`calcDisplayScore`, cores, tendência 7d). Apenas a **embalagem visual** muda.

### 3. Auditoria rápida nos outros módulos

Após o ajuste no `StatCard`, fazer uma varredura visual nos módulos críticos (Documentos, Privacidade, Continuidade, Contratos, Incidentes, Planos de Ação, Ativos*, Due Diligence, Gap Analysis) para confirmar que **nenhum** ainda usa um Card customizado fora do padrão na mesma linha de KPIs. Se encontrar algum, aplicar o mesmo tratamento do RiskScoreCard (envolver em `StatCard` ou alinhar a estrutura externa).

## Detalhes técnicos

```tsx
// stat-card.tsx — base variants
const statCardVariants = cva(
  "group relative overflow-hidden transition-all duration-300 h-full min-h-[148px]",
  { /* mantém variants atuais, sem self-start */ }
)

// CardContent: reservar slot da linha 3 para evitar saltos de altura
<CardContent className="p-5 pl-6 flex flex-col gap-3 h-full">
  {/* linha 1: título + delta */}
  {/* linha 2: valor herói */}
  <div className="min-h-[44px]">
    {/* segments OU description OU vazio */}
  </div>
</CardContent>
```

```tsx
// RiskScoreCard.tsx — nova embalagem
<Card variant="elevated" className="h-full min-h-[148px] relative overflow-hidden">
  <CardContent className="p-5 pl-6 flex flex-col gap-3 h-full">
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Score de Risco
      </span>
      {hasVariation && <TrendBadge .../>}
    </div>
    <div className="flex items-center gap-4">
      <GaugeSVG width={120} height={68} score={displayScore} color={scoreColor} />
      <div>
        <div className="text-3xl font-semibold tabular-nums leading-none">{displayScore}</div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </div>
    </div>
    <div className="min-h-[20px] flex items-center gap-3 text-[10px] text-muted-foreground">
      {legendItems.map(...)}
    </div>
  </CardContent>
</Card>
```

## Arquivos afetados

- `src/components/ui/stat-card.tsx` — altura mínima padronizada, slot reservado.
- `src/components/riscos/RiskScoreCard.tsx` — reescrito para herdar a anatomia.
- Possíveis ajustes pontuais em módulos cujo grid de KPIs misture `StatCard` com cards customizados (verificação em tempo de execução).

## Critério de aceite

- Em `/riscos`, os 4 cards da primeira linha têm exatamente a mesma altura.
- Em qualquer módulo, cards de KPI na mesma linha do grid têm altura idêntica, mesmo quando uns usam `segments` e outros `description`.
- Hover/CTA continuam não causando deslocamento.
- Nenhuma regressão em mobile (breakpoints `md`/`lg` continuam empilhando 1 ou 2 colunas).
