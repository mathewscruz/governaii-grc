

# Plano: Notificações de Versão Apenas no Ícone de Novidades (Sparkles)

## Problema
O trigger `notify_changelog_entry` insere registros na tabela `notifications` (sino) quando uma nova versão é adicionada. Isso duplica a informação, já que o `ChangelogPopover` (ícone Sparkles ✨) já exibe as novidades com indicador de "novo" via `localStorage`.

## Solução
Remover o trigger `notify_changelog_entry` do banco de dados. O `ChangelogPopover` já cuida de:
- Buscar entradas do `changelog_entries`
- Mostrar indicador pulsante quando há versão não vista
- Marcar como "visto" ao abrir o popover

Nenhuma mudança no frontend é necessária — apenas a remoção do trigger SQL.

## Arquivo

| Arquivo | Ação |
|---------|------|
| Nova migration SQL | **Novo** — `DROP TRIGGER` e `DROP FUNCTION` do `notify_changelog_entry` |

## Impacto
- Novas versões aparecem **apenas** no ícone Sparkles (ao lado do sino)
- O sino fica reservado para notificações operacionais (aprovações, incidentes, etc.)
- Zero mudanças no frontend

