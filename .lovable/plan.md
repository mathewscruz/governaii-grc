

# Fluxo de Aprovação de Aceite de Risco

## Situação Atual
O formulário de risco tem um checkbox "Aceitar este risco formalmente" que marca `aceito=true` diretamente — sem fluxo de aprovação, sem notificação, sem e-mail. A tabela `riscos` já possui as colunas necessárias: `aceito`, `aprovador_aceite`, `data_aceite`, `justificativa_aceite`, `data_proxima_revisao`.

## Fluxo Proposto

```text
┌─────────────────────┐     ┌──────────────────────┐     ┌────────────────────┐
│ Usuário marca aceite│────▶│ Seleciona aprovador  │────▶│ Salva risco com    │
│ + justificativa     │     │ + data revisão       │     │ aceito=false       │
│                     │     │                      │     │ status_aceite=     │
│                     │     │                      │     │   'pendente'       │
└─────────────────────┘     └──────────────────────┘     └────────┬───────────┘
                                                                  │
                                                     ┌────────────▼──────────┐
                                                     │ Notificação + E-mail  │
                                                     │ para aprovador        │
                                                     └────────────┬──────────┘
                                                                  │
                                              ┌───────────────────▼──────────┐
                                              │ Aprovador abre o risco       │
                                              │ e vê botões Aprovar/Rejeitar │
                                              └──────┬──────────────┬────────┘
                                                     │              │
                                            ┌────────▼───┐  ┌──────▼────────┐
                                            │ APROVADO   │  │ REJEITADO     │
                                            │ aceito=true│  │ aceito=false  │
                                            │ data_aceite│  │ status_aceite │
                                            │ aparece no │  │  ='rejeitado' │
                                            │ sub-módulo │  │ notifica user │
                                            └────────────┘  └───────────────┘
```

## Alterações

### 1. Migração SQL — Nova coluna `status_aceite`
Adicionar `status_aceite TEXT DEFAULT NULL` à tabela `riscos` para rastrear o fluxo (valores: `pendente`, `aprovado`, `rejeitado`).

### 2. `RiscoFormWizard.tsx` — Reformular seção Aceite
- Quando checkbox "aceito" é marcado: mostrar campos obrigatórios de **Aprovador** (UserSelect), **Justificativa**, **Data Próxima Revisão**, e Anexos
- No `onSubmit`: NÃO marcar `aceito=true` diretamente. Salvar com `aceito=false`, `status_aceite='pendente'`, `aprovador_aceite=aprovadorId`
- Enviar notificação in-app e chamar edge function de e-mail

### 3. Edge Function `send-risco-aceite-notification/index.ts` — Nova
- Recebe `risco_id`, `aprovador_id`, `solicitante_id`
- Busca dados do risco, aprovador e solicitante
- Envia e-mail ao aprovador com template consistente (mesmo padrão de `send-approval-notification`)
- Inclui link para `/riscos?risco={id}`

### 4. `AprovacaoRiscoDialog.tsx` — Adicionar lógica de aceite
- Detectar quando o risco tem `status_aceite='pendente'` e o usuário logado é o `aprovador_aceite`
- Mostrar seção "Decisão de Aceite" com botões Aprovar/Rejeitar
- **Aprovar**: `aceito=true`, `data_aceite=now()`, `status_aceite='aprovado'` — o risco aparece no sub-módulo Aceite de Risco
- **Rejeitar**: `aceito=false`, `status_aceite='rejeitado'` — notifica o criador
- Enviar e-mail de resultado ao solicitante

### 5. `RiscosAceite.tsx` — Filtro já funcional
A página já filtra por `aceito=true`, então riscos aprovados aparecerão automaticamente. Ajustar para mostrar também os `status_aceite='pendente'` em uma seção separada de "Pendentes de Aprovação".

### 6. Notificações centralizadas no sino
Todas as notificações (solicitação, aprovação, rejeição) serão inseridas na tabela `notifications` e aparecerão no NotificationCenter.

## Arquivos a editar/criar
| Arquivo | Ação |
|---------|------|
| Migração SQL | Adicionar coluna `status_aceite` |
| `src/components/riscos/RiscoFormWizard.tsx` | Reformular seção aceite com aprovador + fluxo |
| `supabase/functions/send-risco-aceite-notification/index.ts` | **Criar** — e-mail ao aprovador |
| `src/components/riscos/AprovacaoRiscoDialog.tsx` | Adicionar lógica de decisão de aceite |
| `src/pages/RiscosAceite.tsx` | Mostrar pendentes + aprovados |
| `supabase/config.toml` | Registrar nova edge function |

