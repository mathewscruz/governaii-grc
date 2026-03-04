

# Plano: Legenda do Ícone de Alerta + Completar ISO 27001

## 1. Legenda para o ícone de exclamação

O ícone `AlertTriangle` (⚠️) aparece quando o requisito tem **peso ≥ 3** e status **Não Conforme** — indicando um item de alta prioridade em não conformidade. Atualmente não há nenhuma explicação visual para o usuário.

**Solução**: Adicionar uma barra de legenda discreta abaixo dos filtros/acima da tabela, com os indicadores visuais utilizados:

| Ícone | Significado |
|-------|------------|
| ⚠️ (AlertTriangle vermelho) | Requisito de alta prioridade em não conformidade |

**Arquivo**: `src/components/gap-analysis/GenericRequirementsTable.tsx` — inserir um pequeno bloco de legenda (`text-xs text-muted-foreground`) antes da tabela.

---

## 2. Completar requisitos ISO 27001:2022

A ISO 27001:2022 possui **28 cláusulas** (não 24) quando contamos todos os subitens numerados. Faltam 4 itens:

| Código | Título |
|--------|--------|
| 6.3 | Planejamento de mudanças |
| 9.2.1 | Generalidades (Auditoria interna) |
| 9.2.2 | Programa de auditoria interna |
| 9.3.1 | Generalidades (Análise crítica pela direção) |
| 9.3.2 | Entradas da análise crítica pela direção |
| 9.3.3 | Resultados da análise crítica pela direção |

Os itens atuais `9.2` e `9.3` devem ser **substituídos** pelos seus subitens, e `6.3` deve ser **adicionado**. Resultado: 24 - 2 (9.2, 9.3) + 6 (novos) = **28 cláusulas**.

**Ação**: Usar o insert tool para:
1. Inserir os 5 novos requisitos (6.3, 9.2.1, 9.2.2, 9.3.1, 9.3.2, 9.3.3)
2. Remover os 2 antigos (9.2, 9.3) — migrando eventuais avaliações existentes antes

**Total final**: 28 cláusulas + 93 Anexo A = **121 requisitos**.

---

## Resumo de Impacto

| Arquivo/Recurso | Ação |
|-----------------|------|
| `GenericRequirementsTable.tsx` | Adicionar legenda visual dos ícones |
| Banco de dados (INSERT/DELETE) | Ajustar requisitos ISO 27001 de 24→28 cláusulas |

