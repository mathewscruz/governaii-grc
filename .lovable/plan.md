

# Correções de SEO e Indexação

## Problemas

1. **Sitemap desatualizado**: Referencia `/denuncia-menu` que não existe como rota — a rota real é `/:empresa/denuncia` (dinâmica, não indexável)
2. **Canonical e meta tags**: Estão hardcoded no `index.html` para a landing page, mas não mudam por rota (SPA sem SSR — aceitável, mas o sitemap precisa refletir apenas as rotas que realmente existem e são públicas)
3. **Redirect no Google Search Console**: Provavelmente causado pelo redirect entre `governaii-grc.lovable.app` → `akuris.com.br` no nível DNS/Lovable — não é um problema de código

## O que será feito

### 1. `public/sitemap.xml`
- Remover `/denuncia-menu` (rota inexistente)
- Manter `/` e `/politica-privacidade` (únicas rotas públicas estáticas)
- Atualizar `lastmod` para data atual

### 2. `public/robots.txt`
- Adicionar `Disallow: /denuncia-menu` (caso Google ainda tenha cache)
- Garantir que `/checkout-success` e `/definir-senha` também estejam bloqueadas

### 3. `index.html` — Meta tag para redirect
- Sem alterações necessárias: o redirect é no nível DNS (Lovable custom domain → lovable.app). O canonical já aponta para `akuris.com.br`

## Arquivos editados
- `public/sitemap.xml`
- `public/robots.txt`

