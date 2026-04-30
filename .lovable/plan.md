## Objetivo

Remover por completo o módulo **Políticas** do sistema, mantendo intactos:
- A página pública **Política de Privacidade** (`/politica-privacidade`)
- O campo **Política de Privacidade** nas configurações do Canal de Denúncia
- A categoria **Políticas Públicas** no ROPA/Dados Pessoais (LGPD)
- O tipo de documento **"Política"** dentro do módulo Documentos (você continua podendo classificar um documento como Política)

## O que será removido

### Frontend
- `src/pages/Politicas.tsx` (página)
- `src/components/politicas/PoliticaDialog.tsx` (dialog)
- Rota `/politicas` e import lazy em `src/App.tsx`
- Item "Políticas" na sidebar (`AppSidebar.tsx`)
- Item "Políticas" no menu mobile (`MobileBottomNav.tsx`)
- Entrada "Políticas" no Command Palette (`CommandPalette.tsx`)
- Entrada `/politicas` em `src/lib/route-prefetch.ts`
- Mapeamentos de "politica/politicas" em `src/lib/akuria-actions.ts` e `AkurIAActionListener.tsx`
- Chave i18n `sidebar.policies` em `pt.ts` e `en.ts`

### Edge Functions
- Remover bloco de query e relato de "Políticas" no contexto da AkurIA (`akuria-chat/index.ts`)
- Remover "politica" do mapeamento de tipos do `integration-webhook-dispatcher`
- Remover "politica" da lista de módulos válidos da action `[ACTION:create:...]` no prompt da AkurIA
- A função `docgen-chat` continua reconhecendo "política" como **tipo de documento** (não muda)

### Banco de dados (tabelas hoje vazias)
- `DROP TABLE` em cascata: `politicas`, `politica_aceites`, `politica_questionarios`, `politica_respostas`
- Remover entradas de permissão de módulo `politicas` (em `module_permissions` / perfis), se existirem, para limpar a UI de gestão de acessos

## O que NÃO será tocado

- `src/pages/PoliticaPrivacidade.tsx`
- Campo `politica_privacidade` em `ConfiguracoesDenuncia.tsx` e na tabela `denuncia_configuracoes`
- `politicas_publicas` em `RopaDialog.tsx` e `DadosPessoaisDialog.tsx` (LGPD)
- Tipo `politica` em `DocumentoDialog.tsx`, `BuscaAvancadaDocumentos.tsx` e `docgen-chat` (segue valendo dentro de Documentos)
- Textos institucionais "policies/policies" em `i18n/en.ts` (descrição de Governance/Documentos)

## Validações pós-remoção

- Build TypeScript sem erros
- Sidebar, menu mobile e command palette sem o item "Políticas"
- AkurIA não tenta consultar mais a tabela `politicas`
- `/politicas` redireciona para 404 (rota inexistente)
- Módulo Documentos segue oferecendo "Política" como tipo de documento

Confirma que posso seguir?
