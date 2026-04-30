## Diagnóstico

Mapeei o uso de ícones no sistema. Números reais:

- **246 arquivos** importam `lucide-react`
- **364 ícones únicos** em uso (excessivo — Lucide é o "padrão default" da indústria, não dá identidade)
- **911 ocorrências** de `h-4 w-4` (tamanho default), 155 de `h-5 w-5`, 127 de `h-3 w-3`, 66 de `h-3.5 w-3.5` — **convenção solta**
- **Apenas 29 ocorrências** de `strokeWidth` customizado — 99% dos ícones usam o stroke padrão Lucide (2.0), o que dá aquele ar "site genérico de IA"
- **Inconsistências semânticas**:
  - "Editar" usa `Edit`, `Edit2`, `Pencil`, `PencilLine` (4 metáforas)
  - "Sucesso/check" usa `Check`, `CheckCircle`, `CheckCircle2`, `CheckSquare` (4 variantes, espalhadas em 70+ arquivos)
  - "Alerta" alterna entre `AlertTriangle` e `AlertCircle` sem regra clara
  - "Excluir" usa `Trash` e `Trash2` misturados
- **Já existe** `src/components/icons/AkurisSidebarIcon.tsx` — único ícone proprietário hoje, com `strokeWidth={1.75}` e estilo limpo. Ponto de partida da identidade.

**Conclusão**: o sistema é visualmente "Lucide cru" — bom mas indistinguível de qualquer outro app feito com IA. A ausência de regra de stroke/tamanho e o excesso de variantes para o mesmo conceito são as causas principais.

## Estratégia (sem refazer 246 arquivos)

Em vez de redesenhar 364 ícones (irreal), vamos criar **identidade por sistema de regras + wrapper + ícones-âncora proprietários** nos pontos onde o usuário realmente repara:

1. **Sistema de regras** que padroniza o "feel" Akuris em todo Lucide (stroke fino + tamanhos canônicos).
2. **Ícones proprietários** apenas para os módulos GRC core (8 módulos) — esses sim com identidade própria.
3. **Catálogo central** que elimina a inconsistência semântica (uma metáfora por ação).

## Mudanças

### 1. Token de "Akuris Icon Style" (regra global)

Criar `src/components/icons/Icon.tsx`:

```tsx
// Wrapper que aplica o estilo Akuris a qualquer Lucide icon.
// Stroke 1.5 (vs. 2.0 padrão) + linecap round + tamanhos via prop semântica.
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
const SIZE_MAP = { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 };

export function Icon({ as: LucideIcon, size = 'md', strokeWidth = 1.5, className, ...rest }) {
  return <LucideIcon size={SIZE_MAP[size]} strokeWidth={strokeWidth} className={className} {...rest} />;
}
```

Ganho: **stroke 1.5 = a "assinatura" Akuris** (mais fino, mais premium, distinto de Vercel/Linear/etc. que usam 2.0).

### 2. Catálogo semântico (`src/components/icons/index.ts`)

Re-exportar os 30 ícones mais usados com nomes de domínio + escolha única por metáfora:

```tsx
// Ações
export { Pencil as IconEdit } from 'lucide-react';      // unifica Edit/Edit2/Pencil
export { Trash2 as IconDelete } from 'lucide-react';    // unifica Trash/Trash2
export { Check as IconCheck } from 'lucide-react';      // checkmark inline
export { CheckCircle2 as IconSuccess } from 'lucide-react'; // status sucesso
export { AlertTriangle as IconWarning } from 'lucide-react';
export { AlertCircle as IconInfo } from 'lucide-react';
export { XCircle as IconError } from 'lucide-react';
export { MoreHorizontal as IconMore } from 'lucide-react';
// ...
```

Regra documentada no header do arquivo: **"sempre importar daqui, nunca direto do lucide-react para esses 30 conceitos"**. Linter/code review pega o resto.

### 3. Ícones proprietários para os 8 módulos GRC

Criar `src/components/icons/modules/` com SVGs próprios desenhados com a mesma linguagem do `AkurisSidebarIcon` (viewBox 24, stroke 1.75, linecap round, mini elemento de "confiança" — ponto, check, ou rail):

| Módulo        | Ícone proprietário                                              |
|---------------|------------------------------------------------------------------|
| Riscos        | Diamante com ponto central (em vez de `AlertTriangle` genérico)  |
| Controles     | Escudo com 3 linhas (em vez de `Shield` puro)                    |
| Ativos        | Cubo isométrico com base (em vez de `HardDrive`)                 |
| Incidentes    | Raio com círculo de impacto (em vez de `Zap`)                    |
| Gap Analysis  | Alvo com linha de "gap" (em vez de `Target` puro)                |
| Due Diligence | Lupa com mini check (em vez de `Search`)                         |
| Documentos    | Folha com canto dobrado + selo (em vez de `FileText`)            |
| Denúncias     | Balão com ponto (em vez de `MessageSquareWarning`)               |

Cada um exporta `{Riscos,Controles,Ativos,...}Icon` em ~30 linhas de SVG. Esses são os pontos onde o usuário **mais reconhece** a marca: sidebar, KPI Pills, Maturity Card, breadcrumbs do Command Center. Substituir nesses 4 lugares já dá identidade visível.

### 4. Aplicar nos pontos de alto impacto (NÃO em tudo)

Ondas de aplicação:
- **Onda 1 (este turno)**: substituir Lucide pelos novos `*Icon` proprietários em:
  - `AppSidebar.tsx` (módulos GRC)
  - `KPIPills.tsx` (já refatorado recentemente)
  - `MultiDimensionalRadar.tsx` (`iconMap`)
  - `useRadarChartData.tsx` (campo `icon`)
- **Não tocar agora**: ações genéricas (editar, excluir, etc.) em 246 arquivos. Apenas documentar o catálogo — migração orgânica em PRs futuros via memory rule.

### 5. Memory rule

Adicionar `mem://design/icons/akuris-icon-system` com:
- "Stroke 1.5 = assinatura visual; nunca usar 2.0"
- "Importar ícones de ação de `@/components/icons`, nunca direto de `lucide-react`"
- "Módulos GRC usam `*Icon` proprietários de `@/components/icons/modules`"
- Tamanhos canônicos: xs=12, sm=14, md=16, lg=20, xl=24

E referenciar no `mem://index.md` Core: "Ícones: stroke 1.5, módulos GRC com SVG proprietário".

## Fora de escopo

- Migrar os 246 arquivos para o wrapper `<Icon>` agora — fica como rule para PRs futuros.
- Substituir ícones de bibliotecas terceiras (radix, etc.) — só `lucide-react`.
- Redesenhar os ícones de status (toasts, badges) — esses já funcionam bem.

## Arquivos afetados (Onda 1)

- **Criar**: `src/components/icons/Icon.tsx`, `src/components/icons/index.ts`, `src/components/icons/modules/{Riscos,Controles,Ativos,Incidentes,GapAnalysis,DueDiligence,Documentos,Denuncias}Icon.tsx` (8 arquivos), `mem://design/icons/akuris-icon-system`
- **Editar**: `src/components/AppSidebar.tsx`, `src/components/dashboard/KPIPills.tsx`, `src/components/dashboard/MultiDimensionalRadar.tsx`, `src/hooks/useRadarChartData.tsx`, `mem://index.md`

## Resultado esperado

- Visual perceptivelmente diferente de "site Lovable padrão": linhas mais finas, módulos GRC com assinatura própria.
- Zero quebra: catálogo é re-export, wrapper é opt-in, ícones proprietários só nos pontos editados.
- Rumo claro de migração para o resto do sistema sem precisar fazer tudo de uma vez.

Aprova?