

# Plano: Remover elementos "cara de IA" e ajustar footer

## Elementos que denunciam geração por IA (serão removidos/ajustados)

1. **Background blobs flutuantes** (linhas 266-267) — Os dois orbs de blur gigantes (azul e cyan) são assinatura clássica de landing pages geradas por IA
2. **Grid background animado** (linha 265) — `landing-grid-bg` com opacidade é padrão repetitivo de templates IA
3. **Gradient dividers repetitivos** (linhas 459, 497, 567, 609, 633) — 5 separadores idênticos `bg-gradient-to-r from-transparent via-blue-500/30 to-transparent` entre cada seção
4. **`landing-glow-btn`** com shimmer infinito nos botões (linhas 352, 625, 694) — efeito de brilho deslizante é marca registrada de IA
5. **Badge "Plataforma GRC Completa"** no hero (linhas 331-333) — pill badge genérico no topo é padrão IA
6. **Testimonials com nomes fictícios óbvios** e empresas genéricas ("TechSecure Brasil", "FinGroup S.A.", "DataHealth Ltda") — parecem claramente inventados
7. **Estrelas 5/5 em todos os depoimentos** — ninguém real dá 5 estrelas em tudo
8. **`Quote` icon gigante** antes de cada depoimento — padrão visual repetitivo de IA
9. **Hover scale `hover:scale-[1.02]`** nos cards de ferramentas — micro-animação genérica
10. **Connector lines** entre os cards de "Como Funciona" (linha 478) — padrão visual overused

## Mudanças específicas

### Remover/Simplificar
- Remover os 2 blobs de blur flutuantes (background orbs)
- Remover o grid background
- Remover os 5 gradient dividers (substituir por espaçamento natural ou `border-t border-white/5` simples onde necessário)
- Remover a classe `landing-glow-btn` dos botões (tirar o shimmer)
- Remover o badge pill "Plataforma GRC Completa" do hero
- Remover estrelas dos testimonials
- Remover o ícone `Quote` dos testimonials
- Remover hover scale dos cards de ferramentas
- Remover connector lines do "Como Funciona"

### Ajustar Testimonials
- Tornar mais discretos: remover estrelas, remover Quote icon, manter texto + nome/cargo simples
- Ajustar nomes/empresas para soar mais autênticos (ou simplesmente remover a seção de testimonials se preferir manter credibilidade — mas vou mantê-la com visual mais sóbrio)

### Footer — Trocar "Contato" por "Localização"
- Remover email, telefone do footer (coluna 4)
- Substituir por "Localização" com duas entradas:
  - São Paulo - Brazil
  - Porto - PT
- Remover imports `Mail`, `Phone` (manter `MapPin`)

## Arquivo afetado
`src/pages/LandingPage.tsx` — ajustes pontuais (sem reescrita)

