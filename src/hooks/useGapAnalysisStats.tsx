import { useOptimizedQuery } from './useOptimizedQuery';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export const useGapAnalysisStats = () => {
  return useOptimizedQuery(
    async () => {
      try {
        // Total de frameworks da empresa do usuário
        const { count: totalFrameworks, error: frameworksError } = await supabase
          .from('gap_analysis_frameworks')
          .select('*', { count: 'exact', head: true });

        if (frameworksError) throw frameworksError;

        // Buscar frameworks ativos da empresa
        const { data: frameworks, error: frameworksListError } = await supabase
          .from('gap_analysis_frameworks')
          .select('id');

        if (frameworksListError) throw frameworksListError;

        // Buscar todas as avaliações
        const { data: evaluations, error: evaluationsError } = await supabase
          .from('gap_analysis_evaluations')
          .select('conformity_status, evidence_status, framework_id');

        if (evaluationsError) throw evaluationsError;

        // Filtrar avaliações apenas dos frameworks da empresa do usuário
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
          
          logger.debug('Gap Analysis - Itens avaliados', { count: evaluatedItems.length });
          
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
            logger.debug('Gap Analysis - Score', { totalScore, averageCompliance });
          }
        }

        // Itens pendentes (evidências pendentes)
        const pendingItems = filteredEvaluations.filter(e => 
          e.evidence_status === 'pendente'
        ).length;

        // Frameworks em andamento (que têm avaliações preenchidas)
        const frameworksWithEvaluations = new Set();
        filteredEvaluations.forEach(evaluation => {
          if (evaluation.conformity_status || evaluation.evidence_status) {
            frameworksWithEvaluations.add(evaluation.framework_id);
          }
        });

        const assessmentsInProgress = frameworksWithEvaluations.size;

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
        logger.error('Gap Analysis Stats Error', { error: error instanceof Error ? error.message : String(error) });
        return {
          data: {
            totalFrameworks: 0,
            assessmentsInProgress: 0,
            averageCompliance: 0,
            pendingItems: 0
          },
          error: error
        };
      }
    },
    [],
    {
      staleTime: 5 * 60 * 1000, // 5 minutos de cache
      cacheKey: 'gap-analysis-stats',
      cacheDuration: 5 * 60 * 1000
    }
  );
};