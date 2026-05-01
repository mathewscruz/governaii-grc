import { LoadingOverlay } from "./LoadingOverlay";

/**
 * PageSkeleton — descontinuado como skeleton estrutural.
 * Agora delega para o loader oficial AkurisPulse via LoadingOverlay,
 * mantendo a API para todos os pontos de uso existentes.
 */
export function PageSkeleton() {
  return <LoadingOverlay />;
}
