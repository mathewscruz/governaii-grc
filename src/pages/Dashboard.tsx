import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HardDrive, Shield, AlertCircle, Bell, RefreshCw, Clock } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { MultiDimensionalRadar } from '@/components/dashboard/MultiDimensionalRadar';
import { RecentActivities } from '@/components/dashboard/RecentActivities';
import { RiskScoreTimeline } from '@/components/dashboard/RiskScoreTimeline';
import AlertsDetailDialog from '@/components/dashboard/AlertsDetailDialog';
import { ExecutiveSummaryAI } from '@/components/dashboard/ExecutiveSummaryAI';
import { UpcomingExpirations } from '@/components/dashboard/UpcomingExpirations';
import { TrendBadge, useTrendData } from '@/components/dashboard/TrendIndicators';
import { useAtivosStats } from '@/hooks/useAtivosStats';
import { useControlesStats } from '@/hooks/useControlesStats';
import { useIncidentesStats } from '@/hooks/useIncidentesStats';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [alertsDialogOpen, setAlertsDialogOpen] = useState(false);
  
  const ativosStats = useAtivosStats();
  const controlesStats = useControlesStats();
  const incidentesStats = useIncidentesStats();
  const { data: dashboardData, isLoading: dashboardLoading, refetch: refetchDashboard, dataUpdatedAt } = useDashboardStats();
  const { data: trends } = useTrendData();

  const isLoading = ativosStats.isLoading || controlesStats.isLoading || incidentesStats.isLoading || dashboardLoading;

  if (isLoading) {
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
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6 animate-fade-in w-full max-w-full overflow-x-hidden">
        {/* Saudação personalizada com timestamp */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
              Dashboard Executivo
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Bem-vindo, {profile?.nome || 'Usuário'} — visão consolidada de segurança e conformidade
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              Atualizado: {dataUpdatedAt ? format(new Date(dataUpdatedAt), "HH:mm", { locale: ptBR }) : '--:--'}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => refetchDashboard()}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* KPIs Principais */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 w-full">
          {/* Card 1: Gestão de Ativos */}
          <Tooltip>
            <TooltipTrigger asChild>
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
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors pl-2">
                    Gestão de Ativos
                  </CardTitle>
                  <div className="p-2 sm:p-2.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                    <HardDrive className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                </CardHeader>
                <CardContent className="pl-4 sm:pl-7">
                  <div className="flex items-baseline gap-2">
                    <div className="text-2xl sm:text-3xl font-bold tracking-tight">{ativosStats.data?.total || 0}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    <Badge 
                      variant={ativosStats.data?.criticos > 0 ? "destructive" : "soft"}
                      icon={<div className="w-1.5 h-1.5 rounded-full bg-current" />}
                    >
                      {ativosStats.data?.ativos || 0} ativos
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent><p>Total de ativos cadastrados e sua criticidade</p></TooltipContent>
          </Tooltip>

          {/* Card 2: Alertas Críticos */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Card 
                variant="accent" 
                interactive 
                className="group before:!bg-gradient-to-b before:!from-warning before:!to-warning/70"
                onClick={() => setAlertsDialogOpen(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setAlertsDialogOpen(true)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors pl-2">
                    Alertas Críticos
                  </CardTitle>
                  <div className="p-2 sm:p-2.5 rounded-lg bg-warning/10 text-warning group-hover:bg-warning/20 transition-colors">
                    <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                </CardHeader>
                <CardContent className="pl-4 sm:pl-7">
                  <div className="flex items-baseline gap-2">
                    <div className="text-2xl sm:text-3xl font-bold tracking-tight">{dashboardData?.criticalAlerts || 0}</div>
                    {trends && <TrendBadge value={trends.riscosChange + trends.incidentesChange} inverted />}
                  </div>
                  <div className="flex items-center mt-1">
                    <Badge 
                      variant={(dashboardData?.criticalAlerts || 0) > 5 ? "destructive" : (dashboardData?.criticalAlerts || 0) > 0 ? "warning" : "success"}
                      icon={<div className="w-1.5 h-1.5 rounded-full bg-current" />}
                    >
                      {(dashboardData?.criticalAlerts || 0) > 0 ? 'Detalhes' : 'Tudo ok'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent><p>Soma de riscos altos, denúncias pendentes, controles vencendo e incidentes críticos</p></TooltipContent>
          </Tooltip>

          {/* Card 3: Controles Internos */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Card 
                variant="accent"
                interactive 
                className="group before:!bg-gradient-to-b before:!from-success before:!to-success/70"
                onClick={() => navigate('/governanca?tab=controles')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate('/governanca?tab=controles')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors pl-2">
                    Controles Internos
                  </CardTitle>
                  <div className="p-2 sm:p-2.5 rounded-lg bg-success/10 text-success group-hover:bg-success/20 transition-colors">
                    <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                </CardHeader>
                <CardContent className="pl-4 sm:pl-7">
                  <div className="flex items-baseline gap-2">
                    <div className="text-2xl sm:text-3xl font-bold tracking-tight">{controlesStats.data?.ativos || 0}</div>
                    {trends && <TrendBadge value={trends.controlesChange} />}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    <Badge 
                      variant={controlesStats.data?.vencendoAvaliacao > 0 ? "warning" : "success"}
                      icon={<div className="w-1.5 h-1.5 rounded-full bg-current" />}
                    >
                      {controlesStats.data?.vencendoAvaliacao || 0} vencendo
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent><p>Controles ativos e quantos estão com avaliação próxima do vencimento</p></TooltipContent>
          </Tooltip>

          {/* Card 4: Incidentes de Segurança */}
          <Tooltip>
            <TooltipTrigger asChild>
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
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors pl-2">
                    Incidentes Ativos
                  </CardTitle>
                  <div className="p-2 sm:p-2.5 rounded-lg bg-destructive/10 text-destructive group-hover:bg-destructive/20 transition-colors">
                    <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                </CardHeader>
                <CardContent className="pl-4 sm:pl-7">
                  <div className="flex items-baseline gap-2">
                    <div className="text-2xl sm:text-3xl font-bold tracking-tight">
                      {(incidentesStats.data?.abertos || 0) + (incidentesStats.data?.investigacao || 0)}
                    </div>
                    {trends && <TrendBadge value={trends.incidentesChange} inverted />}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    <Badge 
                      variant={(incidentesStats.data?.mes || 0) > 0 ? "info" : "neutral"}
                      icon={<div className="w-1.5 h-1.5 rounded-full bg-current" />}
                    >
                      +{incidentesStats.data?.mes || 0} este mês
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent><p>Incidentes abertos ou em investigação</p></TooltipContent>
          </Tooltip>
        </div>

        {/* Resumo Executivo com IA */}
        <ExecutiveSummaryAI />

        {/* Matriz de Risco, Atividades e Vencimentos */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6 w-full">
          <div className="xl:col-span-2">
            <MultiDimensionalRadar />
          </div>
          <UpcomingExpirations />
        </div>

        {/* Atividades Recentes + Timeline */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6 w-full">
          <RecentActivities />
          <RiskScoreTimeline />
        </div>

        {/* Dialog de detalhes de alertas */}
        <AlertsDetailDialog
          open={alertsDialogOpen}
          onOpenChange={setAlertsDialogOpen}
          alertDetails={dashboardData?.alertDetails || []}
          riscosAltos={dashboardData?.riscosAltos || 0}
          denunciasPendentes={dashboardData?.denunciasPendentes || 0}
          controlesVencendo={dashboardData?.controlesVencendo || 0}
          incidentesCriticos={dashboardData?.incidentesCriticos || 0}
        />
      </div>
    </TooltipProvider>
  );
}
