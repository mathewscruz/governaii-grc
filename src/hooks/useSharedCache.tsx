import { useQueryClient } from "@tanstack/react-query";

// Hook para gerenciar cache compartilhado entre módulos
export const useSharedCache = () => {
  const queryClient = useQueryClient();

  const invalidateStats = (modules?: string[]) => {
    if (modules) {
      modules.forEach(module => {
        queryClient.invalidateQueries({ queryKey: [`${module}-stats`] });
      });
    } else {
      // Invalidar todas as estatísticas
      queryClient.invalidateQueries({ queryKey: ['ativos-stats'] });
      queryClient.invalidateQueries({ queryKey: ['controles-stats'] });
      queryClient.invalidateQueries({ queryKey: ['incidentes-stats'] });
      queryClient.invalidateQueries({ queryKey: ['riscos-stats'] });
      queryClient.invalidateQueries({ queryKey: ['documentos-stats'] });
      queryClient.invalidateQueries({ queryKey: ['contratos-stats'] });
      queryClient.invalidateQueries({ queryKey: ['due-diligence-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    }
  };

  const invalidateModule = (module: string) => {
    queryClient.invalidateQueries({ queryKey: [`${module}-stats`] });
    
    // Se módulo de riscos foi alterado, invalidar dashboard também
    if (module === 'riscos') {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    }
    
    // Se controles foram alterados, invalidar dashboard
    if (module === 'controles') {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    }
    
    // Se incidentes foram alterados, invalidar dashboard
    if (module === 'incidentes') {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    }
  };

  const prefetchStats = async (module: string) => {
    await queryClient.prefetchQuery({
      queryKey: [`${module}-stats`],
      staleTime: 5 * 60 * 1000, // 5 minutos
    });
  };

  const getCachedData = <T,>(queryKey: string[]): T | undefined => {
    return queryClient.getQueryData<T>(queryKey);
  };

  return {
    invalidateStats,
    invalidateModule,
    prefetchStats,
    getCachedData,
    queryClient
  };
};