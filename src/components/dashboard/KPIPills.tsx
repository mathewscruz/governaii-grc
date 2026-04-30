import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Scale, ListChecks } from 'lucide-react';
import {
  AtivosIcon,
  RiscosIcon,
  IncidentesIcon,
  DocumentosIcon,
  DueDiligenceIcon,
  DenunciasIcon,
} from '@/components/icons';
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
  activeIncidents: number;
  incidentsThisMonth: number;
  activeContracts: number;
  contractsExpiring: number;
  contractsExpired: number;
  activeDocs: number;
  docsExpiring: number;
  docsPending: number;
  // Novos pills (acionáveis, não duplicam Hero)
  totalRiscos: number;
  riscosCriticos: number;
  riscosAltos: number;
  planosPendentes: number;
  planosAtrasados: number;
  ddAtivos: number;
  ddExpirados: number;
  denunciasAbertas: number;
  denunciasNovas: number;
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
      icon: AlertTriangle,
      label: t('kpi.risks'),
      value: props.totalRiscos,
      route: '/riscos',
      color: props.riscosCriticos > 0 ? 'text-destructive' : 'text-primary',
      bgColor: props.riscosCriticos > 0 ? 'bg-destructive/10' : 'bg-primary/10',
      alertBadge:
        props.riscosCriticos > 0
          ? { label: `${props.riscosCriticos} ${t('kpi.critical')}`, variant: 'destructive' as const }
          : props.riscosAltos > 0
            ? { label: `${props.riscosAltos} ${t('kpi.high')}`, variant: 'warning' as const }
            : undefined,
    },
    {
      icon: AlertCircle,
      label: t('kpi.incidents'),
      value: props.activeIncidents,
      route: '/incidentes',
      color: props.activeIncidents > 0 ? 'text-destructive' : 'text-muted-foreground',
      bgColor: props.activeIncidents > 0 ? 'bg-destructive/10' : 'bg-muted/50',
      alertBadge:
        props.incidentsThisMonth > 0
          ? { label: `+${props.incidentsThisMonth} ${t('kpi.month')}`, variant: 'info' as const }
          : undefined,
    },
    {
      icon: ListChecks,
      label: t('kpi.actionPlans'),
      value: props.planosPendentes,
      route: '/planos-acao',
      color: props.planosAtrasados > 0 ? 'text-destructive' : 'text-primary',
      bgColor: props.planosAtrasados > 0 ? 'bg-destructive/10' : 'bg-primary/10',
      alertBadge:
        props.planosAtrasados > 0
          ? { label: `${props.planosAtrasados} ${t('kpi.overdue')}`, variant: 'destructive' as const }
          : undefined,
    },
    {
      icon: Scale,
      label: t('kpi.contracts'),
      value: props.activeContracts,
      route: '/contratos',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      alertBadge:
        props.contractsExpired > 0
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
      alertBadge:
        props.docsExpiring > 0
          ? { label: `${props.docsExpiring} ${t('kpi.expiring')}`, variant: 'warning' as const }
          : props.docsPending > 0
            ? { label: `${props.docsPending} ${t('kpi.pending')}`, variant: 'info' as const }
            : undefined,
    },
    {
      icon: Search,
      label: t('kpi.dueDiligence'),
      value: props.ddAtivos,
      route: '/due-diligence',
      color: props.ddExpirados > 0 ? 'text-destructive' : 'text-primary',
      bgColor: props.ddExpirados > 0 ? 'bg-destructive/10' : 'bg-primary/10',
      alertBadge:
        props.ddExpirados > 0
          ? { label: `${props.ddExpirados} ${t('kpi.expired')}`, variant: 'destructive' as const }
          : undefined,
    },
    {
      icon: MessageSquareWarning,
      label: t('kpi.reports'),
      value: props.denunciasAbertas,
      route: '/denuncia',
      color: props.denunciasNovas > 0 ? 'text-warning' : 'text-primary',
      bgColor: props.denunciasNovas > 0 ? 'bg-warning/10' : 'bg-primary/10',
      alertBadge:
        props.denunciasNovas > 0
          ? { label: `${props.denunciasNovas} ${t('kpi.new')}`, variant: 'warning' as const }
          : undefined,
    },
  ];

  return (
    <div className="relative">
      {/* Fade indicator for scroll */}
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none sm:hidden" />
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide sm:scrollbar-thin">
        {pills.map((pill) => (
          <button
            key={pill.label}
            onClick={() => (pill.onClick ? pill.onClick() : navigate(pill.route))}
            className="group flex items-center gap-2 px-3 py-2 rounded-lg border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all duration-200 cursor-pointer flex-shrink-0"
          >
            <div className={`p-1 rounded-md ${pill.bgColor} group-hover:scale-110 transition-transform`}>
              <pill.icon className={`h-3.5 w-3.5 ${pill.color}`} />
            </div>
            <span className="text-sm font-bold text-foreground">{pill.value}</span>
            <span className="text-[11px] text-muted-foreground whitespace-nowrap">{pill.label}</span>
            {pill.alertBadge && (
              <Badge variant={pill.alertBadge.variant} className="text-[10px] px-1.5 py-0 h-4 hidden md:flex">
                {pill.alertBadge.label}
              </Badge>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
