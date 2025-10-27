import { useState } from 'react';
import { Plus, BarChart3, FileText, Users, TrendingUp, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useGapAnalysisStats } from '@/hooks/useGapAnalysisStats';
import { FrameworkDialog } from '@/components/gap-analysis/FrameworkDialog';
import { AssessmentDialog } from '@/components/gap-analysis/AssessmentDialog';
import { RequirementsManager } from '@/components/gap-analysis/RequirementsManager';
import { AssessmentEvaluationView } from '@/components/gap-analysis/AssessmentEvaluationView';
import { AssessmentsList } from '@/components/gap-analysis/AssessmentsList';
import { FrameworkTabsView } from '@/components/gap-analysis/FrameworkTabsView';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';

interface Framework {
  id: string;
  nome: string;
  versao: string;
  tipo_framework: string;
  descricao: string;
  assessment_count: number;
}

interface Assessment {
  id: string;
  name: string;
  description?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  framework_name: string;
  framework_version: string;
  framework_type: string;
  framework_id?: string;
}

export default function GapAnalysis() {
  const { toast } = useToast();
  const [isFrameworkDialogOpen, setIsFrameworkDialogOpen] = useState(false);
  const [isAssessmentDialogOpen, setIsAssessmentDialogOpen] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState<Framework | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'requirements' | 'evaluation' | 'assessments'>('dashboard');

  const { data: stats, loading: statsLoading, refetch: refetchStats } = useGapAnalysisStats();

  const getComplianceVariant = (compliance: number): "success" | "info" | "warning" | "destructive" => {
    if (compliance >= 80) return "success";    // 80-100% = Verde
    if (compliance >= 60) return "info";       // 60-79% = Azul
    if (compliance >= 40) return "warning";    // 40-59% = Amarelo
    return "destructive";                       // 0-39% = Vermelho
  };

  const statsCards = [
    {
      title: "Total de Frameworks",
      value: stats?.totalFrameworks || 0,
      description: "Frameworks cadastrados",
      icon: FileText,
      color: "text-blue-600"
    },
    {
      title: "Avaliações em Andamento",
      value: stats?.assessmentsInProgress || 0,
      description: "Avaliações ativas",
      icon: BarChart3,
      color: "text-orange-600"
    },
    {
      title: "Conformidade Média",
      value: `${stats?.averageCompliance || 0}%`,
      description: "Índice de conformidade",
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      title: "Itens Pendentes",
      value: stats?.pendingItems || 0,
      description: "Atribuições pendentes",
      icon: Users,
      color: "text-red-600"
    }
  ];

  const handleFrameworkSuccess = () => {
    setIsFrameworkDialogOpen(false);
    toast({
      title: "Sucesso",
      description: "Framework criado/atualizado com sucesso!",
    });
  };

  const handleAssessmentSuccess = () => {
    setIsAssessmentDialogOpen(false);
    refetchStats(); // Atualizar stats após criar/editar avaliação
    toast({
      title: "Sucesso",
      description: "Avaliação criada/atualizada com sucesso!",
    });
  };

  const handleStartAssessment = (framework: Framework) => {
    setSelectedFramework(framework);
    setIsAssessmentDialogOpen(true);
  };

  const handleManageRequirements = (framework: Framework) => {
    setSelectedFramework(framework);
    setCurrentView('requirements');
  };

  const handleSelectAssessment = (assessment: Assessment | any) => {
    // Convert framework data to Assessment format
    const convertedAssessment: Assessment = {
      id: assessment.id,
      name: assessment.name || assessment.nome,
      description: assessment.description || assessment.descricao || '',
      status: assessment.status,
      start_date: assessment.start_date || assessment.data_inicio,
      end_date: assessment.end_date || assessment.data_conclusao,
      framework_name: assessment.framework_name || assessment.framework?.nome || '',
      framework_version: assessment.framework_version || assessment.versao || '',
      framework_type: assessment.framework_type || assessment.framework?.tipo || assessment.tipo_framework || ''
    };
    setSelectedAssessment(convertedAssessment);
    setCurrentView('evaluation');
  };

  const handleEditAssessment = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setIsAssessmentDialogOpen(true);
  };

  const renderBackButton = () => (
    <Button 
      variant="ghost" 
      onClick={() => {
        setCurrentView('dashboard');
        setSelectedFramework(null);
        setSelectedAssessment(null);
      }}
      className="mb-4"
    >
      <ChevronLeft className="h-4 w-4 mr-2" />
      Voltar ao Dashboard
    </Button>
  );

  if (currentView === 'requirements' && selectedFramework) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        {renderBackButton()}
        <RequirementsManager 
          frameworkId={selectedFramework.id}
          frameworkName={selectedFramework.nome}
        />
      </div>
    );
  }

  if (currentView === 'evaluation' && selectedAssessment) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        {renderBackButton()}
        <AssessmentEvaluationView
          assessmentId={selectedAssessment.id}
          frameworkId={selectedAssessment.framework_id || selectedAssessment.id}
          frameworkName={selectedAssessment.framework_name || selectedAssessment.name}
          assessmentName={selectedAssessment.name}
          onSave={() => refetchStats()}
        />
      </div>
    );
  }

  if (currentView === 'assessments') {
    return (
      <div className="container mx-auto p-6 space-y-6">
        {renderBackButton()}
        <AssessmentsList
          onSelectAssessment={handleSelectAssessment}
          onEditAssessment={handleEditAssessment}
        />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <PageHeader
          title="Gap Analysis"
          description="Gerencie frameworks de conformidade e avalie maturidade organizacional"
          actions={
            <Button onClick={() => setIsFrameworkDialogOpen(true)} size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Novo Framework
            </Button>
          }
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

      {/* Framework Tabs View */}
      <FrameworkTabsView onCreateFramework={() => setIsFrameworkDialogOpen(true)} />


      {/* Dialogs */}
      <FrameworkDialog
        open={isFrameworkDialogOpen}
        onOpenChange={setIsFrameworkDialogOpen}
        onSuccess={handleFrameworkSuccess}
      />

      <AssessmentDialog
        open={isAssessmentDialogOpen}
        onOpenChange={setIsAssessmentDialogOpen}
        framework={selectedFramework}
        assessment={selectedAssessment}
        onSuccess={handleAssessmentSuccess}
      />
      </div>
    </ErrorBoundary>
  );
}