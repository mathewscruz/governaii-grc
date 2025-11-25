import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GenericScoreDashboard } from '@/components/gap-analysis/GenericScoreDashboard';
import { GenericRequirementsTable } from '@/components/gap-analysis/GenericRequirementsTable';
import { NISTRadarChart } from '@/components/gap-analysis/nist/NISTRadarChart';
import { CategoryBarChart } from '@/components/gap-analysis/CategoryBarChart';
import { AreaBarChart } from '@/components/gap-analysis/AreaBarChart';
import { FrameworkRadarChart } from '@/components/gap-analysis/charts/FrameworkRadarChart';
import { ISOProgressFunnel } from '@/components/gap-analysis/charts/ISOProgressFunnel';
import { PrivacyTreemap } from '@/components/gap-analysis/charts/PrivacyTreemap';
import { GovernanceGauge } from '@/components/gap-analysis/charts/GovernanceGauge';
import { ComplianceStackedBar } from '@/components/gap-analysis/charts/ComplianceStackedBar';
import { supabase } from '@/integrations/supabase/client';
import { getFrameworkConfig } from '@/lib/framework-configs';
import { useFrameworkScore } from '@/hooks/useFrameworkScore';
import { useEmpresaId } from '@/hooks/useEmpresaId';
import { toast } from 'sonner';

interface Framework {
  id: string;
  nome: string;
  versao: string;
  tipo_framework: string;
  descricao?: string;
}

export default function GapAnalysisFrameworkDetail() {
  const { frameworkId } = useParams<{ frameworkId: string }>();
  const navigate = useNavigate();
  const { empresaId } = useEmpresaId();
  const [framework, setFramework] = useState<Framework | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!frameworkId) return;

    const loadFramework = async () => {
      try {
        const { data, error } = await supabase
          .from('gap_analysis_frameworks')
          .select('*')
          .eq('id', frameworkId)
          .single();

        if (error) throw error;
        setFramework(data);
      } catch (error: any) {
        console.error('Erro ao carregar framework:', error);
        toast.error('Framework não encontrado');
        navigate('/gap-analysis/frameworks');
      } finally {
        setLoading(false);
      }
    };

    loadFramework();
  }, [frameworkId, navigate]);

  const config = useMemo(() => 
    framework ? getFrameworkConfig(framework.nome, framework.tipo_framework) : null,
    [framework?.nome, framework?.tipo_framework]
  );
  
  const defaultConfig = useMemo(() => getFrameworkConfig('default')!, []);
  
  const {
    overallScore,
    pillarScores,
    domainScores,
    areaScores,
    sectionScores,
    categoryScores,
    totalRequirements,
    evaluatedRequirements,
    loading: scoreLoading,
  } = useFrameworkScore(frameworkId || '', config || defaultConfig);

  const handleExportPDF = () => {
    toast.info('Exportação de PDF em desenvolvimento');
  };

  const handleScoreChange = () => {
    // Trigger re-calculation by re-mounting the hook (will happen automatically)
  };

  if (loading || !framework || !config) {
    return (
      <ErrorBoundary>
        <div className="space-y-6 animate-pulse">
          <div className="h-24 bg-muted rounded-lg"></div>
          <div className="h-64 bg-muted rounded-lg"></div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/gap-analysis/frameworks')}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        <PageHeader
          title={`${framework.nome} ${framework.versao}`}
          description={framework.descricao || `Avaliação de conformidade ${framework.tipo_framework}`}
          actions={
            <Button onClick={handleExportPDF} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          }
        />

        {/* Dashboard de Scores */}
        <GenericScoreDashboard
          overallScore={overallScore}
          pillarScores={pillarScores}
          domainScores={domainScores}
          areaScores={areaScores}
          sectionScores={sectionScores}
          categoryScores={categoryScores}
          totalRequirements={totalRequirements}
          evaluatedRequirements={evaluatedRequirements}
          config={config}
          loading={scoreLoading}
          frameworkId={frameworkId!}
        />

        {/* Charts - Dynamic by framework type */}
        {config?.chartType === 'radar' && pillarScores.length > 0 && (
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
            <FrameworkRadarChart 
              pillarScores={pillarScores} 
              maxScore={config.scoreType === 'percentage' ? 100 : 5} 
            />
            {categoryScores.length > 0 && (
              <CategoryBarChart categoryScores={categoryScores} config={config} />
            )}
            {areaScores.length > 0 && (
              <AreaBarChart areaScores={areaScores} config={config} />
            )}
          </div>
        )}
        
        {config?.chartType === 'funnel' && sectionScores.length > 0 && (
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <ISOProgressFunnel sectionScores={sectionScores} />
            {categoryScores.length > 0 && (
              <CategoryBarChart categoryScores={categoryScores} config={config} />
            )}
          </div>
        )}
        
        {config?.chartType === 'treemap' && categoryScores.length > 0 && (
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <PrivacyTreemap categoryScores={categoryScores} />
            {areaScores.length > 0 && (
              <AreaBarChart areaScores={areaScores} config={config} />
            )}
          </div>
        )}
        
        {config?.chartType === 'gauge' && (
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <GovernanceGauge 
              overallScore={overallScore} 
              maxScore={config.scoreType === 'percentage' ? 100 : 5} 
            />
            {categoryScores.length > 0 && (
              <CategoryBarChart categoryScores={categoryScores} config={config} />
            )}
          </div>
        )}
        
        {config?.chartType === 'stacked' && categoryScores.length > 0 && (
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <ComplianceStackedBar categoryScores={categoryScores} />
            {areaScores.length > 0 && (
              <AreaBarChart areaScores={areaScores} config={config} />
            )}
          </div>
        )}

        {/* Tabela de Requisitos */}
        <GenericRequirementsTable
          frameworkId={frameworkId!}
          frameworkName={framework.nome}
          config={config}
          onStatusChange={handleScoreChange}
        />
      </div>
    </ErrorBoundary>
  );
}
