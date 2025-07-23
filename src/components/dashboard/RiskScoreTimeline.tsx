import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

export function RiskScoreTimeline() {
  const { profile } = useAuth();
  const [data, setData] = useState<RiskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCritical, setTotalCritical] = useState(0);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');

  useEffect(() => {
    if (profile) {
      fetchRiskData();
    }
  }, [profile]);

  const fetchRiskData = async () => {
    try {
      // Buscar dados dos últimos 12 meses
      const months = [];
      const now = new Date();
      
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonthDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        // Buscar riscos criados até esse mês
        const { data: riscosData } = await supabase
          .from('riscos')
          .select('nivel_risco_inicial, created_at')
          .lte('created_at', nextMonthDate.toISOString());

        const riscos = riscosData || [];
        const criticos = riscos.filter(r => r.nivel_risco_inicial === 'Crítico').length;
        const altos = riscos.filter(r => r.nivel_risco_inicial === 'Alto' || r.nivel_risco_inicial === 'Muito Alto').length;
        const medios = riscos.filter(r => r.nivel_risco_inicial === 'Médio' || r.nivel_risco_inicial === 'Moderado').length;
        const baixos = riscos.filter(r => r.nivel_risco_inicial === 'Baixo' || r.nivel_risco_inicial === 'Muito Baixo').length;

        months.push({
          month: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
          criticos,
          altos,
          medios,
          baixos
        });
      }

      setData(months);
      
      // Calcular totais atuais e tendência
      if (months.length >= 2) {
        const current = months[months.length - 1];
        const previous = months[months.length - 2];
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Evolução de Riscos por Criticidade</CardTitle>
          <div className="flex items-center space-x-4">
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
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
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
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
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