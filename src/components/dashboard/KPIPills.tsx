import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { 
  HardDrive, Bell, Shield, AlertCircle, 
  Scale, FileText, Target 
} from 'lucide-react';
import { TrendBadge } from './TrendIndicators';
import { useLanguage } from '@/contexts/LanguageContext';

interface KPIPillData {
  icon: React.ElementType;
  label: string;
  value: number | string;
  route: string;
  color: string;
  bgColor: string;
  alertBadge?: { label: string; variant: 'destructive' | 'warning' | 'success' | 'info' };
  onClick?: () => void;
}

interface KPIPillsProps {
  ativos: number;
  criticalAlerts: number;
  activeControls: number;
  controlsExpiring: number;
  activeIncidents: number;
  incidentsThisMonth: number;
  activeContracts: number;
  contractsExpiring: number;
  contractsExpired: number;
  activeDocs: number;
  docsExpiring: number;
  docsPending: number;
  complianceScore: number;
  totalFrameworks: number;
  trends?: { riscosChange: number; incidentesChange: number; controlesChange: number } | null;
  onAlertsClick: () => void;
}

export function KPIPills(props: KPIPillsProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const pills: KPIPillData[] = [
    {
      icon: HardDrive,
      label: t('kpi.assets'),
      value: props.ativos,
      route: '/ativos',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: Bell,
      label: t('kpi.alerts'),
      value: props.criticalAlerts,
      route: '',
      color: props.criticalAlerts > 0 ? 'text-warning' : 'text-success',
      bgColor: props.criticalAlerts > 0 ? 'bg-warning/10' : 'bg-success/10',
      alertBadge: props.criticalAlerts > 0 
        ? { label: t('common.attention'), variant: 'warning' as const }
        : { label: t('common.ok'), variant: 'success' as const },
      onClick: props.onAlertsClick,
    },
    {
      icon: Shield,
      label: t('kpi.controls'),
      value: props.activeControls,
      route: '/governanca?tab=controles',
      color: 'text-success',
      bgColor: 'bg-success/10',
      alertBadge: props.controlsExpiring > 0 
        ? { label: `${props.controlsExpiring} ${t('kpi.expiring')}`, variant: 'warning' as const }
        : undefined,
    },
    {
      icon: AlertCircle,
      label: t('kpi.incidents'),
      value: props.activeIncidents,
      route: '/incidentes',
      color: props.activeIncidents > 0 ? 'text-destructive' : 'text-muted-foreground',
      bgColor: props.activeIncidents > 0 ? 'bg-destructive/10' : 'bg-muted/50',
      alertBadge: props.incidentsThisMonth > 0 
        ? { label: `+${props.incidentsThisMonth} ${t('kpi.month')}`, variant: 'info' as const }
        : undefined,
    },
    {
      icon: Scale,
      label: t('kpi.contracts'),
      value: props.activeContracts,
      route: '/contratos',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      alertBadge: props.contractsExpired > 0 
        ? { label: `${props.contractsExpired} ${t('kpi.expired')}`, variant: 'destructive' as const }
        : props.contractsExpiring > 0 
        ? { label: `${props.contractsExpiring} ${t('kpi.expiring')}`, variant: 'warning' as const }
        : undefined,
    },
    {
      icon: FileText,
      label: t('kpi.documents'),
      value: props.activeDocs,
      route: '/documentos',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      alertBadge: props.docsExpiring > 0 
        ? { label: `${props.docsExpiring} ${t('kpi.expiring')}`, variant: 'warning' as const }
        : props.docsPending > 0
        ? { label: `${props.docsPending} ${t('kpi.pending')}`, variant: 'info' as const }
        : undefined,
    },
    {
      icon: Target,
      label: t('kpi.compliance'),
      value: `${props.complianceScore}%`,
      route: '/gap-analysis',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      alertBadge: { label: `${props.totalFrameworks} ${t('kpi.frameworks')}`, variant: 'info' as const },
    },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {pills.map((pill) => (
        <button
          key={pill.label}
          onClick={() => pill.onClick ? pill.onClick() : navigate(pill.route)}
          className="group flex items-center gap-2 px-3 py-2 rounded-lg border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all duration-200 cursor-pointer"
        >
          <div className={`p-1 rounded-md ${pill.bgColor} group-hover:scale-110 transition-transform`}>
            <pill.icon className={`h-3.5 w-3.5 ${pill.color}`} />
          </div>
          <span className="text-sm font-bold text-foreground">{pill.value}</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">{pill.label}</span>
          {pill.alertBadge && (
            <Badge variant={pill.alertBadge.variant} className="text-[10px] px-1.5 py-0 h-4 hidden md:flex">
              {pill.alertBadge.label}
            </Badge>
          )}
        </button>
      ))}
    </div>
  );
}
