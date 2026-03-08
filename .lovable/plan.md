

# Ilustração do Sistema no Hero da Landing Page

## Abordagem

Vou criar um **mockup estático em SVG/HTML** que represente a interface do dashboard do Akuris — com visual enterprise limpo, sem parecer fake ou gerado por IA. O mockup será construído diretamente em JSX como um componente, mostrando elementos reais do sistema: score gauge, cards de KPI, gráfico radar e sidebar.

## O que será mostrado no mockup

Baseado no dashboard real (`Dashboard.tsx`), o mockup incluirá:
- Mini sidebar com ícones
- Score de saúde (gauge circular)
- Cards de KPI (Riscos, Controles, Incidentes)
- Mini gráfico de barras
- Visual com as cores reais do sistema (`#0A1628`, `#111B2E`, `#1E2D45`, azul primário)

## Layout do Hero

O hero passará de **texto centralizado** para **split layout**: texto à esquerda + mockup à direita, padrão enterprise (Vanta, Drata, OneTrust).

```text
┌─────────────────────────────────────────────┐
│  Gestão de Riscos,        │  ┌──────────┐   │
│  Compliance e Governança  │  │ Dashboard │   │
│                           │  │  Mockup   │   │
│  [Teste Grátis] [Vendas]  │  │  (SVG)    │   │
│                           │  └──────────┘   │
└─────────────────────────────────────────────┘
```

## Implementação

1. **Criar `src/components/landing/DashboardMockup.tsx`** — componente JSX puro que renderiza o mockup como divs estilizadas (sem imagens externas)
2. **Atualizar `LandingPage.tsx`** — hero section com grid 2 colunas, texto à esquerda e mockup à direita
3. O mockup terá uma leve sombra e rotação 3D (`perspective` + `rotateY`) para dar profundidade
4. Em mobile, o mockup aparece abaixo do texto

## Arquivos

| Arquivo | Mudança |
|---|---|
| `src/components/landing/DashboardMockup.tsx` | Novo — mockup estático do dashboard |
| `src/pages/LandingPage.tsx` | Hero split layout com mockup |

