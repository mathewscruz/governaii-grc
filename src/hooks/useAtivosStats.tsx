import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

interface AtivosStats {
  total: number;
  ativos: number;
  inativos: number;
  descontinuados: number;
  criticos: number;
  altos: number;
  medios: number;
  baixos: number;
  altoValorNegocio: number;
  percentualAltoValor: number;
}

export const useAtivosStats = () => {
  const { profile } = useAuth();
  const empresaId = profile?.empresa_id;

  return useQuery({
    queryKey: ['ativos-stats', empresaId],
    enabled: !!empresaId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<AtivosStats> => {
      const { data: ativos, error } = await supabase
        .from('ativos')
        .select('status, criticidade, valor_negocio')
        .eq('empresa_id', empresaId!);

      if (error) throw error;

      const total = ativos?.length || 0;
      const ativos_status = ativos?.filter(a => a.status === 'ativo').length || 0;
      const inativos = ativos?.filter(a => a.status === 'inativo').length || 0;
      const descontinuados = ativos?.filter(a => a.status === 'descontinuado').length || 0;
      
      const criticos = ativos?.filter(a => a.criticidade === 'critico').length || 0;
      const altos = ativos?.filter(a => a.criticidade === 'alto').length || 0;
      const medios = ativos?.filter(a => a.criticidade === 'medio').length || 0;
      const baixos = ativos?.filter(a => a.criticidade === 'baixo').length || 0;
      
      const altoValorNegocio = ativos?.filter(a => a.valor_negocio === 'alto').length || 0;
      const percentualAltoValor = total > 0 ? Math.round((altoValorNegocio / total) * 100) : 0;

      return {
        total,
        ativos: ativos_status,
        inativos,
        descontinuados,
        criticos,
        altos,
        medios,
        baixos,
        altoValorNegocio,
        percentualAltoValor
      };
    },
  });
};
