

# Varredura Geral — Oportunidades de Melhoria de UX

Após analisar a estrutura da aplicação, identifiquei **5 melhorias concretas** que trariam impacto significativo na experiencia do usuário:

---

## 1. ErrorBoundary ausente na maioria das paginas

**Problema**: Apenas 2 paginas (GapAnalysisFrameworks e GapAnalysisFrameworkDetail) utilizam o `ErrorBoundary`. Se qualquer outro modulo (Riscos, Contratos, Documentos, Incidentes, etc.) tiver um erro de renderizacao, o usuario ve uma tela branca sem explicacao.

**Solucao**: Envolver todas as paginas protegidas com `ErrorBoundary` diretamente no `Layout.tsx` (em volta do `{children}`), garantindo cobertura global sem precisar editar cada pagina individualmente.

| Arquivo | Mudanca |
|---------|---------|
| `src/components/Layout.tsx` | Envolver `{children}` dentro de `<ErrorBoundary>` no `<main>` |

---

## 2. Feedback de "carregando" inconsistente entre modulos

**Problema**: Apenas Dashboard e Riscos tem skeletons de carregamento. Outros modulos (Contratos, Documentos, Incidentes, Privacidade, etc.) mostram spinner generico ou nada, criando uma experiencia desconexa.

**Solucao**: Criar um componente `PageSkeleton` reutilizavel com variantes (tabela, cards, dashboard) e aplicar nos modulos que ainda nao tem loading adequado.

| Arquivo | Mudanca |
|---------|---------|
| `src/components/ui/page-skeleton.tsx` | Novo componente com variantes de skeleton |

---

## 3. Paginas sem EmptyState padronizado

**Problema**: Apenas 3 paginas (Contratos, Documentos, GapAnalysisFrameworks) usam o componente `EmptyState`. Os demais modulos mostram tabelas vazias sem orientacao ao usuario sobre o que fazer. Isso e especialmente ruim para novos usuarios.

**Solucao**: Adicionar `EmptyState` com acao de criacao nos modulos que ainda nao tem: Riscos, Incidentes, Ativos, Politicas, PlanosAcao, Denuncia.

| Arquivo | Mudanca |
|---------|---------|
| Paginas sem empty state | Adicionar `<EmptyState>` quando dados retornam vazio |

---

## 4. Ausencia de atalhos de teclado documentados para o usuario

**Problema**: Existe um `CommandPalette` (Cmd+K) funcional, mas nao ha nenhum indicador ou documentacao visivel para o usuario mobile/desktop sobre atalhos disponiveis. Muitos usuarios nunca descobrirao esse recurso.

**Solucao**: Adicionar uma secao "Atalhos de Teclado" no `CommandPalette` (ou um item no menu de perfil do usuario) mostrando os atalhos disponiveis (Cmd+K para busca, Ctrl+B para sidebar).

| Arquivo | Mudanca |
|---------|---------|
| `src/components/CommandPalette.tsx` | Adicionar grupo "Atalhos" na paleta |

---

## 5. Botao de "Voltar" no header nao tem tooltip

**Problema**: O botao de voltar (`ArrowLeft`) no header do `Layout.tsx` nao tem tooltip, e em mobile pode ser confundido com outros icones. Alem disso, usar `navigate(-1)` pode levar o usuario para fora da aplicacao se o historico estiver vazio.

**Solucao**: Adicionar tooltip "Voltar" e tratar o fallback para `/dashboard` quando nao ha historico de navegacao.

| Arquivo | Mudanca |
|---------|---------|
| `src/components/Layout.tsx` | Tooltip + fallback seguro no botao voltar |

---

## Resumo de Prioridade

| # | Melhoria | Impacto | Esforco |
|---|----------|---------|---------|
| 1 | ErrorBoundary global | Alto (evita tela branca) | Baixo |
| 2 | PageSkeleton reutilizavel | Medio (consistencia visual) | Medio |
| 3 | EmptyState nos modulos faltantes | Alto (orienta novos usuarios) | Medio |
| 4 | Documentar atalhos de teclado | Baixo (discoverability) | Baixo |
| 5 | Tooltip + fallback no botao voltar | Baixo (previne bug de navegacao) | Baixo |

Recomendo comecar pelos itens 1 e 5 (rapidos e de alto impacto) e depois 3 (experiencia de primeiro uso).

