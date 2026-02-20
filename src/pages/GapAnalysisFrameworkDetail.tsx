import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GenericScoreDashboard } from '@/components/gap-analysis/GenericScoreDashboard';
import { GenericRequirementsTable } from '@/components/gap-analysis/GenericRequirementsTable';
import { CategoryBarChart } from '@/components/gap-analysis/CategoryBarChart';
import { AreaBarChart } from '@/components/gap-analysis/AreaBarChart';
import { FrameworkRadarChart } from '@/components/gap-analysis/charts/FrameworkRadarChart';
import { ISOProgressFunnel } from '@/components/gap-analysis/charts/ISOProgressFunnel';
import { PrivacyTreemap } from '@/components/gap-analysis/charts/PrivacyTreemap';
import { GovernanceGauge } from '@/components/gap-analysis/charts/GovernanceGauge';
import { ComplianceStackedBar } from '@/components/gap-analysis/charts/ComplianceStackedBar';
import { exportFrameworkPDF } from '@/components/gap-analysis/ExportFrameworkPDF';
import { supabase } from '@/integrations/supabase/client';
import { getFrameworkConfig } from '@/lib/framework-configs';
import { useFrameworkScore } from '@/hooks/useFrameworkScore';
import { useEmpresaId } from '@/hooks/useEmpresaId';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

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
  const [exporting, setExporting] = useState(false);

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
        logger.error('Erro ao carregar framework', { error: error instanceof Error ? error.message : String(error) });
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
    overallScore, pillarScores, domainScores, areaScores, sectionScores,
    categoryScores, totalRequirements, evaluatedRequirements, loading: scoreLoading,
  } = useFrameworkScore(frameworkId || '', config || defaultConfig);

  const handleExportPDF = async () => {
    if (!framework || !config) return;
    setExporting(true);
    try {
      // Fetch requirements with status for PDF
      const { data: reqs } = await supabase
        .from('gap_analysis_requirements')
        .select('id, codigo, titulo, categoria, peso, area_responsavel')
        .eq('framework_id', frameworkId)
        .order('ordem', { ascending: true });

      const { data: evals } = await supabase
        .from('gap_analysis_evaluations')
        .select('requirement_id, conformity_status')
        .eq('framework_id', frameworkId)
        .eq('empresa_id', empresaId);

      const evalMap = new Map(evals?.map(e => [e.requirement_id, e.conformity_status]) || []);

      const requirements = (reqs || []).map(r => ({
        codigo: r.codigo || '',
        titulo: r.titulo,
        categoria: r.categoria || '',
        conformity_status: evalMap.get(r.id) || 'nao_avaliado',
        peso: r.peso,
        area_responsavel: r.area_responsavel,
      }));

      // Get empresa name
      const { data: empresa } = await supabase
        .from('empresas')
        .select('nome')
        .eq('id', empresaId)
        .single();

      await exportFrameworkPDF({
        frameworkName: framework.nome,
        frameworkVersion: framework.versao,
        frameworkType: framework.tipo_framework,
        overallScore,
        totalRequirements,
        evaluatedRequirements,
        pillarScores,
        categoryScores,
        requirements,
        empresaNome: empresa?.nome || 'Empresa',
        scoreType: config.scoreType as 'decimal' | 'percentage',
        maxScore: config.scoreType === 'percentage' ? 100 : 5,
      });

      toast.success('PDF exportado com sucesso');
    } catch (error: any) {
      logger.error('Erro ao exportar PDF', { error: error instanceof Error ? error.message : String(error) });
      toast.error('Erro ao exportar PDF');
    } finally {
      setExporting(false);
    }
  };

  const handleScoreChange = () => {};

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
          <Button variant="ghost" size="sm" onClick={() => navigate('/gap-analysis/frameworks')}>
            <ChevronLeft className="h-4 w-4 mr-2" />Voltar
          </Button>
        </div>

        <PageHeader
          title={`${framework.nome} ${framework.versao}`}
          description={framework.descricao || `Avaliação de conformidade ${framework.tipo_framework}`}
          actions={
            <Button onClick={handleExportPDF} variant="outline" disabled={exporting}>
              <Download className="h-4 w-4 mr-2" />
              {exporting ? 'Exportando...' : 'Exportar PDF'}
            </Button>
          }
        />

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
            <FrameworkRadarChart pillarScores={pillarScores} maxScore={config.scoreType === 'percentage' ? 100 : 5} />
            {categoryScores.length > 0 && <CategoryBarChart categoryScores={categoryScores} config={config} />}
            {areaScores.length > 0 && <AreaBarChart areaScores={areaScores} config={config} />}
          </div>
        )}

        {config?.chartType === 'funnel' && sectionScores.length > 0 && (
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <ISOProgressFunnel sectionScores={sectionScores} />
            {categoryScores.length > 0 && <CategoryBarChart categoryScores={categoryScores} config={config} />}
          </div>
        )}

        {config?.chartType === 'treemap' && categoryScores.length > 0 && (
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <PrivacyTreemap categoryScores={categoryScores} />
            {areaScores.length > 0 && <AreaBarChart areaScores={areaScores} config={config} />}
          </div>
        )}

        {config?.chartType === 'gauge' && (
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <GovernanceGauge overallScore={overallScore} maxScore={config.scoreType === 'percentage' ? 100 : 5} />
            {categoryScores.length > 0 && <CategoryBarChart categoryScores={categoryScores} config={config} />}
          </div>
        )}

        {config?.chartType === 'stacked' && categoryScores.length > 0 && (
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <ComplianceStackedBar categoryScores={categoryScores} />
            {areaScores.length > 0 && <AreaBarChart areaScores={areaScores} config={config} />}
          </div>
        )}

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
