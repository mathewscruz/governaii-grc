

# Validacao Completa — Modulo Privacidade

Analisei todos os componentes: Privacidade.tsx, DadosPessoaisDialog.tsx, MapeamentoDialog.tsx, RopaWizard.tsx, RopaDialog.tsx, SolicitacaoTitularDialog.tsx, FluxoDadosDialog.tsx, DescoberDadosTab.tsx, DadosPessoaisCard.tsx, useDadosStats.tsx.

---

## OK — Sem problemas

- **Privacidade.tsx** — query principal filtra por `empresa_id` via `useEmpresaId`, queryKey inclui `empresaId`. StatCards com variantes semanticas, KPIs corretos (prazo LGPD 15 dias, incidentes privacidade). Tabs, DataTable, ConfirmDialog, empty states, Sheet detalhes. OK.
- **DadosPessoaisDialog** — grava `empresa_id` corretamente via profile. CRUD com toast. OK.
- **SolicitacaoTitularDialog** — grava `empresa_id`. Validacao campos obrigatorios. Campos condicionais por status. Prazo LGPD 15 dias. OK.
- **RopaWizard** — filtra dados e ativos por `empresa_id`. Wizard 4 etapas, vinculacao dados + ativos, validacao por step. OK.
- **FluxoDadosDialog** — filtra dados e usuarios por `empresa_id`. OK.

---

## Problemas Identificados

### 1. SEGURANCA — `useDadosStats` sem filtro `empresa_id` e queryKey estatica

O hook busca `dados_pessoais`, `dados_fluxos`, `dados_solicitacoes_titular` e `ropa_registros` sem `.eq('empresa_id', empresaId)`. A queryKey e fixa `['dados-stats']`. Nao e utilizado em nenhum lugar do projeto atualmente, mas existe e pode ser importado a qualquer momento.

**Correcao**: Adicionar `useEmpresaId`, filtrar todas as queries, incluir `empresaId` na queryKey, `enabled: !!empresaId`.

### 2. SEGURANCA — `MapeamentoDialog` busca dados e ativos SEM filtro `empresa_id`

Linhas 44-47 e 58-61: `supabase.from('dados_pessoais').select('*').order('nome')` e `supabase.from('ativos').select('*').order('nome')` — sem filtro de empresa. Dados e ativos de outras empresas aparecem nos dropdowns.

**Correcao**: Importar `useEmpresaId`, adicionar `.eq('empresa_id', empresaId)` em ambas queries.

### 3. SEGURANCA — `MapeamentoDialog.handleSave` nao grava `empresa_id`

Linhas 82-85: o insert do mapeamento grava apenas `formData` sem adicionar `empresa_id`. O `dados_mapeamento` tem coluna `empresa_id` mas nao e populada.

**Correcao**: Buscar `empresa_id` e incluir no payload (insert e update).

### 4. SEGURANCA — `RopaDialog.loadUsuarios` sem filtro `empresa_id`

Linhas 59-62: `supabase.from('profiles').select('user_id, nome, email').order('nome')` — retorna usuarios de TODAS as empresas nos dropdowns de Responsavel e DPO.

**Correcao**: Importar `useEmpresaId`, adicionar `.eq('empresa_id', empresaId)`.

### 5. SEGURANCA — `DescoberDadosTab` busca descobertas SEM filtro `empresa_id`

Linhas 125-128: `supabase.from('dados_descobertas').select('*').order(...)` — sem filtro de empresa. A queryKey tambem e estatica `['dados-descobertas']`, sem `empresaId`. O delete tambem nao valida empresa.

**Correcao**: Adicionar `.eq('empresa_id', empresaId)` na query e `empresaId` na queryKey.

### 6. SEGURANCA — `Privacidade.tsx` busca `ropa_dados_vinculados` SEM filtro `empresa_id`

Linha 82: `supabase.from('ropa_dados_vinculados').select('id, dados_pessoais_id')` — busca TODOS os vinculos de todas as empresas. Isso pode inflar contagens de ROPAs nos cards do catalogo.

**Correcao**: Filtrar via join ou subquery. Como a tabela pode nao ter `empresa_id` diretamente, filtrar pelos `dados_pessoais_id` que pertencem a empresa (usar os IDs ja carregados).

### 7. UX — Catalogo usa botoes inline em vez de DropdownMenu

Linhas 233-291: a coluna de acoes do catalogo usa 5 botoes ghost inline com Tooltip (Eye, Edit, Link2, FileText, Trash2). Inconsistente com o padrao DropdownMenu adotado nos demais modulos.

**Correcao**: Migrar para DropdownMenu com MoreHorizontal.

### 8. UX — ROPA e Solicitacoes usam botoes inline em vez de DropdownMenu

Linhas 353-387 (ROPA) e 457-490 (Solicitacoes): mesma inconsistencia com botoes ghost inline.

**Correcao**: Migrar para DropdownMenu.

### 9. CODIGO MORTO — `DadosPessoaisCard` nao e utilizado

O componente `DadosPessoaisCard.tsx` nao e importado em nenhum lugar do projeto. E codigo morto.

**Correcao**: Remover o arquivo.

### 10. CODIGO MORTO — `useDadosStats` nao e utilizado

O hook nao e importado em nenhum lugar. Codigo morto com vulnerabilidades.

**Correcao**: Remover o arquivo (em vez de corrigir codigo que ninguem usa).

---

## Resumo de Acoes

| # | Problema | Tipo | Impacto |
|---|----------|------|---------|
| 1 | MapeamentoDialog sem empresa_id nas queries | Seguranca | **Alto** |
| 2 | MapeamentoDialog nao grava empresa_id | Seguranca | **Alto** |
| 3 | RopaDialog loadUsuarios sem empresa_id | Seguranca | **Alto** |
| 4 | DescoberDadosTab sem empresa_id | Seguranca | **Alto** |
| 5 | ropa_dados_vinculados sem filtro empresa | Seguranca | **Medio** |
| 6 | Catalogo acoes inline → DropdownMenu | UX | **Medio** |
| 7 | ROPA/Solicitacoes acoes inline → DropdownMenu | UX | **Medio** |
| 8 | DadosPessoaisCard codigo morto | Manutencao | **Baixo** |
| 9 | useDadosStats codigo morto | Manutencao | **Baixo** |

Todos os 9 itens serao implementados.

### Arquivos a editar:
- `src/components/dados/MapeamentoDialog.tsx` — empresa_id filter + gravar empresa_id
- `src/components/dados/RopaDialog.tsx` — empresa_id filter no loadUsuarios
- `src/components/dados/DescoberDadosTab.tsx` — empresa_id filter + queryKey
- `src/pages/Privacidade.tsx` — filtrar ropa_dados_vinculados, DropdownMenu em todas as tabs
- `src/components/dados/DadosPessoaisCard.tsx` — remover arquivo
- `src/hooks/useDadosStats.tsx` — remover arquivo

