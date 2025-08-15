import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  criticalAlerts: number;
  riscosAltos: number;
  denunciasPendentes: number;
  controlesVencendo: number;
  incidentesCriticos: number;
}

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      // Query consolidada para otimizar performance
      const [riscosResult, denunciasResult, controlesResult, incidentesResult] = await Promise.all([
        // Buscar riscos críticos
        supabase
          .from('riscos')
          .select('nivel_risco_inicial'),

        // Buscar denúncias pendentes
        supabase
          .from('denuncias')
          .select('status')
          .in('status', ['nova', 'em_investigacao']),

        // Buscar controles vencendo (próximos 30 dias)
        (() => {
          const dataLimite = new Date();
          dataLimite.setDate(dataLimite.getDate() + 30);
          return supabase
            .from('controles')
            .select('proxima_avaliacao')
            .lte('proxima_avaliacao', dataLimite.toISOString())
            .gte('proxima_avaliacao', new Date().toISOString());
        })(),

        // Buscar incidentes críticos
        supabase
          .from('incidentes')
          .select('criticidade, status')
          .eq('criticidade', 'critica')
          .in('status', ['aberto', 'investigacao'])
      ]);

      const riscosAltos = riscosResult.data?.filter(r => 
        r.nivel_risco_inicial === 'Alto' || 
        r.nivel_risco_inicial === 'Crítico' || 
        r.nivel_risco_inicial === 'Muito Alto'
      ).length || 0;

      const denunciasPendentes = denunciasResult.data?.length || 0;
      const controlesVencendo = controlesResult.data?.length || 0;
      const incidentesCriticos = incidentesResult.data?.length || 0;

      // Alertas críticos consolidados
      const criticalAlerts = denunciasPendentes + controlesVencendo + riscosAltos + incidentesCriticos;

      return {
        criticalAlerts,
        riscosAltos,
        denunciasPendentes,
        controlesVencendo,
        incidentesCriticos
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutos para dados críticos
  });
};