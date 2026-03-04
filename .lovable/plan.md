

# Plano: Redesign da Landing Page baseado na referência Anarisk

## Estrutura alvo (baseada na imagem de referência)

A landing page será reestruturada para seguir exatamente a mesma sequência de seções da referência, adaptando conteúdo para Akuris GRC. A seção de preços será removida conforme solicitado.

### Seções (em ordem):

1. **Hero** — Headline centralizado grande, subtítulo, 2 botões CTA (Solicitar Demo + Acessar Plataforma), dashboard mockup abaixo (já existe, reposicionar para centralizado)
2. **Logos strip** — "Frameworks e regulamentações suportados" (manter carousel existente, estilizar como strip horizontal limpo)
3. **"Ferramentas Inteligentes"** — Grid 2x2 com 4 cards grandes com ícones/ilustrações: Análise de Riscos em Tempo Real, Controles Internos Categorizados, Score de Conformidade, Gestão de Documentos
4. **"Como o Akuris Funciona?"** — 3 cards com ícone + título + descrição (manter conteúdo existente, redesenhar visual para match)
5. **"O que dizem nossos clientes?"** — Seção de depoimentos com 3 cards (textos placeholder profissionais)
6. **CTA Banner** — "Veja o Akuris em Ação, Comece a Gerenciar Riscos Hoje" com botão "Solicitar Demonstração"
7. **Contato** — Formulário (manter existente)
8. **Footer** — Redesenhar para match com 4 colunas + social links

### Seções REMOVIDAS:
- Preços (conforme solicitado)
- "Esqueça as Planilhas" (substituído pelo grid 2x2 de features)
- Benefícios (integrado nas features)

## Mudanças visuais principais

- Hero: texto centralizado (não split com grid), dashboard mockup abaixo centralizado
- Cards de features: mais espaçosos, fundo glassmorphism escuro com bordas sutis, ícones maiores
- How it works: cards escuros com ícones em destaque, badge de step number
- Testimonials: novo — 3 cards com aspas, texto, nome e cargo
- CTA banner: seção full-width com gradiente e texto grande
- Footer: 4 colunas (Akuris, Produto, Recursos, Contato) + linha de social media

## Arquivo afetado

`src/pages/LandingPage.tsx` — reescrita completa mantendo lógica de form/scroll/state

## Elementos preservados
- Logo Akuris
- Form de contato (lógica Supabase)
- Scroll behavior + header sticky
- Dialog de detalhe de módulos
- Carousel de frameworks
- CSS animations (scroll-left, spin-slow)
- Mobile responsiveness

