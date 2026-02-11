import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface RiskData {
  month: string;
  criticos: number;
  altos: number;
  medios: number;
  baixos: number;
}

type TimeRange = 'week' | 'month' | 'year';

export function RiskScoreTimeline() {
  const { profile } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const { t } = useLanguage();

  // Query única otimizada
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

  // Processar dados no cliente
  const { chartData, totalCritical, trend } = useMemo(() => {
    if (!riscos || riscos.length === 0) {
      return { chartData: [], totalCritical: 0, trend: 'stable' as const };
    }

    const now = new Date();
    let periods: { end: Date; label: string }[] = [];

    if (timeRange === 'week') {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(23, 59, 59, 999);
        periods.push({ end: date, label: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) });
      }
    } else if (timeRange === 'month') {
      for (let i = 3; i >= 0; i--) {
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() - (i * 7));
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 6);
        periods.push({ end: endDate, label: `Sem ${4 - i}` });
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        periods.push({ end: date, label: date.toLocaleDateString('pt-BR', { month: 'short' }) });
      }
    }

    const processedData: RiskData[] = periods.map(period => {
      const riscosAtePeriodo = riscos.filter(r => new Date(r.created_at) <= period.end);
      return {
        month: period.label,
        criticos: riscosAtePeriodo.filter(r => r.nivel_risco_inicial === 'Crítico').length,
        altos: riscosAtePeriodo.filter(r => r.nivel_risco_inicial === 'Alto' || r.nivel_risco_inicial === 'Muito Alto').length,
        medios: riscosAtePeriodo.filter(r => r.nivel_risco_inicial === 'Médio' || r.nivel_risco_inicial === 'Moderado').length,
        baixos: riscosAtePeriodo.filter(r => r.nivel_risco_inicial === 'Baixo' || r.nivel_risco_inicial === 'Muito Baixo').length
      };
    });

    const current = processedData[processedData.length - 1];
    const previous = processedData[processedData.length - 2];
    const currentTotal = (current?.criticos || 0) + (current?.altos || 0);
    const previousTotal = (previous?.criticos || 0) + (previous?.altos || 0);

    return {
      chartData: processedData,
      totalCritical: current?.criticos || 0,
      trend: currentTotal > previousTotal ? 'up' : currentTotal < previousTotal ? 'down' : 'stable'
    };
  }, [riscos, timeRange]);

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border rounded-lg p-3 shadow-md">
          <p className="font-medium mb-2">{`${t('dashboard.period')}: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">{`${entry.name}: ${entry.value}`}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>{t('dashboard.riskEvolution')}</CardTitle></CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2">
          <CardTitle>{t('dashboard.riskEvolution')}</CardTitle>
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <TabsList>
              <TabsTrigger value="week">{t('dashboard.weekly')}</TabsTrigger>
              <TabsTrigger value="month">{t('dashboard.monthly')}</TabsTrigger>
              <TabsTrigger value="year">{t('dashboard.yearly')}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center space-x-2 mt-4">
          <span className="text-2xl font-bold text-destructive">{totalCritical}</span>
          {trend === 'up' && <TrendingUp className="h-5 w-5 text-destructive" />}
          {trend === 'down' && <TrendingDown className="h-5 w-5 text-green-600" />}
          {trend === 'stable' && <AlertTriangle className="h-5 w-5 text-warning" />}
          <Badge variant={totalCritical === 0 ? 'default' : 'destructive'}>
            {totalCritical === 0 ? t('dashboard.noCritical') : t('dashboard.criticalRisks')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-52 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={customTooltip} />
              <Legend />
              <Line type="monotone" dataKey="criticos" stroke="hsl(var(--destructive))" strokeWidth={3} name={t('dashboard.critical')} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="altos" stroke="hsl(var(--warning))" strokeWidth={2} name={t('dashboard.high')} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="medios" stroke="hsl(var(--primary))" strokeWidth={2} name={t('dashboard.medium')} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="baixos" stroke="hsl(var(--muted-foreground))" strokeWidth={2} name={t('dashboard.low')} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center border-t pt-4">
          <div><p className="text-lg font-bold text-destructive">{chartData[chartData.length - 1]?.criticos || 0}</p><p className="text-xs text-muted-foreground">{t('dashboard.critical')}</p></div>
          <div><p className="text-lg font-bold text-warning">{chartData[chartData.length - 1]?.altos || 0}</p><p className="text-xs text-muted-foreground">{t('dashboard.high')}</p></div>
          <div><p className="text-lg font-bold text-primary">{chartData[chartData.length - 1]?.medios || 0}</p><p className="text-xs text-muted-foreground">{t('dashboard.medium')}</p></div>
          <div><p className="text-lg font-bold text-muted-foreground">{chartData[chartData.length - 1]?.baixos || 0}</p><p className="text-xs text-muted-foreground">{t('dashboard.low')}</p></div>
        </div>
      </CardContent>
    </Card>
  );
}
