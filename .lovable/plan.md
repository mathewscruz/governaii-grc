## Objetivo

Concluir a padronização visual dos status — eliminar todos os badges renderizados via `bg-{red|blue|green|...}-100` (helpers legacy `getItemStatusColor`, `getCriticidadeColor`, `getContratoStatusColor`, `getControleTipoColor`, `getClassificacaoColor`, `getDenunciaStatusColor`, `getSensibilidadeColor*`, `getWorkflowStatusColor`, `getAuditoria*Color`, `getTipoColor`) e fazer todos os módulos usarem `<StatusBadge>` com resolvers semânticos de `src/lib/status-tone.tsx`.

## Diagnóstico

O módulo de Ativos está com o visual antigo porque consome diretamente `getCriticidadeColor` e `getItemStatusColor` (cores Tailwind cruas de `text-utils.ts`). A mesma situação ocorre em mais 12 telas/componentes — todas mapeadas abaixo.

## Etapa 1 — Ampliar `src/lib/status-tone.tsx` com resolvers faltantes

Adicionar resolvers semânticos novos (todos seguem o padrão atual: dot HSL, `intensity: 'high'` em níveis críticos, ícones com `strokeWidth: 1.5`):

- `resolveItemStatusTone` — ativo/inativo/vencido/expirado/a_vencer/em_renovacao/em_rotacao/arquivado/descontinuado/revogado.
- `resolveContratoStatusTone` — ativo/negociacao/aprovacao/suspenso/encerrado/cancelado/rascunho/inativo.
- `resolveControleTipoTone` — preventivo/detectivo/corretivo (categoria, sem alarme).
- `resolveClassificacaoTone` — confidencial/restrita/interna/publica.
- `resolveDenunciaStatusTone` — nova/em_analise/em_investigacao/resolvida/arquivada.
- `resolveSensibilidadeTone` — sensivel|muito_sensivel/moderado|medio/comum|baixo (reaproveita escala de criticidade).
- `resolveWorkflowStatusTone` — aberto/em_andamento/concluido/cancelado/aguardando_aprovacao.
- `resolveTipoDocumentoTone` — documento/politica/procedimento/instrucao/formulario/certificado/contrato/relatorio (categoria neutra com tons rotativos).
- `resolveAuditoriaStatusTone`, `resolveAuditoriaTipoTone`, `resolveAuditoriaPrioridadeTone` — alias para os já existentes (`resolveItemAuditoriaStatusTone`, novo categoria, `resolvePrioridadeTone`).

## Etapa 2 — Migrar telas para `<StatusBadge>`

Substituir `<Badge className={getXxxColor(...)}>{label}</Badge>` por `<StatusBadge size="sm" {...resolveXxxTone(value)}>{formatStatus(value)}</StatusBadge>`. Tamanho `sm` em tabelas, `md` em headers/dialogs.

Arquivos:

```text
src/pages/Ativos.tsx                                — criticidade + status item
src/pages/AtivosChaves.tsx                          — criticidade + status item
src/pages/AtivosLicencas.tsx                        — criticidade + status item
src/pages/Documentos.tsx                            — status + tipo + classificação
src/pages/Incidentes.tsx                            — criticidade + workflow status
src/pages/ContasPrivilegiadas.tsx                   — status item
src/pages/Privacidade.tsx                           — workflow + status item
src/pages/Contratos.tsx                             — criticidade (status já migrado)
src/components/ativos/ImportacaoAtivos.tsx          — criticidade
src/components/governanca/SistemasContent.tsx       — criticidade
src/components/governanca/ControlesContent.tsx      — status + criticidade + tipo controle
src/components/auditorias/ItensAuditoriaDialog.tsx  — prioridade
src/components/auditorias/ImportarControlesDialog.tsx — criticidade + status item
src/components/denuncia/DenunciasDashboard.tsx      — criticidade (gravidade)
src/components/dados/RopaWizard.tsx                 — criticidade
```

## Etapa 3 — Marcar helpers legacy como `@deprecated`

Em `src/lib/text-utils.ts`, anotar como `@deprecated` (não remover, para evitar quebras em terceiros): `getItemStatusColor`, `getCriticidadeColor`, `getContratoStatusColor`, `getControleTipoColor`, `getTipoColor`, `getClassificacaoColor`, `getDenunciaStatusColor`, `getSensibilidadeColor`, `getSensibilidadeColorSimple`, `getWorkflowStatusColor`, `getAuditoriaStatusColor`, `getAuditoriaTipoColor`, `getAuditoriaPrioridadeColor` — apontando para o resolver equivalente.

## Validação

- `rg "getItemStatusColor|getCriticidadeColor|getContratoStatusColor|getControleTipoColor|getClassificacaoColor|getDenunciaStatusColor|getSensibilidadeColor|getWorkflowStatusColor|getAuditoria(Status|Tipo|Prioridade)Color" src --glob '!src/lib/text-utils.ts'` deve retornar vazio.
- Conferir visualmente: badges nas tabelas de Ativos, Licenças, Chaves, Documentos, Incidentes, Contas Privilegiadas, Contratos, Auditorias, Controles, Denúncias e Privacidade exibindo dot semântico + texto na fonte DM Sans, sem fundos `bg-*-100`.
- Sem novas cores Tailwind cruas introduzidas. Tema dark continua coerente.

## Observações

- Categorias informativas (tipo de documento, tipo de controle) usam tons sóbrios (`info`/`primary`/`neutral`) sem `intensity: 'high'`, preservando hierarquia visual sem alarme cromático.
- Telas públicas (Denúncia anônima, Registro, Assessment público) e dialogs informativos coloridos tipo Alert ficam fora do escopo — não são badges de status.
