import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, FileText, Users, TrendingUp } from 'lucide-react';
import { useGapAnalysisStats } from '@/hooks/useGapAnalysisStats';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { FrameworkCard } from '@/components/gap-analysis/FrameworkCard';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaId } from '@/hooks/useEmpresaId';

interface Framework {
  id: string;
  nome: string;
  versao: string;
  tipo_framework: string;
  descricao?: string;
  tipo?: string;
}

export default function GapAnalysisFrameworks() {
  const navigate = useNavigate();
  const { empresaId } = useEmpresaId();
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [requirementCounts, setRequirementCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const { data: stats, loading: statsLoading } = useGapAnalysisStats();

  useEffect(() => {
    loadFrameworks();
  }, [empresaId]);

  const loadFrameworks = async () => {
    if (!empresaId) return;

    try {
      setLoading(true);

      // Buscar todos os frameworks (padrão e personalizados)
      const { data: fws, error: fwError } = await supabase
        .from('gap_analysis_frameworks')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false });

      if (fwError) throw fwError;

      setFrameworks(fws || []);

      // Buscar contagem de requisitos para cada framework
      const counts: Record<string, number> = {};
      for (const fw of fws || []) {
        const { count, error: countError } = await supabase
          .from('gap_analysis_requirements')
          .select('*', { count: 'exact', head: true })
          .eq('framework_id', fw.id);

        if (!countError) {
          counts[fw.id] = count || 0;
        }
      }

      setRequirementCounts(counts);
    } catch (error) {
      console.error('Erro ao carregar frameworks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFrameworkClick = (framework: Framework) => {
    navigate(`/gap-analysis/framework/${framework.id}`);
  };

  const getComplianceVariant = (compliance: number): "success" | "info" | "warning" | "destructive" => {
    if (compliance >= 80) return "success";
    if (compliance >= 60) return "info";
    if (compliance >= 40) return "warning";
    return "destructive";
  };

  if (loading) {
    return (
      <ErrorBoundary>
        <div className="space-y-6">
          <PageHeader
            title="Frameworks de Conformidade"
            description="Selecione um framework para avaliar a conformidade organizacional"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map(i => (
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

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total de Frameworks"
            value={stats?.totalFrameworks || 0}
            description="Frameworks cadastrados"
            icon={<FileText className="h-4 w-4" />}
            loading={statsLoading}
          />
          <StatCard
            title="Avaliações em Andamento"
            value={stats?.assessmentsInProgress || 0}
            description="Avaliações ativas"
            icon={<BarChart3 className="h-4 w-4" />}
            variant="warning"
            loading={statsLoading}
          />
          <StatCard
            title="Conformidade Média"
            value={`${stats?.averageCompliance || 0}%`}
            description="Índice de conformidade"
            icon={<TrendingUp className="h-4 w-4" />}
            variant={getComplianceVariant(stats?.averageCompliance || 0)}
            loading={statsLoading}
          />
          <StatCard
            title="Itens Pendentes"
            value={stats?.pendingItems || 0}
            description="Atribuições pendentes"
            icon={<Users className="h-4 w-4" />}
            loading={statsLoading}
          />
        </div>

        {/* Framework Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {frameworks.map((framework) => (
            <FrameworkCard
              key={framework.id}
              id={framework.id}
              nome={framework.nome}
              versao={framework.versao}
              tipo_framework={framework.tipo_framework}
              descricao={framework.descricao}
              requirementCount={requirementCounts[framework.id] || 0}
              onClick={() => handleFrameworkClick(framework)}
            />
          ))}
        </div>

        {frameworks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Nenhum framework disponível. Entre em contato com o administrador.
            </p>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
