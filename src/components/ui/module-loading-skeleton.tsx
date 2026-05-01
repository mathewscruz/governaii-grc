import { AkurisPulse } from "./AkurisPulse";

interface ModuleLoadingSkeletonProps {
  /** Mantido por compatibilidade — não tem mais efeito visual. */
  statCards?: number;
  showTable?: boolean;
  tableRows?: number;
}

/**
 * ModuleLoadingSkeleton — descontinuado como skeleton estrutural.
 * Agora exibe o loader oficial AkurisPulse centralizado no espaço do módulo,
 * mantendo a API para todos os pontos de uso existentes.
 */
export function ModuleLoadingSkeleton(_props: ModuleLoadingSkeletonProps = {}) {
  return (
    <div
      className="flex items-center justify-center w-full min-h-[60vh] animate-in fade-in-0 duration-300"
      role="status"
      aria-label="Carregando módulo"
    >
      <AkurisPulse size={72} />
    </div>
  );
}
