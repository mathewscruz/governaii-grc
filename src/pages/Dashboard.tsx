import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { RefreshCw, Clock } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { MultiDimensionalRadar } from '@/components/dashboard/MultiDimensionalRadar';
import { RecentActivities } from '@/components/dashboard/RecentActivities';
import { RiskScoreTimeline } from '@/components/dashboard/RiskScoreTimeline';
import AlertsDetailDialog from '@/components/dashboard/AlertsDetailDialog';
import { UpcomingExpirations } from '@/components/dashboard/UpcomingExpirations';
import { AkurIAChatbot } from '@/components/dashboard/AkurIAChatbot';

import { useTrendData } from '@/components/dashboard/TrendIndicators';
import { HeroScoreBanner } from '@/components/dashboard/HeroScoreBanner';
import { KPIPills } from '@/components/dashboard/KPIPills';
import { useAtivosStats } from '@/hooks/useAtivosStats';
import { useControlesStats } from '@/hooks/useControlesStats';
import { useIncidentesStats } from '@/hooks/useIncidentesStats';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useContratosStats } from '@/hooks/useContratosStats';
import { useDocumentosStats } from '@/hooks/useDocumentosStats';
import { useGapAnalysisStats } from '@/hooks/useGapAnalysisStats';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRadarChartData } from '@/hooks/useRadarChartData';
import { useQueryClient } from '@tanstack/react-query';

export default function Dashboard() {
  const { profile } = useAuth();
  const { t, locale } = useLanguage();
  const [alertsDialogOpen, setAlertsDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const ativosStats = useAtivosStats();
  const controlesStats = useControlesStats();
  const incidentesStats = useIncidentesStats();
  const contratosStats = useContratosStats();
  const documentosStats = useDocumentosStats();
  const gapStats = useGapAnalysisStats();
  const { data: dashboardData, isLoading: dashboardLoading, dataUpdatedAt } = useDashboardStats();
  const { data: trends } = useTrendData();
  const { data: radarData } = useRadarChartData();

  const isLoading = ativosStats.isLoading || controlesStats.isLoading || incidentesStats.isLoading || dashboardLoading;

  const handleRefreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    queryClient.invalidateQueries({ queryKey: ['ativos-stats'] });
    queryClient.invalidateQueries({ queryKey: ['controles-stats'] });
    queryClient.invalidateQueries({ queryKey: ['incidentes-stats'] });
    queryClient.invalidateQueries({ queryKey: ['contratos-stats'] });
    queryClient.invalidateQueries({ queryKey: ['documentos-stats'] });
    queryClient.invalidateQueries({ queryKey: ['gap-analysis-stats'] });
    queryClient.invalidateQueries({ queryKey: ['radar-chart-data'] });
    queryClient.invalidateQueries({ queryKey: ['trend-data'] });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-xl" />
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-28 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Skeleton className="xl:col-span-2 h-80 rounded-lg" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
      </div>
    );
  }

  const healthScore = radarData && radarData.length > 0
    ? Math.round(radarData.reduce((sum, d) => sum + d.score, 0) / radarData.length)
    : 0;
  const activeIncidents = (incidentesStats.data?.abertos || 0) + (incidentesStats.data?.investigacao || 0);

  return (
    <TooltipProvider>
      <div className="space-y-5 animate-fade-in w-full max-w-full overflow-x-hidden">
        {/* Header compacto */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('dashboard.title')}</h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{dataUpdatedAt ? format(new Date(dataUpdatedAt), "HH:mm", { locale: locale === 'pt' ? ptBR : enUS }) : '--:--'}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleRefreshAll}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Hero Score Banner */}
        <HeroScoreBanner
          healthScore={healthScore}
          criticalAlerts={dashboardData?.criticalAlerts || 0}
          activeControls={controlesStats.data?.ativos || 0}
          complianceScore={gapStats.data?.averageCompliance || 0}
          userName={profile?.nome || 'Usuário'}
        />

        {/* KPI Pills */}
        <KPIPills
          ativos={ativosStats.data?.total || 0}
          criticalAlerts={dashboardData?.criticalAlerts || 0}
          activeControls={controlesStats.data?.ativos || 0}
          controlsExpiring={controlesStats.data?.vencendoAvaliacao || 0}
          activeIncidents={activeIncidents}
          incidentsThisMonth={incidentesStats.data?.mes || 0}
          activeContracts={contratosStats.data?.ativos || 0}
          contractsExpiring={contratosStats.data?.vencendo30Dias || 0}
          contractsExpired={contratosStats.data?.vencidos || 0}
          activeDocs={documentosStats.data?.ativos || 0}
          docsExpiring={documentosStats.data?.vencendo30Dias || 0}
          docsPending={documentosStats.data?.pendentesAprovacao || 0}
          complianceScore={gapStats.data?.averageCompliance || 0}
          totalFrameworks={gapStats.data?.totalFrameworks || 0}
          trends={trends}
          onAlertsClick={() => setAlertsDialogOpen(true)}
        />


        {/* Vencimentos + Radar + Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5 w-full">
          <div className="min-w-0"><UpcomingExpirations /></div>
          <div className="min-w-0"><MultiDimensionalRadar /></div>
          <div className="min-w-0 md:col-span-2 xl:col-span-1"><RiskScoreTimeline /></div>
        </div>

        {/* Atividades Recentes full width */}
        <RecentActivities />

        {/* Dialog de alertas */}
        <AlertsDetailDialog
          open={alertsDialogOpen}
          onOpenChange={setAlertsDialogOpen}
          alertDetails={dashboardData?.alertDetails || []}
          riscosAltos={dashboardData?.riscosAltos || 0}
          denunciasPendentes={dashboardData?.denunciasPendentes || 0}
          controlesVencendo={dashboardData?.controlesVencendo || 0}
          incidentesCriticos={dashboardData?.incidentesCriticos || 0}
        />

        {/* AkurIA Chatbot */}
        <AkurIAChatbot />
      </div>
    </TooltipProvider>
  );
}
