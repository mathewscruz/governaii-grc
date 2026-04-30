## Problema

Em telas com largura reduzida (notebooks 13", janelas divididas, tablets), as abas (`TabsList`) extrapolam a área visível e ficam cortadas, sem indicação de que há mais conteúdo à direita. O exemplo do anexo é a página **Configurações**, mas o problema se repete em várias outras páginas e diálogos.

Sintomas observados:
- Configurações: 9–10 abas em uma linha, cortadas à direita.
- Privacidade, Relatórios, Contratos, Due Diligence, Controles (vários diálogos): usam `grid grid-cols-N` fixo — em telas estreitas os textos ficam apertados ou estouram.
- Diálogos (RelatóriosDialog, ControlesVinculacaoDialog, EvidenciasDialog, DenunciaDialog, DocumentoDialog) com 4 colunas fixas em modais — pior em mobile.

## Estratégia

Resolver na raiz (no componente `TabsList`) + ajustes pontuais nas páginas que usam `grid-cols` rígido.

### 1. Evoluir `src/components/ui/tabs.tsx`

Tornar o `TabsList` responsivo por padrão, sem precisar repetir classes:

- Wrapper com `overflow-x-auto scrollbar-hide` embutido na própria primitiva.
- Borda inferior contínua (mesmo quando há scroll), via wrapper `relative` com a borda no contêiner externo.
- Máscara de fade nas laterais (esquerda/direita) usando `mask-image` para sinalizar que há conteúdo rolável — aparece só quando há overflow real (via `data-overflow` setado por um pequeno hook de medição com `ResizeObserver`).
- Suporte a navegação por teclado (já é nativa do Radix) e por toque/scroll horizontal.
- `TabsTrigger` ganha `shrink-0` para nunca ser comprimido.

Resultado: qualquer `<TabsList>` no app fica responsivo automaticamente.

### 2. Configurações (`src/pages/Configuracoes.tsx`)

- Remover `gap-0`, `overflow-x-auto`, `scrollbar-hide` da TabsList (passa a vir do componente).
- Manter o padrão `<Icon /> + <span class="hidden sm:inline">Label</span>` para que em telas <640 px só os ícones apareçam (com `aria-label` no trigger e tooltip no hover para acessibilidade).
- Em telas ≥640 px e <1024 px: ícone + texto com scroll horizontal e fade nas pontas.
- Em ≥1024 px: tudo cabe sem scroll.

### 3. Páginas/diálogos com `grid grid-cols-N` fixo

Trocar por TabsList padrão (flex + scroll) ou tornar o grid responsivo:

- `src/pages/Privacidade.tsx` (`grid-cols-4`): trocar para flex responsivo.
- `src/pages/Contratos.tsx` (`grid-cols-2`): mantém (2 colunas funcionam bem em mobile).
- `src/pages/DueDiligence.tsx` (`grid-cols-3`): trocar para flex responsivo.
- `src/pages/Relatorios.tsx`: já é flex; só herda melhorias do componente.
- `src/components/denuncia/DenunciaDialog.tsx` (`grid-cols-4`): flex responsivo.
- `src/components/controles/RelatoriosDialog.tsx` (`grid-cols-4`): flex responsivo.
- `src/components/controles/ControlesVinculacaoDialog.tsx` (`grid-cols-2`): mantém.
- `src/components/controles/EvidenciasDialog.tsx` (`grid-cols-2`): mantém.
- `src/components/documentos/DocumentoDialog.tsx` (`grid-cols-2`): mantém.
- `src/components/ativos/TrilhaAuditoriaAtivos.tsx` (`grid-cols-3`): mantém (3 colunas curtas funcionam).
- `src/components/configuracoes/integrations/AzureConfigDialog.tsx` (`grid-cols-2`): mantém.

### 4. Outros pontos com risco de overflow horizontal já fora do escopo de Tabs

Varredura adicional para tabelas/cards em containers fixos sem `min-w-0`:
- Conferir `PageHeader` em telas estreitas (descrição longa não deve gerar scroll horizontal da página).
- Garantir que páginas com tabelas largas usem o padrão `overflow-x-auto` no wrapper da tabela (já documentado em memória `responsive/dialog-and-table-standards`); revisar `Configurações > Empresas`, `Configurações > Planos` e `Configurações > Usuários`.

### 5. QA

Testar com viewport em 1280×720, 1024×768, 820×1180 e 414×896:
- Configurações: todas as abas alcançáveis (scroll/ícones).
- Privacidade, Relatórios, Due Diligence, DenunciaDialog: sem corte e sem texto espremido.
- Tabelas internas: scroll horizontal local, página sem scrollbar lateral.

## Arquivos afetados

**Editados**
- `src/components/ui/tabs.tsx` — TabsList responsivo com fade e scroll embutidos.
- `src/pages/Configuracoes.tsx`
- `src/pages/Privacidade.tsx`
- `src/pages/DueDiligence.tsx`
- `src/components/denuncia/DenunciaDialog.tsx`
- `src/components/controles/RelatoriosDialog.tsx`

**Verificados (sem mudança esperada, mas auditados no QA)**
- Demais usos listados na varredura.

## Memória

Atualizar `mem://ux/responsive/dialog-and-table-standards` com a nova regra: "TabsList é responsivo por padrão; nunca usar `grid grid-cols-N` rígido em TabsList que tenham >2 abas".
