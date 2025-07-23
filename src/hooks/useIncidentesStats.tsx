import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface IncidentesStats {
  total: number;
  abertos: number;
  investigacao: number;
  resolvidos: number;
  criticos: number;
  altos: number;
  medios: number;
  baixos: number;
  mes: number;
}

export const useIncidentesStats = () => {
  return useQuery({
    queryKey: ['incidentes-stats'],
    queryFn: async (): Promise<IncidentesStats> => {
      const { data: incidentes, error } = await supabase
        .from('incidentes')
        .select('status, criticidade, created_at');

      if (error) throw error;

      const total = incidentes?.length || 0;
      const abertos = incidentes?.filter(i => i.status === 'aberto').length || 0;
      const investigacao = incidentes?.filter(i => i.status === 'investigacao').length || 0;
      const resolvidos = incidentes?.filter(i => i.status === 'resolvido').length || 0;
      
      const criticos = incidentes?.filter(i => i.criticidade === 'critica').length || 0;
      const altos = incidentes?.filter(i => i.criticidade === 'alta').length || 0;
      const medios = incidentes?.filter(i => i.criticidade === 'media').length || 0;
      const baixos = incidentes?.filter(i => i.criticidade === 'baixa').length || 0;
      
      // Incidentes do mês atual
      const agora = new Date();
      const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
      const mes = incidentes?.filter(i => {
        return new Date(i.created_at) >= inicioMes;
      }).length || 0;

      return {
        total,
        abertos,
        investigacao,
        resolvidos,
        criticos,
        altos,
        medios,
        baixos,
        mes
      };
    },
  });
};