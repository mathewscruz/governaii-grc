import { useState } from 'react';
import { Plus, BarChart3, FileText, Users, TrendingUp, ChevronLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useGapAnalysisStats } from '@/hooks/useGapAnalysisStats';
import { useOptimizedQuery } from '@/hooks/useOptimizedQuery';
import { supabase } from '@/integrations/supabase/client';
import { FrameworkDialog } from '@/components/gap-analysis/FrameworkDialog';
import { AssessmentDialog } from '@/components/gap-analysis/AssessmentDialog';
import { RequirementsManager } from '@/components/gap-analysis/RequirementsManager';
import { AssessmentEvaluationView } from '@/components/gap-analysis/AssessmentEvaluationView';
import { AssessmentsList } from '@/components/gap-analysis/AssessmentsList';
import { ActiveGapsTabsView } from '@/components/gap-analysis/ActiveGapsTabsView';
import { FrameworkTabsView } from '@/components/gap-analysis/FrameworkTabsView';
import { ErrorBoundary } from '@/components/ErrorBoundary';

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
  const [isFrameworkDialogOpen, setIsFrameworkDialogOpen] = useState(false);
  const [isAssessmentDialogOpen, setIsAssessmentDialogOpen] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState<Framework | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'requirements' | 'evaluation' | 'assessments'>('dashboard');

  const { data: stats, loading: statsLoading } = useGapAnalysisStats();


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
  };

  const handleAssessmentSuccess = () => {
    setIsAssessmentDialogOpen(false);
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
          onSave={() => console.log('Assessment saved')}
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
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Gap Analysis</h1>
            <p className="text-muted-foreground">
              Gerencie frameworks de conformidade e avalie maturidade organizacional
            </p>
          </div>
          <Button onClick={() => setIsFrameworkDialogOpen(true)} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Novo Framework
          </Button>
        </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{stat.value}</div>
              )}
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
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