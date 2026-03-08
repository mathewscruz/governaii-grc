

# Validacao Completa — Modulo Gestao de Ativos e Sub-modulos

Analisei em profundidade os 3 sub-modulos (Ativos, Licencas, Chaves Criptograficas) incluindo tabelas, dialogs, queries, stats hooks, RLS policies, fluxos e consistencia visual. Abaixo os problemas identificados:

---

## RLS Policies e Banco de Dados

**OK** — Todas as tabelas (`ativos`, `ativos_licencas`, `ativos_chaves_criptograficas`, `ativos_manutencoes`, `ativos_localizacoes`, `ativos_notificacoes_enviadas`) possuem policies corretas de SELECT/INSERT/UPDATE/DELETE com `empresa_id = get_user_empresa_id()`.

---

## Problemas Identificados

### 1. SEGURANCA — Licencas e Chaves: queries SEM filtro empresa_id (4 locais)

As paginas `AtivosLicencas.tsx` e `AtivosChaves.tsx` fazem queries sem `.eq('empresa_id', empresaId)`, dependendo apenas de RLS. Os stats hooks (`useLicencasStats`, `useChavesStats`) tambem nao filtram.

| Arquivo | Query sem filtro |
|---------|-----------------|
| `AtivosLicencas.tsx` | `supabase.from('ativos_licencas').select('*').order(...)` |
| `AtivosChaves.tsx` | `supabase.from('ativos_chaves_criptograficas').select('*').order(...)` |
| `useLicencasStats.tsx` | `supabase.from('ativos_licencas').select('*')` |
| `useChavesStats.tsx` | `supabase.from('ativos_chaves_criptograficas').select('*')` |

**Correcao**: Adicionar `useEmpresaId()` ou `useAuth()` e filtrar por `empresa_id`. Incluir `empresaId` na `queryKey` e `enabled: !!empresaId`.

---

### 2. UX — Licencas e Chaves: acoes usam botoes inline em vez de DropdownMenu

As paginas Ativos (principal) usam `DropdownMenu` padrao para acoes de linha. Porem `AtivosLicencas.tsx` e `AtivosChaves.tsx` usam botoes `Edit` e `Trash` inline, quebrando a consistencia visual e o padrao documentado da aplicacao.

**Correcao**: Migrar para `DropdownMenu` com `MoreHorizontal` trigger, identico ao padrao em `Ativos.tsx`.

---

### 3. UX — Ativos: status "em_manutencao" existe no Azure sync mas nao no formulario

A funcao `mapIntuneDeviceToAtivo` na edge function `azure-integration` mapeia dispositivos para status `em_manutencao`, porem o formulario `AtivoDialog.tsx` e a pagina `Ativos.tsx` so oferecem `ativo | inativo | descontinuado`. Um ativo sincronizado pelo Azure pode ficar com status que nao aparece nos filtros nem pode ser editado no formulario.

**Correcao**: Adicionar `{ value: 'em_manutencao', label: 'Em Manutenção', color: 'warning' }` ao `statusOptions` em `Ativos.tsx` e `AtivoDialog.tsx`.

---

### 4. DADOS — Stats hooks (Licencas e Chaves): queryKey sem empresa_id causa cache compartilhado

Os hooks `useLicencasStats` e `useChavesStats` usam queryKeys fixas (`['licencas-stats']`, `['chaves-stats']`). Se o usuario trocar de empresa, os dados cacheados da empresa anterior serao exibidos.

**Correcao**: Incluir `empresaId` na queryKey: `['licencas-stats', empresaId]`.

---

### 5. UX — NotificationCenter: queries de licencas e chaves sem filtro empresa_id

O `NotificationCenter.tsx` busca licencas e chaves para gerar notificacoes de vencimento mas nao filtra por `empresa_id`:
- `supabase.from('ativos_licencas').select(...).eq('status', 'ativa')` — sem empresa_id
- `supabase.from('ativos_chaves_criptograficas').select(...).eq('status', 'ativa')` — sem empresa_id

**Correcao**: Adicionar `.eq('empresa_id', empresaId)` nas queries do NotificationCenter.

---

### 6. FUNCIONALIDADE — Licencas: campo `data_aquisicao` no formulario mas nao e exibido/utilizado

O `LicencaDialog` tem campo `data_aquisicao` mas a tabela da pagina `AtivosLicencas.tsx` nao exibe essa informacao. O campo `data_inicio` (obrigatorio no banco) tambem nao e exibido na tabela.

**Correcao**: Problema menor — manter como esta. Dados sao salvos e acessiveis na edicao.

---

## Resumo de Acoes

| # | Problema | Tipo | Impacto | Esforco |
|---|----------|------|---------|---------|
| 1 | Queries sem empresa_id (Licencas/Chaves) | Seguranca | **Critico** | Baixo |
| 2 | Botoes inline vs DropdownMenu | UX inconsistente | **Medio** | Baixo |
| 3 | Status "em_manutencao" ausente | Dados | **Medio** | Baixo |
| 4 | Stats hooks queryKey sem empresa_id | Cache incorreto | **Medio** | Baixo |
| 5 | NotificationCenter sem empresa_id | Seguranca | **Alto** | Baixo |
| 6 | Campo data_aquisicao nao exibido | UX menor | **Baixo** | Baixo |

Recomendo implementar os itens 1 a 5 nesta rodada. O item 6 e cosmetico e pode ser mantido.

