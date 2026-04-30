## Objetivo

Substituir o ícone genérico de toggle da sidebar (`PanelLeft` do Lucide, usado por inúmeros SaaS) por um **ícone SVG customizado** alinhado à identidade visual da Akuris (Navy #0a1628 / Purple #7552FF, estética "Command Center").

## Conceito do ícone

Criar um SVG próprio que combine:
- A metáfora de **painel lateral** (mantém affordance do "abrir/recolher menu" que o usuário já conhece)
- Um elemento da identidade Akuris: **escudo/shield estilizado** (referência GRC — governança, risco, compliance) com uma barra lateral à esquerda, sugerindo "navegação + proteção".

Resultado: um ícone único, leve (24x24, stroke 2), que muda sutilmente de estado quando a sidebar está aberta vs. fechada (preenchimento da barra lateral).

```text
 ┌─┬──────┐        ┌─┬──────┐
 │█│  ◊   │        │ │  ◊   │
 │█│      │        │ │      │
 └─┴──────┘        └─┴──────┘
   aberta            fechada
```
(`◊` = mini shield ao centro; barra esquerda preenchida quando aberta)

## Implementação

1. **Criar componente** `src/components/icons/AkurisSidebarIcon.tsx`
   - SVG inline 24x24, `stroke="currentColor"`, `strokeWidth={2}`
   - Aceita prop `open?: boolean` para alternar o preenchimento da barra lateral
   - Aceita demais props SVG (className, size) para integrar com Tailwind

2. **Atualizar `src/components/ui/sidebar.tsx`**
   - No `SidebarTrigger` (linha ~260-284), substituir `<PanelLeft />` pelo `<AkurisSidebarIcon open={state === "expanded"} />`
   - Remover o import `PanelLeft` do lucide-react (se não usado em outro lugar do arquivo)
   - Manter o `sr-only` "Toggle Sidebar" para acessibilidade

3. **Validação visual**
   - Verificar em `Layout.tsx` (header) — único consumidor do `SidebarTrigger`
   - Hover/focus states já vêm do botão wrapper, não precisam mudar
   - Conferir contraste no tema dark (cor já é `currentColor`, herda do header)

## Arquivos afetados

- **Novo**: `src/components/icons/AkurisSidebarIcon.tsx`
- **Editado**: `src/components/ui/sidebar.tsx` (1 import + 1 linha do JSX)

## Fora de escopo

- Não altera o logo da Akuris nem outros ícones do sistema
- Não mexe em outras instâncias de ícones lucide (apenas o toggle da sidebar)
- Não cria variações temáticas (light mode usa `currentColor`, já adapta)

Após sua aprovação, implemento o ícone e a substituição.