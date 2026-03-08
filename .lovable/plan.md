

# Ajustes na Landing Page + Validação SEO

## 1. Remover links e rota de "Planos"

**Arquivo:** `src/pages/LandingPage.tsx`
- Remover link "Planos" do header desktop (linha 240)
- Remover link "Planos" do menu mobile (linha 263)
- Remover link "Planos" do footer coluna "Produto" (linha 673)

**Arquivo:** `src/App.tsx`
- Remover rota `/planos` (manter o import e página caso o super admin precise acessar internamente, ou remover completamente)

## 2. Ajustes na seção Gap Analysis

**Arquivo:** `src/pages/LandingPage.tsx`

| O que | Antes | Depois |
|---|---|---|
| Badge "Nosso carro-chefe" (linhas 499-503) | Visível | Removido |
| CTAs (linhas 551-568) | 2 botões | Removidos |
| Subheadline (linha 514) | "Chega de gastar **R$ 50 mil com consultoria externa** pra te dizer..." | "Chega de gastar com consultoria externa pra te dizer..." |
| Em dashes na subheadline | "— da ISO 27001 à LGPD —" | ", da ISO 27001 à LGPD," |
| Em dash bullet 2 (linha 535) | "— disponível 24h" | ". Disponível 24h" |
| Em dash bullet 3 (linha 545) | "— tudo gerado automaticamente" | ". Tudo gerado automaticamente" |

## 3. Validação SEO

Já implementado corretamente:
- ✅ Title, description, keywords, canonical, robots meta
- ✅ Open Graph + Twitter Cards
- ✅ Structured Data (Organization, WebSite, FAQ, BreadcrumbList, SoftwareApplication)
- ✅ hreflang, geo.region
- ✅ robots.txt, sitemap.xml
- ✅ Semantic HTML (header/main/footer/nav/section/article)
- ✅ aria-labels, skip-to-content link

**Correções necessárias:**

| Arquivo | Problema | Correção |
|---|---|---|
| `index.html` | SearchAction aponta para `?q=` que não funciona em SPA | Remover bloco SearchAction do WebSite schema |
| `index.html` | Offers no SoftwareApplication com preços desatualizados (seção Planos removida) | Simplificar para uma única offer genérica sem preço |
| `public/sitemap.xml` | lastmod desatualizado (2026-02-11) | Atualizar para 2026-03-08 |
| `public/sitemap.xml` | Falta URL `/denuncia-externa` listada como `denuncia-externa` mas a rota real é outra | Validar e corrigir URLs |

## Resumo de arquivos

- `src/pages/LandingPage.tsx` — remover Planos links, badge, CTAs, ajustar textos
- `src/App.tsx` — remover rota `/planos` pública
- `index.html` — limpar SearchAction e offers
- `public/sitemap.xml` — atualizar datas

