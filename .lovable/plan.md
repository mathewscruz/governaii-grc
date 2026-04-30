## Objetivo

Criar um **painel admin de Novidades** (visível só para super-admin) para gerenciar o changelog que aparece no popover do header. Fazer também o **backfill** de uma versão v3.0 listando entregas recentes.

## Diagnóstico confirmado

- A tabela `changelog_entries` (id, version, release_date, items jsonb, created_at) tem só **3 entradas antigas (v2.7–v2.9)**, todas de 04/03/2026.
- O componente `ChangelogPopover.tsx` está OK — apenas lê o que existe.
- RLS já está correto: SELECT público para autenticados; INSERT/UPDATE/DELETE só para `has_super_admin_role()`.
- **Não falta nada no schema nem na segurança** — falta UI para popular.

## Implementação

### 1. Nova aba "Novidades" em Configurações (super-admin)

- **Arquivo novo**: `src/components/configuracoes/GerenciamentoChangelog.tsx`
  - Guard: se `!isSuperAdmin`, mostra tela de "Acesso restrito" (mesmo padrão de `GerenciamentoEmpresas.tsx`).
  - Lista todas as versões (mais recente primeiro), cada uma em um Card com versão, data e contagem de itens.
  - Botões: **Nova versão**, **Editar**, **Excluir** (com confirmação).
  - Identidade visual padrão (DM Sans, Navy/Purple, glassmorphism Sonner para toasts).

- **Dialog de edição/criação**: `src/components/configuracoes/ChangelogEntryDialog.tsx`
  - Campos: `version` (texto, ex: v3.0), `release_date` (date picker), e lista dinâmica de **itens**.
  - Cada item tem `type` (Select: Novo / Melhoria / Correção) + `text` (textarea curto).
  - Botões "Adicionar item" / "Remover item" inline.
  - Validação client-side: versão obrigatória, data obrigatória, ao menos 1 item com texto.
  - Ao salvar: `upsert` em `changelog_entries`, invalida lista, toast Sonner.

- **Integração**: adicionar a aba em `src/pages/Configuracoes.tsx` (ou no componente equivalente) com `<TabsTrigger>` condicional ao super-admin, ícone `Sparkles` (mesmo do popover, mantém coerência).

### 2. Backfill v3.0 (30/04/2026)

Inserir uma nova entrada via tool de insert (não migration) com itens cobrindo as entregas recentes:

- Novo: Identidade visual com ícone Akuris exclusivo na navegação
- Melhoria: Hardening de segurança multi-tenant em todas as tabelas (UPDATE WITH CHECK)
- Melhoria: Aba "Empresas" restrita exclusivamente a super-admins
- Melhoria: Gestão de usuários segregada por empresa para administradores
- Melhoria: Módulo de Políticas removido (mantido como tipo de documento)
- Novo: Painel admin de Novidades para gestão do changelog

(Você poderá ajustar o texto depois pelo próprio painel.)

### 3. Memória

Criar `mem://admin/changelog-management` documentando: super-admin gerencia via Configurações > Novidades; tabela `changelog_entries`; popover lê últimas 10 ordenadas por `release_date desc`.

## Fora de escopo

- Não há geração automática por IA (decisão sua).
- Não envia notificação no sino — o badge pulsante no ícone Sparkles já sinaliza versão nova.
- Não cria endpoint público; permanece protegido por auth.

## Arquivos afetados

- **Novos**: `GerenciamentoChangelog.tsx`, `ChangelogEntryDialog.tsx`, memória.
- **Editado**: `src/pages/Configuracoes.tsx` (adiciona aba).
- **Dados**: 1 INSERT em `changelog_entries` (v3.0).

Após aprovação, implemento direto.