## Plano de melhorias do DocGen

Quatro frentes, todas no escopo do módulo Documentos/DocGen — sem mexer em outros módulos.

### 1. Fix do gatilho "Gerar Documento" + feedback visual

**Problema atual**: o backend marca `documento_pronto=true` se a resposta da IA contém qualquer trecho como "gerar documento", "posso gerar", etc. Isso dispara falso-positivo cedo demais. E quando o usuário clica em Gerar, o painel direito fica vazio por 20–40s sem feedback.

**Mudanças**:
- `supabase/functions/docgen-chat/index.ts`:
  - Trocar a heurística por um marcador explícito: instruir o modelo a emitir literalmente `[DOCGEN_READY]` ao final da mensagem **somente** quando tiver coletado objetivo, escopo, responsabilidades e procedimentos básicos.
  - Detectar `[DOCGEN_READY]` na resposta, setar `documento_pronto=true` e remover o marcador antes de devolver ao frontend.
  - Manter fallback (heurística antiga) atrás de uma flag para não regredir conversas em andamento.
- `src/components/documentos/DocGenDialog.tsx`:
  - Renderizar um **skeleton de documento** no painel direito enquanto `isGeneratingDoc=true` (header + 4-5 blocos de seções com `animate-pulse`).
  - Texto "Gerando documento… isso pode levar até 40 segundos" com ícone Brain animado.
  - Garantir que o painel direito passe a aparecer já no início da geração (não só após `generatedDocument` ficar populado).

### 2. Botão "Nova conversa" + histórico

**Mudanças no `DocGenDialog.tsx`**:
- Header do dialog ganha dois botões discretos:
  - **Nova conversa** (ícone `Plus`): limpa `messages`, `conversationId`, `generatedDocument`, `documentReady` e dispara saudação de novo.
  - **Histórico** (ícone `History`): abre um Popover/Sheet listando conversas anteriores do usuário (`docgen_conversations` filtrado por `user_id` + `empresa_id`, ordem desc, últimos 20). Cada item mostra título, data e tipo. Clicar carrega `messages` e `contexto` daquela conversa.
- Não cria tabelas novas — `docgen_conversations` já tem tudo (mensagens em jsonb, tipo_documento_identificado, updated_at).

### 3. Novos templates de sistema

**Hoje só existem 2** (PSI e POP). Adicionar via migration:
- Política de Senhas
- Política de Mesa Limpa e Tela Limpa
- Política de LGPD/Privacidade
- Política de Backup
- Plano de Continuidade de Negócios
- Análise de Impacto no Negócio (BIA)
- Código de Ética e Conduta
- Política de Controle de Acesso

Cada um com `estrutura` jsonb contendo seções padrão do mercado (Objetivo, Escopo, Definições, Diretrizes, Responsabilidades, Penalidades, Revisão, Aprovação). `is_system=true`, `empresa_id` = UUID zero (padrão atual).

### 4. AlertDialog de descarte

**Substituir** o atual toast destrutivo + `setTimeout(2s)` no `handleDialogClose`:
- Quando o usuário tenta fechar com `hasUnsavedChanges=true`, abrir um `AlertDialog` (shadcn) com:
  - Título: "Descartar documento gerado?"
  - Descrição: "Você tem um documento gerado que não foi salvo no sistema nem exportado. Se fechar agora, ele será perdido."
  - Ações: **Continuar editando** (cancela fechamento) | **Descartar** (fecha de fato).
- Remove o setTimeout — comportamento fica previsível.

---

### Detalhes técnicos

- **Edge Function**: redeployar `docgen-chat` após edit. Manter a chamada Claude (Sonnet 4) e o `consume_ai_credit` intactos.
- **DB**: 1 migration apenas com `INSERT INTO docgen_templates` para os 8 templates novos (idempotente via `ON CONFLICT (nome, tipo_documento) DO NOTHING` — vou checar se há unique constraint; se não houver, criar uma).
- **Identidade visual**: tudo segue DM Sans, primary purple, padrões Sonner para toasts e shadcn AlertDialog.
- **Multi-tenant**: histórico carrega só conversas do `user_id` + `empresa_id` atuais. Templates novos são globais (`is_system=true`), não vazam dados.
- **Sem impacto em outros módulos**: mudanças isoladas em `DocGenDialog.tsx` + `docgen-chat/index.ts` + 1 migration.

### Arquivos afetados
- `src/components/documentos/DocGenDialog.tsx` (edit)
- `supabase/functions/docgen-chat/index.ts` (edit)
- `supabase/migrations/<nova>.sql` (create — só INSERT de templates + possível unique constraint)

### Validação após implementar
1. Abrir DocGen, conversar até receber `[DOCGEN_READY]` — botão "Gerar Documento" só deve aparecer aí.
2. Clicar Gerar — skeleton aparece no painel direito imediatamente.
3. Clicar "Nova conversa" — limpa tudo.
4. Abrir "Histórico" — lista conversas anteriores; clicar restaura.
5. Pedir "Política de Senhas" — backend deve casar com o template novo, não cair no fallback PSI.
6. Tentar fechar com documento gerado não salvo — AlertDialog aparece.
