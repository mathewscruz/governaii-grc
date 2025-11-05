import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Eye, Loader2, FileCheck, AlertTriangle, TrendingUp, Target } from 'lucide-react';
import { useAdherenceStats } from '@/hooks/useAdherenceStats';
import { useOptimizedQuery } from '@/hooks/useOptimizedQuery';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AdherenceAssessmentDialog } from './AdherenceAssessmentDialog';
import type { AdherenceAssessment } from './types';

interface AdherenceAssessmentViewProps {
  onViewResult: (assessment: AdherenceAssessment) => void;
}

export function AdherenceAssessmentView({ onViewResult }: AdherenceAssessmentViewProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: stats } = useAdherenceStats();

  const { data: assessments, loading: isLoading, refetch } = useOptimizedQuery(
    async () => {
      const { data, error } = await supabase
        .from('gap_analysis_adherence_assessments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    },
    [],
    { cacheKey: 'adherence-assessments', cacheDuration: 0 }
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'concluido':
        return <Badge className="bg-green-500 text-white">Concluído</Badge>;
      case 'processando':
        return <Badge className="bg-blue-500 text-white"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Processando</Badge>;
      case 'erro':
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getResultBadge = (resultado?: string) => {
    if (!resultado) return null;
    
    switch (resultado) {
      case 'conforme':
        return <Badge className="bg-green-500 text-white">Conforme</Badge>;
      case 'nao_conforme':
        return <Badge variant="destructive">Não Conforme</Badge>;
      case 'parcial':
        return <Badge className="bg-yellow-500 text-white">Parcial</Badge>;
      default:
        return null;
    }
  };

  const statsCards = [
    {
      title: 'Total de Avaliações',
      value: stats?.totalAvaliacoes || 0,
      icon: <Target className="h-4 w-4" />,
      description: 'Avaliações realizadas'
    },
    {
      title: 'Avaliações Conformes',
      value: stats?.avaliacoesConformes || 0,
      icon: <FileCheck className="h-4 w-4" />,
      description: 'Documentos em conformidade'
    },
    {
      title: 'Não Conformes',
      value: stats?.avaliacoesNaoConformes || 0,
      icon: <AlertTriangle className="h-4 w-4" />,
      description: 'Requerem atenção'
    },
    {
      title: 'Conformidade Média',
      value: `${stats?.mediaConformidade || 0}%`,
      icon: <TrendingUp className="h-4 w-4" />,
      description: 'Média geral de conformidade'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Avaliação de Aderência</h2>
          <p className="text-muted-foreground">
            Compare documentos internos com frameworks regulatórios usando IA
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Avaliação
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Lista de Avaliações */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Avaliações Recentes</h3>
        
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : assessments && assessments.length > 0 ? (
          <div className="space-y-4">
            {(assessments as any[]).map((assessment: any) => (
              <Card key={assessment.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{assessment.nome_analise}</h4>
                      {getStatusBadge(assessment.status)}
                      {getResultBadge(assessment.resultado_geral)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-3">
                      <div>
                        <span className="font-medium">Framework:</span> {assessment.framework_nome} {assessment.framework_versao}
                      </div>
                      <div>
                        <span className="font-medium">Documento:</span> {assessment.documento_nome}
                      </div>
                    </div>

                    {assessment.status === 'concluido' && (
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span>Conformidade</span>
                            <span className="font-semibold">{assessment.percentual_conformidade}%</span>
                          </div>
                          <Progress value={assessment.percentual_conformidade} className="h-2" />
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground mt-2">
                      Analisado em {format(new Date(assessment.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>

                  <div className="ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewResult(assessment)}
                      disabled={assessment.status !== 'concluido'}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Nenhuma avaliação realizada ainda</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeira Avaliação
            </Button>
          </div>
        )}
      </Card>

      {/* Dialog */}
      <AdherenceAssessmentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={refetch}
      />
    </div>
  );
}