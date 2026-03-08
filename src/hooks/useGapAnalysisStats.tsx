import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { logger } from '@/lib/logger';

export const useGapAnalysisStats = () => {
  const { profile } = useAuth();
  const empresaId = profile?.empresa_id;

  return useQuery({
    queryKey: ['gap-analysis-stats', empresaId],
    enabled: !!empresaId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      try {
        const { count: totalFrameworks, error: frameworksError } = await supabase
          .from('gap_analysis_frameworks')
          .select('*', { count: 'exact', head: true });

        if (frameworksError) throw frameworksError;

        const { data: frameworks, error: frameworksListError } = await supabase
          .from('gap_analysis_frameworks')
          .select('id');

        if (frameworksListError) throw frameworksListError;

        const { data: evaluations, error: evaluationsError } = await supabase
          .from('gap_analysis_evaluations')
          .select('conformity_status, evidence_status, framework_id')
          .eq('empresa_id', empresaId!)
          .limit(5000);

        if (evaluationsError) throw evaluationsError;

        const frameworkIds = new Set(frameworks?.map(f => f.id) || []);
        const filteredEvaluations = evaluations?.filter(e =>
          frameworkIds.has(e.framework_id)
        ) || [];

        let averageCompliance = 0;
        if (filteredEvaluations.length > 0) {
          const evaluatedItems = filteredEvaluations.filter(e =>
            e.conformity_status && e.conformity_status !== 'nao_aplicavel'
          );

          if (evaluatedItems.length > 0) {
            const totalScore = evaluatedItems.reduce((score, evaluation) => {
              switch (evaluation.conformity_status) {
                case 'conforme': return score + 100;
                case 'parcial': return score + 50;
                case 'nao_conforme': return score + 0;
                default: return score;
              }
            }, 0);
            averageCompliance = totalScore / evaluatedItems.length;
          }
        }

        const pendingItems = filteredEvaluations.filter(e =>
          e.evidence_status === 'pendente'
        ).length;

        const frameworksWithEvaluations = new Set<string>();
        filteredEvaluations.forEach(evaluation => {
          if (evaluation.conformity_status || evaluation.evidence_status) {
            frameworksWithEvaluations.add(evaluation.framework_id);
          }
        });

        return {
          totalFrameworks: totalFrameworks || 0,
          assessmentsInProgress: frameworksWithEvaluations.size,
          averageCompliance: Math.round(averageCompliance),
          pendingItems: pendingItems || 0
        };
      } catch (error) {
        logger.error('Gap Analysis Stats Error', { error: error instanceof Error ? error.message : String(error) });
        return { totalFrameworks: 0, assessmentsInProgress: 0, averageCompliance: 0, pendingItems: 0 };
      }
    },
  });
};
