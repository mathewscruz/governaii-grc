

# Plano: Reforma dos Relatórios PDF + Substituição GovernAII → Akuris

## Problemas Identificados

1. **Tipo exibido como string bruta**: No PDF do framework (ExportFrameworkPDF.tsx), linha 124 exibe `frameworkType` sem formatar (ex: `seguranca_informacao`). Mesmo problema nos relatórios de Riscos, Documentos e templates.
2. **"GovernAI" ainda presente** em 29+ arquivos: rodapés de PDFs, edge functions, CSS, logger, integration dispatcher, due diligence dialogs.
3. **PDFs sem logo, sem gráficos, visuais pobres**: O PDF do framework não tem logotipo Akuris, não tem gráficos visuais (apenas tabelas e texto plano), rodapé ainda diz "GovernAI".

---

## Tarefa 1: Criar helper centralizado de formatação para PDFs

**Arquivo**: `src/lib/pdf-utils.ts` (novo)

Centralizar:
- `formatLabel(text: string): string` — reutiliza `STATUS_LABELS` de `text-utils.ts` + fallback capitalize
- `loadAkurisLogo(): Promise<HTMLImageElement | null>` — carrega `/akuris-logo.png` para uso em todos PDFs
- `addAkurisHeader(doc: jsPDF, y: number): number` — header padrão com logo + linha gradiente simulada
- `addAkurisFooter(doc: jsPDF)` — rodapé "Akuris - Plataforma GRC" em todas as páginas
- Cores da marca: primary `#7552ff`, dark `#0a1628`

---

## Tarefa 2: Reformar ExportFrameworkPDF.tsx (relatório principal)

**Arquivo**: `src/components/gap-analysis/ExportFrameworkPDF.tsx`

Mudanças:
- Importar helpers de `pdf-utils.ts`
- **Capa**: Adicionar logo Akuris no topo, fundo dark navy, título centralizado
- **Tipo**: Formatar `frameworkType` com `formatLabel()` (linha 124)
- **Score geral**: Adicionar barra de progresso visual mais elaborada com cores da marca
- **Categorias**: Desenhar mini barras horizontais coloridas ao lado de cada score (simular gráfico de barras)
- **Tabelas**: Usar zebra striping com cores da marca, headers violeta
- **Rodapé**: Trocar "GovernAI - Gestão de Conformidade" por "Akuris - Plataforma GRC" (linha 298)
- **Status**: Já formata bem, manter

---

## Tarefa 3: Reformar generateTemplatePDF.ts (relatórios customizados)

**Arquivo**: `src/components/relatorios/generateTemplatePDF.ts`

Mudanças:
- Capa: usar logo Akuris + cores da marca (substituir fundo navy genérico)
- Seções: usar header violeta (#7552ff) nos títulos
- Tabelas: formatar valores de status/tipo/criticidade com `formatLabel()`
- Rodapé: já diz "Akuris GRC" ✓, manter
- Métricas: adicionar mini barras visuais horizontais ao lado dos valores numéricos

---

## Tarefa 4: Reformar ExportRiscosPDF.tsx

**Arquivo**: `src/components/riscos/ExportRiscosPDF.tsx`

Mudanças:
- Adicionar header com logo Akuris
- Formatar `nivel_risco_inicial`, `nivel_risco_residual`, `status` com `formatLabel()`
- Adicionar rodapé padrão Akuris
- Melhorar visual da tabela com cores da marca

---

## Tarefa 5: Reformar DocumentosRelatorios.tsx

**Arquivo**: `src/components/documentos/DocumentosRelatorios.tsx`

Mudanças:
- Adicionar header com logo no PDF
- Formatar `tipo` e `status` com `formatLabel()` (linhas 106-107)
- Adicionar rodapé padrão
- CSV: também formatar labels no export

---

## Tarefa 6: Substituir TODAS as referências "GovernAII" → "Akuris"

**Arquivos afetados** (25+ arquivos):

### Frontend (comentários/CSS class names — NÃO renomear classes CSS pois quebraria):
- `src/lib/logger.ts` linha 1: comentário → "Akuris"
- `src/App.css` linha 1: comentário → "Akuris"
- `src/index.css` linhas 340, 472, 489: comentários → "Akuris" (classes `governaii-*` mantidas para não quebrar)

### Frontend (texto visível):
- `src/components/due-diligence/AssessmentDialog.tsx` linha 187: `'GovernAI'` → `'Akuris'`
- `src/components/due-diligence/AssessmentsManagerEnhanced.tsx` linhas 67, 415: `'GovernAI'` → `'Akuris'`

### Edge Functions (texto em payloads):
- `integration-webhook-dispatcher/index.ts`: linhas 51, 123, 132, 173, 188 — trocar "GovernAII" por "Akuris"

### Edge Functions (URLs `governaii-grc.lovable.app`):
- Estas URLs hospedam assets reais (logo), então NÃO devem ser alteradas pois o domínio `akuris.com.br` pode não servir esses assets. Manter como estão.

---

## Arquivos afetados (resumo)

1. `src/lib/pdf-utils.ts` — **novo** (helper centralizado)
2. `src/components/gap-analysis/ExportFrameworkPDF.tsx` — reforma visual + formatação
3. `src/components/relatorios/generateTemplatePDF.ts` — reforma visual + formatação
4. `src/components/riscos/ExportRiscosPDF.tsx` — reforma visual + formatação
5. `src/components/documentos/DocumentosRelatorios.tsx` — reforma visual + formatação
6. `src/lib/logger.ts` — comentário
7. `src/App.css` — comentário
8. `src/index.css` — comentários
9. `src/components/due-diligence/AssessmentDialog.tsx` — texto
10. `src/components/due-diligence/AssessmentsManagerEnhanced.tsx` — texto
11. `supabase/functions/integration-webhook-dispatcher/index.ts` — texto nos payloads

