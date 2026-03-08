import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

interface AlertDetail {
  id: string;
  title: string;
  description?: string;
  type: 'risco' | 'denuncia' | 'controle' | 'incidente';
}

interface DashboardStats {
  criticalAlerts: number;
  riscosAltos: number;
  denunciasPendentes: number;
  controlesVencendo: number;
  incidentesCriticos: number;
  alertDetails: AlertDetail[];
  lastUpdated: Date;
}

export const useDashboardStats = () => {
  const { profile } = useAuth();
  const empresaId = profile?.empresa_id;

  return useQuery({
    queryKey: ['dashboard-stats', empresaId],
    enabled: !!empresaId,
    queryFn: async (): Promise<DashboardStats> => {
      const alertDetails: AlertDetail[] = [];
      
      const [riscosResult, denunciasResult, controlesResult, incidentesResult] = await Promise.all([
        supabase
          .from('riscos')
          .select('id, nome, descricao, nivel_risco_inicial')
          .eq('empresa_id', empresaId!)
          .in('nivel_risco_inicial', ['Alto', 'Crítico', 'Muito Alto']),

        supabase
          .from('denuncias')
          .select('id, titulo, descricao, status')
          .eq('empresa_id', empresaId!)
          .in('status', ['nova', 'em_investigacao']),

        (() => {
          const dataLimite = new Date();
          dataLimite.setDate(dataLimite.getDate() + 30);
          return supabase
            .from('controles')
            .select('id, nome, descricao, proxima_avaliacao')
            .eq('empresa_id', empresaId!)
            .lte('proxima_avaliacao', dataLimite.toISOString())
            .gte('proxima_avaliacao', new Date().toISOString());
        })(),

        supabase
          .from('incidentes')
          .select('id, titulo, descricao, criticidade, status')
          .eq('empresa_id', empresaId!)
          .eq('criticidade', 'critica')
          .in('status', ['aberto', 'investigacao'])
      ]);

      // Processar riscos
      const riscosAltos = riscosResult.data?.length || 0;
      riscosResult.data?.forEach(r => {
        alertDetails.push({ id: r.id, title: r.nome, description: r.descricao || undefined, type: 'risco' });
      });

      // Processar denúncias
      const denunciasPendentes = denunciasResult.data?.length || 0;
      denunciasResult.data?.forEach(d => {
        alertDetails.push({ id: d.id, title: d.titulo, description: d.descricao || undefined, type: 'denuncia' });
      });

      // Processar controles
      const controlesVencendo = controlesResult.data?.length || 0;
      controlesResult.data?.forEach(c => {
        alertDetails.push({ id: c.id, title: c.nome, description: c.descricao || undefined, type: 'controle' });
      });

      // Processar incidentes
      const incidentesCriticos = incidentesResult.data?.length || 0;
      incidentesResult.data?.forEach(i => {
        alertDetails.push({ id: i.id, title: i.titulo, description: i.descricao || undefined, type: 'incidente' });
      });

      const criticalAlerts = denunciasPendentes + controlesVencendo + riscosAltos + incidentesCriticos;

      return {
        criticalAlerts,
        riscosAltos,
        denunciasPendentes,
        controlesVencendo,
        incidentesCriticos,
        alertDetails,
        lastUpdated: new Date()
      };
    },
    staleTime: 2 * 60 * 1000,
  });
};
