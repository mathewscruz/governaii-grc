import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { PlayCircle, Clock, AlertTriangle } from 'lucide-react';
import { useOptimizedQuery } from '@/hooks/useOptimizedQuery';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ActiveAssessment {
  id: string;
  nome: string;
  status: string;
  data_inicio: string;
  data_prevista_conclusao: string;
  percentual_conclusao: number;
  framework: {
    id: string;
    nome: string;
    tipo_framework: string;
  };
}

interface ActiveGapsTabsViewProps {
  onSelectAssessment: (assessment: ActiveAssessment) => void;
}

export function ActiveGapsTabsView({ onSelectAssessment }: ActiveGapsTabsViewProps) {
  const [activeTab, setActiveTab] = useState<string>('all');

  const { data: activeAssessments, loading } = useOptimizedQuery(
    async () => {
      const { data, error } = await supabase
        .from('gap_analysis_assessments')
        .select(`
          id,
          nome,
          status,
          data_inicio,
          data_prevista_conclusao,
          percentual_conclusao,
          framework:gap_analysis_frameworks(
            id,
            nome,
            tipo_framework
          )
        `)
        .in('status', ['em_andamento', 'pausada'])
        .order('data_prevista_conclusao', { ascending: true });

      if (error) throw error;
      return { data: data || [], error: null };
    },
    [],
    {
      staleTime: 2 * 60 * 1000,
      cacheKey: 'active-gap-assessments'
    }
  );

  const groupedAssessments = activeAssessments?.reduce((acc, assessment) => {
    const frameworkType = assessment.framework?.tipo_framework || 'outros';
    if (!acc[frameworkType]) {
      acc[frameworkType] = [];
    }
    acc[frameworkType].push(assessment);
    return acc;
  }, {} as Record<string, ActiveAssessment[]>) || {};

  const getStatusColor = (status: string) => {
    const colors = {
      'em_andamento': 'bg-blue-100 text-blue-800',
      'pausada': 'bg-yellow-100 text-yellow-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      'em_andamento': 'Em Andamento',
      'pausada': 'Pausada'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getFrameworkTypeLabel = (tipo: string) => {
    const labels = {
      'regulatorio': 'Regulatório',
      'normativo': 'Normativo',
      'boas_praticas': 'Boas Práticas',
      'interno': 'Interno',
      'outros': 'Outros'
    };
    return labels[tipo as keyof typeof labels] || tipo;
  };

  const getDaysUntilDeadline = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      const deadline = parseISO(dateString);
      return differenceInDays(deadline, new Date());
    } catch {
      return null;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Sem prazo definido';
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  const renderAssessmentCard = (assessment: ActiveAssessment) => {
    const daysUntilDeadline = getDaysUntilDeadline(assessment.data_prevista_conclusao);
    const isUrgent = daysUntilDeadline !== null && daysUntilDeadline <= 7;
    
    return (
      <Card key={assessment.id} className="transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold text-sm">{assessment.nome}</h4>
                <Badge 
                  variant="outline" 
                  className={getStatusColor(assessment.status)}
                >
                  {getStatusLabel(assessment.status)}
                </Badge>
                {isUrgent && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Urgente
                  </Badge>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground mb-2">
                Framework: {assessment.framework?.nome}
              </p>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Progresso</span>
                  <span className="text-xs font-medium">{assessment.percentual_conclusao || 0}%</span>
                </div>
                <Progress value={assessment.percentual_conclusao || 0} className="h-2" />
              </div>
              
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Prazo: {formatDate(assessment.data_prevista_conclusao)}
                </div>
                {daysUntilDeadline !== null && (
                  <span className={isUrgent ? 'text-red-600 font-medium' : ''}>
                    {daysUntilDeadline > 0 ? `${daysUntilDeadline} dias restantes` : 
                     daysUntilDeadline === 0 ? 'Vence hoje' : 
                     `${Math.abs(daysUntilDeadline)} dias em atraso`}
                  </span>
                )}
              </div>
            </div>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSelectAssessment(assessment)}
              className="ml-2"
            >
              <PlayCircle className="h-3 w-3 mr-1" />
              Continuar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gaps em Andamento</CardTitle>
          <CardDescription>Avaliações ativas que precisam da sua atenção</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activeAssessments || activeAssessments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gaps em Andamento</CardTitle>
          <CardDescription>Avaliações ativas que precisam da sua atenção</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <PlayCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">Nenhuma avaliação em andamento</p>
            <p className="text-muted-foreground">
              Todas as avaliações foram concluídas ou não há avaliações iniciadas.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const tabItems = [
    { value: 'all', label: 'Todas', count: activeAssessments.length },
    ...Object.entries(groupedAssessments).map(([type, assessments]) => ({
      value: type,
      label: getFrameworkTypeLabel(type),
      count: assessments.length
    }))
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gaps em Andamento</CardTitle>
        <CardDescription>Avaliações ativas que precisam da sua atenção</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-auto">
            {tabItems.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="relative">
                {tab.label}
                <Badge variant="secondary" className="ml-2 text-xs">
                  {tab.count}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="all" className="mt-4">
            <div className="grid gap-3">
              {activeAssessments.map(renderAssessmentCard)}
            </div>
          </TabsContent>
          
          {Object.entries(groupedAssessments).map(([type, assessments]) => (
            <TabsContent key={type} value={type} className="mt-4">
              <div className="grid gap-3">
                {assessments.map(renderAssessmentCard)}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}