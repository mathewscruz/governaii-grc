import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { FrameworkCard } from '@/components/gap-analysis/FrameworkCard';
import { FrameworkComparisonRadar } from '@/components/gap-analysis/FrameworkComparisonRadar';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaId } from '@/hooks/useEmpresaId';
import { useGapAnalysisStats } from '@/hooks/useGapAnalysisStats';
import { ClipboardList, Activity, TrendingUp, AlertTriangle, Shield } from 'lucide-react';
import { logger } from '@/lib/logger';

interface Framework {
  id: string;
  nome: string;
  versao: string;
  tipo_framework: string;
  descricao?: string;
}

interface FrameworkProgress {
  totalRequirements: number;
  evaluatedRequirements: number;
  conformeCount: number;
  averageScore: number;
}

interface StatusCounts {
  conforme: number;
  parcial: number;
  nao_conforme: number;
  nao_aplicavel: number;
  nao_avaliado: number;
}

export default function GapAnalysisFrameworks() {
  const navigate = useNavigate();
  const { empresaId } = useEmpresaId();
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [requirementCounts, setRequirementCounts] = useState<Record<string, number>>({});
  const [frameworkProgress, setFrameworkProgress] = useState<Record<string, FrameworkProgress>>({});
  const [frameworkStatusCounts, setFrameworkStatusCounts] = useState<Record<string, StatusCounts>>({});
  const [loading, setLoading] = useState(true);

  const { data: stats } = useGapAnalysisStats();

  useEffect(() => {
    loadFrameworks();
  }, [empresaId]);

  const loadFrameworks = async () => {
    try {
      setLoading(true);
      const { data: fws, error: fwError } = await supabase
        .from('gap_analysis_frameworks')
        .select('*')
        .is('empresa_id', null)
        .eq('is_template', true)
        .order('nome', { ascending: true });

      if (fwError) throw fwError;
      setFrameworks(fws || []);

      const frameworkIds = (fws || []).map(fw => fw.id);
      const counts: Record<string, number> = {};
      const progress: Record<string, FrameworkProgress> = {};
      const statusCountsMap: Record<string, StatusCounts> = {};

      if (frameworkIds.length > 0) {
        const { data: allRequirements, error: reqError } = await supabase
          .from('gap_analysis_requirements')
          .select('id, framework_id')
          .in('framework_id', frameworkIds);

        if (!reqError && allRequirements) {
          allRequirements.forEach(req => {
            counts[req.framework_id] = (counts[req.framework_id] || 0) + 1;
          });

          if (empresaId) {
            const { data: allEvaluations, error: evalError } = await supabase
              .from('gap_analysis_evaluations')
              .select('conformity_status, framework_id')
              .in('framework_id', frameworkIds)
              .eq('empresa_id', empresaId);

            if (!evalError && allEvaluations) {
              const evalsByFramework = new Map<string, typeof allEvaluations>();
              allEvaluations.forEach(ev => {
                const existing = evalsByFramework.get(ev.framework_id) || [];
                existing.push(ev);
                evalsByFramework.set(ev.framework_id, existing);
              });

              frameworkIds.forEach(fwId => {
                const evals = evalsByFramework.get(fwId) || [];
                const evaluated = evals.filter(e =>
                  e.conformity_status && e.conformity_status !== 'nao_avaliado'
                );
                const conforme = evals.filter(e => e.conformity_status === 'conforme').length;
                const parcial = evals.filter(e => e.conformity_status === 'parcial').length;
                const nao_conforme = evals.filter(e => e.conformity_status === 'nao_conforme').length;
                const nao_aplicavel = evals.filter(e => e.conformity_status === 'nao_aplicavel').length;
                const totalReqs = counts[fwId] || 0;
                const nao_avaliado = totalReqs - conforme - parcial - nao_conforme - nao_aplicavel;

                statusCountsMap[fwId] = { conforme, parcial, nao_conforme, nao_aplicavel, nao_avaliado: Math.max(0, nao_avaliado) };

                let avgScore = 0;
                if (evaluated.length > 0) {
                  const totalScore = evaluated.reduce((acc, e) => {
                    if (e.conformity_status === 'conforme') return acc + 100;
                    if (e.conformity_status === 'parcial') return acc + 50;
                    return acc;
                  }, 0);
                  avgScore = Math.round(totalScore / evaluated.length);
                }

                progress[fwId] = {
                  totalRequirements: totalReqs,
                  evaluatedRequirements: evaluated.length,
                  conformeCount: conforme,
                  averageScore: avgScore
                };
              });
            }
          }
        }
      }

      setRequirementCounts(counts);
      setFrameworkProgress(progress);
      setFrameworkStatusCounts(statusCountsMap);
    } catch (error) {
      logger.error('Erro ao carregar frameworks', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  // Split active vs available
  const { activeFrameworks, availableFrameworks } = useMemo(() => {
    const active: Framework[] = [];
    const available: Framework[] = [];
    frameworks.forEach(fw => {
      const p = frameworkProgress[fw.id];
      if (p && p.evaluatedRequirements > 0) {
        active.push(fw);
      } else {
        available.push(fw);
      }
    });
    return { activeFrameworks: active, availableFrameworks: available };
  }, [frameworks, frameworkProgress]);

  // Radar data
  const comparisonData = useMemo(() => {
    return activeFrameworks.map(fw => ({
      name: fw.nome,
      score: frameworkProgress[fw.id]?.averageScore || 0,
    }));
  }, [activeFrameworks, frameworkProgress]);

  const handleFrameworkClick = (framework: Framework) => {
    navigate(`/gap-analysis/framework/${framework.id}`);
  };

  if (loading) {
    return (
      <ErrorBoundary>
        <div className="space-y-6">
          <PageHeader title="Frameworks de Conformidade" description="Selecione um framework para avaliar a conformidade organizacional" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map(i => (<div key={i} className="h-24 bg-muted rounded-lg" />))}
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <PageHeader title="Frameworks de Conformidade" description="Selecione um framework para avaliar a conformidade organizacional" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total de Frameworks" value={stats?.totalFrameworks || frameworks.length} icon={<ClipboardList className="h-4 w-4" />} description="Frameworks disponíveis" />
          <StatCard title="Avaliações em Andamento" value={activeFrameworks.length} icon={<Activity className="h-4 w-4" />} description="Frameworks com avaliações iniciadas" />
          <StatCard title="Conformidade Média" value={`${stats?.averageCompliance || 0}%`} icon={<TrendingUp className="h-4 w-4" />} description="Média geral de conformidade" />
          <StatCard title="Itens Pendentes" value={stats?.pendingItems || 0} icon={<AlertTriangle className="h-4 w-4" />} description="Evidências pendentes" />
        </div>

        {/* Radar comparativo */}
        {comparisonData.length >= 2 && (
          <FrameworkComparisonRadar data={comparisonData} />
        )}

        {/* Frameworks Ativos */}
        {activeFrameworks.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Frameworks Ativos
              <span className="text-sm font-normal text-muted-foreground">({activeFrameworks.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeFrameworks.map((framework) => (
                <FrameworkCard
                  key={framework.id}
                  id={framework.id}
                  nome={framework.nome}
                  versao={framework.versao}
                  tipo_framework={framework.tipo_framework}
                  descricao={framework.descricao}
                  requirementCount={requirementCounts[framework.id] || 0}
                  progress={frameworkProgress[framework.id]}
                  statusCounts={frameworkStatusCounts[framework.id]}
                  variant="active"
                  onClick={() => handleFrameworkClick(framework)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Frameworks Disponíveis */}
        {availableFrameworks.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              Frameworks Disponíveis
              <span className="text-sm font-normal text-muted-foreground">({availableFrameworks.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {availableFrameworks.map((framework) => (
                <FrameworkCard
                  key={framework.id}
                  id={framework.id}
                  nome={framework.nome}
                  versao={framework.versao}
                  tipo_framework={framework.tipo_framework}
                  descricao={framework.descricao}
                  requirementCount={requirementCounts[framework.id] || 0}
                  variant="available"
                  onClick={() => handleFrameworkClick(framework)}
                />
              ))}
            </div>
          </div>
        )}

        {frameworks.length === 0 && (
          <EmptyState
            icon={<Shield className="h-8 w-8" />}
            title="Nenhum framework disponível"
            description="Entre em contato com o administrador para habilitar frameworks de conformidade."
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
