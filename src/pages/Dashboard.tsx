
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HardDrive, Shield, AlertCircle, Bell } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { MatrizVisualizacao } from '@/components/riscos/MatrizVisualizacao';
import { RecentActivities } from '@/components/dashboard/RecentActivities';
import { RiskScoreTimeline } from '@/components/dashboard/RiskScoreTimeline';
import { useAtivosStats } from '@/hooks/useAtivosStats';
import { useControlesStats } from '@/hooks/useControlesStats';
import { useIncidentesStats } from '@/hooks/useIncidentesStats';
import { useDashboardStats } from '@/hooks/useDashboardStats';

export default function Dashboard() {
  const { profile } = useAuth();
  
  // Usar hooks otimizados para dados reais
  const ativosStats = useAtivosStats();
  const controlesStats = useControlesStats();
  const incidentesStats = useIncidentesStats();
  const dashboardStats = useDashboardStats();

  if (ativosStats.isLoading || controlesStats.isLoading || incidentesStats.isLoading || dashboardStats.isLoading) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl space-y-6">
      {/* Saudação personalizada */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Olá, {profile?.nome || 'Usuário'}! 👋
        </h1>
        <p className="text-muted-foreground">
          Aqui está um resumo da sua situação de segurança e conformidade
        </p>
      </div>

      {/* 1ª Linha - KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Gestão de Ativos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gestão de Ativos</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ativosStats.data?.total || 0}</div>
            <div className="flex items-center mt-2">
              <Badge variant={ativosStats.data?.criticos > 0 ? "destructive" : "default"}>
                {ativosStats.data?.ativos || 0} ativos
              </Badge>
              {ativosStats.data?.criticos > 0 && (
                <span className="text-xs text-destructive ml-2">
                  {ativosStats.data.criticos} críticos
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Alertas Críticos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Críticos</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.data?.criticalAlerts || 0}</div>
            <div className="flex items-center mt-2">
              <Badge variant={(dashboardStats.data?.criticalAlerts || 0) > 5 ? "destructive" : (dashboardStats.data?.criticalAlerts || 0) > 0 ? "outline" : "default"}>
                {(dashboardStats.data?.criticalAlerts || 0) > 5 ? 'Atenção urgente' : (dashboardStats.data?.criticalAlerts || 0) > 0 ? 'Monitorar' : 'Tudo ok'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Controles Internos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Controles Internos</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{controlesStats.data?.ativos || 0}</div>
            <div className="flex items-center mt-2">
              <Badge variant={controlesStats.data?.vencendoAvaliacao > 0 ? "outline" : "default"}>
                {controlesStats.data?.vencendoAvaliacao || 0} vencendo
              </Badge>
              <span className="text-xs text-muted-foreground ml-2">
                de {controlesStats.data?.total || 0} totais
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Incidentes de Segurança */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incidentes Ativos</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(incidentesStats.data?.abertos || 0) + (incidentesStats.data?.investigacao || 0)}
            </div>
            <div className="flex items-center mt-2">
              <Badge variant={(incidentesStats.data?.mes || 0) > 0 ? "outline" : "default"}>
                +{incidentesStats.data?.mes || 0} este mês
              </Badge>
              {incidentesStats.data?.criticos > 0 && (
                <span className="text-xs text-destructive ml-2">
                  {incidentesStats.data.criticos} críticos
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2ª Linha - Matriz de Risco e Atividades Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MatrizVisualizacao />
        <RecentActivities />
      </div>

      {/* 3ª Linha - Timeline do Score de Risco */}
      <RiskScoreTimeline />
    </div>
  );
}
