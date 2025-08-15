import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DenunciasStats {
  total: number;
  novas: number;
  em_andamento: number;
  resolvidas: number;
}

export const useDenunciasStats = () => {
  return useQuery({
    queryKey: ['denuncias-stats'],
    queryFn: async (): Promise<DenunciasStats> => {
      try {
        const { data: denuncias, error } = await supabase
          .from('denuncias')
          .select('id, status');

        if (error) {
          console.error('Erro ao buscar estatísticas de denúncias:', error);
          throw error;
        }

        const total = denuncias?.length || 0;
        const novas = denuncias?.filter(d => d.status === 'nova').length || 0;
        const em_andamento = denuncias?.filter(d => 
          ['em_analise', 'em_investigacao'].includes(d.status)
        ).length || 0;
        const resolvidas = denuncias?.filter(d => 
          ['resolvida', 'arquivada'].includes(d.status)
        ).length || 0;

        return {
          total,
          novas,
          em_andamento,
          resolvidas
        };
      } catch (error) {
        console.error('Erro ao carregar estatísticas de denúncias:', error);
        throw error;
      }
    },
  });
};