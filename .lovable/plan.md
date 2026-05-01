## Substituir colunas "Prioridade" e "Área" na tabela de requisitos

Na `GenericRequirementsTable` (lista de requisitos do gap analysis dentro de cada framework), as colunas atuais não agregam valor:
- **Prioridade**: quase todos os itens vêm do framework como "Obrigatório" → coluna virtualmente uniforme.
- **Área**: campo `area_responsavel` raramente é preenchido → coluna mostra "—" em todas as linhas.

Substituição aprovada: **Prazo** + **Responsável**.

---

### 1. Origem dos dados

Os campos vêm de `gap_analysis_evaluations` (avaliação por empresa), não dos requisitos globais:

- `prazo_implementacao` (date)
- `responsavel_avaliacao` (uuid → `profiles.user_id`)

O `select` atual de evaluations será estendido para incluir esses dois campos, mantendo o filtro `.eq('empresa_id', empresaId)` (multi-tenant).

Para resolver UUID → nome, será disparada uma query única paralela em `profiles` (`user_id, nome, email` filtrado por `empresa_id`), montando um `Map<string, UserLite>` para lookup O(1) durante o render.

---

### 2. Renderização — Coluna "Prazo"

Cabeçalho com ícone `CalendarClock`. Largura `w-32`. Lógica de cor semântica:

```text
sem prazo            → "—" cinza claro (text-muted-foreground/40)
hoje ou no passado   → vermelho (text-destructive) + ícone de alerta
até 7 dias           → âmbar (text-warning)
> 7 dias             → texto neutro (text-foreground)
```

Formato `dd/MM/yyyy` (`date-fns` já presente). Tooltip mostra "Em X dias" ou "Atrasado há X dias".

### 3. Renderização — Coluna "Responsável"

Cabeçalho com ícone `UserRound`. Largura `w-44`. Renderização compacta:

```text
sem responsável  → "—" cinza claro
com responsável  → <Avatar 24px com iniciais>  Nome (truncado em 1 linha)
```

Iniciais geradas das duas primeiras palavras do `nome`. Tooltip mostra nome completo + email. Quando o lookup ainda não terminou, mostra placeholder `••• ` para evitar flicker.

---

### 4. Ajustes secundários

- **Tipos**: estender `Requirement` com `prazo_implementacao?: string | null` e `responsavel_avaliacao?: string | null` (já existem como opcionais na interface — apenas garantir que vêm preenchidos).
- **`evalMap`**: adicionar os dois campos ao mapeamento.
- **`merged`**: passar os campos para cada requisito.
- **`colSpan` do estado vazio**: continua 8 (mesma quantidade de colunas).
- **Filtros**: o switch "Somente prioritários" continua válido (filtra por `obrigatorio` ou `peso ≥ 3`) — não removemos a noção de prioridade do filtro, só a coluna visual redundante.
- **Legenda do popover "?"**: remover o item "Obrigatório · Marcado pelo framework" (informação migra para o filtro) e adicionar dois itens novos:
  - `CalendarClock` vermelho → "Prazo vencido"
  - `CalendarClock` âmbar → "Prazo nos próximos 7 dias"

---

### 5. Estratégia de execução

1. Adicionar imports (`CalendarClock`, `UserRound`, `Avatar`, `Tooltip`, `date-fns`).
2. Adicionar estado `usersById: Map<string, UserLite>` carregado uma vez via `useEffect` baseado em `empresaId`.
3. Estender select de evaluations e propagar campos no merge.
4. Trocar `<TableHead>` "Prioridade" / "Área" por "Prazo" / "Responsável".
5. Trocar as duas `<TableCell>` correspondentes pelos novos componentes inline (`DueDateCell`, `OwnerCell`) definidos no próprio arquivo.
6. Atualizar a legenda do popover.
7. Validar TypeScript.

---

### 6. Considerações

- **Multi-tenant**: a query de `profiles` recebe `.eq('empresa_id', empresaId)` — sem vazamento entre empresas.
- **Performance**: 1 query extra por carregamento da página de framework (cache local em estado). Negligível.
- **Sem novos componentes globais**: `DueDateCell` e `OwnerCell` ficam locais ao arquivo para não inflar a UI library.
- **Compatibilidade**: nenhuma quebra para quem ainda não preencheu prazo/responsável — células mostram "—" gracioso, mantendo a tabela limpa (resolve a sensação de "tudo igual" da imagem enviada).

---

### Arquivos editados
- `src/components/gap-analysis/GenericRequirementsTable.tsx` (único arquivo)
