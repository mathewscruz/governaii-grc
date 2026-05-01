import { LoadingOverlay } from "./LoadingOverlay";

/**
 * RouteFallback — fallback de Suspense para rotas.
 * Mantido como re-export para compatibilidade com pontos de uso existentes.
 * Internamente é o LoadingOverlay com AkurisPulse (loader oficial do sistema).
 */
export function RouteFallback() {
  return <LoadingOverlay />;
}
