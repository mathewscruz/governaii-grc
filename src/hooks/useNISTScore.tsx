import { useOptimizedQuery } from './useOptimizedQuery';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaId } from './useEmpresaId';

// Mapeamento de status para pontuação
const STATUS_SCORES: Record<string, number | null> = {
  'conforme': 5.0,
  'parcial': 2.5,
  'nao_conforme': 0.0,
  'nao_aplicavel': null // Não conta no cálculo
};

// Pilares do NIST CSF 2.0
export const NIST_PILLARS = [
  { code: 'GOVERN', name: 'Governar', color: 'hsl(var(--chart-1))' },
  { code: 'IDENTIFY', name: 'Identificar', color: 'hsl(var(--chart-2))' },
  { code: 'PROTECT', name: 'Proteger', color: 'hsl(var(--chart-3))' },
  { code: 'DETECT', name: 'Detectar', color: 'hsl(var(--chart-4))' },
  { code: 'RESPOND', name: 'Responder', color: 'hsl(var(--chart-5))' },
  { code: 'RECOVER', name: 'Recuperar', color: 'hsl(var(--primary))' }
];

// Escala de classificação
export const getScoreClassification = (score: number): { label: string; variant: 'success' | 'info' | 'warning' | 'destructive' | 'default' } => {
  if (score >= 4.5) return { label: 'Excelente', variant: 'success' };
  if (score >= 3.5) return { label: 'Bom', variant: 'info' };
  if (score >= 2.5) return { label: 'Regular', variant: 'warning' };
  if (score >= 1.5) return { label: 'Insuficiente', variant: 'destructive' };
  return { label: 'Crítico', variant: 'destructive' };
};

interface NISTRequirement {
  id: string;
  codigo: string;
  titulo: string;
  descricao: string;
  categoria: string;
  area_responsavel: string;
  peso: number;
  obrigatorio: boolean;
  ordem: number;
  conformity_status?: string | null;
  evidence_status?: string | null;
}

interface PillarScore {
  pillar: string;
  name: string;
  score: number;
  totalRequirements: number;
  evaluatedRequirements: number;
  conformeCount: number;
  parcialCount: number;
  naoConformeCount: number;
  naCount: number;
  color: string;
}

interface NISTScore {
  overallScore: number;
  pillarScores: PillarScore[];
  totalRequirements: number;
  evaluatedRequirements: number;
  progressPercentage: number;
}

export const useNISTScore = (frameworkId: string) => {
  const { empresaId } = useEmpresaId();

  return useOptimizedQuery(
    async () => {
      if (!empresaId || !frameworkId) {
        return {
          data: null,
          error: 'Missing empresaId or frameworkId'
        };
      }

      try {
        // Buscar requisitos do framework
        const { data: requirements, error: reqError } = await supabase
          .from('gap_analysis_requirements')
          .select('*')
          .eq('framework_id', frameworkId)
          .order('ordem', { ascending: true });

        if (reqError) throw reqError;

        // Buscar avaliações existentes
        const { data: evaluations, error: evalError } = await supabase
          .from('gap_analysis_evaluations')
          .select('*')
          .eq('framework_id', frameworkId);

        if (evalError) throw evalError;

        // Mapear avaliações por requirement_id
        const evaluationMap = new Map(
          evaluations?.map(e => [e.requirement_id, e]) || []
        );

        // Combinar requirements com evaluations
        const enrichedRequirements: NISTRequirement[] = requirements?.map(req => ({
          ...req,
          conformity_status: evaluationMap.get(req.id)?.conformity_status || null,
          evidence_status: evaluationMap.get(req.id)?.evidence_status || null
        })) || [];

        // Calcular score por pilar
        const pillarScores: PillarScore[] = NIST_PILLARS.map(pillar => {
          const pillarReqs = enrichedRequirements.filter(r => r.categoria === pillar.code);
          const evaluatedReqs = pillarReqs.filter(r => r.conformity_status && r.conformity_status !== null);

          let totalWeightedScore = 0;
          let totalWeight = 0;

          // CORREÇÃO: Considerar TODOS os requisitos (não avaliados = 0 pontos)
          pillarReqs.forEach(req => {
            const status = req.conformity_status;
            let score: number;
            
            if (status === 'nao_aplicavel') {
              // N/A não entra no cálculo
              return;
            } else if (status && STATUS_SCORES[status] !== null && STATUS_SCORES[status] !== undefined) {
              // Requisito avaliado: usar pontuação do status
              score = STATUS_SCORES[status] as number;
            } else {
              // Não avaliado = 0 pontos (comportamento de auditoria real)
              score = 0;
            }
            
            totalWeightedScore += score * req.peso;
            totalWeight += req.peso;
          });

          const pillarScore = totalWeight > 0 ? Number((totalWeightedScore / totalWeight).toFixed(1)) : 0;

          const conformeCount = pillarReqs.filter(r => r.conformity_status === 'conforme').length;
          const parcialCount = pillarReqs.filter(r => r.conformity_status === 'parcial').length;
          const naoConformeCount = pillarReqs.filter(r => r.conformity_status === 'nao_conforme').length;
          const naCount = pillarReqs.filter(r => r.conformity_status === 'nao_aplicavel').length;

          return {
            pillar: pillar.code,
            name: pillar.name,
            score: pillarScore,
            totalRequirements: pillarReqs.length,
            evaluatedRequirements: evaluatedReqs.length,
            conformeCount,
            parcialCount,
            naoConformeCount,
            naCount,
            color: pillar.color
          };
        });

        // Calcular score geral (média dos pilares)
        const validPillarScores = pillarScores.filter(p => p.totalRequirements > 0 && p.evaluatedRequirements > 0);
        const overallScore = validPillarScores.length > 0
          ? Number((validPillarScores.reduce((sum, p) => sum + p.score, 0) / validPillarScores.length).toFixed(1))
          : 0;

        const totalRequirements = enrichedRequirements.length;
        const evaluatedRequirements = enrichedRequirements.filter(r => r.conformity_status && r.conformity_status !== null).length;
        const progressPercentage = totalRequirements > 0 ? Math.round((evaluatedRequirements / totalRequirements) * 100) : 0;

        const result: NISTScore = {
          overallScore,
          pillarScores,
          totalRequirements,
          evaluatedRequirements,
          progressPercentage
        };

        return {
          data: result,
          error: null
        };
      } catch (error) {
        console.error('NIST Score Error:', error);
        return {
          data: null,
          error: error
        };
      }
    },
    [empresaId, frameworkId],
    {
      staleTime: 0,
      cacheKey: `nist-score-${frameworkId}`,
      cacheDuration: 0
    }
  );
};
