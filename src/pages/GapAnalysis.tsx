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
  nome: string;
  descricao: string;
  status: string;
  data_inicio: string;
  data_conclusao_prevista: string;
  data_conclusao: string;
  framework_id: string;
  framework: {
    id: string;
    nome: string;
    tipo: string;
  };
}

export default function GapAnalysis() {
  const [isFrameworkDialogOpen, setIsFrameworkDialogOpen] = useState(false);
  const [isAssessmentDialogOpen, setIsAssessmentDialogOpen] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState<Framework | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'requirements' | 'evaluation' | 'assessments'>('dashboard');

  const { data: stats, loading: statsLoading } = useGapAnalysisStats();

  const { data: frameworks, loading: frameworksLoading, refetch: refetchFrameworks } = useOptimizedQuery(
    async () => {
      const { data, error } = await supabase
        .from('gap_analysis_frameworks')
        .select(`
          *,
          assessment_count:gap_analysis_assessments(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const frameworksWithCount = data?.map(framework => ({
        ...framework,
        assessment_count: framework.assessment_count?.[0]?.count || 0
      })) || [];

      return { data: frameworksWithCount, error: null };
    },
    [],
    {
      staleTime: 5 * 60 * 1000,
      cacheKey: 'gap-frameworks-with-count'
    }
  );

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

  const getFrameworkTypeColor = (tipo: string) => {
    const colors = {
      'regulatorio': 'bg-blue-100 text-blue-800',
      'normativo': 'bg-green-100 text-green-800',
      'boas_praticas': 'bg-purple-100 text-purple-800',
      'interno': 'bg-orange-100 text-orange-800'
    };
    return colors[tipo as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleFrameworkSuccess = () => {
    setIsFrameworkDialogOpen(false);
    refetchFrameworks();
  };

  const handleAssessmentSuccess = () => {
    setIsAssessmentDialogOpen(false);
    refetchFrameworks();
  };

  const handleStartAssessment = (framework: Framework) => {
    setSelectedFramework(framework);
    setIsAssessmentDialogOpen(true);
  };

  const handleManageRequirements = (framework: Framework) => {
    setSelectedFramework(framework);
    setCurrentView('requirements');
  };

  const handleSelectAssessment = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
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
          frameworkId={selectedAssessment.framework_id}
          frameworkName={selectedAssessment.framework?.nome || ''}
          assessmentName={selectedAssessment.nome}
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gap Analysis</h1>
          <p className="text-muted-foreground">
            Gerencie frameworks de conformidade e avalie maturidade organizacional
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setCurrentView('assessments')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Ver Avaliações
          </Button>
          <Button onClick={() => setIsFrameworkDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Framework
          </Button>
        </div>
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

      {/* Frameworks List */}
      <Card>
        <CardHeader>
          <CardTitle>Frameworks Registrados</CardTitle>
          <CardDescription>
            Gerencie seus frameworks de conformidade e inicie novas avaliações
          </CardDescription>
        </CardHeader>
        <CardContent>
          {frameworksLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : frameworks && frameworks.length > 0 ? (
            <div className="grid gap-4">
              {frameworks.map((framework) => (
                <Card key={framework.id} className="transition-shadow hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{framework.nome}</h3>
                          <Badge variant="secondary">v{framework.versao}</Badge>
                          <Badge 
                            variant="outline" 
                            className={getFrameworkTypeColor(framework.tipo_framework)}
                          >
                            {framework.tipo_framework}
                          </Badge>
                        </div>
                        
                        {framework.descricao && (
                          <p className="text-muted-foreground mb-3">
                            {framework.descricao}
                          </p>
                        )}
                        
                        <div className="text-sm text-muted-foreground">
                          {framework.assessment_count} avaliação(ões) realizadas
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleManageRequirements(framework)}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Requisitos
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleStartAssessment(framework)}
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Nova Avaliação
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Nenhum framework cadastrado</p>
              <p className="text-muted-foreground mb-4">
                Comece criando seu primeiro framework de conformidade.
              </p>
              <Button onClick={() => setIsFrameworkDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Framework
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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
  );
}