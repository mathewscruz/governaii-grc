## Objetivo

Garantir que (1) **todo status, tipo, criticidade, prioridade e classificação exibidos** em telas, badges, popups e relatórios comecem com letra maiúscula e usem rótulos completos do dicionário (`STATUS_LABELS`), e (2) eliminar/corrigir abreviações em textos visíveis ao usuário.

## Diagnóstico

A varredura revelou dois padrões problemáticos:

### A) Status renderizados sem helper (ficam minúsculos / com underscore)

Locais que imprimem `{x.status}`, `{x.tipo}`, `{x.criticidade}` etc. diretamente — só `className="capitalize"` ou nada — ignorando o dicionário oficial `STATUS_LABELS`:

```text
src/components/ativos/AtivoDialog.tsx               (linhas 347, 351)
src/components/auditorias/AreaSistemaSelect.tsx     (117)
src/components/contratos/ContratoDialog.tsx         (340)
src/components/contratos/ContratoDialogWizard.tsx   (612, 616)
src/components/contratos/FornecedorDialog.tsx       (Select label)
src/components/controles/ControleDialog.tsx         (360, 363, 365)
src/components/controles/RelatoriosDialog.tsx       (320, 326)
src/components/controles/RiscoSelect.tsx            (137)
src/components/controles/ControlesVinculacaoDialog  (385)
src/components/dashboard/KpiDrillDownDrawer.tsx     (676)
src/components/documentos/DocumentoDialog.tsx       (375, 378)
src/components/documentos/DocumentoPreview.tsx      (127, 129)
src/components/due-diligence/AssessmentResponsesViewer.tsx       (215)
src/components/due-diligence/AssessmentsManagerEnhanced.tsx      (139)
src/components/due-diligence/ReportsView.tsx        (278)
src/components/incidentes/IncidenteDialog.tsx       (534)
src/components/riscos/AprovacaoRiscoDialog.tsx      (339)
src/components/contratos/RelatoriosContratos.tsx    (523)
src/pages/Relatorios.tsx                            (128 — PDF)
src/components/NotificationCenter.tsx               (206 — interpola status raw na mensagem)
```

### B) Abreviações em mensagem do NotificationCenter

`NotificationCenter.tsx` linha 206 monta a mensagem com `${incidente.status}` cru, gerando textos como `"... está em_andamento e requer atenção..."`.

A varredura ampla por abreviações típicas (`Qtd`, `Desc.`, `Obs.`, `Resp.`, `Dept.`, `Adm.`, `Cfg`, `Pub.`, `Priv.`, `Nº`, `Min.`, `Máx.`) não retornou ocorrências em strings visíveis — o sistema já está bastante limpo neste ponto. Caso o usuário tenha avistado alguma abreviação específica, ela cairá nos casos do grupo A (status formatados como `em_andamento`, `nao_aplicavel` etc.) ou em strings i18n; faremos uma segunda passada nos arquivos `src/i18n/pt.ts` e `en.ts` em busca de chaves abreviadas.

## Plano de execução

### 1. Reforçar o helper único

Em `src/lib/text-utils.ts`:
- Criar atalho `formatStatusLabel(value)` que: trata `null/undefined`, normaliza acentos, troca `_`/`-` por espaço, consulta `STATUS_LABELS` e cai em `formatStatus` (já capitaliza palavra a palavra e respeita `UPPERCASE_WORDS`).
- Garantir cobertura no dicionário para termos hoje exibidos cru: `em_homologacao`, `em_producao`, `descontinuado`, `manutencao`, `suspenso`, `vigente`, `vencido`, `em_renovacao`, `previsto`, `realizado`, `atrasado`, `nao_iniciado`, `em_execucao`, `bloqueado`, `aguardando`, `enviado`, `recebido`, `validado`, `invalidado` (adicionar somente os que faltarem).

### 2. Substituir renderizações cruas

Em cada um dos arquivos do grupo A acima, trocar:

```tsx
{formData.status}                               →  {formatStatus(formData.status)}
{formData.status.replace('_', ' ')}             →  {formatStatus(formData.status)}
{formData.tipo}                                 →  {formatStatus(formData.tipo)}
{formData.criticidade}                          →  {formatStatus(formData.criticidade)}
{item.acao}                                     →  {formatStatus(item.acao)}
{controle.criticidade}                          →  {formatStatus(controle.criticidade)}
{documento.tipo} / {documento.status}           →  {formatStatus(...)}
{assessment.status} / {fornecedor.status}       →  {formatStatus(...)}
{watched.criticidade}                           →  {formatStatus(...)}
({area.tipo})                                   →  ({formatStatus(area.tipo)})
```

E remover `className="capitalize"` quando o helper já entrega rótulo correto (evita capitalizar siglas como `TI`, `ERP`, `LGPD`).

Onde já existe `STATUS_LABELS_*` local (ex.: `pages/PlanosAcao.tsx`), manter o map local mas garantir o fallback `formatStatus(item.prioridade)` no `||`.

### 3. Corrigir mensagem do NotificationCenter

`src/components/NotificationCenter.tsx` linha 206:

```tsx
// antes
message: `O incidente "${incidente.titulo}" está ${incidente.status} ...`
// depois
message: `O incidente "${incidente.titulo}" está com status ${formatStatus(incidente.status)} ...`
```

### 4. Relatórios PDF

`src/pages/Relatorios.tsx` linha 128: `Status: ${formatStatus(relatorio.status)}`.
Verificar `src/lib/pdf-utils.ts` e `csv-utils.ts` por outros usos crus e padronizar.

### 5. Varredura final de abreviações

Após as substituições, rodar `rg` por:
- `\.(status|tipo|criticidade|prioridade|classificacao|nivel|severity)\}` — não devem sobrar ocorrências fora de helpers/forms.
- `Qtd|Qtde|Desc\.|Obs\.|Resp\.|Dept|Cfg|Adm\.|Pub\.|Priv\.|Nº|N°|Mín|Máx|Min\.|Max\.` em `src/**/*.tsx` e `src/i18n/**`. Corrigir caso a caso (ex.: `Qtd` → `Quantidade`, `Desc.` → `Descrição`, `Resp.` → `Responsável`, `Dept.` → `Departamento`, `Nº` → `Número`).

### 6. Anti-regressão (memória)

Atualizar `mem://logic/dicionario-status-labels-v2`:
- Regra explícita: **proibido renderizar `.status`, `.tipo`, `.criticidade`, `.prioridade`, `.classificacao` direto em JSX**. Usar sempre `formatStatus()` ou `getStatusLabel()`.
- Proibir `className="capitalize"` em valores que vêm do banco (não respeita siglas e mantém underscores).
- Proibir abreviações em rótulos visíveis ao usuário (lista de termos vetados).

## Detalhes técnicos

- `formatStatus` já existe e cobre o caso (consulta `STATUS_LABELS`, normaliza, capitaliza, respeita `UPPERCASE_WORDS`).
- Sem mudança de schema; só camada de apresentação.
- Nenhum impacto em filtros/Selects (esses usam `value` cru — apenas o `label` exibido muda).
- Sem novos componentes; reuso de `StatusBadge` onde já presente.

## Entregáveis

- ~20 arquivos editados (lista no grupo A).
- Dicionário `STATUS_LABELS` complementado.
- Mensagens de notificação automáticas legíveis.
- Memória atualizada com regra anti-regressão.
