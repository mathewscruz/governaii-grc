import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { StatCard } from '@/components/ui/stat-card';
import { ClipboardList, Users, CheckCircle, Clock, AlertTriangle, TrendingUp, Plus, Send, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDateOnly } from '@/lib/date-utils';

interface DashboardStats {
  totalFornecedores: number;
  totalAssessments: number;
  completedAssessments: number;
  pendingAssessments: number;
  expiredAssessments: number;
  averageScore: number;
  recentAssessments: any[];
  totalTemplates: number;
}

export function DueDiligenceDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalFornecedores: 0,
    totalTemplates: 0,
    totalAssessments: 0,
    completedAssessments: 0,
    pendingAssessments: 0,
    expiredAssessments: 0,
    averageScore: 0,
    recentAssessments: []
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.empresa_id) return;

      const [templatesRes, assessmentsRes, fornecedoresRes] = await Promise.all([
        supabase.from('due_diligence_templates').select('id').eq('ativo', true),
        supabase.from('due_diligence_assessments').select('id, status, score_final, fornecedor_nome, created_at, data_expiracao').eq('empresa_id', profile.empresa_id),
        supabase.from('fornecedores').select('id').eq('empresa_id', profile.empresa_id).eq('status', 'ativo')
      ]);

      const assessments = assessmentsRes.data || [];
      const now = new Date();
      
      const completedAssessments = assessments.filter(a => a.status === 'concluido').length;
      const expiredAssessments = assessments.filter(a => 
        a.data_expiracao && new Date(a.data_expiracao) < now && a.status !== 'concluido'
      ).length;
      const pendingAssessments = assessments.filter(a => 
        a.status !== 'concluido' && !(a.data_expiracao && new Date(a.data_expiracao) < now)
      ).length;
      
      const completedWithScores = assessments.filter(a => a.status === 'concluido' && a.score_final);
      const averageScore = completedWithScores.length > 0 
        ? completedWithScores.reduce((sum, a) => sum + (a.score_final || 0), 0) / completedWithScores.length * 10
        : 0;

      const recentAssessments = assessments
        .filter(a => a.status !== 'concluido' || (a.data_expiracao && new Date(a.data_expiracao) < now))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      setStats({
        totalFornecedores: fornecedoresRes.data?.length || 0,
        totalTemplates: templatesRes.data?.length || 0,
        totalAssessments: assessments.length,
        completedAssessments,
        pendingAssessments,
        expiredAssessments,
        averageScore,
        recentAssessments
      });
    } catch (error: any) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluido': return 'bg-green-100 text-green-800 border-green-200';
      case 'em_andamento': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'enviado': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'concluido': return 'Concluído';
      case 'em_andamento': return 'Em Andamento';
      case 'enviado': return 'Enviado';
      default: return status;
    }
  };

  const isExpired = (date: string) => new Date() > new Date(date);

  return (
    <div className="space-y-4">
      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Fornecedores Ativos"
          value={stats.totalFornecedores}
          description={`${stats.totalTemplates} templates disponíveis`}
          icon={<Users className="h-4 w-4" />}
          loading={loading}
        />
        <StatCard
          title="Avaliações Concluídas"
          value={stats.completedAssessments}
          description={`${stats.pendingAssessments} pendentes`}
          icon={<CheckCircle className="h-4 w-4" />}
          loading={loading}
          variant="success"
        />
        <StatCard
          title="Expiradas / Atenção"
          value={stats.expiredAssessments}
          description="Requerem ação imediata"
          icon={<AlertTriangle className="h-4 w-4" />}
          loading={loading}
          variant={stats.expiredAssessments > 0 ? "destructive" : "default"}
        />
        <StatCard
          title="Score Médio"
          value={`${stats.averageScore.toFixed(0)}%`}
          description="Média geral dos fornecedores"
          icon={<TrendingUp className="h-4 w-4" />}
          loading={loading}
          variant={stats.averageScore >= 80 ? 'success' : stats.averageScore >= 60 ? 'warning' : stats.averageScore > 0 ? 'destructive' : 'default'}
        />
      </div>

      {/* Assessments que precisam de atenção */}
      {stats.recentAssessments.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Avaliações que precisam de atenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentAssessments.map((assessment, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-sm">{assessment.fornecedor_nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateOnly(assessment.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {assessment.data_expiracao && isExpired(assessment.data_expiracao) && assessment.status !== 'concluido' && (
                      <Badge variant="destructive" className="text-xs">Expirado</Badge>
                    )}
                    <Badge className={`${getStatusColor(assessment.status)} border text-xs`}>
                      {getStatusLabel(assessment.status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
