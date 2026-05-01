## AkurisPulse — Loader único do sistema

Adotar `AkurisPulse` como o **único padrão de carregamento** em toda a aplicação. Conforme escolhido, vamos substituir **tudo**: Suspense fallbacks, spinners de botão, skeletons estruturais e loaders locais de listas/cards.

---

### 1. Componentes base (novos)

**`src/components/ui/AkurisPulse.tsx`** — símbolo Akuris (path "A") em `#8B78E8` com 3 anéis pulsantes (delays `0s`, `0.8s`, `1.6s`) usando o keyframe `akuris-ring-expand`. Props: `size?: number` (default 80). SVG com `overflow="visible"` para os anéis não serem cortados. Sem libs externas, só CSS.

**`src/components/ui/LoadingOverlay.tsx`** — overlay full-screen `fixed inset-0 z-50` com fundo `#06060e` e `<AkurisPulse />` centralizado. Inclui `role="status"` + `aria-label="Carregando"` para acessibilidade.

**`src/index.css`** — adicionar:
```css
@keyframes akuris-ring-expand {
  0%   { transform: scale(0.88); opacity: 0.72; }
  100% { transform: scale(2.1);  opacity: 0;    }
}
```

---

### 2. Substituições globais (na ordem)

**a) `RouteFallback` → `LoadingOverlay`**
- `src/components/ui/route-fallback.tsx`: re-exportar `LoadingOverlay` como `RouteFallback` (mantém os 16+ pontos de uso em `App.tsx` funcionando sem editar cada `<Route>`).

**b) Skeletons estruturais → `LoadingOverlay` (página) / `<AkurisPulse />` (seção)**
- `src/components/ui/page-skeleton.tsx`: substituir o conteúdo por `<LoadingOverlay />` (mantém a API, todos os pontos de uso continuam válidos).
- `src/components/ui/module-loading-skeleton.tsx`: idem.
- `src/components/ui/skeleton.tsx`: transformar `<Skeleton />` em wrapper que centraliza um `<AkurisPulse size={28} />` no espaço onde antes desenhava a barra cinza. Mantém className/dimensões para não quebrar o layout dos containers que reservam espaço.

**c) `Loader2` em botões → `<AkurisPulse size={16} />`**
- ~47 arquivos. Codemod com `rg`/`sed`:
  - Remover imports `Loader2` de `lucide-react` (preservando outros ícones).
  - Trocar `<Loader2 className="... animate-spin" />` por `<AkurisPulse size={16} />`.
- Validar visualmente alguns pontos críticos (botões de submit em `Auth`, `DocGenDialog`, `TratamentoForm`, dialogs de criação).

**d) Loaders inline (`animate-spin` em divs/imgs) → `<AkurisPulse />`**
- Casos restantes detectados por `rg "animate-spin"`: substituir pelo `<AkurisPulse>` em tamanho proporcional ao container (24/32/48).

---

### 3. Estratégia de execução

1. Criar `AkurisPulse.tsx`, `LoadingOverlay.tsx` e o keyframe no `index.css`.
2. Reapontar `route-fallback.tsx`, `page-skeleton.tsx`, `module-loading-skeleton.tsx` e `skeleton.tsx` (4 arquivos cobrem ~80% das referências sem tocar nos consumidores).
3. Codemod para `Loader2` em lote, depois revisão arquivo a arquivo para os casos com import compartilhado.
4. Sweep final: `rg "animate-spin|<Skeleton|Loader2"` deve retornar 0 ocorrências (exceto dentro dos componentes base do shadcn que vamos sobrescrever).
5. Smoke test visual nas rotas principais: `/auth`, `/dashboard`, `/gap-analysis`, `/riscos`, dialogs de submit.

---

### 4. Considerações

- **UX**: você confirmou que prefere identidade total mesmo perdendo o efeito "esqueleto que imita o layout final". O CLS vai aumentar levemente em listas/tabelas (a área onde antes havia placeholders cinza vai mostrar o pulse e depois o conteúdo).
- **Bundle**: nenhum impacto — saímos de Lucide/Skeleton para SVG inline.
- **Acessibilidade**: overlay e pulse recebem `role="status"` + `aria-label="Carregando"`.
- **Memória**: vou atualizar a memória `ux/ui-consistency-standards` informando que `PageSkeleton`/`ModuleLoadingSkeleton`/`Skeleton`/`Loader2` estão **descontinuados** em favor de `AkurisPulse`/`LoadingOverlay`.

---

### Arquivos criados
- `src/components/ui/AkurisPulse.tsx`
- `src/components/ui/LoadingOverlay.tsx`

### Arquivos editados (núcleo)
- `src/index.css` (keyframe)
- `src/components/ui/route-fallback.tsx`
- `src/components/ui/page-skeleton.tsx`
- `src/components/ui/module-loading-skeleton.tsx`
- `src/components/ui/skeleton.tsx`

### Arquivos editados (sweep — ~50 arquivos)
- Todos os arquivos com `Loader2` ou `animate-spin` (Auth, dialogs, formulários, botões de save/delete, gerenciadores de configuração, etc.)
