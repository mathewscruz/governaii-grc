

# Plano: Migrar Contexto para Configurações + Changelog Dinâmico

## 1. Migrar "Contexto da Organização" para Configurações

**Problema**: O botão "Contexto" está no `GapAnalysisFrameworkDetail.tsx` — o usuário precisa entrar em um framework específico para preencher. As informações são da empresa (globais), não do framework.

**Solução**:
- Transformar `CompanyContextDialog.tsx` em um componente inline (não dialog) chamado `CompanyContextSettings.tsx`, reutilizando a mesma lógica de campos (setor, porte, objetivo, data alvo)
- Adicionar nova aba "Organização" na página `Configuracoes.tsx` (visível para admin/super_admin), renderizando o novo componente dentro de um Card
- Remover o botão "Contexto" e o `CompanyContextDialog` do `GapAnalysisFrameworkDetail.tsx`
- Manter o `CompanyContextDialog.tsx` para eventual reuso, mas o ponto de entrada principal passa a ser Configurações

**Arquivos**:
| Arquivo | Ação |
|---------|------|
| `src/components/configuracoes/CompanyContextSettings.tsx` | **Novo** — form inline com os 4 campos (setor, porte, objetivo, data alvo) |
| `src/pages/Configuracoes.tsx` | **Modificar** — adicionar aba "Organização" com ícone Building2 |
| `src/pages/GapAnalysisFrameworkDetail.tsx` | **Modificar** — remover botão Contexto, import do CompanyContextDialog e state showContextDialog |

## 2. Changelog Dinâmico via Tabela de Versões

**Problema**: O `ChangelogPopover.tsx` usa um array hardcoded `CHANGELOG`. O usuário quer que a cada publicação, as novidades apareçam automaticamente no sino/notificações.

**Análise de viabilidade**: O Lovable não dispara webhooks ao publicar, então não é possível automatizar 100%. A solução prática é:
- Criar uma tabela `changelog_entries` no Supabase para armazenar versões e itens
- O `ChangelogPopover` passa a ler da tabela em vez do array hardcoded
- Quando uma nova entrada é adicionada à tabela, uma notificação é criada automaticamente para todos os usuários da empresa via trigger
- O administrador (ou via SQL) adiciona entradas ao publicar — processo simples e controlável

**Estrutura da tabela `changelog_entries`**:
```sql
id uuid PK
version text NOT NULL
release_date date NOT NULL
items jsonb NOT NULL  -- [{ type: 'feature'|'improvement'|'fix', text: '...' }]
created_at timestamptz DEFAULT now()
```

**Trigger**: Ao inserir um novo changelog, inserir uma notificação na tabela `notifications` para cada usuário ativo, com título "Nova versão {version}" e mensagem resumida dos itens.

**Arquivos**:
| Arquivo | Ação |
|---------|------|
| Migration SQL | **Novo** — tabela `changelog_entries` + trigger para criar notificações |
| `src/components/ChangelogPopover.tsx` | **Modificar** — ler de Supabase em vez de array hardcoded, marcar "visto" via localStorage |

## Impacto
- Configurações ganha a aba "Organização" — admin preenche uma vez, todos os frameworks usam
- Changelog passa a ser dinâmico — novas versões aparecem no popover de novidades E como notificação no sino
- Nenhuma funcionalidade existente é perdida

