import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GenericScoreDashboard } from '@/components/gap-analysis/GenericScoreDashboard';
import { GenericRequirementsTable } from '@/components/gap-analysis/GenericRequirementsTable';
import { NISTRadarChart } from '@/components/gap-analysis/nist/NISTRadarChart';
import { CategoryBarChart } from '@/components/gap-analysis/CategoryBarChart';
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
    if (!frameworkId || !empresaId) return;

    const loadFramework = async () => {
      try {
        const { data, error } = await supabase
          .from('gap_analysis_frameworks')
          .select('*')
          .eq('id', frameworkId)
          .eq('empresa_id', empresaId)
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
  }, [frameworkId, empresaId, navigate]);

  const config = framework ? getFrameworkConfig(framework.nome, framework.tipo_framework) : null;
  
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
  } = useFrameworkScore(frameworkId || '', config || getFrameworkConfig('default')!);

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
        />

        {/* Radar and Bar Charts side by side */}
        {(pillarScores.length > 3 || categoryScores.length > 0) && (
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {pillarScores.length > 3 && (
              <NISTRadarChart pillarScores={pillarScores} />
            )}
            {categoryScores.length > 0 && (
              <CategoryBarChart 
                categoryScores={categoryScores}
                config={config}
              />
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
