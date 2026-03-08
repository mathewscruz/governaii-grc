import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresaId } from "@/hooks/useEmpresaId";

interface ControlesStats {
  total: number;
  ativos: number;
  inativos: number;
  emRevisao: number;
  criticos: number;
  altos: number;
  medios: number;
  baixos: number;
  preventivos: number;
  detectivos: number;
  corretivos: number;
  vencendoAvaliacao: number;
  vencidos: number;
}

export const useControlesStats = () => {
  const { empresaId } = useEmpresaId();

  return useQuery({
    queryKey: ['controles-stats', empresaId],
    staleTime: 5 * 60 * 1000,
    enabled: !!empresaId,
    queryFn: async (): Promise<ControlesStats> => {
      const { data: controles, error } = await supabase
        .from('controles')
        .select('status, criticidade, tipo, proxima_avaliacao')
        .eq('empresa_id', empresaId!);

      if (error) throw error;

      const total = controles?.length || 0;
      const ativos = controles?.filter(c => c.status === 'ativo').length || 0;
      const inativos = controles?.filter(c => c.status === 'inativo').length || 0;
      const emRevisao = controles?.filter(c => c.status === 'em_revisao').length || 0;
      
      const criticos = controles?.filter(c => c.criticidade === 'critico').length || 0;
      const altos = controles?.filter(c => c.criticidade === 'alto').length || 0;
      const medios = controles?.filter(c => c.criticidade === 'medio').length || 0;
      const baixos = controles?.filter(c => c.criticidade === 'baixo').length || 0;
      
      const preventivos = controles?.filter(c => c.tipo === 'preventivo').length || 0;
      const detectivos = controles?.filter(c => c.tipo === 'detectivo').length || 0;
      const corretivos = controles?.filter(c => c.tipo === 'corretivo').length || 0;
      
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const em30Dias = new Date(hoje.getTime() + (30 * 24 * 60 * 60 * 1000));
      
      const vencendoAvaliacao = controles?.filter(c => {
        if (!c.proxima_avaliacao) return false;
        const dataAvaliacao = new Date(c.proxima_avaliacao);
        dataAvaliacao.setHours(0, 0, 0, 0);
        return dataAvaliacao <= em30Dias && dataAvaliacao >= hoje;
      }).length || 0;
      
      const vencidos = controles?.filter(c => {
        if (!c.proxima_avaliacao) return false;
        const dataAvaliacao = new Date(c.proxima_avaliacao);
        dataAvaliacao.setHours(0, 0, 0, 0);
        return dataAvaliacao < hoje;
      }).length || 0;

      return {
        total,
        ativos,
        inativos,
        emRevisao,
        criticos,
        altos,
        medios,
        baixos,
        preventivos,
        detectivos,
        corretivos,
        vencendoAvaliacao,
        vencidos
      };
    },
  });
};
