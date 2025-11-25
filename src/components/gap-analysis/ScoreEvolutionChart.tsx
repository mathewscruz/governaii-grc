import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useScoreHistory, ScoreHistoryPeriod } from '@/hooks/useScoreHistory';
import { Skeleton } from '@/components/ui/skeleton';

interface ScoreEvolutionChartProps {
  frameworkId: string;
}

export const ScoreEvolutionChart = ({ frameworkId }: ScoreEvolutionChartProps) => {
  const [period, setPeriod] = useState<ScoreHistoryPeriod>('monthly');
  const { history, loading } = useScoreHistory(frameworkId, period);

  const periods: { value: ScoreHistoryPeriod; label: string }[] = [
    { value: 'daily', label: 'Dia' },
    { value: 'weekly', label: 'Semana' },
    { value: 'monthly', label: 'Mês' },
    { value: 'yearly', label: 'Ano' }
  ];

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Evolução do Score</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Evolução do Score</CardTitle>
        <div className="flex gap-1">
          {periods.map(p => (
            <Button
              key={p.value}
              variant={period === p.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p.value)}
              className="h-8 px-3"
            >
              {p.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            <p>Nenhum histórico disponível ainda</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={history} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                domain={[0, 5]}
                ticks={[0, 1, 2, 3, 4, 5]}
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  padding: '8px 12px'
                }}
                labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                formatter={(value: number) => [value.toFixed(2), 'Score']}
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ fill: '#8b5cf6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
