# Aba "Notícias" — campanhas de e-mail com geração por IA

Criar uma nova aba **Notícias** dentro de `Configurações` (visível apenas para super-admin) que permita compor e disparar e-mails informativos/marketing para todos os usuários ativos da plataforma, com auxílio de IA para gerar conteúdo + imagem ilustrativa, sempre embrulhados no header e rodapé padrão Akuris.

## Diagnóstico do que já existe

- **Resend** já é o provedor (`noreply@akuris.com.br`), `RESEND_API_KEY` já configurada.
- **Template base** `supabase/functions/_shared/email-templates/BaseEmailTemplate.tsx` já tem header escuro com logo Akuris + footer padrão. Vamos reaproveitar.
- **Lovable AI Gateway** disponível via `LOVABLE_API_KEY`. Usaremos Gemini 3 Flash para texto e Nano Banana (`gemini-2.5-flash-image`) para imagem ilustrativa.
- Tabela `profiles` com coluna `email` e `ativo` — fonte da lista de destinatários.
- Padrão de aba super-admin já existe (Novidades/Changelog) — copiamos a estrutura.

## Mudanças

### 1. Banco — duas tabelas novas
**Migração:**
- `email_campanhas`
  - `id uuid pk`, `created_at`, `updated_at`
  - `criado_por uuid` (profile)
  - `assunto text not null`
  - `conteudo_html text not null` (HTML do bloco principal — sem header/footer)
  - `imagem_url text` (URL da imagem ilustrativa, opcional)
  - `status text default 'rascunho'` (rascunho | enviando | enviado | falhou)
  - `enviado_em timestamptz`, `total_destinatarios int`, `total_enviados int`, `total_falhados int`
  - `erro text`
- `email_campanha_logs`
  - `id uuid pk`, `campanha_id uuid fk`, `email text`, `status text` (sent|failed), `erro text`, `created_at`

RLS: apenas `super_admin` lê/insere/atualiza (via `has_role`). Logs também restritos a super-admin.

### 2. Storage
Bucket público `email-assets` para hospedar imagens geradas pela IA ou enviadas manualmente. Política: super-admin escreve, leitura pública.

### 3. Edge Functions

**a) `generate-email-content`** (verify_jwt = true, super-admin only)
- Input: `{ prompt: string, includeImage: boolean }`
- Chama Lovable AI (Gemini 3 Flash) com system prompt instruindo a gerar HTML semântico (parágrafos, listas, headings) **sem** incluir header/footer/logo — apenas o miolo. Tom corporativo Akuris.
- Se `includeImage=true`, faz uma segunda chamada para `gemini-2.5-flash-image` gerando ilustração relacionada ao tema, faz upload para `email-assets` e retorna URL pública.
- Sanitiza HTML retornado (DOMPurify equivalente em Deno via `isomorphic-dompurify`).
- Trata 402/429 e devolve erros estruturados.

**b) `send-email-campaign`** (verify_jwt = true, super-admin only)
- Input: `{ campanha_id }`
- Marca `status='enviando'`, busca todos `profiles.email` onde `ativo=true`.
- Renderiza HTML final com `BaseEmailTemplate` envolvendo: imagem (se houver) + conteúdo principal.
- Envia em lotes de 50 via Resend `batch.send` (ou loop com small delay), grava cada resultado em `email_campanha_logs`.
- Atualiza contadores e `status='enviado'` ou `'falhou'`.

### 4. Frontend — `src/components/configuracoes/NoticiasTab.tsx`
Nova aba super-admin em `Configuracoes.tsx` (chave `noticias`, ícone `Newspaper`). Layout:

- **Lista** de campanhas (rascunhos + enviadas) com status, data, total enviado.
- **Botão "Nova campanha"** abre dialog/Sheet `EmailCampanhaEditor`.

**`EmailCampanhaEditor`**:
- Campo Assunto.
- Bloco "Gerar com IA": textarea para o pedido (ex.: "Crie um e-mail sobre o módulo de Gestão de Riscos"), checkbox "Incluir imagem ilustrativa", botão "Gerar". Loading state.
- Após gerar, popula:
  - URL de imagem (preview) + botão remover/trocar.
  - Editor de conteúdo: usar **textarea** (HTML simples) com tabs "Editar HTML" / "Pré-visualização" — pré-visualização renderiza com o `BaseEmailTemplate` mock em iframe sandboxed mostrando como ficará o e-mail final.
- Upload manual de imagem (input file → upload para `email-assets`).
- Botões: **Salvar rascunho**, **Enviar para todos**.

**Pré-visualização**: componente React `EmailPreview` que recria visualmente o HTML do `BaseEmailTemplate` (mesmas cores/estilos) renderizando dentro de um iframe `srcDoc`. Garante WYSIWYG sem precisar executar a edge function.

### 5. Confirmação de envio
Antes de disparar, mostrar dialog: "Vai enviar para X usuários ativos. Confirmar?" — listar contagem real obtida do Supabase. Após confirmar, chama `send-email-campaign`, mostra toast e recarrega a lista.

## Arquitetura técnica resumida

```text
[NoticiasTab UI]
   │  rascunho/edit ─► insert email_campanhas
   │  IA ─► generate-email-content ─► Lovable AI (texto) + Nano Banana (imagem) ─► storage email-assets
   │  enviar ─► send-email-campaign ─► profiles(ativo) + Resend + BaseEmailTemplate
   └─ logs ─► email_campanha_logs
```

## Segurança
- RLS: super-admin only nas duas tabelas e funções (validação tanto em RLS quanto no Edge Function via `has_role`).
- Sanitização HTML obrigatória no backend antes de gravar/enviar.
- Rate-limit implícito pelos batches de envio.

## Arquivos
- **Migração SQL** (tabelas + RLS + bucket + policies storage).
- **Criar**: `supabase/functions/generate-email-content/index.ts`.
- **Criar**: `supabase/functions/send-email-campaign/index.ts`.
- **Criar**: `src/components/configuracoes/NoticiasTab.tsx`.
- **Criar**: `src/components/configuracoes/EmailCampanhaEditor.tsx`.
- **Criar**: `src/components/configuracoes/EmailPreview.tsx` (iframe srcDoc).
- **Editar**: `src/pages/Configuracoes.tsx` (adicionar TabsTrigger + TabsContent "noticias").

## Não escopo
- Sem agendamento (envio é imediato; podemos adicionar depois).
- Sem segmentação por empresa/role nesta versão (envia para todos os ativos — conforme pedido).
- Sem editor WYSIWYG complexo (textarea HTML + preview já atende; podemos evoluir).
- Sem tracking de abertura/clique nesta versão.
