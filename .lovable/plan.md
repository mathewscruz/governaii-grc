

# Auditoria Completa de Relatórios do Sistema

## Inventário Atual — O que existe

| Módulo | Relatório | Formato | Status | Problema |
|---|---|---|---|---|
| **Riscos** | Listagem + KPIs | PDF + CSV | Funcional | Bom, completo |
| **Documentos** | Geral, Vencidos, Categoria | PDF + CSV | Funcional | PDF limita 50 docs; CSV "por categoria" não agrupa |
| **Gap Analysis (Framework)** | Técnico completo | PDF | Funcional | Bom, completo |
| **Gap Analysis (Board)** | Executivo 5 páginas | PDF | Funcional | Bom, completo |
| **Gap Analysis (SoA)** | Declaração Aplicabilidade | PDF | Funcional | Bom, completo |
| **Gap Analysis (Aderência)** | Avaliação documento | PDF | Funcional | Visual diferente (cinza), não usa `pdf-utils` |
| **Denúncias** | Analytics + filtros | CSV | Parcial | Só exporta CSV; sem PDF |
| **Contratos** | Dashboard + gráficos | Tela apenas | **Quebrado** | `exportarRelatorio` é placeholder (`console.log`) |
| **Controles** | Dialog com tabs | Tela apenas | **Quebrado** | `exportarRelatorio` é placeholder (`console.log`) |
| **Due Diligence** | ReportsView + Sidebar | Tela + JSON | Parcial | Botões PDF/Excel/CSV são placeholder; sidebar exporta JSON bruto |
| **Templates (Relatórios)** | 6 templates pré-definidos | PDF | Funcional | ISO 27001 query com `.eq('empresa_id')` em frameworks globais (retorna 0); Executivo idem |
| **Incidentes** | — | — | **Inexistente** | Zero export |
| **Planos de Ação** | — | — | **Inexistente** | Zero export |
| **Políticas** | — | — | **Inexistente** | Zero export |
| **Ativos** | CSV básico | CSV | Mínimo | Sem BOM UTF-8, sem PDF |
| **Continuidade** | — | — | **Inexistente** | Zero export |
| **Contas Privilegiadas** | — | — | **Inexistente** | Zero export |

## Problemas Identificados

### 1. CRÍTICO: Templates ISO 27001 e Executivo retornam dados vazios
`fetchISO27001Data` e `fetchExecutivoData` fazem `.eq('empresa_id', empresaId)` na tabela `gap_analysis_frameworks`, mas frameworks são globais (`empresa_id = NULL`). Resultado: sempre 0 frameworks.

### 2. CRÍTICO: Controles — export é `console.log`
`RelatoriosDialog.tsx` linha 63-66: `exportarRelatorio` faz apenas `console.log`. Os botões "Exportar" enganam o usuário.

### 3. CRÍTICO: Contratos — export é placeholder
`RelatoriosContratos.tsx`: `exportarRelatorio` mostra toast de sucesso mas não gera arquivo real.

### 4. CRÍTICO: Due Diligence — 4 botões de export são placeholder
`ReportsView.tsx` linhas 228-244: botões PDF/Excel/CSV não têm `onClick` handler.

### 5. MÉDIO: Aderência PDF não segue o padrão visual Akuris
`ExportPDF.tsx` usa esquema de cores cinza próprio e logo loader diferente, enquanto todos os outros PDFs usam `pdf-utils.ts` com cores Akuris roxas.

### 6. MÉDIO: Documentos PDF limita a 50 registros
`DocumentosRelatorios.tsx` linha 111: `.slice(0, 50)` trunca sem aviso.

### 7. MÉDIO: 6 módulos sem nenhum export
Incidentes, Planos de Ação, Políticas, Continuidade, Contas Privilegiadas não possuem nenhuma capacidade de exportação.

### 8. BAIXO: Ativos CSV não inclui BOM UTF-8
Acentos podem quebrar ao abrir no Excel.

### 9. BAIXO: Denúncias só exporta CSV
Módulo com dashboard visual rico, mas sem PDF executivo.

## Plano de Correção

### Fase 1: Corrigir o que está quebrado (prioridade alta)

**A. Corrigir queries dos templates ISO/Executivo/Compliance**
- `generateTemplatePDF.ts`: Trocar `.eq('empresa_id', empresaId)` por query sem filtro de empresa em `gap_analysis_frameworks` (são globais). Buscar evaluations filtradas por `empresa_id`.
- Arquivos: `src/components/relatorios/generateTemplatePDF.ts`

**B. Implementar export real em Controles**
- Substituir `console.log` por geração real de PDF usando `pdf-utils` com KPIs + tabela de controles.
- Arquivo: `src/components/controles/RelatoriosDialog.tsx`

**C. Implementar export real em Contratos**
- Substituir placeholder por PDF com KPIs (total, valor, vencidos) + tabela.
- Arquivo: `src/components/contratos/RelatoriosContratos.tsx`

**D. Implementar export real em Due Diligence**
- Adicionar `onClick` handlers nos 4 botões com geração de PDF/CSV real.
- Arquivo: `src/components/due-diligence/ReportsView.tsx`

### Fase 2: Adicionar exports nos módulos que não têm (prioridade média)

**E. Incidentes — PDF + CSV**
- Criar `ExportIncidentesPDF.tsx` com KPIs (total, criticidade, MTTR) + tabela.

**F. Planos de Ação — CSV**
- Adicionar botão export na página com dados filtrados.

**G. Políticas — CSV**
- Adicionar botão export na página.

**H. Continuidade — CSV**
- Adicionar botão export na página.

**I. Contas Privilegiadas — CSV**
- Adicionar botão export com dados das contas.

### Fase 3: Melhorias de qualidade (prioridade baixa)

**J. Documentos — remover limite de 50**
- Paginar corretamente no PDF em vez de truncar.

**K. Ativos — adicionar BOM UTF-8 e PDF**
- Adicionar `\ufeff` no CSV e criar export PDF.

**L. Denúncias — adicionar PDF executivo**
- Gerar PDF com gráficos e KPIs.

### Arquivos a criar/modificar

| Arquivo | Ação |
|---|---|
| `src/components/relatorios/generateTemplatePDF.ts` | Corrigir queries ISO/Executivo/Compliance |
| `src/components/controles/RelatoriosDialog.tsx` | Implementar export PDF/CSV real |
| `src/components/contratos/RelatoriosContratos.tsx` | Implementar export PDF/CSV real |
| `src/components/due-diligence/ReportsView.tsx` | Implementar onClick nos botões de export |
| `src/pages/Incidentes.tsx` | Adicionar botão export + lógica PDF/CSV |
| `src/pages/PlanosAcao.tsx` | Adicionar botão export CSV |
| `src/pages/Politicas.tsx` | Adicionar botão export CSV |
| `src/pages/Continuidade.tsx` | Adicionar botão export CSV |
| `src/pages/ContasPrivilegiadas.tsx` | Adicionar botão export CSV |
| `src/components/documentos/DocumentosRelatorios.tsx` | Remover limite 50 docs |
| `src/pages/Ativos.tsx` | Adicionar BOM UTF-8 no CSV |

