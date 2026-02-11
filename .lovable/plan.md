

# Auditoria SEO Completa - Akuris (Visao de Especialista em Trafego e Midia)

## VEREDICTO: NAO esta otimizado. Ha problemas criticos no index.html.

O `robots.txt` e `sitemap.xml` foram corrigidos, mas o arquivo principal `index.html` -- que e o que o Google realmente le -- ainda tem **~15 referencias ao dominio antigo `governaii.com.br`** e ao nome "GovernAII". Isso significa que o Google esta indexando informacoes erradas.

---

## PROBLEMAS CRITICOS (Bloqueantes para SEO)

### 1. index.html com dominio errado em 15+ lugares
Todas as URLs de canonical, hreflang, Open Graph, Twitter Cards e JSON-LD ainda apontam para `governaii.com.br` ao inves de `akuris.com.br`:

- Linha 30: `canonical` -> `governaii.com.br`
- Linha 33-34: `hreflang` -> `governaii.com.br`
- Linha 41: `og:url` -> `governaii.com.br`
- Linha 53: `twitter:url` -> `governaii.com.br`
- Linhas 77, 143, 179, 186: JSON-LD `url` -> `governaii.com.br`

**Impacto**: O Google vai indexar o site com canonical errado, causando confusao de identidade e potencialmente nao rankear o dominio correto.

### 2. Meta description ainda diz "GovernAII"
Linha 24: `"GovernAII e a plataforma completa..."` -- A meta description e o texto que aparece nos resultados do Google. Dizer "GovernAII" quando a marca e "Akuris" confunde o usuario e prejudica CTR (taxa de cliques).

### 3. JSON-LD com nome de plano antigo
Linha 106: `"name": "GovernAII Enterprise"` nos dados estruturados de ofertas.

### 4. AggregateRating falso (RISCO ALTO)
Linhas 111-117: O JSON-LD declara `"ratingValue": "5"` com `"ratingCount": "10"`. Isso e uma avaliacao fake. O Google **penaliza** sites que inventam reviews. Para um produto novo, isso e facilmente detectavel e pode resultar em penalizacao manual.

**Recomendacao**: Remover completamente o bloco `aggregateRating` ate ter avaliacoes reais.

### 5. apple-touch-icon e og:image com logo antiga
Linhas 9, 44, 56, 60, 84, 146: Todas as imagens OG/Twitter/apple-touch-icon apontam para um arquivo chamado `Governiaa%20(500%20x%20200%20px).png` no Supabase Storage. Isso:
- Mostra a marca antiga quando compartilhado no WhatsApp/LinkedIn/Facebook
- O nome do arquivo tem acentuacao e espacos, o que nao e ideal para SEO

### 6. Comentario referenciando marca antiga
Linha 64: `"Google Fonts - DM Sans (GovernAII Identity)"` -- Nao afeta SEO diretamente mas e descuido de marca.

---

## PROBLEMAS IMPORTANTES (Impactam ranking)

### 7. SPA sem pre-rendering (LIMITACAO TECNICA)
O site e uma Single Page Application (React). O Google consegue renderizar JavaScript, mas:
- Demora mais para indexar
- Bots como Facebook, LinkedIn, WhatsApp dependem do HTML estatico do `index.html`
- Os meta tags no `index.html` sao os mesmos para TODAS as paginas (landing, auth, registro)

**Impacto real**: Quando alguem compartilhar `akuris.com.br/auth` no LinkedIn, vai aparecer o titulo e descricao da landing page, nao da pagina de login. Isso e aceitavel para o momento, mas nao e ideal.

### 8. Sitemap incompleto
O sitemap tem apenas 4 URLs. Faltam:
- `/registro` (pagina de conversao - importante!)
- `/planos` (se for tornado publico no futuro)

### 9. Sitemap com lastmod desatualizado
Todas as datas sao `2025-12-09`. Devem refletir a data real da ultima alteracao. Para o lancamento, usar a data atual.

### 10. Sem Google Search Console / Analytics
Sem rastreamento, voce nao sabe:
- Quantas pessoas acessam a landing page
- Quais palavras-chave rankeia
- Taxa de conversao dos CTAs
- Se ha erros de indexacao

### 11. Emails com dominio antigo em outros arquivos
Encontrei `contato@governaii.com.br`, `privacidade@governaii.com.br`, `dpo@governaii.com.br` em:
- `src/pages/PoliticaPrivacidade.tsx`
- `src/components/CreditsExhaustedDialog.tsx`
- `src/components/Layout.tsx`
- Edge functions de integracao

---

## PLANO DE IMPLEMENTACAO

### Etapa 1: Correcoes criticas no index.html
- Substituir TODAS as 15+ ocorrencias de `governaii.com.br` por `akuris.com.br`
- Atualizar meta description de "GovernAII e a plataforma..." para "Akuris e a plataforma..."
- Remover bloco `aggregateRating` (reviews falsos)
- Renomear "GovernAII Enterprise" para "Akuris Enterprise" no JSON-LD
- Atualizar comentario da fonte de "GovernAII Identity" para "Akuris Identity"

### Etapa 2: Atualizar imagens OG
- Atualizar `og:image`, `twitter:image`, `apple-touch-icon` e `preload` para usar logo Akuris (idealmente em tamanho 1200x630 para OG)
- Se nao houver imagem Akuris no Storage, manter a atual temporariamente mas planejar substituicao

### Etapa 3: Atualizar sitemap
- Adicionar `/registro` ao sitemap
- Atualizar `lastmod` para data atual (`2026-02-11`)

### Etapa 4: Atualizar emails residuais
- Substituir `contato@governaii.com.br` por `contato@akuris.com.br` em PoliticaPrivacidade, CreditsExhaustedDialog e Layout
- Substituir `privacidade@governaii.com.br` e `dpo@governaii.com.br` em PoliticaPrivacidade
- Atualizar URLs de logo nas edge functions de integracao

### Etapa 5 (Recomendacao futura - nao implementavel aqui)
- Configurar Google Search Console e submeter sitemap
- Configurar Google Analytics 4 (GA4) para rastreamento de conversoes
- Criar imagem OG dedicada com tamanho 1200x630px com a marca Akuris
- Considerar blog/conteudo para SEO organico de longo prazo

---

## Secao Tecnica - Arquivos Afetados

| Arquivo | Alteracao |
|---------|-----------|
| `index.html` | ~15 substituicoes de dominio + remocao aggregateRating + meta description |
| `public/sitemap.xml` | Adicionar /registro + atualizar lastmod |
| `src/pages/PoliticaPrivacidade.tsx` | 3 emails antigos |
| `src/components/CreditsExhaustedDialog.tsx` | 1 email antigo |
| `src/components/Layout.tsx` | 1 email antigo |
| `supabase/functions/integration-webhook-dispatcher/index.ts` | URL logo antiga |
| `supabase/functions/test-integration-connection/index.ts` | URL logo antiga |

Total: 7 arquivos, ~25 substituicoes pontuais.

