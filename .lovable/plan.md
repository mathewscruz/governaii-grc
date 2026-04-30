Vou corrigir o problema de scroll do chat do DocGen com foco no layout do modal, não apenas na barra em si.

Diagnóstico pelo código: o DocGen usa `DialogShell` com `noScroll`, mas o `DialogContent` tem apenas `max-height` e não uma altura explícita. Como o conteúdo interno usa vários `h-full`/`flex-1`, o navegador pode calcular a área do chat como conteúdo inteiro, enquanto o modal corta com `overflow-hidden`. Resultado: a conversa fica visualmente limitada/cortada, mas a área correta não vira um container rolável de verdade. Isso combina com o print: o usuário vê mensagens no meio/final da conversa e o input, mas não consegue rolar livremente para cima/baixo.

Plano de correção:

1. Ajustar altura real do modal DocGen
- Em `DocGenDialog.tsx`, passar uma `className` específica para o `DialogShell` do DocGen com altura explícita:
  - mobile: `h-[100dvh]`
  - desktop: `sm:h-[92vh]`
- Isso garante que os filhos com `flex-1 min-h-0` tenham uma altura concreta para distribuir, fazendo o chat rolar corretamente.

2. Fortalecer o container de mensagens
- No container `messagesScrollRef`, manter `overflow-y-auto`, mas adicionar classes/propriedades para interação melhor:
  - `overscroll-contain`
  - `touch-pan-y`
  - `scrollbar-gutter: stable`
  - padding lateral suficiente para a barra não cobrir texto
- Garantir que o container tenha `min-h-0`, `flex-1` e esteja dentro de pais com `min-h-0`/`overflow-hidden` corretos.

3. Melhorar a experiência de auto-scroll
- Manter auto-scroll para o final quando chega nova mensagem, mas sem impedir que o usuário role manualmente depois.
- Ajustar o auto-scroll para usar `requestAnimationFrame`, evitando rodar antes do layout final e evitando comportamentos inconsistentes em conversas longas.

4. Adicionar botão de retorno ao fim, se necessário
- Quando o usuário estiver lendo mensagens antigas e chegar uma resposta nova, mostrar um botão discreto “Ir para o fim” dentro do chat.
- Isso evita jogar o usuário automaticamente para baixo enquanto ele está lendo histórico e melhora a experiência em conversas longas.

5. Revisar responsividade
- Validar o comportamento em desktop/laptop, especialmente no viewport próximo ao do usuário (`1101x974`), onde o layout fica em duas colunas.
- Garantir que em mobile o chat continue ocupando a tela inteira e rolando internamente, sem depender do scroll da página.

6. Pequeno ajuste de UX visual
- Tornar a área de mensagens visualmente mais clara como região rolável: barra visível, limite bem definido e espaço entre mensagens/input.
- Sem mudar identidade visual: manter DM Sans, cores do Akuris e layout atual do DocGen.

Arquivos previstos:
- `src/components/documentos/DocGenDialog.tsx`
- Possivelmente `src/components/ui/dialog-shell.tsx` apenas se for melhor tornar o comportamento de `noScroll` mais robusto para todos os modais que usam esse padrão. Se o risco de impacto em outros módulos for maior, farei a correção isolada no DocGen.

Validação após implementar:
- Abrir uma conversa longa no DocGen.
- Confirmar que é possível rolar para cima e para baixo dentro das mensagens.
- Confirmar que o input permanece fixo abaixo do chat.
- Confirmar que o preview do documento continua rolando separadamente.
- Confirmar que o modal não corta mensagens nem depende do scroll da página.