import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { HardDrive, Shield, AlertCircle, Bell } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { MultiDimensionalRadar } from '@/components/dashboard/MultiDimensionalRadar';
import { RecentActivities } from '@/components/dashboard/RecentActivities';
import { RiskScoreTimeline } from '@/components/dashboard/RiskScoreTimeline';
import { useAtivosStats } from '@/hooks/useAtivosStats';
import { useControlesStats } from '@/hooks/useControlesStats';
import { useIncidentesStats } from '@/hooks/useIncidentesStats';
import { useDashboardStats } from '@/hooks/useDashboardStats';

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const ativosStats = useAtivosStats();
  const controlesStats = useControlesStats();
  const incidentesStats = useIncidentesStats();
  const dashboardStats = useDashboardStats();

  if (ativosStats.isLoading || controlesStats.isLoading || incidentesStats.isLoading || dashboardStats.isLoading) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-fade-in">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-5 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 rounded-lg" />
          <Skeleton className="h-96 rounded-lg" />
        </div>
        <Skeleton className="h-80 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in w-full max-w-full overflow-x-hidden">
      {/* Saudação personalizada */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Olá, {profile?.nome || 'Usuário'}! 👋
        </h1>
        <p className="text-muted-foreground text-lg">
          Aqui está um resumo da sua situação de segurança e conformidade
        </p>
      </div>

      {/* KPIs Principais com nova identidade visual */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 w-full">
        {/* Card 1: Gestão de Ativos */}
        <Card 
          variant="accent"
          interactive 
          className="group"
          onClick={() => navigate('/ativos')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/ativos')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors pl-2">
              Gestão de Ativos
            </CardTitle>
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
              <HardDrive className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pl-7">
            <div className="text-3xl font-bold mb-2 tracking-tight">{ativosStats.data?.total || 0}</div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge 
                variant={ativosStats.data?.criticos > 0 ? "destructive" : "soft"}
                icon={<div className="w-1.5 h-1.5 rounded-full bg-current" />}
              >
                {ativosStats.data?.ativos || 0} ativos
              </Badge>
              {ativosStats.data?.criticos > 0 && (
                <Badge variant="destructive" size="sm">
                  {ativosStats.data.criticos} críticos
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Alertas Críticos */}
        <Card 
          variant="accent" 
          interactive 
          className="group before:!bg-gradient-to-b before:!from-warning before:!to-warning/70"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors pl-2">
              Alertas Críticos
            </CardTitle>
            <div className="p-2.5 rounded-lg bg-warning/10 text-warning group-hover:bg-warning/20 transition-colors">
              <Bell className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pl-7">
            <div className="text-3xl font-bold mb-2 tracking-tight">{dashboardStats.data?.criticalAlerts || 0}</div>
            <div className="flex items-center">
              <Badge 
                variant={(dashboardStats.data?.criticalAlerts || 0) > 5 ? "destructive" : (dashboardStats.data?.criticalAlerts || 0) > 0 ? "warning" : "success"}
                icon={<div className="w-1.5 h-1.5 rounded-full bg-current" />}
              >
                {(dashboardStats.data?.criticalAlerts || 0) > 5 ? 'Atenção urgente' : (dashboardStats.data?.criticalAlerts || 0) > 0 ? 'Monitorar' : 'Tudo ok'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Controles Internos */}
        <Card 
          variant="accent"
          interactive 
          className="group before:!bg-gradient-to-b before:!from-success before:!to-success/70"
          onClick={() => navigate('/governanca')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/governanca')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors pl-2">
              Controles Internos
            </CardTitle>
            <div className="p-2.5 rounded-lg bg-success/10 text-success group-hover:bg-success/20 transition-colors">
              <Shield className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pl-7">
            <div className="text-3xl font-bold mb-2 tracking-tight">{controlesStats.data?.ativos || 0}</div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge 
                variant={controlesStats.data?.vencendoAvaliacao > 0 ? "warning" : "success"}
                icon={<div className="w-1.5 h-1.5 rounded-full bg-current" />}
              >
                {controlesStats.data?.vencendoAvaliacao || 0} vencendo
              </Badge>
              <span className="text-xs text-muted-foreground">
                de {controlesStats.data?.total || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Incidentes de Segurança */}
        <Card 
          variant="accent"
          interactive 
          className="group before:!bg-gradient-to-b before:!from-destructive before:!to-destructive/70"
          onClick={() => navigate('/incidentes')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/incidentes')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors pl-2">
              Incidentes Ativos
            </CardTitle>
            <div className="p-2.5 rounded-lg bg-destructive/10 text-destructive group-hover:bg-destructive/20 transition-colors">
              <AlertCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="pl-7">
            <div className="text-3xl font-bold mb-2 tracking-tight">
              {(incidentesStats.data?.abertos || 0) + (incidentesStats.data?.investigacao || 0)}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge 
                variant={(incidentesStats.data?.mes || 0) > 0 ? "info" : "neutral"}
                icon={<div className="w-1.5 h-1.5 rounded-full bg-current" />}
              >
                +{incidentesStats.data?.mes || 0} este mês
              </Badge>
              {incidentesStats.data?.criticos > 0 && (
                <Badge variant="destructive" size="sm">
                  {incidentesStats.data.criticos} críticos
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Matriz de Risco e Atividades Recentes */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6 w-full">
        <MultiDimensionalRadar />
        <RecentActivities />
      </div>

      {/* Timeline do Score de Risco */}
      <RiskScoreTimeline />
    </div>
  );
}