
# Redesign Completo dos E-mails do Sistema

## Problema Atual
Os e-mails atuais tem um visual generico e "feito por IA": header violeta solido, caixas com borda lateral colorida (`borderLeft: 4px`), tipografia sem personalidade. Falta humanidade e refinamento.

## Inspiracao (dos modelos enviados)
- **Heroku**: Header escuro com logo centralizado, layout limpo, secoes bem separadas com icones, botao grande
- **Duolingo**: Super clean, muito espaco em branco, tipografia grande e amigavel, botao arredondado colorido
- **Logoipsum**: Header com logo, visual moderno, botao de destaque com cor vibrante

## Nova Abordagem Visual

O redesign sera **inspirado no estilo Heroku** (o mais adequado para uma plataforma GRC profissional):

1. **Header**: Fundo escuro (`#0a1628` - cor secondary do sistema) com logo Akuris centralizado (letras brancas ficam visiveis no fundo escuro) + uma linha decorativa gradiente violeta abaixo
2. **Layout**: Muito mais limpo, com mais espaco em branco, sem bordas laterais coloridas nas caixas
3. **Tipografia**: Titulos maiores e mais ousados, texto do corpo mais respirado
4. **Botoes**: Maiores, mais arredondados, com estilo pill (border-radius grande)
5. **Info boxes**: Fundo neutro sutil sem borda lateral, mais suaves
6. **Footer**: Minimalista, assinatura "Equipe Akuris" estilo carta antes do footer tecnico
7. **Codigo OTP**: Estilo mais elegante com fundo violeta claro e digitos bem espassados

## Arquivos Afetados

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/_shared/email-templates/BaseEmailTemplate.tsx` | Redesign completo: header escuro, gradiente decorativo, layout mais limpo, footer assinatura |
| `supabase/functions/send-welcome-email/_templates/welcome-email.tsx` | Adaptar ao novo estilo, texto mais amigavel |
| `supabase/functions/resend-welcome-email/_templates/welcome-email.tsx` | Mesmas alteracoes do welcome |
| `supabase/functions/send-password-reset/_templates/password-reset-email.tsx` | Adaptar ao novo estilo |
| `supabase/functions/send-mfa-code/_templates/mfa-code-email.tsx` | Novo visual para codigo OTP |
| `supabase/functions/process-invitation-reminders/_templates/invitation-reminder-email.tsx` | Adaptar ao novo estilo |

## Secao Tecnica

### Mudancas principais no BaseEmailTemplate

**Header (antes -> depois):**
- Antes: `backgroundColor: '#7552ff'` (violeta solido), logo com `filter: brightness(0) invert(1)`
- Depois: `backgroundColor: '#0a1628'` (escuro), logo sem filtro (letras brancas ja aparecem), padding maior, + linha gradiente violeta decorativa abaixo do header

**Info boxes (antes -> depois):**
- Antes: `borderLeft: '4px solid #7552ff'`, fundo colorido forte
- Depois: Fundo `#f8f9fb` com borda `1px solid #e2e8f0`, sem borda lateral, `borderRadius: '12px'`

**Warning boxes (antes -> depois):**
- Antes: Fundo amarelo com borda lateral amarela
- Depois: Fundo amarelo mais sutil, icone de alerta em texto, sem borda lateral

**Botoes (antes -> depois):**
- Antes: `borderRadius: '10px'`, padding `14px 36px`
- Depois: `borderRadius: '50px'` (pill), padding `16px 48px`, sem boxShadow

**Footer (antes -> depois):**
- Antes: Texto centralizado com link "Akuris"
- Depois: Assinatura "Equipe Akuris" no conteudo + footer tecnico minimalista com copyright

**Titulo (antes -> depois):**
- Antes: `fontSize: '22px'` com divider de 48px violeta
- Depois: `fontSize: '26px'` sem divider, mais espaco acima

### Mudancas nos templates individuais

Cada template sera simplificado para usar o novo estilo mais limpo, removendo excesso de caixas coloridas e substituindo por texto direto com formatacao sutil.
