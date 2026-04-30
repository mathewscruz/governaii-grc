
# Evolução Visual Akuris — Identidade & UX

Análise feita em cima do estado atual: tema Navy/Violet bem definido, ícones já com stroke 1.5 e catálogo semântico iniciado, sidebar com gradient, dashboard com Hero Banner + KPI Pills + maturidade GRC monocromática. A base é sólida — abaixo está o que vale **criar, refinar e remover** para destravar uma identidade verdadeiramente proprietária.

---

## 1. Linguagem visual proprietária ("Akuris Signature")

Hoje o sistema parece "premium genérico". Faltam **elementos de marca repetíveis** que o olho associe imediatamente à Akuris.

### Criar
- **Akuris Mark Pattern**: padrão sutil de fundo (grade fina + pontos violeta a 4% opacidade) usado em cards Hero, telas de bloqueio (trial/empresa inativa) e estados vazios. Vira "papel timbrado" digital.
- **Corner Accent (canto superior esquerdo dos cards principais)**: pequeno chevron violeta de 12px no canto, exclusivo de Cards de "destaque" (Hero, KPI principal, modal de IA). Substitui a `governaii-accent-bar` lateral animada (que está pouco usada) por algo mais discreto e moderno.
- **Divider com glyph**: separadores horizontais com um diamante violeta de 6px no centro — usado entre seções de páginas longas (Configurações, Relatórios, Detalhe de Risco).
- **Tipografia hierárquica oficial**: definir 4 estilos canônicos (`display`, `title`, `body`, `caption`) com tracking customizado em DM Sans (`-0.02em` em títulos grandes, `0` em body). Hoje cada página decide sozinha.

### Remover
- A barra lateral animada `accent-bar-pulse` (pulsa o ano todo, vira ruído).
- Gradientes `gradient-accent` triplos (3 stops violeta) — substituir por gradiente de 2 stops, mais elegante.

---

## 2. Sistema de cores — refinar sem quebrar

A paleta Navy/Violet está boa, mas há **excesso de violeta puro** em superfícies, o que cansa visualmente.

### Refinar
- **Surface tokens semânticos**: criar `--surface-1` (cards), `--surface-2` (cards aninhados), `--surface-3` (popovers) com micro-elevação por luminosidade ao invés de shadow. Hoje tudo é `bg-card` chapado.
- **Status colors mais sóbrios**: success/warning/destructive estão saturados demais (typical Tailwind). Reduzir saturação em 15-20% para combinar com o Navy.
- **Violeta apenas como ação**: aplicar a regra "violeta = clicável ou métrica positiva". Hoje aparece em borders decorativos, ícones inativos, dividers — dilui o significado.

### Adicionar
- **Token `--brand-ink`** (texto sobre violeta) bem calibrado para acessibilidade AA.
- **Modo Light revisitado**: hoje o light mode é quase um afterthought. Polir backgrounds (atualmente quase brancos demais) com `200 30% 96%` para dar respiro.

---

## 3. Layout shell e navegação

### Sidebar
- **Agrupar visualmente os 13 itens em 3 seções rotuladas**: `OPERAÇÃO` (Dashboard, Planos), `GRC CORE` (Riscos, Controles, Gap, Ativos), `COMPLIANCE & GOVERNANÇA` (Contratos, Documentos, Privacidade, Due Diligence, Denúncia, Continuidade), `INSIGHTS` (Relatórios). Hoje é uma lista plana de 13 itens — alta carga cognitiva.
- **Active state mais sutil**: trocar `border-l-4 border-primary + bg-primary/15` por **pílula violeta inteira arredondada** (estilo Linear/Notion). Mais moderno e menos "barulhento".
- **Indicador de submenu fechado mas com filho ativo**: hoje só destaca quando aberto — adicionar dot violeta no chevron quando há rota ativa dentro de um grupo colapsado.
- **Footer**: incluir versão do app + badge de ambiente (Trial/Pro) acima do logout, hoje só aparece o logout.

### Header
- **Breadcrumb com ícone do módulo** (usando os ícones proprietários) antes do nome.
- **Página atual em destaque tipográfico** (não em `font-semibold`, mas em bloco com label "VOCÊ ESTÁ EM").
- **Spotlight/Command Palette mais visível**: hoje o `CommandPaletteButton` é discreto. Aumentar para uma barra "Buscar em tudo · ⌘K" estilo Linear.

### Remover
- Botão "Voltar" do header — ele compete com a sidebar e o breadcrumb. Manter apenas em mobile.

---

## 4. Cards, tabelas e densidade

### Cards
- Padding padronizado em **3 tamanhos** (`compact` 12px, `default` 20px, `feature` 32px). Hoje cada card escolhe.
- **Header de card unificado**: ícone proprietário + título + ação opcional à direita. Componente `<ModuleCardHeader>` reutilizável.
- Remover sombras pesadas em cards aninhados — usar apenas `border` interno.

### Tabelas
- **Density toggle** (compact/comfortable) salvo por usuário, no topo de toda lista grande (Riscos, Controles, Ativos, Documentos).
- **Coluna de status como pílula colorida** padronizada via `<StatusBadge>` — hoje cada módulo desenha a sua.
- **Row hover com micro-animação** de slide do accent violeta lateral (4px) ao invés de mudar bg de toda linha.
- **Skeleton row** real (não bloco genérico) para tabelas durante loading.

### Estados vazios
- Criar **EmptyState ilustrado** com SVG proprietário (mesma família dos ícones de módulo). Hoje usamos texto + ícone Lucide pequeno — frio.
- Cada módulo ganha sua própria ilustração de "vazio" combinando com o ícone do módulo.

---

## 5. Dashboard — próxima onda

A reforma recente já elevou bastante. Próximos passos:

- **Saudação contextual** ("Bom dia, Pedro · 3 itens críticos exigem atenção") em vez de só "Dashboard".
- **Modo Foco**: botão que esconde KPI pills e mantém só o Hero Score + ações pendentes — útil para gestores.
- **Drill-down inline**: clicar numa barra de maturidade abre um drawer lateral (não navega de página).
- **Last update timestamp** discreto no rodapé do Hero ("Atualizado há 2 min").

---

## 6. Microinterações e transições

### Adicionar
- **Page transitions mais curtas** (180ms ease-out, hoje parece ~300ms).
- **Skeleton com shimmer violeta sutil** (atual é cinza puro).
- **Hover em ícones de ação** (editar/deletar) com leve scale 1.05 + tooltip rápido (delay 200ms).
- **Toast com ícone proprietário** ao invés do ícone Sonner padrão.
- **Botão primário com ripple violeta** ao clicar (substitui o "press feedback" trivial).

### Remover
- `governaii-card-hover` com `translateY(-2px)` global — exagerado em cards de dashboard. Manter só em cards clicáveis.

---

## 7. Acessibilidade & polimento

- **Foco de teclado visível**: hoje é o ring padrão; criar ring violeta com offset 2px e raio combinado com o componente.
- **Contraste do `muted-foreground`** no dark mode (`200 10% 55%`) está no limite de AA — subir para 60-65%.
- **Toggle de tema no header** (ainda não existe atalho fácil), com ícone proprietário sun/moon.

---

## 8. O que NÃO mexer
- Paleta principal (Navy + Violet) — já é identidade.
- DM Sans — manter.
- Sistema de ícones recém-criado — apenas expandir.
- Estrutura do Hero Banner + KPI Pills do dashboard.

---

## Entrega proposta (faseada)

Sugiro implementar em **3 ondas pequenas** (cada uma aprovada antes da próxima) para você ver o impacto sem risco:

**Onda 1 — Fundamentos (alto impacto, baixo risco)**
- Surface tokens semânticos + saturação dos status
- Sidebar reagrupada em seções + active state em pílula
- Active-dot em grupos colapsados
- Componente `<ModuleCardHeader>` e `<StatusBadge>` unificados
- Foco de teclado violeta global

**Onda 2 — Identidade (visual proprietário)**
- Akuris Mark Pattern (background sutil)
- Corner Accent nos cards principais (substitui `accent-bar-pulse`)
- EmptyStates ilustrados por módulo
- Toast com ícone proprietário
- Skeleton com shimmer violeta

**Onda 3 — Polimento UX**
- Saudação contextual + Modo Foco no Dashboard
- Density toggle nas tabelas grandes
- Drill-down em drawer no Dashboard
- Spotlight/Command Palette mais proeminente
- Toggle de tema no header

---

**Posso começar pela Onda 1?** Se preferir, podemos também rodar uma única onda combinando os itens que mais te interessam.
