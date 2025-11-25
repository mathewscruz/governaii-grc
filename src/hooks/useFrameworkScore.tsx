import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaId } from './useEmpresaId';
import { FrameworkConfig } from '@/lib/framework-configs';

interface Requirement {
  id: string;
  codigo?: string | null;
  titulo: string;
  categoria?: string | null;
  area_responsavel?: string | null;
  peso?: number | null;
}

interface Evaluation {
  requirement_id: string;
  conformity_status?: string | null;
}

interface PillarScore {
  pillar: string;
  name: string;
  score: number;
  totalRequirements: number;
  evaluatedRequirements: number;
  color: string;
}

interface DomainScore {
  domain: string;
  name: string;
  score: number;
  totalRequirements: number;
  evaluatedRequirements: number;
  color: string;
}

interface AreaScore {
  area: string;
  score: number;
  totalRequirements: number;
  evaluatedRequirements: number;
}

interface SectionScore {
  section: string;
  name: string;
  score: number;
  totalRequirements: number;
  evaluatedRequirements: number;
}

interface CategoryScore {
  category: string;
  score: number;
  total: number;
  evaluated: number;
}

interface FrameworkScore {
  overallScore: number;
  pillarScores: PillarScore[];
  domainScores: DomainScore[];
  areaScores: AreaScore[];
  sectionScores: SectionScore[];
  categoryScores: CategoryScore[];
  totalRequirements: number;
  evaluatedRequirements: number;
  loading: boolean;
  error: Error | null;
}

const PILLAR_COLORS: Record<string, string> = {
  'GOVERN': '#3b82f6',
  'IDENTIFY': '#10b981',
  'PROTECT': '#f59e0b',
  'DETECT': '#ef4444',
  'RESPOND': '#8b5cf6',
  'RECOVER': '#06b6d4',
  'Governança': '#3b82f6',
  'Gestão de Riscos': '#10b981',
  'Segurança': '#f59e0b',
  'Conformidade': '#ef4444',
  'Monitoramento': '#8b5cf6',
  'Auditoria': '#06b6d4',
  'Operações': '#ec4899',
};

export function useFrameworkScore(frameworkId: string, config: FrameworkConfig): FrameworkScore {
  const { empresaId } = useEmpresaId();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [overallScore, setOverallScore] = useState(0);
  const [pillarScores, setPillarScores] = useState<PillarScore[]>([]);
  const [domainScores, setDomainScores] = useState<DomainScore[]>([]);
  const [areaScores, setAreaScores] = useState<AreaScore[]>([]);
  const [sectionScores, setSectionScores] = useState<SectionScore[]>([]);
  const [categoryScores, setCategoryScores] = useState<CategoryScore[]>([]);
  const [totalRequirements, setTotalRequirements] = useState(0);
  const [evaluatedRequirements, setEvaluatedRequirements] = useState(0);

  useEffect(() => {
    if (!frameworkId || !empresaId) return;

    const loadScore = async () => {
      try {
        setLoading(true);
        setError(null);

        // Buscar requisitos do framework
        const { data: requirements, error: reqError } = await supabase
          .from('gap_analysis_requirements')
          .select('id, codigo, titulo, categoria, area_responsavel, peso')
          .eq('framework_id', frameworkId)
          .order('ordem', { ascending: true });

        if (reqError) throw reqError;

        // Buscar avaliações existentes
        const { data: evaluations, error: evalError } = await supabase
          .from('gap_analysis_evaluations')
          .select('requirement_id, conformity_status')
          .eq('framework_id', frameworkId)
          .eq('empresa_id', empresaId);

        if (evalError) throw evalError;

        // Criar mapa de avaliações
        const evalMap = new Map<string, Evaluation>();
        (evaluations || []).forEach((e: Evaluation) => {
          evalMap.set(e.requirement_id, e);
        });

        // Agrupar requisitos por pilar
        const pillarGroups = new Map<string, Requirement[]>();
        (requirements || []).forEach((req: Requirement) => {
          const pillar = req.categoria || 'Outros';
          if (!pillarGroups.has(pillar)) {
            pillarGroups.set(pillar, []);
          }
          pillarGroups.get(pillar)?.push(req);
        });

        // Calcular scores por pilar
        const calculatedPillarScores: PillarScore[] = [];
        
        pillarGroups.forEach((reqs, pillarName) => {
          let totalWeightedScore = 0;
          let totalWeight = 0;
          let evaluated = 0;

          reqs.forEach((req) => {
            const evaluation = evalMap.get(req.id);
            const status = evaluation?.conformity_status || 'nao_avaliado';
            const weight = req.peso || 1;

            if (status !== 'nao_aplicavel') {
              const score = config.statusScores[status as keyof typeof config.statusScores] || 0;
              totalWeightedScore += score * weight;
              totalWeight += weight;
              
              if (status !== 'nao_avaliado') {
                evaluated++;
              }
            }
          });

          const pillarScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
          
          calculatedPillarScores.push({
            pillar: pillarName,
            name: pillarName,
            score: pillarScore,
            totalRequirements: reqs.length,
            evaluatedRequirements: evaluated,
            color: PILLAR_COLORS[pillarName] || '#6b7280',
          });
        });

        // Calcular score geral (média dos pilares que têm requisitos)
        const validPillars = calculatedPillarScores.filter(p => p.totalRequirements > 0);
        const overall = validPillars.length > 0
          ? validPillars.reduce((sum, p) => sum + p.score, 0) / validPillars.length
          : 0;

        const totalEvaluated = calculatedPillarScores.reduce((sum, p) => sum + p.evaluatedRequirements, 0);

        setOverallScore(overall);
        setPillarScores(calculatedPillarScores);
        
        // Convert pillar scores to category scores format
        const calculatedCategoryScores: CategoryScore[] = calculatedPillarScores.map(pillar => ({
          category: pillar.name,
          score: pillar.score,
          total: pillar.totalRequirements,
          evaluated: pillar.evaluatedRequirements
        }));
        setCategoryScores(calculatedCategoryScores);
        
        setDomainScores([]);
        setAreaScores([]);
        setSectionScores([]);
        setTotalRequirements(requirements?.length || 0);
        setEvaluatedRequirements(totalEvaluated);
      } catch (err: any) {
        console.error('Erro ao calcular score:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    loadScore();
  }, [frameworkId, empresaId, config]);

  return {
    overallScore,
    pillarScores,
    domainScores,
    areaScores,
    sectionScores,
    categoryScores,
    totalRequirements,
    evaluatedRequirements,
    loading,
    error,
  };
}
