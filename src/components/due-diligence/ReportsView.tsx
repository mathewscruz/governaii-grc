import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, TrendingUp, Users, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useReportsData } from '@/hooks/useReportsData';

export function ReportsView() {
  const { data: reportsData, isLoading, error } = useReportsData();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-24 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Erro ao carregar dados dos relatórios</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Relatórios e Análises</h2>
        <p className="text-muted-foreground">
          Análise detalhada dos resultados das avaliações de fornecedores
        </p>
      </div>

      {/* Métricas Gerais */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Médio Geral</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {reportsData?.overallMetrics.averageScore.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Baseado em avaliações concluídas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fornecedores Avaliados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportsData?.overallMetrics.totalSuppliers}</div>
            <p className="text-xs text-muted-foreground">
              Fornecedores únicos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Resposta</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportsData?.overallMetrics.responseRate.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Assessments concluídos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportsData?.overallMetrics.averageCompletionTime.toFixed(1)} dias
            </div>
            <p className="text-xs text-muted-foreground">
              Para conclusão da avaliação
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Análise por Categoria */}
      <Card>
        <CardHeader>
          <CardTitle>Desempenho por Categoria</CardTitle>
          <CardDescription>
            Scores médios organizados por categoria de avaliação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {reportsData?.categoryPerformance.map((category, index) => {
              const colors = [
                'bg-green-100 text-green-800',
                'bg-blue-100 text-blue-800', 
                'bg-purple-100 text-purple-800',
                'bg-orange-100 text-orange-800',
                'bg-red-100 text-red-800'
              ];
              return (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className={colors[index % colors.length]}>
                      {category.category}
                    </Badge>
                    <span className="font-medium">{category.score.toFixed(1)}%</span>
                  </div>
                  <Progress value={category.score} className="w-32" />
                </div>
              );
            })}
            {(!reportsData?.categoryPerformance || reportsData.categoryPerformance.length === 0) && (
              <p className="text-center text-muted-foreground py-4">
                Nenhuma categoria encontrada
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Fornecedores */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Melhores Fornecedores</CardTitle>
            <CardDescription>
              Top 5 fornecedores por score
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportsData?.topSuppliers.map((fornecedor, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{fornecedor.nome}</p>
                    <p className="text-sm text-muted-foreground">{fornecedor.categoria}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{fornecedor.score.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">#{index + 1}</p>
                  </div>
                </div>
              ))}
              {(!reportsData?.topSuppliers || reportsData.topSuppliers.length === 0) && (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum fornecedor avaliado
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fornecedores em Atenção</CardTitle>
            <CardDescription>
              Fornecedores com scores baixos que precisam de atenção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportsData?.lowPerformingSuppliers.map((fornecedor, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{fornecedor.nome}</p>
                    <p className="text-sm text-muted-foreground">{fornecedor.categoria}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">{fornecedor.score.toFixed(1)}%</p>
                    <Badge variant="destructive" className="text-xs">
                      {fornecedor.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {(!reportsData?.lowPerformingSuppliers || reportsData.lowPerformingSuppliers.length === 0) && (
                <p className="text-center text-muted-foreground py-4">
                  Todos os fornecedores têm boa performance
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exportar Relatórios */}
      <Card>
        <CardHeader>
          <CardTitle>Exportar Relatórios</CardTitle>
          <CardDescription>
            Baixe relatórios detalhados em diferentes formatos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Relatório Completo (PDF)
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Scores por Fornecedor (Excel)
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Análise de Tendências (CSV)
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Dashboard Executivo (PDF)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}