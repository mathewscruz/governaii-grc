import { useOptimizedQuery } from './useOptimizedQuery';
import { supabase } from '@/integrations/supabase/client';

export const useGapAnalysisStats = () => {
  return useOptimizedQuery(
    async () => {
      try {
        // Total de frameworks
        const { count: totalFrameworks, error: frameworksError } = await supabase
          .from('gap_analysis_frameworks')
          .select('*', { count: 'exact', head: true });

        if (frameworksError) throw frameworksError;

        // Avaliações em andamento
        const { count: assessmentsInProgress, error: assessmentsError } = await supabase
          .from('gap_analysis_assessments')
          .select('*', { count: 'exact', head: true })
          .in('status', ['em_andamento', 'pausada']);

        if (assessmentsError) throw assessmentsError;

        // Calcular conformidade média baseada nas avaliações reais
        const { data: evaluations, error: evaluationsError } = await supabase
          .from('gap_analysis_evaluations')
          .select('conformity_status');

        if (evaluationsError) throw evaluationsError;

        let averageCompliance = 0;
        if (evaluations && evaluations.length > 0) {
          const conformeCount = evaluations.filter(e => e.conformity_status === 'conforme').length;
          const totalEvaluated = evaluations.filter(e => e.conformity_status && e.conformity_status !== 'nao_aplicavel').length;
          averageCompliance = totalEvaluated > 0 ? (conformeCount / totalEvaluated) * 100 : 0;
        }

        // Itens pendentes (avaliações não conformes + evidências pendentes)
        const { data: pendingEvaluations, error: pendingError } = await supabase
          .from('gap_analysis_evaluations')
          .select('conformity_status, evidence_status');

        let pendingItems = 0;
        if (!pendingError && pendingEvaluations) {
          const nonCompliantCount = pendingEvaluations.filter(e => 
            e.conformity_status === 'nao_conforme' || e.conformity_status === 'parcial'
          ).length;
          const pendingEvidenceCount = pendingEvaluations.filter(e => 
            e.evidence_status === 'pendente' || e.evidence_status === 'em_analise'
          ).length;
          pendingItems = nonCompliantCount + pendingEvidenceCount;
        }

        return {
          data: {
            totalFrameworks: totalFrameworks || 0,
            assessmentsInProgress: assessmentsInProgress || 0,
            averageCompliance: Math.round(averageCompliance),
            pendingItems: pendingItems || 0
          },
          error: null
        };
      } catch (error) {
        return {
          data: null,
          error: error
        };
      }
    },
    [],
    {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheKey: 'gap-analysis-stats',
      cacheDuration: 10 // 10 minutos
    }
  );
};