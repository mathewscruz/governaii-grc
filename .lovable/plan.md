

# Responsividade Completa + Performance da Landing Page

## Resumo

Auditoria e correcao de responsividade em todo o sistema (Landing Page, Layout, Dashboard e Chatbot AkurIA), otimizacao de performance da Landing Page para mobile, e ajuste do chatbot AkurIA para nao ficar sobreposto a barra de navegacao inferior mobile.

---

## 1. Landing Page - Performance Mobile

### Problemas identificados
- Background animado (`landing-grid-bg`) com CSS grid infinito roda continuamente, consumindo GPU em dispositivos moveis
- Gradient orbs (`blur-[128px]`) sao custosos em mobile - blur pesado na GPU
- Animacao `float` no dashboard preview roda infinitamente
- Animacao `gradient-shift` no texto roda infinitamente (8s loop)
- Inline `<style>` com `animate-scroll-left` (carousel) roda infinitamente
- Multiplos `backdrop-filter: blur()` nos cards glassmorphism

### Solucoes
**`src/index.css`**:
- Adicionar media query `@media (prefers-reduced-motion: reduce)` para desabilitar animacoes pesadas
- Adicionar media query para telas pequenas desabilitando animacoes de background e float
- Reduzir blur dos gradient orbs em mobile (128px para 64px)

**`src/pages/LandingPage.tsx`**:
- Adicionar `loading="lazy"` nas imagens que nao estao no viewport inicial
- Usar `will-change: transform` apenas nos elementos animados
- Desabilitar float animation e gradient orbs em mobile via classes condicionais
- Reduzir quantidade de blur nos orbs fixos para mobile

---

## 2. Landing Page - Responsividade

### Problemas identificados
- Hero section: em telas muito pequenas (320px), os botoes CTA podem ficar apertados
- Logo no header `h-20` pode ser grande demais em mobile (ocupa espaco vertical)
- Contact form inputs podem ser pequenos demais em mobile

### Solucoes
**`src/pages/LandingPage.tsx`**:
- Reduzir logo de `h-20` para `h-12 sm:h-16 md:h-20` no header
- Ajustar hero section `min-h-[85vh]` para `min-h-[70vh] sm:min-h-[85vh]` em mobile
- Garantir que botoes CTA tenham `w-full` em mobile

---

## 3. Layout Principal - Header Mobile

### Problemas identificados
- Header com muitos icones em mobile (CommandPaletteButton, LanguageSelector, ChangelogPopover, NotificationCenter, UserProfile) - ficam "comidos"
- Gap entre items `gap-1 sm:gap-2` pode nao ser suficiente

### Solucoes
**`src/components/Layout.tsx`**:
- Esconder `CommandPaletteButton` e `ChangelogPopover` em mobile (`hidden sm:flex`)
- Manter apenas NotificationCenter e UserProfile visiveis em telas muito pequenas
- LanguageSelector esconder em mobile (disponibilizar em outro lugar se necessario)

---

## 4. Dashboard - Responsividade

### Problemas identificados
- KPI Pills overflow horizontal funciona mas pode confundir usuario
- HeroScoreBanner metrics podem ficar apertados em mobile
- Grid de 3 colunas dos cards (Vencimentos/Radar/Timeline) ja faz `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` - OK
- RiskScoreTimeline com `md:col-span-2 xl:col-span-1` - OK

### Solucoes
**`src/components/dashboard/KPIPills.tsx`**:
- Adicionar indicador visual de scroll (gradiente fade nas bordas) para indicar que ha mais pills
- Nenhuma mudanca critica necessaria, ja faz scroll horizontal

**`src/pages/Dashboard.tsx`**:
- Dashboard title pode diminuir em mobile: `text-xl sm:text-2xl`

---

## 5. AkurIA Chatbot - Mobile

### Problemas identificados
- FAB posicionado `bottom-6 right-6` fica sobreposto a MobileBottomNav (`h-14 bottom-0`)
- Chat panel `w-[380px]` ultrapassa a tela em mobile (375px)
- Chat panel `bottom-6 right-6` nao se adapta a tela mobile
- Chat panel `h-[520px]` pode ser alto demais em telas menores

### Solucoes
**`src/components/dashboard/AkurIAChatbot.tsx`**:
- FAB: mudar para `bottom-20 md:bottom-6 right-4 md:right-6` para ficar acima da bottom nav em mobile
- Chat panel: em mobile usar `inset-x-2 bottom-16 md:bottom-6 md:right-6 md:left-auto md:w-[380px]` com `h-[70vh] md:h-[520px]` para ocupar tela toda em mobile
- Ajustar z-index para ficar acima da bottom nav

---

## 6. Paginas de Modulos (verificacao geral)

### Verificacoes
- DataTable ja e responsivo com scroll horizontal - OK
- Dialogs usam `max-w-lg/max-w-xl` com scroll - OK
- Sidebar colapsa automaticamente em mobile via SidebarProvider - OK
- MobileBottomNav ja existe e funciona - OK

---

## Arquivos a modificar

1. **`src/index.css`** - Media queries para reducao de animacoes em mobile
2. **`src/pages/LandingPage.tsx`** - Logo size, hero height, gradient orbs mobile, lazy loading
3. **`src/components/Layout.tsx`** - Esconder itens do header em mobile
4. **`src/components/dashboard/AkurIAChatbot.tsx`** - Posicionamento mobile FAB e chat panel
5. **`src/pages/Dashboard.tsx`** - Titulo responsivo menor

## Detalhes Tecnicos

### CSS Mobile Performance (index.css)
```css
@media (max-width: 768px) {
  .landing-grid-bg { display: none; }
  .landing-float { animation: none; }
}

@media (prefers-reduced-motion: reduce) {
  .landing-gradient-text,
  .landing-float,
  .landing-glow-btn::before {
    animation: none;
  }
}
```

### AkurIA Mobile Layout (AkurIAChatbot.tsx)
- FAB: `fixed bottom-20 md:bottom-6 right-4 md:right-6`
- Panel: `fixed inset-x-3 bottom-16 md:bottom-6 md:right-6 md:left-auto md:w-[380px] h-[calc(100vh-8rem)] md:h-[520px] max-h-[520px]`

### Header Mobile (Layout.tsx)
- CommandPaletteButton: adicionar `className="hidden sm:flex"`
- ChangelogPopover: adicionar `className="hidden md:flex"` (ou wrapper div)
- LanguageSelector: adicionar `className="hidden md:flex"` (ou wrapper div)

