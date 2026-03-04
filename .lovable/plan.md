

# Plano: Melhorar Exibição do Conteúdo de Orientação dos Requisitos

## Problema
O texto de orientação é renderizado como blocos de texto corridos, sem separação visual clara entre seções. Parece conteúdo "cru" de IA — sem identidade visual da ferramenta.

## Solução

Reescrever o componente `MarkdownContent` no arquivo `src/components/gap-analysis/nist/NISTRequirementDetailDialog.tsx` para renderizar cada seção (identificada por `##`) dentro de **cards visuais** com ícone, título destacado e fundo sutil. Isso cria uma aparência de conteúdo nativo da plataforma.

### Mudanças específicas:

1. **Seções em Cards**: Cada `## Título` gera um card (`rounded-lg border bg-card p-4`) com ícone contextual baseado no título (ex: 🎯 para "O que este requisito significa", 🏢 para "Por que isso importa", ⚙️ para "Como implementar", ✅ para "Resumo prático")

2. **Mapeamento de ícones por palavra-chave no título**: Um mapa simples (significa→BookOpen, importa→Building, implementar→Settings, resumo→CheckSquare, evidência→FileCheck, risco→AlertTriangle) para dar identidade visual sem depender do conteúdo da IA

3. **Espaçamento entre seções**: `space-y-4` entre cards em vez de `space-y-2` entre parágrafos soltos

4. **Parágrafos dentro dos cards**: Manter `text-sm text-muted-foreground leading-relaxed` mas com `space-y-3` para mais respiração

5. **Primeiro parágrafo (antes de qualquer ##)**: Renderizar como texto introdutório com estilo levemente diferente (`text-sm text-foreground/80 italic`)

## Arquivo

| Arquivo | Mudança |
|---------|---------|
| `src/components/gap-analysis/nist/NISTRequirementDetailDialog.tsx` | Reescrever `MarkdownContent` para agrupar conteúdo por seção em cards com ícones |

## Resultado
O conteúdo parecerá documentação estruturada da plataforma, não output de IA.

