import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { FrameworkCard } from '@/components/gap-analysis/FrameworkCard';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaId } from '@/hooks/useEmpresaId';
import { useGapAnalysisStats } from '@/hooks/useGapAnalysisStats';
import { ClipboardList, Activity, TrendingUp, AlertTriangle, Shield } from 'lucide-react';

interface Framework {
  id: string;
  nome: string;
  versao: string;
  tipo_framework: string;
  descricao?: string;
  tipo?: string;
}

interface FrameworkProgress {
  totalRequirements: number;
  evaluatedRequirements: number;
  conformeCount: number;
  averageScore: number;
}

export default function GapAnalysisFrameworks() {
  const navigate = useNavigate();
  const { empresaId } = useEmpresaId();
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [requirementCounts, setRequirementCounts] = useState<Record<string, number>>({});
  const [frameworkProgress, setFrameworkProgress] = useState<Record<string, FrameworkProgress>>({});
  const [loading, setLoading] = useState(true);
  
  const { data: stats } = useGapAnalysisStats();

  useEffect(() => {
    loadFrameworks();
  }, [empresaId]);

  const loadFrameworks = async () => {
    try {
      setLoading(true);

      // Buscar apenas frameworks globais (compartilhados entre todas as empresas)
      const { data: fws, error: fwError } = await supabase
        .from('gap_analysis_frameworks')
        .select('*')
        .is('empresa_id', null)
        .eq('is_template', true)
        .order('nome', { ascending: true });

      if (fwError) throw fwError;

      setFrameworks(fws || []);

      // Buscar contagem de requisitos e progresso para cada framework
      const counts: Record<string, number> = {};
      const progress: Record<string, FrameworkProgress> = {};

      for (const fw of fws || []) {
        // Contar requisitos
        const { data: requirements, error: countError } = await supabase
          .from('gap_analysis_requirements')
          .select('id')
          .eq('framework_id', fw.id);

        if (!countError && requirements) {
          counts[fw.id] = requirements.length;

          // Buscar avaliações da empresa para este framework
          if (empresaId) {
            const { data: evaluations, error: evalError } = await supabase
              .from('gap_analysis_evaluations')
              .select('conformity_status')
              .eq('framework_id', fw.id)
              .eq('empresa_id', empresaId);

            if (!evalError && evaluations) {
              const evaluated = evaluations.filter(e => 
                e.conformity_status && e.conformity_status !== 'nao_avaliado'
              );
              const conforme = evaluations.filter(e => e.conformity_status === 'conforme').length;
              
              // Calcular score médio (0-100%)
              let avgScore = 0;
              if (evaluated.length > 0) {
                const totalScore = evaluated.reduce((acc, e) => {
                  if (e.conformity_status === 'conforme') return acc + 100;
                  if (e.conformity_status === 'parcial') return acc + 50;
                  return acc;
                }, 0);
                avgScore = Math.round(totalScore / evaluated.length);
              }

              progress[fw.id] = {
                totalRequirements: requirements.length,
                evaluatedRequirements: evaluated.length,
                conformeCount: conforme,
                averageScore: avgScore
              };
            }
          }
        }
      }

      setRequirementCounts(counts);
      setFrameworkProgress(progress);
    } catch (error) {
      console.error('Erro ao carregar frameworks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFrameworkClick = (framework: Framework) => {
    navigate(`/gap-analysis/framework/${framework.id}`);
  };

  if (loading) {
    return (
      <ErrorBoundary>
        <div className="space-y-6">
          <PageHeader
            title="Frameworks de Conformidade"
            description="Selecione um framework para avaliar a conformidade organizacional"
          />
          {/* StatCards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-muted rounded-lg"></div>
            ))}
          </div>
          {/* Framework Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 animate-pulse">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-64 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <PageHeader
          title="Frameworks de Conformidade"
          description="Selecione um framework para avaliar a conformidade organizacional"
        />

        {/* StatCards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total de Frameworks"
            value={stats?.totalFrameworks || frameworks.length}
            icon={<ClipboardList className="h-4 w-4" />}
            description="Frameworks disponíveis"
          />
          <StatCard
            title="Avaliações em Andamento"
            value={stats?.assessmentsInProgress || 0}
            icon={<Activity className="h-4 w-4" />}
            description="Frameworks com avaliações iniciadas"
          />
          <StatCard
            title="Conformidade Média"
            value={`${stats?.averageCompliance || 0}%`}
            icon={<TrendingUp className="h-4 w-4" />}
            description="Média geral de conformidade"
          />
          <StatCard
            title="Itens Pendentes"
            value={stats?.pendingItems || 0}
            icon={<AlertTriangle className="h-4 w-4" />}
            description="Evidências pendentes"
          />
        </div>

        {/* Framework Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {frameworks.map((framework) => (
            <FrameworkCard
              key={framework.id}
              id={framework.id}
              nome={framework.nome}
              versao={framework.versao}
              tipo_framework={framework.tipo_framework}
              descricao={framework.descricao}
              requirementCount={requirementCounts[framework.id] || 0}
              progress={frameworkProgress[framework.id]}
              onClick={() => handleFrameworkClick(framework)}
            />
          ))}
        </div>

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
