import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { CornerAccent } from '@/components/identity/CornerAccent';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Icon } from '@/components/icons/Icon';
import { useLanguage } from '@/contexts/LanguageContext';

interface RiskData {
  month: string;
  criticos: number;
  altos: number;
  medios: number;
  baixos: number;
}

type TimeRange = 'week' | 'month' | 'year';

const SERIES = [
  { key: 'criticos', tone: 'destructive', labelKey: 'dashboard.critical' },
  { key: 'altos', tone: 'warning', labelKey: 'dashboard.high' },
  { key: 'medios', tone: 'primary', labelKey: 'dashboard.medium' },
  { key: 'baixos', tone: 'muted-foreground', labelKey: 'dashboard.low' },
] as const;

export function RiskScoreTimeline() {
  const { profile } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const { t } = useLanguage();

  const { data: riscos, isLoading } = useQuery({
    queryKey: ['riscos-timeline', profile?.empresa_id],
    queryFn: async () => {
      if (!profile?.empresa_id) return [];
      const { data, error } = await supabase
        .from('riscos')
        .select('id, nivel_risco_inicial, created_at')
        .eq('empresa_id', profile.empresa_id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.empresa_id,
    staleTime: 5 * 60 * 1000,
  });

  const { chartData, totals, deltaPct, trend } = useMemo(() => {
    const empty = {
      chartData: [] as RiskData[],
      totals: { criticos: 0, altos: 0, medios: 0, baixos: 0 },
      deltaPct: 0,
      trend: 'stable' as 'up' | 'down' | 'stable',
    };
    if (!riscos || riscos.length === 0) return empty;

    const now = new Date();
    const periods: { end: Date; label: string }[] = [];

    if (timeRange === 'week') {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(23, 59, 59, 999);
        periods.push({
          end: date,
          label: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        });
      }
    } else if (timeRange === 'month') {
      for (let i = 3; i >= 0; i--) {
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() - i * 7);
        periods.push({ end: endDate, label: `Sem ${4 - i}` });
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        periods.push({
          end: date,
          label: date.toLocaleDateString('pt-BR', { month: 'short' }),
        });
      }
    }

    const processed: RiskData[] = periods.map((period) => {
      const slice = riscos.filter((r) => new Date(r.created_at) <= period.end);
      return {
        month: period.label,
        criticos: slice.filter((r) => r.nivel_risco_inicial === 'Crítico').length,
        altos: slice.filter(
          (r) => r.nivel_risco_inicial === 'Alto' || r.nivel_risco_inicial === 'Muito Alto'
        ).length,
        medios: slice.filter(
          (r) => r.nivel_risco_inicial === 'Médio' || r.nivel_risco_inicial === 'Moderado'
        ).length,
        baixos: slice.filter(
          (r) => r.nivel_risco_inicial === 'Baixo' || r.nivel_risco_inicial === 'Muito Baixo'
        ).length,
      };
    });

    const last = processed[processed.length - 1];
    const prev = processed[processed.length - 2];
    const lastSevere = (last?.criticos || 0) + (last?.altos || 0);
    const prevSevere = (prev?.criticos || 0) + (prev?.altos || 0);
    const delta = prevSevere === 0 ? (lastSevere > 0 ? 100 : 0) : ((lastSevere - prevSevere) / prevSevere) * 100;

    return {
      chartData: processed,
      totals: last || { criticos: 0, altos: 0, medios: 0, baixos: 0 },
      deltaPct: Math.round(delta),
      trend: lastSevere > prevSevere ? 'up' : lastSevere < prevSevere ? 'down' : 'stable',
    } as const;
  }, [riscos, timeRange]);

  const customTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border border-border bg-popover/95 backdrop-blur-md shadow-lg px-3 py-2 min-w-[140px]">
        <p className="text-[11px] font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any) => (
            <div key={entry.dataKey} className="flex items-center justify-between gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-foreground">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                  aria-hidden="true"
                />
                {entry.name}
              </span>
              <span className="font-semibold tabular-nums text-foreground">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const toggleSeries = (key: string) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  if (isLoading) {
    return (
      <Card className="h-full w-full flex flex-col">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56 mt-2" />
        </CardHeader>
        <CardContent className="flex-1">
          <Skeleton className="h-52 sm:h-72 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const colorOf = (tone: string) => {
    if (tone === 'muted-foreground') return 'hsl(var(--muted-foreground))';
    return `hsl(var(--${tone}))`;
  };

  const trendColor =
    trend === 'up' ? 'text-destructive' : trend === 'down' ? 'text-success' : 'text-muted-foreground';
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <Card className="relative h-full w-full flex flex-col overflow-hidden min-w-0">
      <CornerAccent />
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 w-full">
          <div className="min-w-0">
            <CardTitle className="text-base">{t('dashboard.riskEvolution')}</CardTitle>
            <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="text-foreground font-semibold tabular-nums">{totals.criticos}</span>
              <span>{t('dashboard.critical')}</span>
              <span className="text-border">·</span>
              <span className="text-foreground font-semibold tabular-nums">{totals.altos}</span>
              <span>{t('dashboard.high')}</span>
              <span className="text-border">·</span>
              <span className={`inline-flex items-center gap-1 ${trendColor}`}>
                <Icon as={TrendIcon} size="xs" />
                <span className="tabular-nums font-medium">
                  {deltaPct === 0 ? '—' : `${deltaPct > 0 ? '+' : ''}${deltaPct}%`}
                </span>
              </span>
            </div>
          </div>
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <TabsList className="h-8">
              <TabsTrigger value="week" className="text-xs px-2.5">{t('dashboard.weekly')}</TabsTrigger>
              <TabsTrigger value="month" className="text-xs px-2.5">{t('dashboard.monthly')}</TabsTrigger>
              <TabsTrigger value="year" className="text-xs px-2.5">{t('dashboard.yearly')}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Legenda interativa */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {SERIES.map((s) => {
            const active = !hidden.has(s.key);
            return (
              <button
                key={s.key}
                onClick={() => toggleSeries(s.key)}
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] transition-all ${
                  active
                    ? 'bg-card border-border text-foreground hover:border-primary/40'
                    : 'bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50'
                }`}
                aria-pressed={active}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: active ? colorOf(s.tone) : 'hsl(var(--muted-foreground))' }}
                  aria-hidden="true"
                />
                {t(s.labelKey)}
              </button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col pt-0 pb-4 min-h-0">
        <div className="relative flex-1 min-h-[14rem] w-full">
          <div className="absolute inset-0">
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
            <ComposedChart data={chartData} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
              <defs>
                <linearGradient id="grad-criticos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="grad-altos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--warning))" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="hsl(var(--warning))" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                vertical={false}
                stroke="hsl(var(--border))"
                strokeDasharray="3 4"
                opacity={0.5}
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                padding={{ left: 12, right: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={32}
                domain={[0, 'auto']}
                padding={{ top: 8, bottom: 8 }}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip content={customTooltip} cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }} />

              {!hidden.has('baixos') && (
                <Line
                  type="monotone"
                  dataKey="baixos"
                  name={t('dashboard.low')}
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              )}
              {!hidden.has('medios') && (
                <Line
                  type="monotone"
                  dataKey="medios"
                  name={t('dashboard.medium')}
                  stroke="hsl(var(--primary))"
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              )}
              {!hidden.has('altos') && (
                <Area
                  type="monotone"
                  dataKey="altos"
                  name={t('dashboard.high')}
                  stroke="hsl(var(--warning))"
                  strokeWidth={2}
                  fill="url(#grad-altos)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              )}
              {!hidden.has('criticos') && (
                <Area
                  type="monotone"
                  dataKey="criticos"
                  name={t('dashboard.critical')}
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2.5}
                  fill="url(#grad-criticos)"
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
