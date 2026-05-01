## Diagnóstico — drill-down dos cards (KpiDrillDownDrawer)

A gaveta lateral que abre ao clicar nos StatCards do dashboard tem **8 das 19 queries quebradas** porque referenciam colunas que não existem no schema. Por isso o card de Riscos mostra "Não foi possível carregar" no print enviado.

### Bugs confirmados (cruzando schema do banco com o código)

| Drill key | Tabela | Problema | Correção |
|---|---|---|---|
| `riscos` | `riscos` | usa `titulo` e `severidade` (não existem) | usar `nome` e `nivel_risco_residual` (fallback `nivel_risco_inicial`); filtrar por `aceito=false` em vez de `status` |
| `riscos_aceite` | `riscos` | usa `titulo`, `severidade` | usar `nome` e `nivel_risco_residual` |
| `incidentes` | `incidentes` | usa `severidade` (existe `criticidade`); filtra `status in ('aberto','investigacao')` mas o valor real é só `aberto` (e provavelmente `em_analise`) | usar `criticidade`; ajustar lista de status para `('aberto','em_analise','em_tratamento')` |
| `contratos` | `contratos` | usa `titulo` (existe `nome`) | usar `nome` (com `numero_contrato` como subtítulo) |
| `documentos` | `documentos` | usa `titulo` e `data_revisao` (existem `nome` e `data_vencimento`); filtra por `pendente_aprovacao` mas o valor real é `pendente` | usar `nome`, `data_vencimento`, status `pendente` |
| `due_diligence` | `due_diligence_assessments` | usa `terceiro_nome` e `score` (existem `fornecedor_nome` e `score_final`) | renomear nos campos |
| `denuncias` | `denuncias` | filtra `status in ('novas','em_andamento')` (valor real provável: `nova`, `em_investigacao`); usa `categoria` (existe `categoria_id` + `titulo`) | usar `titulo` como título e `gravidade` como tom; ajustar status |
| `controles` | — | retorna lista vazia hard-coded e aponta para `/sistemas` | apontar para `/controles` e popular com itens reais de `controles_internos` (top 5 por criticidade) ou ocultar a tile até implementar |

### Bugs adicionais

1. **`?focus=ID` nunca é consumido**: a gaveta navega para `/{rota}?focus={id}` ao clicar num item, mas nenhuma página de listagem (`Riscos`, `Documentos`, `Incidentes`, etc.) lê esse parâmetro para destacar/abrir o registro. Resultado: o usuário cai na lista, mas não vai para o item escolhido.
2. **Botão "Ver todos" do drill `auditorias`** aponta para `/governanca?tab=auditorias` — verificar se a rota `/governanca` existe (rg mostrou que existe). OK.
3. **Botão "Ver todos" do drill `controles`** vai para `/sistemas` em vez de `/controles`.
4. **Estado de erro** mostra apenas "Não foi possível carregar" sem botão "Tentar novamente" — UX ruim quando a query falha.

### O que está OK

- 11 drill keys funcionam: `ativos`, `planos`, `ativos_chaves`, `ativos_licencas`, `auditorias`, `continuidade`, `gap_analysis`, `revisao_acessos`, `privacidade`, `sistemas`, `contas_privilegiadas`.
- Provider global, isolamento por `empresa_id`, identidade visual (StatusBadge, AkurisPulse, EmptyState, ícones proprietários) — todos seguem o padrão Akuris.

---

## Plano de execução

### 1. Corrigir as 8 queries quebradas em `src/components/dashboard/KpiDrillDownDrawer.tsx`
Reescrever os `case` afetados (`riscos`, `riscos_aceite`, `incidentes`, `contratos`, `documentos`, `due_diligence`, `denuncias`, `controles`) usando os nomes de coluna reais do schema. Para `controles`, conectar à tabela `controles_internos` (top 5 por criticidade).

### 2. Ajustar status enum match
- `incidentes`: status `('aberto','em_analise','em_tratamento')`
- `denuncias`: status `('nova','em_investigacao','em_andamento')` (manter ambos por compatibilidade)
- `documentos`: status `('pendente','pendente_aprovacao')`

### 3. Implementar handler `?focus=` nas páginas de listagem
Adicionar nos pages (`Riscos`, `Incidentes`, `Documentos`, `Contratos`, `Ativos`, `Denuncia`, `DueDiligence`, `PlanosAcao`, `AtivosChaves`, `AtivosLicencas`, `Continuidade`, `GapAnalysis`, `RevisaoAcessos`, `Privacidade`, `Sistemas`, `ContasPrivilegiadas`) um efeito que, ao detectar `?focus=ID`:
- Faça scroll até a linha (`document.getElementById(`row-${id}`)`).
- Aplique destaque temporário (ring primary por 2s).
- Onde já existir dialog de detalhe, abra o registro automaticamente.

Para reduzir o escopo nesta primeira leva, implementar apenas nos 6 pages mais usados via dashboard: `Riscos`, `Incidentes`, `Documentos`, `Contratos`, `PlanosAcao`, `DueDiligence`. Os demais ganham handler em iteração futura.

### 4. UX do estado de erro
No `KpiDrillDownDrawer`, adicionar botão "Tentar novamente" no `EmptyState` de erro que chama `refetch()` do react-query.

### 5. Corrigir rota do "Ver todos" de controles
`route: '/sistemas'` → `route: '/controles'`.

### 6. Validação
- Rodar a app e clicar em todos os 19 cards do dashboard, conferindo que cada gaveta carrega sem erro.
- Testar 1 clique em item de cada gaveta corrigida e verificar que o page de destino abre/destaca o registro.

### Arquivos afetados
- `src/components/dashboard/KpiDrillDownDrawer.tsx` (correções de query e UX de erro)
- `src/pages/Riscos.tsx`, `src/pages/Incidentes.tsx`, `src/pages/Documentos.tsx`, `src/pages/Contratos.tsx`, `src/pages/PlanosAcao.tsx`, `src/pages/DueDiligence.tsx` (handler `?focus=`)
- Novo helper opcional: `src/hooks/useFocusRow.ts` (encapsula scroll + ring)

Sem necessidade de migrations — apenas leitura/correção em queries existentes.
