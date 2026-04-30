import { Shield, AlertTriangle, Target } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { GrcMaturity } from '@/hooks/useGrcMaturityScore';
import { HealthScoreGauge } from './HealthScoreGauge';
import { AkurisMarkPattern } from '@/components/identity/AkurisMarkPattern';
import { CornerAccent } from '@/components/identity/CornerAccent';

interface HeroScoreBannerProps {
  maturity: GrcMaturity;
  criticalAlerts: number;
  activeControls: number;
  complianceScore: number;
  userName: string;
}

export function HeroScoreBanner({
  maturity,
  criticalAlerts,
  activeControls,
  complianceScore,
  userName,
}: HeroScoreBannerProps) {
  const { t } = useLanguage();

  const metrics = [
    {
      icon: AlertTriangle,
      label: t('dashboard.criticalAlerts'),
      value: criticalAlerts,
      color: criticalAlerts > 0 ? 'text-destructive' : 'text-success',
      bgColor: criticalAlerts > 0 ? 'bg-destructive/10' : 'bg-success/10',
    },
    {
      icon: Shield,
      label: t('dashboard.activeControls'),
      value: activeControls,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: Target,
      label: t('dashboard.compliance'),
      value: `${complianceScore}%`,
      color: complianceScore >= 70 ? 'text-success' : complianceScore >= 50 ? 'text-warning' : 'text-destructive',
      bgColor: complianceScore >= 70 ? 'bg-success/10' : complianceScore >= 50 ? 'bg-warning/10' : 'bg-destructive/10',
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-primary/5 via-card to-accent/5 p-4 md:p-6 lg:p-8">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

      <div className="relative flex flex-col lg:flex-row items-center gap-4 lg:gap-8">
        {/* Maturity gauge (semicircular, classic look) */}
        <div className="shrink-0 w-full lg:w-56 flex items-center justify-center">
          <HealthScoreGauge maturity={maturity} />
        </div>

        {/* Content */}
        <div className="flex-1 text-center lg:text-left space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">{t('dashboard.commandCenter')}</p>
            <h2 className="text-xl lg:text-2xl font-bold text-foreground">
              {t('dashboard.hello')}, {userName}
            </h2>
          </div>

          {/* Metrics row */}
          <div className="flex flex-wrap justify-center lg:justify-start gap-3">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg border bg-card/80 backdrop-blur-sm"
              >
                <div className={`p-1.5 rounded-md ${metric.bgColor}`}>
                  <metric.icon className={`h-3.5 w-3.5 ${metric.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground leading-none">{metric.label}</p>
                  <p className={`text-sm font-bold ${metric.color} leading-tight mt-0.5`}>{metric.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
