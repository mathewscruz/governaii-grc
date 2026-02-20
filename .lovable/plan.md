
# Correcao Definitiva do Logo nos E-mails

## Causa Raiz
O bucket `email-assets` no Supabase Storage **nao existe** (retorna 404). Todas as templates de e-mail referenciam `https://lnlkahtugwmkznasapfd.supabase.co/storage/v1/object/public/email-assets/akuris-logo.png` que esta inacessivel.

## Solucao

### Passo 1: Criar Edge Function para upload do logo
Criar uma Edge Function temporaria `upload-email-logo` que:
1. Cria o bucket `email-assets` como publico no Supabase Storage
2. Faz download do logo de `public/akuris-logo.png` (da URL do preview do projeto)
3. Faz upload para o bucket como `akuris-logo.png`
4. Retorna a URL publica confirmando sucesso

### Passo 2: Executar a funcao
- Deploy e chamada da funcao para garantir que o bucket e o arquivo existam
- Verificar que a URL `https://lnlkahtugwmkznasapfd.supabase.co/storage/v1/object/public/email-assets/akuris-logo.png` retorna a imagem corretamente

### Passo 3: Limpar
- Deletar a edge function temporaria apos o upload bem-sucedido

**Nenhuma alteracao nos templates e necessaria** — todos ja referenciam a URL correta, o problema e somente que o bucket/arquivo nao existe no storage.

## Secao Tecnica

**Edge Function `upload-email-logo/index.ts`:**
- Usa `supabaseAdmin` com `SUPABASE_SERVICE_ROLE_KEY` para criar o bucket publico
- Faz fetch do logo de `https://id-preview--e64d00f7-1631-421a-bcc8-86aa27d8fb2a.lovable.app/akuris-logo.png`
- Upload via `supabase.storage.from('email-assets').upload('akuris-logo.png', blob, { contentType: 'image/png', upsert: true })`
- Funcao sera deletada apos execucao

**Arquivos envolvidos:**
- `supabase/functions/upload-email-logo/index.ts` (criar, executar, deletar)
- Nenhum template precisa ser alterado
