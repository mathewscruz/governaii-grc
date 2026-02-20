

# Avaliacao Completa: Governanca, Contratos e Documentos

---

## Resumo Executivo

Apos analise minuciosa dos tres modulos, identifiquei **problemas criticos**, **melhorias de UX** e **componentes orfaos** (criados mas nunca usados). A prioridade e eliminar funcionalidades "fantasma" que confundem o usuario e alinhar a experiencia visual entre os modulos.

---

## 1. CONTRATOS - Problemas Encontrados

### 1.1 Componentes criados mas NUNCA usados na pagina

Os seguintes componentes existem no codigo mas **nao sao importados nem renderizados** em `Contratos.tsx`:

| Componente | Arquivo | Problema |
|------------|---------|----------|
| `NotificacoesContratos` | `contratos/NotificacoesContratos.tsx` | Popover de notificacoes com sino -- nunca aparece na pagina. Gera notificacoes em memoria (nao persiste), nao integra com o NotificationCenter central do header |
| `IntegracaoModulos` | `contratos/IntegracaoModulos.tsx` | Dialog de integracoes com ativos/riscos/controles/auditorias -- nunca aparece. Busca por texto (ilike) em vez de relacoes reais |
| `BuscaAvancada` | `contratos/BuscaAvancada.tsx` | Componente de busca avancada completo (filtros por data, valor, fornecedor) -- nunca usado. A pagina usa apenas filtros inline simples |

**Acao recomendada:** Integrar `BuscaAvancada` na pagina de Contratos (igual ao padrao de Documentos que ja tem busca avancada funcionando). Remover `NotificacoesContratos` (as notificacoes devem ir para o sino central do header, conforme regra #2 do projeto). Avaliar se `IntegracaoModulos` agrega valor ou se deve ser removido.

### 1.2 Falta exportacao CSV em Contratos

A pagina de Documentos tem botao "Exportar CSV". A pagina de Contratos **nao tem**, apesar de ser uma funcionalidade esperada para gestores. Os relatorios existem (via `RelatoriosContratos`), mas nao ha exportacao rapida da tabela.

**Acao recomendada:** Adicionar botao de exportacao CSV na toolbar de Contratos, seguindo o mesmo padrao do modulo de Documentos.

### 1.3 Inconsistencia visual: botoes de acao na tabela

Na tabela de **Contratos**, cada linha tem 5 botoes de icone visíveis (Documentos, Marcos, Aditivos, Editar, Excluir). Na tabela de **Documentos**, as acoes ficam dentro de um `DropdownMenu` com icone de tres pontos. Na tabela de **Fornecedores**, so tem 2 botoes (Editar, Excluir).

**Acao recomendada:** Padronizar usando `DropdownMenu` (tres pontos) em Contratos tambem, igual a Documentos. Isso melhora a leitura da tabela, especialmente em telas menores.

### 1.4 Stat card "Valor Total" nao filtra por status ativo

O `useContratosStats` soma o valor de TODOS os contratos, mas o card diz "Valor em contratos ativos". Inconsistencia entre dado e label.

**Acao recomendada:** Filtrar o calculo de `valorTotal` para incluir apenas contratos com status "ativo", ou mudar o label.

---

## 2. DOCUMENTOS - Problemas Encontrados

### 2.1 Componentes criados mas NUNCA usados na pagina

| Componente | Arquivo | Problema |
|------------|---------|----------|
| `DocumentosDashboard` | `documentos/DocumentosDashboard.tsx` | Dashboard com graficos por tipo/categoria -- nunca importado em nenhuma pagina |
| `NotificacoesDocumentos` | `documentos/NotificacoesDocumentos.tsx` | Cards de documentos vencendo -- nunca importado em nenhuma pagina. Viola regra #2 (notificacoes devem ir para o sino central) |

**Acao recomendada:** Remover ambos. Os stat cards da pagina principal ja cobrem as mesmas metricas que o `DocumentosDashboard`. As notificacoes devem ir para o centro de notificacoes do header.

### 2.2 Relatorios de Documentos - botoes nao funcionam

O componente `DocumentosRelatorios` mostra 3 cards com botoes "Gerar Relatorio", mas **nenhum botao tem logica implementada**. Clicar nao faz nada. Isso e frustrante para o usuario.

**Acao recomendada:** Implementar a geracao real de PDF/CSV nos relatorios, ou remover o componente ate que esteja funcional (para nao iludir o usuario).

### 2.3 Filtros duplicados na toolbar

A toolbar de Documentos tem dois botoes de filtro: "Filtros" (toggle de filtros inline) e "Busca Avancada" (dialog modal). Ambos usam o mesmo icone `Filter`. Isso confunde o usuario sobre qual usar.

**Acao recomendada:** Unificar em um unico ponto de filtro. Manter apenas "Filtros" com um toggle, e dentro dele adicionar um link "Busca Avancada" para abrir o dialog quando necessario.

### 2.4 Upload Multiplos - simulado, nao real

O `UploadMultiplosDialog` **simula** o upload com `setTimeout` (linhas 42-51). Os arquivos nao sao realmente enviados ao Supabase Storage. O usuario ve "sucesso" mas nada e salvo.

**Acao recomendada:** Implementar upload real iterando sobre os arquivos e criando registros em `documentos` + upload ao Supabase Storage, ou remover a funcionalidade ate implementacao real.

---

## 3. GOVERNANCA - Problemas Encontrados

### 3.1 Modulo bem estruturado, poucos problemas

O modulo de Governanca (Controles + Auditorias) esta mais maduro que os outros dois. Usa `useQuery` do React Query (melhor que `useState` + `useEffect` manual), `DataTable` reutilizavel e padroes consistentes.

### 3.2 Controles usa DataTable, Auditorias usa cards

O sub-modulo de **Controles** usa o componente `DataTable` padronizado. O sub-modulo de **Auditorias** usa `AuditoriaCardAccordion` (cards com accordion). Sao visuais diferentes dentro do mesmo modulo.

**Acao recomendada:** Isso e aceitavel pois auditorias tem estrutura hierarquica (itens dentro da auditoria), o que justifica o formato de card/accordion. Nao requer mudanca.

### 3.3 Falta exportacao CSV em Auditorias

O botao de exportar CSV existe e funciona em Auditorias. OK.

### 3.4 Controles nao tem exportacao CSV

O sub-modulo de Controles **nao tem** botao de exportacao CSV, apesar de ser uma tabela completa com muitos dados.

**Acao recomendada:** Adicionar exportacao CSV nos Controles.

---

## 4. Inconsistencias Tecnicas Transversais

### 4.1 Contratos usa `useState` + `fetchData()` manual; Controles usa `useQuery`

O modulo de Contratos gerencia dados com `useState` + `useEffect` + funcoes `fetchContratos`/`fetchFornecedores` manuais. Isso causa:
- Sem cache automatico
- Sem refetch em foco de janela
- Sem deduplicacao de requests
- Codigo mais complexo de manter

**Acao recomendada:** Migrar Contratos para `useQuery` do React Query (igual Controles/Auditorias). Isso e uma melhoria tecnica importante mas nao urgente.

### 4.2 Paginacao duplicada entre os modulos

Os tres modulos implementam paginacao com o mesmo codigo repetido (~40 linhas identicas). Poderiam usar um hook compartilhado.

**Acao recomendada:** Melhoria futura; nao bloqueia o usuario.

---

## Plano de Implementacao (Priorizado)

### Prioridade ALTA (impacto direto no usuario)

1. **Implementar relatorios reais em DocumentosRelatorios** - Botoes que nao fazem nada sao o pior tipo de bug de UX
2. **Implementar upload multiplos real** - Simulacao engana o usuario
3. **Integrar BuscaAvancada na pagina de Contratos** - Componente pronto, so falta importar e conectar
4. **Adicionar exportacao CSV em Contratos** - Funcionalidade esperada que falta

### Prioridade MEDIA (limpeza e consistencia)

5. **Padronizar acoes de tabela em Contratos** - Trocar 5 botoes inline por DropdownMenu (tres pontos)
6. **Unificar filtros duplicados em Documentos** - Remover redundancia "Filtros" vs "Busca Avancada"
7. **Corrigir stat card "Valor Total"** - Filtrar apenas contratos ativos
8. **Adicionar exportacao CSV em Controles**

### Prioridade BAIXA (limpeza de codigo)

9. **Remover componentes orfaos** - `DocumentosDashboard`, `NotificacoesDocumentos`, `NotificacoesContratos`
10. **Migrar Contratos para React Query** - Melhoria tecnica de manutencao

---

## Secao Tecnica - Arquivos Afetados

| # | Arquivo | Acao | Tipo |
|---|---------|------|------|
| 1 | `documentos/DocumentosRelatorios.tsx` | Implementar geracao real de PDF/CSV | Modificar |
| 2 | `documentos/UploadMultiplosDialog.tsx` | Implementar upload real ao Supabase | Modificar |
| 3 | `pages/Contratos.tsx` | Importar BuscaAvancada + exportar CSV + DropdownMenu acoes | Modificar |
| 4 | `contratos/BuscaAvancada.tsx` | Ja existe, so precisa ser conectado | Sem mudanca |
| 5 | `pages/Documentos.tsx` | Unificar botoes de filtro | Modificar |
| 6 | `hooks/useContratosStats.tsx` | Filtrar valorTotal por status ativo | Modificar |
| 7 | `governanca/ControlesContent.tsx` | Adicionar exportacao CSV | Modificar |
| 8 | `documentos/DocumentosDashboard.tsx` | Remover (orfao) | Deletar |
| 9 | `documentos/NotificacoesDocumentos.tsx` | Remover (orfao) | Deletar |
| 10 | `contratos/NotificacoesContratos.tsx` | Remover (orfao, viola regra #2) | Deletar |

