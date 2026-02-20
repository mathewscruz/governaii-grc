

# Adicionar Seletor de Idioma na Tela de Login

## Problema
O componente `LanguageSelector` existe mas nao esta sendo renderizado na pagina de login (`src/pages/Auth.tsx`). O usuario nao consegue trocar o idioma antes de logar.

## Solucao
Adicionar o `LanguageSelector` na tela de login, posicionado no canto superior direito do painel de login, de forma discreta e coerente com o visual escuro da pagina.

## Implementacao

### Arquivo: `src/pages/Auth.tsx`

1. Importar o componente `LanguageSelector`
2. Posicionar o seletor no topo do painel de login (lado direito), acima do formulario
3. Estilizar com cores claras (texto branco/transparente) para combinar com o tema escuro da tela de login

O seletor ficara posicionado no canto superior direito do painel de login, antes do card do formulario, acessivel tanto em desktop quanto em mobile.

### Arquivo: `src/components/LanguageSelector.tsx`

Ajustar as classes CSS para funcionar bem no tema escuro da tela de login, adicionando suporte a cores claras (texto `text-white/60` com hover `text-white`).

## Secao Tecnica

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/Auth.tsx` | Importar e renderizar `LanguageSelector` no topo do painel de login |
| `src/components/LanguageSelector.tsx` | Adicionar prop opcional `variant="dark"` para estilizacao no tema escuro |

