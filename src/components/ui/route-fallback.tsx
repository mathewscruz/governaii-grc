/**
 * RouteFallback — fallback visual para Suspense em rotas públicas.
 *
 * Evita "tela branca" durante o lazy load de rotas que não passam pelo Layout
 * (ex.: /auth, /, /registro, /denuncia/...). Mostra a marca Akuris centralizada
 * com leve animação para sinalizar atividade ao usuário.
 */
export function RouteFallback() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background"
      role="status"
      aria-live="polite"
      aria-label="Carregando"
    >
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <img
          src="/akuris-favicon.png"
          alt=""
          aria-hidden="true"
          className="h-12 w-12 animate-[spin_2s_linear_infinite] opacity-90"
        />
        <span className="text-xs text-muted-foreground tracking-wide">Carregando…</span>
      </div>
    </div>
  );
}
