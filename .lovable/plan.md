## Diagnóstico do DocGen

Auditei o componente (`src/components/documentos/DocGenDialog.tsx`, 817 linhas) e a edge function (`supabase/functions/docgen-chat/index.ts`, 585 linhas). O fluxo macro está bom — chat → identificação do tipo de doc → "Gerar Documento" → preview → exportar/salvar — mas encontrei **bugs reais**, sendo o do scroll o mais crítico, além de problemas de UX e de robustez.

> Não consegui reproduzir visualmente porque o preview está deslogado, mas a causa do scroll é estrutural no DOM e está clara no código.

---

## Bugs encontrados

### 1. Scroll do chat não funciona (o que o usuário reclamou) — **crítico**
No `DialogShell` o `noScroll` envolve os filhos em `<div className="h-full">` (linha 140 de `dialog-shell.tsx`). Mas o filho direto que o `DocGenDialog` passa é:

```
<div className="flex flex-col h-full p-6 gap-4 min-h-0">
```

Esse `h-full` **não recebe altura** do pai (`<div className="h-full">` do shell) porque o pai dele (`<div className="flex-1 min-h-0 overflow-hidden">`) é flex, mas o intermediário não. Resultado: a `ScrollArea` do chat (linha 644) calcula altura colapsada em 0 / `min-h-[300px]`, e quando as mensagens crescem o `ScrollArea` **não scrolla** — a página inteira do dialog é que tenta crescer e bate no `max-h-[92vh]`, escondendo as mensagens antigas atrás do header sem barra de scroll funcional.

**Correção**: trocar o wrapper `noScroll` do `DialogShell` para `<div className="h-full flex flex-col">`, ou (mais cirúrgico) no `DocGenDialog` substituir o root por `<div className="flex flex-col flex-1 h-full p-6 gap-4 min-h-0 overflow-hidden">`. Vou fazer pelo lado do `DocGenDialog` para não impactar outros consumidores do `DialogShell`.

### 2. Auto-scroll para a última mensagem usa `scrollIntoView` dentro do Radix `ScrollArea` — **não funciona**
Linha 132: `messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })`. O Radix `ScrollArea` tem um `Viewport` interno; `scrollIntoView` no filho rola o **document**, não o viewport. Por isso novas mensagens podem sumir embaixo mesmo quando o scroll do item 1 estiver consertado.

**Correção**: pegar o viewport via `[data-radix-scroll-area-viewport]` e setar `viewport.scrollTop = viewport.scrollHeight`, ou trocar a `ScrollArea` por um `<div className="flex-1 min-h-0 overflow-y-auto">` simples (mais leve, e é o padrão dos chats do app — usado no `akuria-chat`).

### 3. Saudação inicial é regenerada toda vez que o dialog é reaberto
O `useEffect` da linha 81 tem dependência `[open]`. Quando `open` vira `true`, **sempre** sobrescreve `messages` com a saudação, descartando a conversa em andamento (`conversationId` continua, mas o histórico visível é apagado).

**Correção**: só setar a saudação se `messages.length === 0`.

### 4. `Enter` envia mensagem mesmo durante composição IME
Linha 590 usa `onKeyPress` (deprecated) e não checa `isComposing`. Em teclados que usam dead keys / acentos compostos, isso pode disparar envio prematuro. Trocar para `onKeyDown` + `e.nativeEvent.isComposing`.

### 5. Risco de XSS no tooltip
Linha 544: o `definition` é injetado como atributo `title` via string concatenada, sem escape. Hoje os valores vêm de constantes hardcoded (`TOOLTIPS`), mas se um dia vierem da API, aspas/`<` quebram o markup. Mesmo o `DOMPurify` no `dangerouslySetInnerHTML` permite `title`. Vou escapar.

### 6. UX: nenhum aviso quando a IA termina de pensar
Quando a resposta chega, o card "DocGen está pensando..." some sem feedback sonoro/visual além disso. OK por ora — não vou mexer, mas registro.

### 7. UX: campo de input não recebe foco automático ao abrir
Pequeno polimento: focar a `Textarea` quando `open` vira `true` e quando a IA termina de responder.

### 8. UX: layout do preview ocupa metade da tela mesmo em telas estreitas (`w-1/2` fixo, linha 732)
Em viewport < 1024px o chat fica espremido. Trocar para `lg:w-1/2 w-full` e empilhar (`flex-col lg:flex-row`).

### 9. Edge function: parser de JSON é frágil
O `parsedResponse` (linhas 297–353) tenta extrair JSON da resposta de chat, mas o prompt pede texto puro ("NÃO inclua JSON visível"). O try/catch sempre cai no `catch`, e o regex de limpeza pode comer parte do conteúdo se o usuário pedir um exemplo de JSON. Vou simplificar: tratar a resposta como texto puro, e detectar `documento_pronto` apenas pelos marcadores em `messageText.toLowerCase()` (que já é feito nas linhas 357–362).

### 10. Edge function: falta `verify_jwt = true` (segurança)
Pela memória do projeto (Vulnerability Baseline), edge functions devem ter `verify_jwt=true`. Vou checar `supabase/config.toml` e ajustar se estiver desabilitado.

---

## O que NÃO vou mexer

- Lógica de geração de documento, parser do JSON do documento final, exportação PDF/DOCX, salvar no sistema, integração com framework_context/gaps — está funcionando e fora do escopo da reclamação.
- `DocLayoutBuilder` e `DocumentoDialog` (não são parte da queixa).
- Visual geral do dialog (cards, cores) — segue o design system.

---

## Arquivos a alterar

1. `src/components/documentos/DocGenDialog.tsx` — fixes 1, 2, 3, 4, 5, 7, 8 (pequenas mudanças cirúrgicas no JSX e em 3 useEffects).
2. `supabase/functions/docgen-chat/index.ts` — fix 9 (simplificar parser).
3. `supabase/config.toml` — fix 10 (somente se `verify_jwt = false` para `docgen-chat`; verifico antes).

Sem migrations de banco. Sem novas dependências.

## Validação após implementar

Vou pedir para você logar no preview e abrir o DocGen para eu testar o scroll com 10+ mensagens, confirmar que a saudação não some ao reabrir, e validar a responsividade do split chat/preview.

Posso prosseguir?
