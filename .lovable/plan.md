
# 1. Aplicar Visual do Menu Lateral na Tela de Login + 2. Validar e Corrigir Modulo de Relatorios

---

## Parte 1 - Tela de Login com Visual do Sidebar

### Problema Atual
A tela de login usa `hsl(216, ...)` como base de cor (azul-marinho generico), enquanto o sidebar e o shell do app usam `hsl(230, ...)` (navy com tom levemente roxo) com o efeito de `sidebar-gradient` (radial-gradient com brilho neon na parte inferior). Isso cria uma desconexao visual entre login e o app.

### Mudancas em `src/pages/Auth.tsx`

1. **Brand Panel (desktop)** - Trocar o background de `from-[hsl(216,60%,8%)] via-[hsl(216,45%,10%)] to-[hsl(216,60%,8%)]` para usar a mesma classe `sidebar-gradient` ou replicar as cores `hsl(230, 25%, 7%)` / `hsl(228, 20%, 9%)` com o radial-gradient neon
2. **Login Panel (direita)** - Trocar `from-[hsl(216,50%,10%)] to-[hsl(216,45%,12%)]` para `from-[hsl(230,25%,7%)] to-[hsl(228,20%,9%)]`
3. **Loading state** - Trocar background para `hsl(230, 25%, 7%)`
4. **Glow orbs** - Atualizar para usar `hsl(252, ...)` (primary do sistema) ao inves de `primary/10` generico, alinhando com o `--shadow-glow` do design system
5. **Form card** - Manter o estilo glassmorphism mas com as bordas `white/[0.08]` ja existentes (ja consistente)

### Arquivos modificados:
- `src/pages/Auth.tsx` - ~8 linhas de troca de cores nos backgrounds

---

## Parte 2 - Validacao e Correcao do Modulo de Relatorios

### Problemas Identificados

1. **PDF Export e superficial** - O `handleExportPDF` gera um PDF com apenas titulo, descricao, data e status. Nao puxa NENHUM dado real do banco. Independente do template escolhido (LGPD, ISO 27001, Riscos, etc.), o PDF sai identico e vazio.

2. **Templates nao puxam dados** - Quando o usuario cria um relatorio a partir de um template (ex: "Panorama de Riscos"), o sistema apenas salva o nome e descricao do template na tabela `relatorios_customizados`. Nao existe logica para buscar dados dos modulos correspondentes (riscos, incidentes, controles, etc.).

3. **Falta botao de "Visualizar"** - O card do relatorio tem apenas "Exportar PDF" e "Excluir". Nao tem como visualizar o conteudo antes de exportar.

4. **Nao ha botao de editar** - O icone `Pencil` e importado mas nao e usado em nenhum lugar.

### Solucao

#### A. Criar funcao `generateTemplatePDF` robusta que busca dados reais por template

Para cada `template_base`, buscar os dados corretos do Supabase:

| Template | Dados buscados |
|----------|---------------|
| `lgpd_anpd` | Tabela `dados_pessoais_mapeamento`, `solicitacoes_titulares`, `incidentes` (filtro LGPD), `politicas` |
| `iso27001_auditoria` | `gap_analysis_frameworks` (filtro ISO 27001), `gap_analysis_requirements` + `evaluations`, `controles` |
| `executivo_trimestral` | `riscos` (resumo), `incidentes` (ultimos 90 dias), `controles` (status), `gap_analysis_frameworks` (scores) |
| `riscos_geral` | `riscos` completo com `tratamentos_riscos`, contagens por nivel, matriz de calor |
| `incidentes_periodo` | `incidentes` com timeline, contagens por criticidade/status |
| `compliance_geral` | `gap_analysis_frameworks` (todos), `controles`, `politicas`, `auditorias` |

#### B. Implementar `handleExportPDF` por template com secoes estruturadas

Cada PDF tera:
- Capa com logo da empresa, nome do relatorio, data de geracao
- Sumario executivo com metricas-chave
- Secoes especificas do template com tabelas e dados reais
- Rodape com numero de pagina

#### C. Adicionar botao "Visualizar" que abre um dialog/drawer com preview dos dados

Antes de exportar, o usuario pode ver um preview dos dados que serao incluidos no PDF.

### Arquivos modificados:
- `src/pages/Relatorios.tsx` - Refatorar `handleExportPDF` com logica por template, adicionar botao Visualizar, adicionar botao Editar
- Criar `src/components/relatorios/RelatorioPreviewDialog.tsx` - Dialog de preview com dados reais organizados por secao
- Criar `src/components/relatorios/generateTemplatePDF.ts` - Funcao utilitaria que gera PDF com dados do Supabase por template

### Secao Tecnica

#### Estrutura do PDF por template (exemplo `riscos_geral`):

```text
Pagina 1: Capa
  - Logo empresa
  - "Panorama de Riscos"
  - Data: 20/02/2026

Pagina 2: Resumo Executivo
  - Total de riscos: X
  - Criticos: X | Altos: X | Medios: X | Baixos: X
  - Tratamentos concluidos: X%

Pagina 3+: Detalhamento
  - Lista de riscos criticos/altos com nome, descricao, nivel
  - Status dos tratamentos
```

#### Dados necessarios por template:

1. **lgpd_anpd**: `dados_pessoais_mapeamento`, `solicitacoes_titulares`, `incidentes`, `politicas` - filtrando por `empresa_id`
2. **iso27001_auditoria**: `gap_analysis_frameworks` (nome LIKE '%ISO 27001%'), `gap_analysis_requirements` + `gap_analysis_evaluations`, `controles`
3. **executivo_trimestral**: `riscos`, `incidentes` (90 dias), `controles`, `gap_analysis_frameworks`
4. **riscos_geral**: `riscos` com `tratamentos_riscos`
5. **incidentes_periodo**: `incidentes` com filtro de datas
6. **compliance_geral**: `gap_analysis_frameworks`, `controles`, `politicas`, `auditorias`

#### Ordem de implementacao:
1. Atualizar cores da tela de login (rapido, ~5 min)
2. Criar `generateTemplatePDF.ts` com funcoes de busca por template
3. Criar `RelatorioPreviewDialog.tsx` para preview dos dados
4. Refatorar `Relatorios.tsx` para usar as novas funcoes e adicionar botoes Visualizar/Editar
