## Objetivo

Resolver três problemas no popup `RequirementDetailDialog`:
1. **Scroll quebrado** no painel direito (Avaliar Conformidade / Evidências / Plano de Ação) — usuário não consegue rolar até as evidências e plano.
2. **Ícones genéricos de IA** (`Brain`, `Sparkles`, `ScanSearch`, `Lightbulb`) — substituir pelo nosso ícone proprietário com identidade Akuris.
3. **Metadados redundantes** no header (`Obrigatório`, `Peso 2`, `Contexto`) — já aparecem na tabela e no badge "Peso N" interno do diagnóstico.

---

## 1. Correção do scroll (crítico)

**Causa raiz:** dentro de `DialogShell` com `noScroll`, o conteúdo está em `<div className="flex flex-col h-full">`. Os dois `ScrollArea` filhos usam `md:w-[42%]` / `md:w-[58%]` mas o pai `flex flex-col md:flex-row min-h-0 flex-1` falta `overflow-hidden` consistente e os `ScrollArea` não declaram `h-full` — o Radix `ScrollArea` precisa de altura explícita para ativar a viewport interna.

**Correção:**
- Adicionar `h-full` aos dois `<ScrollArea>` (esquerdo e direito).
- Garantir que o wrapper `flex flex-col md:flex-row` tenha `overflow-hidden` para que o flex calcule a altura corretamente.
- Em mobile (`flex-col`), ajustar para que cada painel tenha altura própria via `flex-1 min-h-0`.

Resultado: barra de rolagem funcional no painel direito, permitindo acessar Steps 2 (Evidências), 3 (Plano de Ação), 4 (Detalhes) e 5 (Vínculos).

---

## 2. Ícone proprietário de IA Akuris

**Estado atual:** ícones Lucide genéricos espalhados (`Brain` em "Gerar com IA", `Sparkles` em validação, `Lightbulb` em dicas, `ScanSearch` em validar).

**Solução:** criar novo ícone proprietário `AkurisAIIcon` em `src/components/icons/modules/AkurisAIIcon.tsx`, seguindo o padrão dos demais módulos (`stroke 1.5`, viewBox 24x24, baseado em `_BaseModuleIcon`). Conceito visual: gema/diamante estilizado + nó central (referência sutil ao "A" de Akuris e ao spark de IA), sem clichês de robô/cérebro.

**Aplicação no `RequirementDetailDialog.tsx`:**
- Botão "Gerar com IA" (Step 2): `Brain` → `AkurisAIIcon`.
- Linha de dica "Validar com IA": `Sparkles` → `AkurisAIIcon`.
- Card de sugestão do diagnóstico (`Sugestão da IA`): adicionar `AkurisAIIcon` à esquerda do badge.
- Botão "Validar com IA" (em cada evidência anexada): `ScanSearch` → `AkurisAIIcon`.
- Manter `Lightbulb` apenas como ícone de "dica/empty state" não-IA (ou trocar por `IconInfo` da paleta semântica).

Exportar no `src/components/icons/index.ts` para reuso futuro nos demais módulos com IA (DocGen, AkurIA, Riscos, Due Diligence).

---

## 3. Remoção de metadados redundantes do header

**Estado atual no header do popup:**
```
STATUS [Conforme | Parcial | Não Conforme | N/A]    Obrigatório · Peso 2 · Contexto
```

**Análise:**
- `Obrigatório` já aparece na coluna "Prioridade" da tabela (`getPriorityBadge`) — duplicado.
- `Peso N` já aparece em cada pergunta do diagnóstico quando relevante (`{q.peso >= 2 && <Badge>Peso {q.peso}</Badge>}`) e na tabela.
- `Contexto` (categoria do requisito) já está visível no filtro/agrupamento da tabela e no breadcrumb da página de detalhes do framework.

**Decisão:** remover totalmente o bloco lateral de metadados do header do popup. O header fica focado no que importa: **título do requisito + barra de status**.

Justificativa UX: o popup é a "tela de trabalho" do requisito — o usuário já chegou nele sabendo a categoria e a prioridade. Repetir essas informações polui o header e compete visualmente com a barra de status (que é a ação principal).

---

## Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `src/components/icons/modules/AkurisAIIcon.tsx` | **Criar** — novo ícone proprietário de IA |
| `src/components/icons/index.ts` | Exportar `AkurisAIIcon` |
| `src/components/gap-analysis/dialogs/RequirementDetailDialog.tsx` | Corrigir scroll (`h-full` nos `ScrollArea` + `overflow-hidden` no wrapper); substituir `Brain`/`Sparkles`/`ScanSearch` por `AkurisAIIcon`; remover bloco de metadados (`Obrigatório`, `Peso N`, `Categoria`) do header |

Nenhuma mudança em banco, edge functions ou RLS.

---

## Resultado esperado

- Painel direito do popup rola até o final, expondo Evidências e Plano de Ação.
- Ações de IA passam a ter um ícone único e proprietário (Akuris), reforçando a identidade visual em todo o sistema.
- Header do popup fica mais limpo, focado em **título + status**, sem redundância com a tabela.
