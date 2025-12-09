import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ClipboardList, Users, CheckCircle, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
  totalTemplates: number;
  totalAssessments: number;
  completedAssessments: number;
  pendingAssessments: number;
  averageScore: number;
  recentAssessments: any[];
}

export function DueDiligenceDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTemplates: 0,
    totalAssessments: 0,
    completedAssessments: 0,
    pendingAssessments: 0,
    averageScore: 0,
    recentAssessments: []
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardStats();
  }, []); // Removido fetchDashboardStats das dependências

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      // Buscar templates
      const { data: templates, error: templatesError } = await supabase
        .from('due_diligence_templates')
        .select('id')
        .eq('ativo', true);

      if (templatesError) throw templatesError;

      // Buscar avaliações
      const { data: assessments, error: assessmentsError } = await supabase
        .from('due_diligence_assessments')
        .select('id, status, score_final, fornecedor_nome, created_at');

      if (assessmentsError) throw assessmentsError;

      // Calcular estatísticas
      const totalTemplates = templates?.length || 0;
      const totalAssessments = assessments?.length || 0;
      const completedAssessments = assessments?.filter(a => a.status === 'concluido').length || 0;
      const pendingAssessments = assessments?.filter(a => a.status !== 'concluido').length || 0;
      
      const completedWithScores = assessments?.filter(a => a.status === 'concluido' && a.score_final) || [];
      const averageScore = completedWithScores.length > 0 
        ? completedWithScores.reduce((sum, a) => sum + (a.score_final || 0), 0) / completedWithScores.length
        : 0;

      const recentAssessments = assessments
        ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5) || [];

      setStats({
        totalTemplates,
        totalAssessments,
        completedAssessments,
        pendingAssessments,
        averageScore,
        recentAssessments
      });

    } catch (error: any) {
      console.error('Erro ao buscar estatísticas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as estatísticas do dashboard.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'concluido':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'em_andamento':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'enviado':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'expirado':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'concluido': return 'Concluído';
      case 'em_andamento': return 'Em Andamento';
      case 'enviado': return 'Enviado';
      case 'expirado': return 'Expirado';
      default: return status;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
              <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-6 bg-muted rounded w-16 animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progresso das Avaliações */}
      <Card>
        <CardHeader>
          <CardTitle>Progresso das Avaliações</CardTitle>
          <CardDescription>
            Status geral das avaliações de fornecedores
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Taxa de Conclusão</span>
              <span>
                {stats.totalAssessments > 0 
                  ? Math.round((stats.completedAssessments / stats.totalAssessments) * 100)
                  : 0
                }%
              </span>
            </div>
            <Progress 
              value={stats.totalAssessments > 0 
                ? (stats.completedAssessments / stats.totalAssessments) * 100
                : 0
              } 
              className="w-full" 
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completedAssessments}</div>
              <div className="text-xs text-muted-foreground">Concluídas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalAssessments - stats.completedAssessments - stats.pendingAssessments}
              </div>
              <div className="text-xs text-muted-foreground">Em Andamento</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingAssessments}</div>
              <div className="text-xs text-muted-foreground">Pendentes</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Avaliações Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Avaliações Recentes</CardTitle>
          <CardDescription>
            Últimas avaliações criadas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentAssessments.length > 0 ? (
            <div className="space-y-3">
              {stats.recentAssessments.map((assessment, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <p className="font-medium">{assessment.fornecedor_nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(assessment.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {assessment.score_final && (
                      <span className={`text-sm font-medium ${getScoreColor(assessment.score_final)}`}>
                        {assessment.score_final.toFixed(1)}%
                      </span>
                    )}
                    <Badge className={`${getStatusColor(assessment.status)} border whitespace-nowrap`}>{getStatusLabel(assessment.status)}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma avaliação encontrada</p>
              <p className="text-sm">Crie sua primeira avaliação na aba "Avaliações"</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}