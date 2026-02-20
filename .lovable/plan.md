

# Correcao da Linha Branca e Ajuste Visual do Menu Lateral

## Problemas Identificados

1. **Linha branca entre sidebar e conteudo**: Causada por `border-r` no componente Sidebar (`sidebar.tsx` linha 242) e `border` no container de conteudo (`Layout.tsx` linha 149)
2. **Visual nao corresponde ao anexo 1**: O menu lateral precisa de ajustes para ficar mais proximo da referencia (degrade mais suave, sem bordas visiveis entre sidebar e conteudo)

## Mudancas

### 1. Remover border-r do sidebar (sidebar.tsx)
- Na linha 242, remover `group-data-[side=left]:border-r` e `group-data-[side=right]:border-l` para eliminar a linha branca entre sidebar e conteudo

### 2. Ajustar border do conteudo (Layout.tsx)
- Na linha 149, trocar `border border-border/30` por `border-l-0 border border-border/20` ou remover a borda do lado esquerdo (que toca o sidebar), mantendo apenas as bordas superiores, direita e inferior para o efeito de painel
- Ajustar `m-2` para `my-2 mr-2` para que o conteudo encoste no sidebar sem gap do lado esquerdo, mantendo o espaco nos outros lados
- Arredondar apenas os cantos da direita: `rounded-r-2xl` em vez de `rounded-2xl`

### 3. Refinar o degrade do sidebar (index.css)
- Ajustar o gradiente para ser mais suave e profundo, como na referencia (mais escuro no topo, leve brilho azulado no fundo)

## Secao Tecnica

**Arquivo: `src/components/ui/sidebar.tsx` (linha 242)**
- Remover: `group-data-[side=left]:border-r group-data-[side=right]:border-l`
- Manter: `group-data-[collapsible=icon]:w-[--sidebar-width-icon]`

**Arquivo: `src/components/Layout.tsx` (linha 149)**
- De: `bg-background rounded-2xl m-2 border border-border/30`
- Para: `bg-background rounded-r-2xl my-2 mr-2 border border-border/20 border-l-0`

**Arquivo: `src/index.css`**
- Ajustar gradiente para tom mais profundo com leve brilho no fundo, similar ao anexo 1

