import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, FileText, Download, Calendar, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReportData {
  assessments: any[];
  templates: any[];
  scores: any[];
  statistics: {
    total_assessments: number;
    completed_assessments: number;
    average_score: number;
    completion_rate: number;
  };
}

export function ReportsViewer() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const { toast } = useToast();

  useEffect(() => {
    fetchReportData();
  }, [selectedPeriod]);

  const fetchReportData = async () => {
    try {
      setLoading(true);

      // Buscar dados para relatórios
      const [assessments, templates, scores] = await Promise.all([
        supabase.from('due_diligence_assessments').select('*'),
        supabase.from('due_diligence_templates').select('*'),
        supabase.from('due_diligence_scores').select('*')
      ]);

      const totalAssessments = assessments.data?.length || 0;
      const completedAssessments = assessments.data?.filter(a => a.status === 'concluido').length || 0;
      const avgScore = scores.data?.reduce((acc, s) => acc + (s.score_total || 0), 0) / (scores.data?.length || 1) || 0;

      setReportData({
        assessments: assessments.data || [],
        templates: templates.data || [],
        scores: scores.data || [],
        statistics: {
          total_assessments: totalAssessments,
          completed_assessments: completedAssessments,
          average_score: avgScore,
          completion_rate: totalAssessments > 0 ? (completedAssessments / totalAssessments) * 100 : 0
        }
      });

    } catch (error: any) {
      toast({
        title: "Erro ao carregar relatórios",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center p-8">Carregando relatórios...</div>;
  }

  if (!reportData) {
    return <div className="text-center p-8">Erro ao carregar dados</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Relatórios de Due Diligence</h2>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Estatísticas gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total de Avaliações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.statistics.total_assessments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Concluídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.statistics.completed_assessments}</div>
            <Progress value={reportData.statistics.completion_rate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Score Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.statistics.average_score.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Taxa de Conclusão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.statistics.completion_rate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de avaliações recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Avaliações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportData.assessments.slice(0, 10).map((assessment) => (
              <div key={assessment.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">{assessment.fornecedor_nome}</h4>
                  <p className="text-sm text-muted-foreground">{assessment.fornecedor_email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={assessment.status === 'concluido' ? 'default' : 'secondary'}>
                    {assessment.status}
                  </Badge>
                  {assessment.score_final && (
                    <Badge variant="outline">{assessment.score_final.toFixed(1)}%</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}