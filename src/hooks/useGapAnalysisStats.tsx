import { useOptimizedQuery } from './useOptimizedQuery';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaId } from './useEmpresaId';
import { logger } from '@/lib/logger';

export const useGapAnalysisStats = () => {
  const { empresaId } = useEmpresaId();

  return useOptimizedQuery(
    async () => {
      if (!empresaId) {
        return {
          data: { totalFrameworks: 0, assessmentsInProgress: 0, averageCompliance: 0, pendingItems: 0 },
          error: null
        };
      }

      try {
        // Total de frameworks (globais, empresa_id IS NULL)
        const { count: totalFrameworks, error: frameworksError } = await supabase
          .from('gap_analysis_frameworks')
          .select('*', { count: 'exact', head: true });

        if (frameworksError) throw frameworksError;

        // Buscar frameworks ativos
        const { data: frameworks, error: frameworksListError } = await supabase
          .from('gap_analysis_frameworks')
          .select('id');

        if (frameworksListError) throw frameworksListError;

        // Buscar avaliações filtradas por empresa_id (limit 5000 para evitar truncamento do default 1000)
        const { data: evaluations, error: evaluationsError } = await supabase
          .from('gap_analysis_evaluations')
          .select('conformity_status, evidence_status, framework_id')
          .eq('empresa_id', empresaId)
          .limit(5000);

        if (evaluationsError) throw evaluationsError;

        const frameworkIds = new Set(frameworks?.map(f => f.id) || []);
        const filteredEvaluations = evaluations?.filter(e => 
          frameworkIds.has(e.framework_id)
        ) || [];

        logger.debug('Gap Analysis - Avaliações filtradas', { count: filteredEvaluations.length });

        // Conformidade média
        let averageCompliance = 0;
        if (filteredEvaluations.length > 0) {
          const evaluatedItems = filteredEvaluations.filter(e => 
            e.conformity_status && e.conformity_status !== 'nao_aplicavel' && e.conformity_status !== null
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
          data: {
            totalFrameworks: totalFrameworks || 0,
            assessmentsInProgress: frameworksWithEvaluations.size,
            averageCompliance: Math.round(averageCompliance),
            pendingItems: pendingItems || 0
          },
          error: null
        };
      } catch (error) {
        logger.error('Gap Analysis Stats Error', { error: error instanceof Error ? error.message : String(error) });
        return {
          data: { totalFrameworks: 0, assessmentsInProgress: 0, averageCompliance: 0, pendingItems: 0 },
          error: error
        };
      }
    },
    [empresaId],
    {
      staleTime: 5,
      cacheKey: `gap-analysis-stats-${empresaId || 'none'}`,
      cacheDuration: 5
    }
  );
};
