import * as React from 'react';
import { Clock, RefreshCw, Focus, Eye, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Icon } from '@/components/icons/Icon';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';

interface DashboardHeaderProps {
  userName: string;
  criticalCount: number;
  dataUpdatedAt?: number;
  isFocusMode: boolean;
  onToggleFocus: () => void;
  onRefresh: () => void;
}

/**
 * DashboardHeader contextual: saudação por hora do dia + sumário crítico,
 * timestamp de atualização, botão de Modo Foco e refresh.
 */
export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  userName,
  criticalCount,
  dataUpdatedAt,
  isFocusMode,
  onToggleFocus,
  onRefresh,
}) => {
  const { t, locale } = useLanguage();
  const dateLocale = locale === 'pt' ? ptBR : enUS;

  const summary = React.useMemo(() => {
    if (criticalCount === 0) return t('dashboard_v3.allClear');
    const tpl =
      criticalCount === 1
        ? t('dashboard_v3.criticalSummary')
        : t('dashboard_v3.criticalSummaryPlural');
    return tpl.replace('{{count}}', String(criticalCount));
  }, [criticalCount, t]);

  const timeStr = dataUpdatedAt ? format(new Date(dataUpdatedAt), 'HH:mm', { locale: dateLocale }) : '--:--';

  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight truncate">
          {greeting}, {firstName}
        </h1>
        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          {criticalCount > 0 ? (
            <Icon as={AlertCircle} size="sm" className="text-destructive flex-shrink-0" />
          ) : (
            <Icon as={CheckCircle2} size="sm" className="text-success flex-shrink-0" />
          )}
          <span className="truncate">{summary}</span>
        </p>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground mr-1">
          <Icon as={Clock} size="xs" />
          <span className="tabular-nums">{t('dashboard_v3.updatedAt').replace('{{time}}', timeStr)}</span>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRefresh} aria-label="Refresh">
              <Icon as={RefreshCw} size="sm" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{timeStr}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isFocusMode ? 'default' : 'outline'}
              size="sm"
              onClick={onToggleFocus}
              className="h-8"
              aria-pressed={isFocusMode}
            >
              <Icon as={isFocusMode ? Eye : Focus} size="sm" className="mr-1.5" />
              <span className="text-xs hidden sm:inline">
                {isFocusMode ? t('dashboard_v3.focusOff') : t('dashboard_v3.focusOn')}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isFocusMode ? t('dashboard_v3.focusOff') : t('dashboard_v3.focusOn')}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

export default DashboardHeader;
