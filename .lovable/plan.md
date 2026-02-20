

# Correcao de Cores e Efeito de Iluminacao do Sidebar

## Analise da Imagem de Referencia

A imagem mostra:
- **Fundo do sidebar**: Preto quase puro com leve tom azul escuro (~`#0d0f1a` / `hsl(230, 30%, 8%)`)
- **Efeito de iluminacao**: Um brilho difuso azul/violeta vindo da parte inferior do sidebar, como uma luz neon refletida. Isso nao e apenas um gradiente linear simples — e um `radial-gradient` posicionado no bottom-center
- **Borda do conteudo**: Borda muito sutil, quase invisivel, com tom azulado escuro

## Mudancas

### 1. Sidebar: Fundo mais escuro + efeito de luz neon (index.css)

O gradiente atual esta claro demais. A referencia mostra um fundo quase preto com um brilho azul/violeta difuso na parte inferior.

Nova implementacao com camadas:
- Camada base: cor solida muito escura (`hsl(230, 25%, 7%)`)
- Camada de iluminacao: `radial-gradient` azul/violeta posicionado no bottom-center, simulando a luz neon

### 2. Borda do painel de conteudo (Layout.tsx)

A borda precisa ser mais sutil e com tom azulado, nao branca/cinza.

### 3. Fundo do shell (index.css)

O `--layout-shell` tambem precisa ser mais escuro para combinar com o sidebar.

## Secao Tecnica

**Arquivo: `src/index.css`**

Atualizar `.sidebar-gradient`:
```css
.sidebar-gradient {
  background: 
    radial-gradient(ellipse at 50% 100%, hsl(230, 60%, 25%, 0.4) 0%, transparent 60%),
    linear-gradient(180deg, hsl(230, 25%, 7%) 0%, hsl(228, 20%, 9%) 100%);
}

.dark .sidebar-gradient {
  background: 
    radial-gradient(ellipse at 50% 100%, hsl(230, 60%, 22%, 0.4) 0%, transparent 60%),
    linear-gradient(180deg, hsl(230, 25%, 5%) 0%, hsl(228, 20%, 7%) 100%);
}
```

Atualizar `--layout-shell` para combinar:
- Light: `230 25% 7%`
- Dark: `230 25% 5%`

Atualizar variaveis do sidebar:
- `--sidebar-background: 230 25% 7%` (light)
- `--sidebar-background: 230 25% 5%` (dark)
- `--sidebar-accent: 230 20% 12%` (light)
- `--sidebar-border: 230 15% 15%`

**Arquivo: `src/components/Layout.tsx` (linha 149)**

Trocar `border border-border/20` por `border border-[hsl(230,20%,20%)]/30` para borda com tom azulado sutil.

**Arquivos modificados:**
- `src/index.css` — gradiente com efeito de iluminacao neon + variaveis escurecidas
- `src/components/Layout.tsx` — borda com tom azulado

