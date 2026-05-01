## Problema identificado

O toast da screenshot ("Login realizado com sucesso!") está com **borda verde grossa de 4px à esquerda** e layout desalinhado porque há um **CSS legado em `src/index.css` (linhas 207–234)** que aplica `!important` sobre todos os toasts do Sonner, **conflitando** com o `<Toaster>` editorial Akuris (`src/components/ui/sonner.tsx`). Esse CSS:

- Força `border-left: 4px solid` por `data-type` → sobrescreve o acento de 2px do Akuris (pseudo-elemento `before:`), resultando em duas marcações visuais e o "barrão" verde da screenshot.
- Força `background`, `border`, `color` e `box-shadow` com `!important` → anula o glassmorphism, a sombra primary e a tipografia editorial definidas no `toastOptions.classNames`.
- Usa cores hardcoded fora do design system (não tokens HSL semânticos), fugindo da identidade.

Resultado: o toast de login parece "genérico", sobressai sobre elementos do header e quebra a padronização que já foi implementada na onda anterior de notificações editoriais.

## Solução

### 1. Remover o bloco CSS legado de toasts em `src/index.css`
Apagar integralmente as regras `.toaster { ... }` e `.toaster [data-sonner-toast]...` (linhas ~207–234). Toda a estilização do toast passa a vir **exclusivamente** do `Toaster` Akuris (`sonner.tsx`), garantindo:
- Acento vertical único de 2px (pseudo-elemento `before:`) na cor do tom semântico.
- Glassmorphism (`bg-background/95 backdrop-blur-2xl`) + sombra primary suave.
- Tipografia editorial (title 13px semibold, description 12px muted).
- Modo escuro automático via tokens HSL do design system.

### 2. Garantir responsividade ao tema (light/dark)
Trocar `theme="light"` por `theme="system"` no `<Sonner>` para acompanhar o `ThemeProvider` da ferramenta — hoje o toast fica branco mesmo em dark mode.

### 3. Reforçar largura/empilhamento consistentes
No `toastOptions.classNames.toast`, fixar `w-[360px] max-w-[92vw]` (mesma medida do `akurisToast` custom) para que toasts disparados via `toast.success(...)` e via `akurisToast(...)` tenham **exatamente o mesmo footprint** — eliminando o efeito de "um sobressaindo ao outro" quando empilhados.

### 4. Validação visual
Após a remoção, validar:
- Toast de login (`toast.success(t('auth.loginSuccess'))` em `src/pages/Auth.tsx`) deve aparecer com chip 32x32 verde + ícone `CheckCircle2`, acento de 2px e tipografia editorial.
- Toasts de erro, warning e info no mesmo padrão.
- Empilhamento de 2–3 toasts simultâneos sem variação de largura.

## Arquivos afetados

- `src/index.css` — remover linhas ~207–234 (bloco `.toaster` legado).
- `src/components/ui/sonner.tsx` — `theme="system"` + largura fixa no classNames.
- `mem://design/foundations/notifications-editorial-akuris` — adicionar nota: "CSS legado do Sonner em index.css proibido; toda estilização vem do `<Toaster>` Akuris".

Nenhuma alteração necessária em chamadas existentes (`toast.success`, `toast.error`, `akurisToast`) — a correção é puramente de camada de estilo.
