

# Redesign Visual: Sidebar com Degrade e Borda no Conteudo

## O que muda

Baseado na imagem de referencia, vamos aplicar 3 mudancas visuais principais:

### 1. Sidebar com degrade
O menu lateral recebera um fundo com gradiente escuro, indo de um navy profundo na parte superior para um tom levemente mais claro/azulado na parte inferior, criando profundidade visual.

### 2. Borda arredondada no conteudo principal
A area de conteudo (header + main) recebera um container com borda arredondada e fundo levemente diferenciado, criando a sensacao de "painel flutuante" sobre o fundo escuro — exatamente como na referencia.

### 3. Fundo escuro visivel atras do conteudo
O fundo geral da pagina sera escuro (navy), e o conteudo principal tera fundo branco com bordas arredondadas, criando contraste e hierarquia visual.

## Secao Tecnica

### Arquivo: `src/index.css`
- Atualizar variaveis do sidebar para suportar gradiente:
  - `--sidebar-background` ajustado
  - Adicionar classe CSS para gradiente no sidebar: `background: linear-gradient(180deg, hsl(228, 50%, 12%) 0%, hsl(232, 40%, 18%) 100%)`

### Arquivo: `src/components/Layout.tsx`
- O wrapper externo (`min-h-screen flex w-full`) recebera fundo escuro navy (`bg-[hsl(228,50%,12%)]`)
- O container de conteudo (`flex-1 flex flex-col`) recebera:
  - `bg-background rounded-2xl m-2 overflow-hidden border border-border/50`
  - Isso cria o efeito de painel com borda arredondada

### Arquivo: `src/components/AppSidebar.tsx`
- Adicionar classe de gradiente no componente `Sidebar`

### Arquivo: `src/components/ui/sidebar.tsx`
- Pode precisar de ajuste para aceitar o gradiente como background (verificar se o estilo inline sobrescreve)

### Resumo visual do resultado

```text
+---------------------------+--------------------------------------+
|                           |  .-----------------------------------.|
|   SIDEBAR                 |  | HEADER (search, profile, etc.)   ||
|   (degrade escuro         |  |-----------------------------------||
|    navy -> navy claro)     |  |                                   ||
|                           |  |   CONTEUDO PRINCIPAL               ||
|   [Logo]                  |  |   (fundo branco, borda arredondada)||
|   [Dashboard]             |  |                                   ||
|   [Riscos]                |  |                                   ||
|   [Gap Analysis]          |  |                                   ||
|   ...                     |  |                                   ||
|                           |  '-----------------------------------'|
+---------------------------+--------------------------------------+
```

**Arquivos modificados:**
- `src/index.css` — variaveis de sidebar e classe de gradiente
- `src/components/Layout.tsx` — fundo escuro + container arredondado
- `src/components/AppSidebar.tsx` — classe de gradiente no sidebar

