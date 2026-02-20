
# Melhorias Visuais e Funcionais do Gap Analysis - Inspiradas na Referencia

## Analise das Imagens de Referencia

Identifiquei 5 melhorias que se encaixam no nosso cenario, e 2 itens que nao se aplicam.

### O que vale adotar

1. **Separacao "Frameworks Ativos" vs "Disponiveis"** (imagem 101) - A referencia separa frameworks com avaliacao iniciada (mostrando blocos coloridos de status e % de conclusao) dos nao iniciados (mostrando descricao completa e estimativa de esforco). Atualmente nossos cards misturam todos juntos.

2. **Blocos coloridos de status por categoria** (imagens 100, 101, 102) - Ao inves de apenas barras de progresso, a referencia usa pequenos quadrados coloridos onde cada quadrado = 1 requisito e a cor = status (verde=conforme, vermelho=nao conforme, amarelo=parcial, cinza=pendente). Isso da uma visao muito mais rica do que uma barra de progresso. Podemos adotar isso tanto nos FrameworkCards ativos quanto na pagina de detalhe do framework como cards de categoria.

3. **Cards de categorias com blocos de status na pagina de detalhe** (imagens 100, 102) - A referencia mostra um grid de cards por categoria, cada um com blocos coloridos, contagem de conformidade e % atribuido. Ao clicar num card, abre popover com breakdown (Conforme, Parcial, Nao Conforme, Pendente). Podemos adicionar isso acima da tabela de requisitos.

4. **Evidencias com drag & drop e "Adicionar link"** (imagem 103) - A referencia mostra uma zona de drag & drop estilizada e botoes "Add link" e "Link existing evidence". Nosso upload atual e apenas um botao "Anexar Arquivo". Melhorar para incluir drag & drop visual e opcao de adicionar URL como evidencia.

5. **Tabela de requisitos agrupados por status** (imagem 99) - A referencia agrupa requisitos como "Unmet 4" e "Met 16" com contagem, e ao lado de cada requisito mostra as evidencias vinculadas com icone de status. Podemos adicionar a contagem de evidencias por requisito na tabela.

### O que NAO vale adotar

- **Fluxo de aprovacao/review com timeline** (imagem 104) - Adiciona complexidade significativa sem beneficio direto para o cenario de auto-avaliacao que e nosso foco. O usuario quer se auto-avaliar, nao precisa de aprovacao de um terceiro.
- **Secao "Checks & Controls" e "Supported integrations"** (imagem 105) - Especifico de ferramentas com integracao automatica a infraestrutura (AWS, GCP). Nao se aplica ao nosso produto que e focado em avaliacao manual.

---

## Plano de Implementacao

### 1. Separar Frameworks Ativos vs Disponiveis na pagina principal

**Arquivo:** `src/pages/GapAnalysisFrameworks.tsx`

Dividir a lista de frameworks em duas secoes:
- **"Frameworks Ativos"** - Frameworks que a empresa ja tem avaliacoes iniciadas. Cards maiores (2 colunas) com blocos coloridos de status, % de conclusao, e contagem de conformidade
- **"Frameworks Disponiveis"** - Frameworks sem avaliacoes. Cards com descricao completa e botao "Iniciar Avaliacao"

### 2. Componente de blocos coloridos de status (StatusBlocks)

**Novo arquivo:** `src/components/gap-analysis/StatusBlocks.tsx`

Componente reutilizavel que renderiza uma grade de quadradinhos coloridos:
- Verde = Conforme
- Vermelho = Nao Conforme
- Amarelo = Parcial
- Azul = N/A
- Cinza claro = Nao Avaliado

Cada bloco representa 1 requisito. Usado nos FrameworkCards ativos e nos CategoryCards.

### 3. Cards de categorias com blocos na pagina de detalhe do framework

**Novo arquivo:** `src/components/gap-analysis/CategoryStatusCards.tsx`

Grid de cards por categoria com:
- Nome da categoria
- Blocos coloridos de status
- Contagem "X/Y conformes"
- Ao clicar, mostra popover com breakdown detalhado (quantos Conforme, Parcial, Nao Conforme, Pendente)
- Funciona como atalho para filtrar a tabela abaixo

**Arquivo:** `src/pages/GapAnalysisFrameworkDetail.tsx`
- Inserir CategoryStatusCards entre o dashboard de score e a tabela de requisitos

### 4. Melhorar evidencias com drag & drop e link URL

**Arquivo:** `src/components/gap-analysis/nist/NISTRequirementDetailDialog.tsx`

Substituir o botao simples de upload por:
- Zona de drag & drop com borda tracejada e texto "Arraste e solte, ou Buscar arquivos..." (como na referencia)
- Botao "Adicionar Link" para inserir URL de evidencia (Notion, SharePoint, Google Drive etc.)
- Lista de evidencias com icone por tipo de arquivo (PDF, imagem, link, documento)
- Limite de 20MB visivel

### 5. Contagem de evidencias na tabela de requisitos

**Arquivo:** `src/components/gap-analysis/GenericRequirementsTable.tsx`

Adicionar coluna "Evidencias" na tabela mostrando contagem de evidencias vinculadas a cada requisito (ex: icone de clip + "3 arquivos"). Carrega count a partir dos evidence_files da avaliacao.

---

## Secao Tecnica

### Novos arquivos:
- `src/components/gap-analysis/StatusBlocks.tsx` - Componente de blocos coloridos
- `src/components/gap-analysis/CategoryStatusCards.tsx` - Grid de cards de categorias

### Arquivos modificados:
- `src/pages/GapAnalysisFrameworks.tsx` - Separacao Ativos/Disponiveis, uso de StatusBlocks nos cards ativos
- `src/components/gap-analysis/FrameworkCard.tsx` - Variante "ativa" com StatusBlocks
- `src/pages/GapAnalysisFrameworkDetail.tsx` - Adicionar CategoryStatusCards
- `src/components/gap-analysis/nist/NISTRequirementDetailDialog.tsx` - Drag & drop + add link para evidencias
- `src/components/gap-analysis/GenericRequirementsTable.tsx` - Coluna de contagem de evidencias

### Dados necessarios:
- Para os StatusBlocks nos FrameworkCards, precisamos buscar contagem por status para cada framework (ja temos os dados de evaluations, apenas precisamos granularidade por status)
- Para evidencias por link, armazenar no campo `evidence_files` existente com tipo `{ type: 'file' | 'link', name, url, size? }`

### Ordem de implementacao:
1. StatusBlocks (componente base)
2. Separacao Ativos/Disponiveis + FrameworkCard ativo com blocos
3. CategoryStatusCards na pagina de detalhe
4. Drag & drop + link URL nas evidencias
5. Coluna de evidencias na tabela de requisitos
