import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Eye, Loader2, FileCheck, AlertTriangle, TrendingUp, Target, Trash2 } from 'lucide-react';
import { useAdherenceStats } from '@/hooks/useAdherenceStats';
import { useOptimizedQuery } from '@/hooks/useOptimizedQuery';
import { supabase } from '@/integrations/supabase/client';
import { formatDateOnly } from '@/lib/date-utils';
import { AdherenceAssessmentDialog } from './AdherenceAssessmentDialog';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/ConfirmDialog';
import type { AdherenceAssessment } from './types';

interface AdherenceAssessmentViewProps {
  onViewResult: (assessment: AdherenceAssessment) => void;
}

export function AdherenceAssessmentView({ onViewResult }: AdherenceAssessmentViewProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'concluido':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'processando':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'erro':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'concluido': return 'Concluído';
      case 'processando': return <><Loader2 className="h-3 w-3 mr-1 animate-spin inline" />Processando</>;
      case 'erro': return 'Erro';
      default: return status;
    }
  };

  const getResultColor = (resultado?: string): string => {
    if (!resultado) return '';
    switch (resultado) {
      case 'conforme':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'nao_conforme':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'parcial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getResultLabel = (resultado?: string): string | null => {
    if (!resultado) return null;
    switch (resultado) {
      case 'conforme': return 'Conforme';
      case 'nao_conforme': return 'Não Conforme';
      case 'parcial': return 'Parcial';
      default: return resultado;
    }
  };

  const handleDelete = async () => {
    if (!assessmentToDelete) return;
    
    setIsDeleting(true);
    try {
      const assessment = (assessments as any[])?.find(a => a.id === assessmentToDelete);
      
      // 1. Excluir detalhes relacionados
      const { error: detailsError } = await supabase
        .from('gap_analysis_adherence_details')
        .delete()
        .eq('assessment_id', assessmentToDelete);
      
      if (detailsError) throw detailsError;

      // 2. Excluir arquivo do storage
      if (assessment?.storage_file_name) {
        const { error: storageError } = await supabase.storage
          .from('adherence-documents')
          .remove([assessment.storage_file_name]);
        
        if (storageError) {
          console.error('Erro ao excluir arquivo do storage:', storageError);
        }
      }

      // 3. Excluir registro principal
      const { error: assessmentError } = await supabase
        .from('gap_analysis_adherence_assessments')
        .delete()
        .eq('id', assessmentToDelete);
      
      if (assessmentError) throw assessmentError;

      toast.success('Avaliação excluída com sucesso');
      refetch();
    } catch (error: any) {
      console.error('Erro ao excluir avaliação:', error);
      toast.error('Erro ao excluir avaliação: ' + error.message);
    } finally {
      setIsDeleting(false);
      setAssessmentToDelete(null);
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
      {/* Botão Nova Avaliação */}
      <div className="flex justify-end">
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
                      <Badge className={`${getStatusColor(assessment.status)} border whitespace-nowrap`}>{getStatusLabel(assessment.status)}</Badge>
                      {assessment.resultado_geral && <Badge className={`${getResultColor(assessment.resultado_geral)} border whitespace-nowrap`}>{getResultLabel(assessment.resultado_geral)}</Badge>}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-3">
                      <div>
                        <span className="font-medium">Framework:</span> {assessment.framework_nome} {assessment.framework_versao}
                      </div>
                      <div>
                        <span className="font-medium">Documento:</span> {assessment.documento_nome}
                      </div>
                    </div>

                    {assessment.status === 'processando' && (
                      <div className="flex items-center gap-2 text-blue-600 text-sm">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Identificando requisitos relevantes e analisando... (1-2 minutos)</span>
                      </div>
                    )}

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
                      Analisado em {formatDateOnly(assessment.created_at)}
                    </p>
                  </div>

                  <div className="ml-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewResult(assessment)}
                      disabled={assessment.status !== 'concluido'}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Detalhes
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAssessmentToDelete(assessment.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
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

      {/* Dialogs */}
      <AdherenceAssessmentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={refetch}
      />
      
      <ConfirmDialog
        open={!!assessmentToDelete}
        onOpenChange={(open) => !open && setAssessmentToDelete(null)}
        title="Excluir avaliação?"
        description="Esta ação não pode ser desfeita. A avaliação e todos os seus dados serão permanentemente removidos."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={handleDelete}
        loading={isDeleting}
      />
    </div>
  );
}