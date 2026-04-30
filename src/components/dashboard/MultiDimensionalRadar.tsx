import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRadarChartData, RadarDataPoint } from "@/hooks/useRadarChartData";
import { useGrcMaturityScore } from "@/hooks/useGrcMaturityScore";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, AlertCircle, XCircle, AlertTriangle, Shield, 
  Monitor, Zap, Target, ClipboardCheck, FileText, MessageSquareWarning,
  ChevronRight, Minus
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const iconMap: Record<string, React.ComponentType<any>> = {
  AlertTriangle, Shield, Monitor, Zap, Target, ClipboardCheck, FileText, MessageSquareWarning,
};

const getScoreColor = (score: number, hasData: boolean) => {
  if (!hasData) return 'bg-muted';
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-primary';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-destructive';
};

const getScoreTextColor = (score: number, hasData: boolean) => {
  if (!hasData) return 'text-muted-foreground';
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-primary';
  if (score >= 40) return 'text-yellow-500';
  return 'text-destructive';
};

const MaturityRow = ({ item, navigate, t }: { item: RadarDataPoint; navigate: any; t: any }) => {
  const Icon = iconMap[item.icon] || FileText;
  const colorClass = getScoreColor(item.score, item.hasData);
  const textColor = getScoreTextColor(item.score, item.hasData);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => navigate(item.link)}
          className="group flex items-center gap-3 w-full p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
        >
          <div className="flex-shrink-0 h-7 w-7 rounded-md bg-muted/80 flex items-center justify-center group-hover:bg-muted">
            <Icon className="h-3.5 w-3.5 text-foreground/70" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-foreground truncate">{item.subject}</span>
              <div className="flex items-center gap-1.5">
                {item.hasData ? (
                  <span className={`text-xs font-bold ${textColor}`}>{item.score}%</span>
                ) : (
                  <span className="text-[10px] text-muted-foreground italic">{t('dashboard.noData') || 'Sem dados'}</span>
                )}
              </div>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-700 ease-out ${colorClass}`}
                style={{ width: item.hasData ? `${Math.max(item.score, 2)}%` : '0%' }}
              />
            </div>
          </div>

          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-foreground/70 transition-colors flex-shrink-0" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-[220px]">
        <p className="font-semibold text-sm mb-1">{item.subject}</p>
        <p className="text-xs text-muted-foreground mb-1.5">{item.details.total} registros</p>
        <div className="space-y-0.5">
          {item.details.metrics.map((m, i) => (
            <p key={i} className="text-xs flex items-center gap-1">
              <Minus className="h-2 w-2 text-primary" /> {m}
            </p>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export const MultiDimensionalRadar = () => {
  const { data, isLoading } = useRadarChartData();
  const maturity = useGrcMaturityScore();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const statusConfig = useMemo(() => {
    if (maturity.status === 'excellent') return { label: t('dashboard.excellent'), variant: 'success' as const, icon: CheckCircle2, color: maturity.colorClass };
    if (maturity.status === 'good') return { label: t('dashboard.good'), variant: 'default' as const, icon: CheckCircle2, color: maturity.colorClass };
    if (maturity.status === 'warning') return { label: t('dashboard.warning'), variant: 'warning' as const, icon: AlertCircle, color: maturity.colorClass };
    if (maturity.status === 'critical') return { label: t('dashboard.criticalStatus'), variant: 'destructive' as const, icon: XCircle, color: maturity.colorClass };
    return { label: t('dashboard.noData') || 'Sem dados', variant: 'outline' as const, icon: Minus, color: maturity.colorClass };
  }, [maturity.status, maturity.colorClass, t]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent><Skeleton className="h-[350px] w-full" /></CardContent>
      </Card>
    );
  }

  const StatusIcon = statusConfig.icon;

  return (
    <Card className="h-full w-full flex flex-col overflow-hidden min-w-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">{t('dashboard.maturity')}</CardTitle>
        <div className="flex items-center gap-2 mt-2">
          <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
          <Badge variant={statusConfig.variant} className="text-[10px]">
            {statusConfig.label}
          </Badge>
          {maturity.totalModules > 0 && (
            <span className="text-[11px] text-muted-foreground">
              {maturity.modulesWithData} de {maturity.totalModules} módulos com dados
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-0 pb-3">
        <div className="space-y-0.5">
          {(data ?? []).map((item) => (
            <MaturityRow key={item.subject} item={item} navigate={navigate} t={t} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
