Vou ajustar em duas frentes: detalhe completo para itens longos e padronização real dos toasts no visual Akuris.

## 1. Notificações: abrir uma tela/modal de leitura completa
- Alterar o comportamento do sino: ao clicar em uma notificação, em vez de navegar direto e cortar o texto, abrir um detalhe em `Dialog` com layout editorial Akuris.
- O detalhe exibirá:
  - módulo/origem com ícone proprietário;
  - título completo;
  - mensagem completa, sem `line-clamp`;
  - data/tempo relativo;
  - tipo/prioridade em `StatusBadge`;
  - botão de ação “Ir para o módulo” quando existir `link_to`.
- Manter a marcação como lida ao abrir o detalhe.
- Preservar o popover compacto no sino com texto truncado, mas agora ele será apenas a lista resumida.

## 2. Novidades: abrir detalhe completo das versões
- Atualizar o `ChangelogPopover` para que o clique em uma versão/item abra um `Dialog` de detalhe.
- O detalhe exibirá a versão, data e todos os itens em uma área ampla e rolável, evitando corte de textos longos.
- Substituir o loader visual legado por `AkurisPulse`, mantendo a regra de identidade do sistema.
- Padronizar os badges de “Novo / Melhoria / Correção” para `StatusBadge`, evitando visual genérico e cores inconsistentes.

## 3. Toasts: corrigir sobreposição e padronizar de verdade
- Ajustar `src/components/ui/sonner.tsx` usando as classes internas corretas do Sonner (`content`, `icon`, `title`, `description`) para que o chip do ícone não invada o texto.
- Remover a causa do item “sobresair” no toast: hoje o ícone customizado tem 32px, mas o Sonner ainda reserva apenas 16px para a área de ícone. Vou expandir essa área e alinhar o conteúdo com `items-start`, `gap` e largura fixa.
- Garantir largura consistente (`360px`, com `max-width` responsivo), texto sem sobreposição, quebra segura de linha e espaçamento correto entre toasts empilhados.
- Manter o padrão visual Akuris: fundo glass, acento vertical fino de 2px, chip semântico, DM Sans, stroke 1.5 e tons `success/warning/destructive/info`.
- Atualizar `akurisToast` para usar a mesma anatomia visual do `Toaster`, evitando dois padrões diferentes.

## 4. Compatibilidade com toasts antigos
- Refatorar `src/hooks/use-toast.ts` para encaminhar chamadas legadas de `useToast()` para o Sonner.
- Isso é importante porque muitos módulos ainda usam `useToast`; hoje esses toasts podem não aparecer ou não seguir o visual oficial.
- A compatibilidade será mantida para chamadas como:
  - `toast({ title, description })`
  - `toast({ title, description, variant: 'destructive' })`
- Assim, todos os módulos passam a usar o mesmo Toaster Akuris sem precisar alterar dezenas de arquivos agora.

## 5. Segurança e consistência
- Ao tocar em queries de notificações, manter o isolamento por usuário e, quando houver `empresa_id` disponível, preservar/aplicar filtros de empresa conforme padrão do projeto.
- Não adicionar backend novo.
- Não reintroduzir CSS global para `[data-sonner-toast]`; a estilização ficará centralizada no componente `sonner.tsx`.

## Arquivos previstos
- `src/components/NotificationCenter.tsx`
- `src/components/ChangelogPopover.tsx`
- `src/components/ui/sonner.tsx`
- `src/lib/akuris-toast.tsx`
- `src/hooks/use-toast.ts`
- `src/i18n/pt.ts`
- `src/i18n/en.ts`

Depois de aprovado, implemento esses ajustes e valido visualmente o fluxo esperado: toast de login, toast de erro/sucesso e abertura completa de notificação/novidade.