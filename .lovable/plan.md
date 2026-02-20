

# Correcao do Logotipo nos E-mails

## Problema
O logo Akuris nao renderiza nos e-mails. A imagem aparece quebrada no header escuro. Causas identificadas:

1. **`Img` sem `width`/`height` explicitos**: Clientes de e-mail (Gmail, Outlook) ignoram `max-width`/`max-height` em CSS e precisam de atributos HTML `width` e `height` diretamente na tag `<img>`.
2. **Parametro `?v=1` na URL**: Alguns clientes de e-mail bloqueiam URLs com query strings.
3. **Templates com HTML inline usam URLs erradas**: Varios edge functions (incidentes, denuncias, auditorias) usam `https://akuris.com.br/akuris-logo.png` como fallback — URL que nao existe.

## Solucao

### 1. BaseEmailTemplate.tsx — Corrigir tag Img
- Adicionar `width="160"` e `height="48"` como atributos HTML na tag `<Img>`
- Remover `?v=1` da URL do logo
- Manter `style` apenas para `margin: '0 auto'`

### 2. constants.ts — Remover query string
- Alterar `SYSTEM_LOGO_URL` removendo `?v=1`

### 3. Edge Functions com HTML inline — Corrigir fallback URL
Substituir `https://akuris.com.br/akuris-logo.png` pela URL correta do storage em:
- `send-denuncia-notification/index.ts`
- `send-incidente-notification/index.ts`
- `send-auditoria-item-notification/index.ts`
- `send-due-diligence-email/index.ts`
- Adicionar `width` e `height` nos `<img>` inline tambem

### 4. Deploy
Fazer deploy de todas as funcoes afetadas para aplicar as correcoes.

## Secao Tecnica

**URL correta do logo (sem query string):**
```
https://lnlkahtugwmkznasapfd.supabase.co/storage/v1/object/public/email-assets/akuris-logo.png
```

**Img tag corrigida no BaseEmailTemplate:**
```tsx
<Img
  src={logoUrl}
  alt={companyName}
  width="160"
  height="48"
  style={{ margin: '0 auto', display: 'block' }}
/>
```

**Arquivos modificados:**
- `supabase/functions/_shared/constants.ts`
- `supabase/functions/_shared/email-templates/BaseEmailTemplate.tsx`
- `supabase/functions/send-denuncia-notification/index.ts`
- `supabase/functions/send-incidente-notification/index.ts`
- `supabase/functions/send-auditoria-item-notification/index.ts`
- `supabase/functions/send-due-diligence-email/index.ts`
