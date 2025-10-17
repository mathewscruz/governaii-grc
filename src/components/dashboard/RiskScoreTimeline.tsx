import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

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
  const [data, setData] = useState<RiskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCritical, setTotalCritical] = useState(0);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');
  const [timeRange, setTimeRange] = useState<TimeRange>('month');

  useEffect(() => {
    if (profile) {
      fetchRiskData();
    }
  }, [profile, timeRange]);

  const fetchRiskData = async () => {
    try {
      setLoading(true);
      const periods = [];
      const now = new Date();
      
      if (timeRange === 'week') {
        // Últimos 7 dias
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);

          const { data: riscosData } = await supabase
            .from('riscos')
            .select('nivel_risco_inicial, created_at')
            .lte('created_at', date.toISOString());

          const riscos = riscosData || [];
          const criticos = riscos.filter(r => r.nivel_risco_inicial === 'Crítico').length;
          const altos = riscos.filter(r => r.nivel_risco_inicial === 'Alto' || r.nivel_risco_inicial === 'Muito Alto').length;
          const medios = riscos.filter(r => r.nivel_risco_inicial === 'Médio' || r.nivel_risco_inicial === 'Moderado').length;
          const baixos = riscos.filter(r => r.nivel_risco_inicial === 'Baixo' || r.nivel_risco_inicial === 'Muito Baixo').length;

          periods.push({
            month: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
            criticos,
            altos,
            medios,
            baixos
          });
        }
      } else if (timeRange === 'month') {
        // Últimas 4 semanas
        for (let i = 3; i >= 0; i--) {
          const endDate = new Date(now);
          endDate.setDate(endDate.getDate() - (i * 7));
          const startDate = new Date(endDate);
          startDate.setDate(startDate.getDate() - 6);
          
          const { data: riscosData } = await supabase
            .from('riscos')
            .select('nivel_risco_inicial, created_at')
            .lte('created_at', endDate.toISOString());

          const riscos = riscosData || [];
          const criticos = riscos.filter(r => r.nivel_risco_inicial === 'Crítico').length;
          const altos = riscos.filter(r => r.nivel_risco_inicial === 'Alto' || r.nivel_risco_inicial === 'Muito Alto').length;
          const medios = riscos.filter(r => r.nivel_risco_inicial === 'Médio' || r.nivel_risco_inicial === 'Moderado').length;
          const baixos = riscos.filter(r => r.nivel_risco_inicial === 'Baixo' || r.nivel_risco_inicial === 'Muito Baixo').length;

          periods.push({
            month: `${startDate.getDate()}/${startDate.getMonth() + 1}`,
            criticos,
            altos,
            medios,
            baixos
          });
        }
      } else {
        // Últimos 12 meses
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const nextMonthDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
          
          const { data: riscosData } = await supabase
            .from('riscos')
            .select('nivel_risco_inicial, created_at')
            .lte('created_at', nextMonthDate.toISOString());

          const riscos = riscosData || [];
          const criticos = riscos.filter(r => r.nivel_risco_inicial === 'Crítico').length;
          const altos = riscos.filter(r => r.nivel_risco_inicial === 'Alto' || r.nivel_risco_inicial === 'Muito Alto').length;
          const medios = riscos.filter(r => r.nivel_risco_inicial === 'Médio' || r.nivel_risco_inicial === 'Moderado').length;
          const baixos = riscos.filter(r => r.nivel_risco_inicial === 'Baixo' || r.nivel_risco_inicial === 'Muito Baixo').length;

          periods.push({
            month: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
            criticos,
            altos,
            medios,
            baixos
          });
        }
      }

      setData(periods);
      
      // Calcular totais atuais e tendência
      if (periods.length >= 2) {
        const current = periods[periods.length - 1];
        const previous = periods[periods.length - 2];
        const currentTotal = current.criticos + current.altos;
        const previousTotal = previous.criticos + previous.altos;
        
        setTotalCritical(current.criticos);
        
        if (currentTotal > previousTotal) setTrend('up');
        else if (currentTotal < previousTotal) setTrend('down');
        else setTrend('stable');
      }
    } catch (error) {
      console.error('Erro ao carregar dados de riscos:', error);
    } finally {
      setLoading(false);
    }
  };

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border rounded-lg p-3 shadow-md">
          <p className="font-medium mb-2">{`Período: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolução de Riscos por Criticidade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center justify-between w-full">
            <CardTitle>Evolução de Riscos por Criticidade</CardTitle>
            <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
              <TabsList>
                <TabsTrigger value="week">Semanal</TabsTrigger>
                <TabsTrigger value="month">Mensal</TabsTrigger>
                <TabsTrigger value="year">Anual</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        <div className="flex items-center space-x-4 mt-4">
          <div className="text-right">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-destructive">
                {totalCritical}
              </span>
              {trend === 'up' && <TrendingUp className="h-5 w-5 text-destructive" />}
              {trend === 'down' && <TrendingDown className="h-5 w-5 text-green-600" />}
              {trend === 'stable' && <AlertTriangle className="h-5 w-5 text-warning" />}
            </div>
            <Badge variant={totalCritical === 0 ? 'default' : 'destructive'}>
              {totalCritical === 0 ? 'Sem Críticos' : 'Riscos Críticos'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="w-full overflow-hidden">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                className="text-sm text-muted-foreground"
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                className="text-sm text-muted-foreground"
              />
              <Tooltip content={customTooltip} />
              <Legend />
              <Line
                type="monotone"
                dataKey="criticos"
                stroke="hsl(var(--destructive))"
                strokeWidth={3}
                name="Críticos"
                dot={{ fill: 'hsl(var(--destructive))', strokeWidth: 2, r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="altos"
                stroke="hsl(var(--warning))"
                strokeWidth={2}
                name="Altos"
                dot={{ fill: 'hsl(var(--warning))', strokeWidth: 2, r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="medios"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                name="Médios"
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="baixos"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                name="Baixos"
                dot={{ fill: 'hsl(var(--muted-foreground))', strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Críticos</p>
            <p className="text-lg font-semibold text-destructive">
              {data[data.length - 1]?.criticos || 0}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Altos</p>
            <p className="text-lg font-semibold text-warning">
              {data[data.length - 1]?.altos || 0}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Médios</p>
            <p className="text-lg font-semibold text-primary">
              {data[data.length - 1]?.medios || 0}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Baixos</p>
            <p className="text-lg font-semibold text-muted-foreground">
              {data[data.length - 1]?.baixos || 0}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}