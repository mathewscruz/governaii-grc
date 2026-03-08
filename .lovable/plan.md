

# Landing Page — Auditoria de Marketing, SEO & UX

## Diagnóstico Crítico

Analisei a landing page com olhar de head de marketing e especialista em SEO/UX. Identifiquei problemas sérios em 4 categorias:

### 1. Sinais visuais que denunciam "feito por IA"
- **Gradient text animado** (`landing-gradient-text` com `gradient-shift 8s`): padrão #1 de templates gerados por IA
- **Glassmorphism genérico** (`bg-white/[0.03] backdrop-blur-sm`): visual cookie-cutter de SaaS AI-generated
- **Glow effects nos cards** (`landing-card-glow`, `shadow-glow`): efeito "wow" que toda landing de IA tem
- **Shimmer button** (`landing-glow-btn::before` com shimmer animation): padrão extremamente AI
- **Ícones Lucide coloridos em circles**: layout genérico que grita template
- **Testimonials com avatar de letra**: sem foto, sem empresa real, sem credibilidade
- **Dashboard mockup fake**: barras de gráfico CSS sem dados reais — parece demo genérica
- **Flow particles** animados: efeito decorativo sem propósito

### 2. Problemas de SEO técnico
- **Zero heading hierarchy correta**: H1 está ok, mas seções usam H2 genericamente sem H3
- **Sem `<article>` ou `<section>` semântico** com `aria-labelledby` consistente
- **Links sociais apontam para `#`**: Google penaliza links quebrados
- **Sem breadcrumb structured data** para a home
- **LCP ruim**: hero carrega logo como asset importado (bundled) mas o mockup é pesado com muitos divs
- **Sem `<meta name="description">` dinâmica** no componente (usa a do index.html, ok)
- **Formulário de contato sem honeypot** anti-spam
- **Falta `loading="lazy"`** em imagens do footer (bandeiras)
- **CSS inline no `<style>`**: o `@keyframes scroll-left` deveria estar no index.css
- **Falta alt text descritivo** no mockup do dashboard

### 3. Problemas de UX/Conversão
- **CTA "Solicitar Demonstração" repete 3x** com mesmo estilo — fadiga visual
- **Nenhum dado quantificável** ("+200 empresas", "60% redução"): falta social proof real
- **Seção "Ferramentas Inteligentes" e "Módulos" são redundantes**: dizem a mesma coisa de formas diferentes
- **Formulário de contato é longo demais** (5 campos): taxa de conversão cai drasticamente com >3 campos
- **Nenhum pricing visível**: visitante não sabe se pode pagar
- **Nenhum CTA de trial/freemium**: só "demonstração" cria barreira alta
- **Footer tem links sociais fake** (#): destrói credibilidade

### 4. Problemas de acessibilidade
- **Skip link em português hardcoded** ("Pular para o conteúdo principal")
- **Botões de navegação sem role adequado** (são `<button>` ok, mas sem `aria-current`)
- **Contraste de `text-gray-400` sobre `#0A1628`**: ratio ~3.5:1, abaixo do WCAG AA 4.5:1
- **Formulário sem `aria-describedby`** para erros

## Plano de Implementação

### A. Eliminar visual "AI-generated"

1. **Remover gradient-text animado** do H1 e H2s — usar cor sólida branca ou um destaque estático com `text-blue-400` simples
2. **Remover shimmer, glow-pulse, flow-particles** — limpar CSS morto
3. **Substituir glassmorphism** por cards com `bg-[#111B2E]` sólido e `border border-[#1E2D45]` — visual enterprise limpo
4. **Dashboard mockup**: substituir barras CSS por screenshot real do produto ou ilustração vetorial estática
5. **Testimonials**: remover avatares de letra, usar aspas estilizadas simples — visual mais editorial/sóbrio
6. **Cards de módulos**: ícones com fundo sólido opaco em vez de gradients transparentes

### B. SEO técnico

1. **Heading hierarchy**: H1 (hero) → H2 (cada seção) → H3 (cards de features)
2. **Structured data**: adicionar `BreadcrumbList` e melhorar `SoftwareApplication` no index.html
3. **Links sociais**: remover os `href="#"` — ou colocar URLs reais ou remover
4. **Mover CSS inline** (`@keyframes scroll-left`, `.lp-fade-up`) para index.css
5. **Adicionar `loading="lazy"`** nas imagens de bandeira do footer
6. **Contraste**: subir `text-gray-400` → `text-gray-300` em textos descritivos

### C. UX/Conversão

1. **Consolidar seções**: fundir "Ferramentas Inteligentes" e "Módulos" em uma única seção mais enxuta
2. **CTA primário diferenciado**: hero com "Teste Grátis" (link para /registro) + secundário "Fale com Vendas"
3. **Formulário simplificado**: reduzir para 3 campos (Nome, Email, Mensagem) — mover empresa/telefone para opcionais
4. **Adicionar social proof numérico** no hero: "+X empresas confiam no Akuris" (ou badge de segurança)
5. **Seção de preços resumida** com link para /planos
6. **Footer**: remover ícones sociais sem URL real

### D. Limpeza de CSS

Remover do `index.css` as classes não utilizadas ou que remetem a templates AI:
- `landing-glow-btn` + `::before` shimmer
- `landing-card-glow`
- `flow-line-container` + `flow-particle`
- `landing-float`
- `landing-glass`, `landing-glass-light`
- Keyframes: `flow-particle`, `glow-pulse`, `shimmer`, `pulse-ring`, `float`, `rotate-slow`

## Arquivos a modificar

| Arquivo | Mudança |
|---|---|
| `src/pages/LandingPage.tsx` | Reescrever layout: fundir seções, CTAs, cards sólidos, remover mockup fake, limpar testimonials, simplificar form |
| `src/index.css` | Remover ~15 classes/keyframes AI-pattern não utilizadas |
| `index.html` | Adicionar BreadcrumbList structured data |

## Resultado esperado

Landing page com visual enterprise sóbrio (referência: Vanta, Drata, OneTrust), sem nenhum padrão visual que denuncie geração por IA, otimizada para Core Web Vitals, com heading hierarchy correta e structured data completa.

