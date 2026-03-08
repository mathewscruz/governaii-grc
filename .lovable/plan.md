

# Alternar seções clara/escura + trocar azul por roxo Akuris

## Resumo

Duas mudanças na Landing Page:

1. **Seções alternadas**: As seções atualmente são todas escuras. Alternar entre o fundo escuro atual (`#0A1628`) e um fundo ligeiramente mais claro (`#0D1F37` ou similar) para criar contraste visual claro entre blocos.
2. **Trocar azul por roxo Akuris** (`#7552FF`): Todos os destaques em `blue-400`/`blue-500`/`blue-600` serão substituídos pelo roxo da marca.

## Mapeamento das seções

| Seção | Fundo atual | Novo fundo |
|---|---|---|
| Hero | `#0A1628` (escuro) | Mantém escuro |
| Frameworks Strip | border only | Mantém (transição) |
| Módulos | `#0A1628` (escuro) | **Claro** → `#0F1A2E` |
| Como Funciona | `#0D1F37` (já diferente) | Mantém |
| Testimonials | `#0A1628` | **Claro** → `#0F1A2E` |
| Pricing CTA | `#0D1F37` | Mantém |
| Contato | `#0A1628` | **Claro** → `#0F1A2E` |

## Substituição de cores (azul → roxo)

Todas as ocorrências no arquivo:
- `text-blue-400` → `text-[#7552FF]`
- `bg-blue-600` → `bg-[#7552FF]`
- `hover:bg-blue-500` → `hover:bg-[#8B6FFF]`
- `focus:border-blue-500` → `focus:border-[#7552FF]`
- `focus:ring-blue-500` → `focus:ring-[#7552FF]`
- `rgba(59,130,246,...)` no hero gradient → `rgba(117,82,255,...)`

Também no `DashboardMockup.tsx`: substituir `#3B82F6` e `bg-blue-600/30` pelo roxo correspondente.

## Arquivo

| Arquivo | Mudança |
|---|---|
| `src/pages/LandingPage.tsx` | Backgrounds alternados + todas as cores azuis → roxo |
| `src/components/landing/DashboardMockup.tsx` | Cores azuis → roxo no mockup |

