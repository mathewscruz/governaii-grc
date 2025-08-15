import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RiscosStats {
  total: number;
  criticos: number;
  altos: number;
  medios: number;
  baixos: number;
  tratamentos_pendentes: number;
  tratamentos_andamento: number;
  tratamentos_concluidos: number;
  aceitos: number;
  tratados: number;
}

export const useRiscosStats = () => {
  return useQuery({
    queryKey: ['riscos-stats'],
    queryFn: async (): Promise<RiscosStats> => {
      // Buscar riscos
      const { data: riscos, error: riscosError } = await supabase
        .from('riscos')
        .select(`
          id,
          nivel_risco_inicial,
          nivel_risco_residual,
          aceito
        `);

      if (riscosError) throw riscosError;

      const newStats: RiscosStats = {
        total: riscos?.length || 0,
        criticos: riscos?.filter(r => r.nivel_risco_inicial === 'Crítico' || r.nivel_risco_inicial === 'Muito Alto').length || 0,
        altos: riscos?.filter(r => r.nivel_risco_inicial === 'Alto').length || 0,
        medios: riscos?.filter(r => r.nivel_risco_inicial === 'Médio').length || 0,
        baixos: riscos?.filter(r => r.nivel_risco_inicial === 'Baixo' || r.nivel_risco_inicial === 'Muito Baixo').length || 0,
        tratamentos_pendentes: 0,
        tratamentos_andamento: 0,
        tratamentos_concluidos: 0,
        aceitos: riscos?.filter(r => r.aceito).length || 0,
        tratados: riscos?.filter(r => r.nivel_risco_residual).length || 0
      };

      // Buscar estatísticas de tratamentos se houver riscos
      if (riscos && riscos.length > 0) {
        const { data: tratamentos, error: tratamentosError } = await supabase
          .from('riscos_tratamentos')
          .select('status, risco_id')
          .in('risco_id', riscos.map(r => r.id));

        if (tratamentosError) {
          console.error('Erro ao buscar tratamentos:', tratamentosError);
        } else if (tratamentos) {
          newStats.tratamentos_pendentes = tratamentos.filter(t => t.status === 'pendente').length;
          newStats.tratamentos_andamento = tratamentos.filter(t => t.status === 'em andamento').length;
          newStats.tratamentos_concluidos = tratamentos.filter(t => t.status === 'concluído').length;
        }
      }

      return newStats;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  });
};