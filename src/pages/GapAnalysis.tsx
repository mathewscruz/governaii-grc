import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, BarChart3, Target, Clock, AlertTriangle, Folders } from "lucide-react";
import { useGapAnalysisStats } from "@/hooks/useGapAnalysisStats";
import { useOptimizedQuery } from "@/hooks/useOptimizedQuery";
import { supabase } from "@/integrations/supabase/client";
import { FrameworkDialog } from "@/components/gap-analysis/FrameworkDialog";
import { AssessmentDialog } from "@/components/gap-analysis/AssessmentDialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function GapAnalysis() {
  const [frameworkDialogOpen, setFrameworkDialogOpen] = useState(false);
  const [assessmentDialogOpen, setAssessmentDialogOpen] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState<any>(null);

  const { data: stats, loading: statsLoading } = useGapAnalysisStats();

  const { data: frameworks, loading: frameworksLoading, refetch } = useOptimizedQuery(
    async () => {
      const { data, error } = await supabase
        .from('gap_analysis_frameworks')
        .select(`
          *,
          gap_analysis_assessments(count)
        `)
        .order('created_at', { ascending: false });

      return { data: data || [], error };
    },
    [],
    { staleTime: 30000 }
  );

  const statsCards = [
    {
      title: "Total de Frameworks",
      value: stats?.totalFrameworks || 0,
      icon: Folders,
      color: "text-blue-600"
    },
    {
      title: "Avaliações em Andamento",
      value: stats?.assessmentsInProgress || 0,
      icon: Clock,
      color: "text-yellow-600"
    },
    {
      title: "Conformidade Média",
      value: `${stats?.averageCompliance || 0}%`,
      icon: Target,
      color: "text-green-600"
    },
    {
      title: "Itens Pendentes",
      value: stats?.pendingItems || 0,
      icon: AlertTriangle,
      color: "text-red-600"
    }
  ];

  const getFrameworkTypeColor = (tipo: string) => {
    const colors = {
      'seguranca': 'bg-red-100 text-red-800',
      'compliance': 'bg-blue-100 text-blue-800',
      'operacional': 'bg-green-100 text-green-800',
      'qualidade': 'bg-purple-100 text-purple-800',
      'financeiro': 'bg-yellow-100 text-yellow-800'
    };
    return colors[tipo as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Gap Analysis</h1>
          <p className="text-muted-foreground">
            Avalie a maturidade e conformidade com frameworks
          </p>
        </div>
        <Button onClick={() => setFrameworkDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Framework
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-foreground">
                  {card.value}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lista de Frameworks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Frameworks Cadastrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {frameworksLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : frameworks?.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Nenhum framework cadastrado
              </h3>
              <p className="text-muted-foreground mb-4">
                Comece criando seu primeiro framework para avaliação de maturidade
              </p>
              <Button onClick={() => setFrameworkDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Framework
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {frameworks?.map((framework) => (
                <Card key={framework.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base font-medium mb-1">
                          {framework.nome}
                        </CardTitle>
                        {framework.versao && (
                          <p className="text-sm text-muted-foreground">
                            Versão: {framework.versao}
                          </p>
                        )}
                      </div>
                      {framework.tipo_framework && (
                        <Badge className={getFrameworkTypeColor(framework.tipo_framework)}>
                          {framework.tipo_framework}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {framework.descricao && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {framework.descricao}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {framework.gap_analysis_assessments?.[0]?.count || 0} avaliações
                      </span>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedFramework(framework);
                          setAssessmentDialogOpen(true);
                        }}
                      >
                        Nova Avaliação
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <FrameworkDialog
        open={frameworkDialogOpen}
        onOpenChange={setFrameworkDialogOpen}
        onSuccess={refetch}
      />

      <AssessmentDialog
        open={assessmentDialogOpen}
        onOpenChange={setAssessmentDialogOpen}
        framework={selectedFramework}
        onSuccess={() => {
          setSelectedFramework(null);
          refetch();
        }}
      />
    </div>
  );
}