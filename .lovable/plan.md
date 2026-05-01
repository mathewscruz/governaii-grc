## Plano para corrigir o scroll do popup

Vou ajustar a estrutura de altura do modal, porque o problema não está mais apenas nos `ScrollArea` internos: o `DialogShell` está usando apenas `max-height`, então o conteúdo não recebe uma altura fixa para calcular a rolagem dos painéis esquerdo e direito.

### 1. Dar altura real ao popup de detalhe
No `RequirementDetailDialog.tsx`, vou passar uma classe explícita para o `DialogShell`:

```tsx
className="h-[100dvh] sm:h-[92vh]"
```

Isso faz o modal ocupar uma altura controlada, igual ao padrão já usado em outro diálogo grande do sistema (`DocGenDialog`), permitindo que os filhos com `h-full` e `flex-1` calculem corretamente a área disponível.

### 2. Reforçar a área de conteúdo com `min-h-0`
Vou manter e, se necessário, reforçar a cadeia de containers com:

- `h-full`
- `min-h-0`
- `overflow-hidden`
- `flex-1`

A sequência esperada será:

```text
DialogShell com altura fixa
└── body flex-1 min-h-0 overflow-hidden
    └── wrapper h-full flex flex-col min-h-0 overflow-hidden
        ├── status bar fixa
        └── área dos painéis flex-1 min-h-0 overflow-hidden
            ├── painel esquerdo scrollável
            └── painel direito scrollável
```

### 3. Ajustar os dois painéis para rolagem independente
Nos dois painéis (`Orientação do Requisito` e jornada da avaliação), vou ajustar o `ScrollArea` para ter altura calculável e impedir expansão do conteúdo:

- painel esquerdo: `h-full min-h-0 overflow-hidden`
- painel direito: `h-full min-h-0 overflow-hidden`

Se o Radix `ScrollArea` continuar não renderizando barra visível nesse layout específico, vou substituir somente esses dois painéis por `div` nativo com `overflow-y-auto`, que é mais simples e mais confiável para esse caso.

### 4. Preservar footer e status fixos
O rodapé com “Cancelar / Salvar avaliação” continuará fixo no final do popup, e a barra de status continuará fixa no topo do conteúdo. Apenas o conteúdo interno de cada coluna será rolável.

### Resultado esperado
Com o ajuste, o usuário conseguirá rolar separadamente:

- lado esquerdo: textos longos de orientação e exemplos de evidências;
- lado direito: evidências, plano de ação, detalhes da avaliação, vínculos e histórico.

O popup não deve mais cortar os campos abaixo nem impedir preenchimento/salvamento.