import { useOptimizedQuery } from './useOptimizedQuery';
import { supabase } from '@/integrations/supabase/client';

export const useGapAnalysisStats = () => {
  return useOptimizedQuery(
    async () => {
      // Total de frameworks
      const { count: totalFrameworks } = await supabase
        .from('gap_analysis_frameworks')
        .select('*', { count: 'exact', head: true });

      // Avaliações em andamento
      const { count: assessmentsInProgress } = await supabase
        .from('gap_analysis_assessments')
        .select('*', { count: 'exact', head: true })
        .in('status', ['em_andamento', 'pausada']);

      // Calcular conformidade média
      const { data: evaluations } = await supabase
        .from('gap_analysis_evaluations')
        .select('status');

      let averageCompliance = 0;
      if (evaluations && evaluations.length > 0) {
        const conformeCount = evaluations.filter(e => e.status === 'conforme').length;
        const totalEvaluated = evaluations.filter(e => e.status !== 'nao_avaliado').length;
        averageCompliance = totalEvaluated > 0 ? (conformeCount / totalEvaluated) * 100 : 0;
      }

      // Itens pendentes (atribuições)
      const { count: pendingItems } = await supabase
        .from('gap_analysis_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pendente');

      return {
        data: {
          totalFrameworks: totalFrameworks || 0,
          assessmentsInProgress: assessmentsInProgress || 0,
          averageCompliance: Math.round(averageCompliance),
          pendingItems: pendingItems || 0
        },
        error: null
      };
    },
    [],
    {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheKey: 'gap-analysis-stats'
    }
  );
};