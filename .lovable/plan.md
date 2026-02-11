
## Objetivo
Eliminar totalmente o “espaço” (faixa/gap) entre o menu lateral (Sidebar) e o Header, garantindo que o Header sempre “encoste” exatamente na lateral do Sidebar em qualquer estado (expandido/colapsado) e em qualquer resolução.

---

## Diagnóstico (por que o gap continua)
Hoje existem **duas fontes de largura diferentes** para o Sidebar:

1) Em `src/components/ui/sidebar.tsx` o componente cria um “spacer” que reserva a largura do sidebar usando CSS variables:
- `--sidebar-width = 16rem` (256px)
- `--sidebar-width-icon = 3rem` (48px)

2) Em `src/components/AppSidebar.tsx` você está **forçando** a largura via classes Tailwind:
- expandido: `w-60` (240px)
- colapsado: `w-14` (56px)

Resultado:
- O “spacer” reserva **256px**, mas o sidebar real fica com **240px**.
- Sobra uma faixa de **16px** (que aparece como o “espaço” entre Sidebar e conteúdo/Header).
- Hacks como `-ml-px` não resolvem porque o problema não é 1px, e sim **desalinhamento estrutural de layout**.

---

## Estratégia de correção (simples e robusta)
Fazer o Sidebar e o “spacer” falarem a mesma linguagem: **usar apenas um sistema de largura**.

Opção recomendada (mais limpa e alinhada ao componente):
- **Remover as classes `w-60`/`w-14` do `AppSidebar.tsx`**
- Deixar o `Sidebar` controlar a largura pelo mecanismo nativo (`--sidebar-width` / `--sidebar-width-icon`)
- Ajustar, se necessário, o visual para continuar com o mesmo “feeling” de largura (caso você prefira 240px em vez de 256px, aí ajustamos a variável e não via `w-*`)

---

## Alterações planejadas (arquivos)

### 1) `src/components/AppSidebar.tsx`
- Remover o override de largura no componente `<Sidebar ...>`:
  - Tirar `w-60` e `w-14` da string de classes.
  - Manter apenas as classes de transição/estética.
- Manter a lógica `isCollapsed` para ocultar textos/ajustar ícones e logo, pois isso não depende da largura fixa.

Critério de aceite:
- Ao alternar expandido/colapsado, **não aparece nenhuma faixa** entre sidebar e conteúdo.

---

### 2) `src/components/Layout.tsx`
- Remover os hacks de alinhamento introduzidos anteriormente:
  - Remover `-ml-px` do container principal do conteúdo (e garantir que não exista `-ml-px` no header).
- O layout deve voltar a ser “neutro”; quem dita largura/posicionamento é o próprio sistema do sidebar.

Critério de aceite:
- O header encosta no sidebar tanto no estado expandido quanto colapsado, sem depender de margens negativas.

---

## Validação (checklist rápido)
Vou validar em preview nestas larguras (simulando os devices mais comuns):
- 320px, 360px, 375px (iPhones/Android pequenos)
- 768px (tablet)
- 1024px (tablet/desktop pequeno)
- 1366px / 1440px / 1920px (desktop)

Cenários:
1) Sidebar expandido: sem gap.
2) Sidebar colapsado (ícone): sem gap.
3) Transição expandir/colapsar: sem “piscar” faixa no meio.
4) Scroll vertical na página: sem “linha” aparecendo.

---

## Observações importantes
- Essa correção mantém a identidade visual e melhora a consistência estrutural do layout (sem gambiarras).
- Se você fizer questão de o sidebar ter exatamente a largura 240px (w-60), a solução correta é ajustar `SIDEBAR_WIDTH` para `15rem` (240px) no `ui/sidebar.tsx` (ou expor isso via CSS vars), mas **não misturar** com `w-*` no `AppSidebar`.

---

## Entregáveis
- Sidebar e Header perfeitamente “colados”, sem faixa visível, em todos os estados e resoluções testadas.
