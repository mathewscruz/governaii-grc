# Fix — Espaço vazio reservado pelo CTA "Ver detalhes" no StatCard

## Problema

Hoje, o CTA "Ver detalhes →" ocupa lugar no fluxo do `CardContent` mesmo quando está com `opacity-0` em repouso. Resultado: ~21px de altura reservada em todo card interativo, criando uma faixa vazia entre a última linha de conteúdo (segments / description / empty hint) e a borda inferior do card.

## Causa

Em `src/components/ui/stat-card.tsx` o bloco do CTA é um `div` normal dentro do `space-y-3` do `CardContent`. Apenas os filhos (`span` e `ArrowRight`) ficam invisíveis com `opacity-0`, mas o `div` pai segue ocupando linha + `pt-1`.

## Solução

Tirar o CTA do fluxo: posicioná-lo de forma **absoluta** no canto inferior direito do card, com `pointer-events-none`. Em repouso o card colapsa naturalmente para a altura do conteúdo real; no hover o CTA faz fade + slide-in por cima do padding inferior.

Como o `Card` raiz já é `relative overflow-hidden`, basta usar `absolute bottom-2 right-3`. Não interfere com o `CornerAccent` (top-right) nem com o accent-bar lateral.

### Código (substituição em `src/components/ui/stat-card.tsx`, linhas 290–298)

```tsx
{/* CTA discreta (só se interativo) — absolute, não reserva espaço */}
{showCTA && (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute bottom-2 right-3 inline-flex items-center gap-1 text-[11px] font-medium text-primary opacity-0 translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0"
  >
    <span>{drillDown ? "Ver detalhes" : "Abrir"}</span>
    <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
  </div>
)}
```

### Anatomia visual após a correção

```text
Antes (hover desligado)                 Depois (hover desligado)
┌──────────────────────────┐            ┌──────────────────────────┐
│ ◇ Riscos ativos    ↗ +12%│            │ ◇ Riscos ativos    ↗ +12%│
│                          │            │                          │
│ 42                       │            │ 42                       │
│                          │            │ ████░░  3 críticos       │
│ ████░░  3 críticos       │            └──────────────────────────┘
│                          │             ↑ card encolhe ~24px
│  (espaço vazio aqui)     │
└──────────────────────────┘
```

No hover o CTA aparece sobreposto no canto inferior direito, sem afetar a altura.

## Detalhes técnicos

- `pointer-events-none`: o clique continua sendo capturado pelo `Card` inteiro (que já é o `role="button"`), o CTA é puramente visual.
- `aria-hidden="true"`: o aria-label do card já anuncia título + valor; o CTA é decorativo.
- `bottom-2 right-3`: alinhado com o `p-5 pl-6` do `CardContent` sem encostar na borda.
- Mantém a transição suave (opacity + translate) que já existia.
- Nenhuma mudança de API; nenhum dos 16 módulos migrados precisa ser tocado.

## Arquivo afetado

- `src/components/ui/stat-card.tsx` — apenas o bloco do CTA (linhas 290–298).

## Não muda

- Anatomia herói (ícone inline, valor, segments, trend, accent).
- Comportamento de drill-down e `onClick`.
- Loading via `AkurisPulse`, empty hint, badges.
- Cards não-interativos (sem `drillDown`/`onClick`) já não renderizavam o CTA — continuam idênticos.
