

# Plano: Melhorar visibilidade do Nível de Maturidade

## Problema

Atualmente exibe apenas "🟡 Nível 3" — o usuário precisa fazer hover no tooltip para entender o significado. Isso é pouco intuitivo.

## Solução

Mostrar o nome e a descrição do nível diretamente no badge, sem depender do tooltip. Formato:

```text
🟡 Nível 3 — Definido
   Processos documentados e padronizados
```

## Mudança

| Arquivo | Detalhe |
|---------|---------|
| `GenericScoreDashboard.tsx` (linhas 160-180) | Remover `TooltipProvider/Tooltip/TooltipTrigger/TooltipContent`. Substituir por um bloco que mostra `Nível {level} — {name}` na primeira linha e `{description}` em texto menor abaixo. Manter o ícone e as cores do `maturity`. |

O badge ficará assim:
```tsx
<div className={`inline-flex flex-col gap-0.5 px-2 py-1 rounded-md ${maturity.bgColor} border text-xs w-fit`}>
  <div className="flex items-center gap-1">
    <span>{maturity.icon}</span>
    <span className={`font-semibold ${maturity.color}`}>
      Nível {maturity.level} — {maturity.name}
    </span>
  </div>
  <span className="text-[10px] text-muted-foreground">{maturity.description}</span>
</div>
```

