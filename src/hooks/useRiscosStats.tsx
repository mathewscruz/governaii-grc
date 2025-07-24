import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

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
  const { profile } = useAuth();
  const [stats, setStats] = useState<RiscosStats>({
    total: 0,
    criticos: 0,
    altos: 0,
    medios: 0,
    baixos: 0,
    tratamentos_pendentes: 0,
    tratamentos_andamento: 0,
    tratamentos_concluidos: 0,
    aceitos: 0,
    tratados: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!profile?.empresa_id) return;

    try {
      setLoading(true);
      setError(null);

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

      setStats(newStats);
    } catch (error: any) {
      console.error('Erro ao buscar estatísticas de riscos:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [profile?.empresa_id]);

  const refetch = () => {
    fetchStats();
  };

  return {
    stats,
    loading,
    error,
    refetch
  };
};