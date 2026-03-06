

# Varredura Geral — Problemas e Melhorias Identificadas

Após análise detalhada do código, identifiquei **5 problemas concretos** que afetam a experiência e a integridade da aplicação:

---

## 1. TrialBanner duplicado no Layout

**Problema**: No `Layout.tsx`, linhas 153-154, o componente `<TrialBanner />` está renderizado **duas vezes**, fazendo com que o banner de trial apareça em dobro para todos os usuários em período de teste.

**Solução**: Remover a linha duplicada.

| Arquivo | Ação |
|---------|------|
| `src/components/Layout.tsx` | Remover o segundo `<TrialBanner />` (linha 154) |

---

## 2. Contratos, Documentos e Privacidade ainda usam useState/useEffect manual (sem React Query)

**Problema**: Enquanto Riscos, Incidentes, Ativos, Políticas e Planos de Ação já foram migrados para React Query, **3 módulos** ainda usam `useState` + `useEffect` + `fetchData()` manual:

- **Contratos.tsx**: `useState<Contrato[]>([])` + `useEffect(() => fetchData(), [])` — não atualiza após criar/editar
- **Documentos.tsx**: `useState` + `useEffect(() => fetchDocumentos(), [])` — precisa recarregar manualmente
- **Privacidade.tsx**: `useState` + `useEffect(() => loadData(), [])` — mesma situação

Isso contradiz diretamente a validação feita anteriormente sobre "atualização dinâmica".

**Solução**: Migrar esses 3 módulos para `useQuery` + `invalidateQueries`, seguindo o mesmo padrão já aplicado em Riscos e Incidentes.

| Arquivo | Ação |
|---------|------|
| `src/pages/Contratos.tsx` | Migrar para useQuery + invalidateQueries |
| `src/pages/Documentos.tsx` | Migrar para useQuery + invalidateQueries |
| `src/pages/Privacidade.tsx` | Migrar para useQuery + invalidateQueries |

---

## 3. Queries sem filtro de empresa_id (isolamento de dados)

**Problema crítico**: Contratos e Documentos fazem queries **sem filtro de `empresa_id`**:

```js
// Contratos.tsx
supabase.from('contratos').select('*').order(...)  // SEM .eq('empresa_id', ...)

// Documentos.tsx  
supabase.from('documentos').select('*').order(...)  // SEM .eq('empresa_id', ...)
```

Isso depende exclusivamente de RLS para isolamento — se houver qualquer falha em RLS, dados de outras empresas podem vazar. A regra do projeto diz: **"uma empresa NUNCA pode ver os dados da outra"**. Adicionar o filtro no código é uma camada extra de segurança.

**Solução**: Adicionar `.eq('empresa_id', empresaId)` nas queries desses módulos, como já é feito em Políticas, Ativos, Incidentes e Riscos.

| Arquivo | Ação |
|---------|------|
| `src/pages/Contratos.tsx` | Adicionar filtro empresa_id |
| `src/pages/Documentos.tsx` | Adicionar filtro empresa_id |
| `src/pages/Privacidade.tsx` | Verificar e adicionar filtro empresa_id |

---

## 4. console.error em vez de logger em vários módulos

**Problema**: Contratos e Documentos usam `console.error()` para logar erros, enquanto o padrão do sistema é usar `logger.error()` (que está implementado em `src/lib/logger.ts`). Isso gera inconsistência e dificulta rastreamento centralizado de erros.

**Solução**: Substituir `console.error` por `logger.error` nos módulos Contratos e Documentos.

| Arquivo | Ação |
|---------|------|
| `src/pages/Contratos.tsx` | Substituir console.error por logger.error |
| `src/pages/Documentos.tsx` | Substituir console.error por logger.error |

---

## 5. Privacidade.tsx não usa DataTable padronizado (usa Table manual)

**Problema**: A página de Privacidade renderiza tabelas usando `<Table>` manual, enquanto todos os outros módulos usam o componente `<DataTable>` que já inclui paginação, ordenação e "sem resultados" padronizados. Isso cria uma inconsistência visual e funcional.

**Solução**: Isso é uma refatoração maior que pode ser feita posteriormente. Por enquanto, o foco deve ser nos itens 1-4 que são mais urgentes.

---

## Resumo de Prioridade

| # | Problema | Impacto | Esforço |
|---|----------|---------|---------|
| 1 | TrialBanner duplicado | Visual (banner aparece 2x) | Mínimo |
| 2 | 3 módulos sem React Query | Funcional (dados não atualizam) | Médio |
| 3 | Queries sem empresa_id | Segurança (isolamento de dados) | Baixo |
| 4 | console.error inconsistente | Manutenção (logs dispersos) | Baixo |
| 5 | Privacidade sem DataTable | Visual (inconsistência) | Alto |

Recomendo implementar os itens **1 a 4** agora (são os mais impactantes e de esforço baixo/médio). O item 5 pode ficar para uma rodada posterior.

