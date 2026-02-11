import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRadarChartData, RadarDataPoint } from "@/hooks/useRadarChartData";
import { useNavigate } from "react-router-dom";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const CustomDot = ({ cx, cy, payload, navigate }: any) => {
  const handleClick = (e: any) => {
    e.stopPropagation();
    if (payload.link) {
      navigate(payload.link);
    }
  };

  return (
    <circle
      cx={cx}
      cy={cy}
      r={6}
      fill="hsl(var(--primary))"
      stroke="#fff"
      strokeWidth={2}
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
      className="hover:r-8 transition-all"
    />
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload[0]) return null;

  const data: RadarDataPoint = payload[0].payload;
  
  const statusConfig = {
    excellent: { icon: CheckCircle2, color: "text-green-500", label: "Excelente", bgColor: "bg-green-500/10" },
    good: { icon: CheckCircle2, color: "text-blue-500", label: "Bom", bgColor: "bg-blue-500/10" },
    warning: { icon: AlertCircle, color: "text-yellow-500", label: "Atenção", bgColor: "bg-yellow-500/10" },
    critical: { icon: XCircle, color: "text-red-500", label: "Crítico", bgColor: "bg-red-500/10" }
  };

  const config = statusConfig[data.details.status];
  const StatusIcon = config.icon;

  return (
    <div className="bg-background border border-border rounded-lg shadow-lg p-4 min-w-[250px]">
      <div className="flex items-center gap-2 mb-3">
        <StatusIcon className={`w-5 h-5 ${config.color}`} />
        <h3 className="font-semibold text-foreground">{data.subject}</h3>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Score:</span>
          <span className="font-bold text-lg text-foreground">{data.score}%</span>
        </div>
        
        <Badge variant="outline" className={config.bgColor}>
          {config.label}
        </Badge>

        <div className="pt-2 border-t border-border space-y-1">
          {data.details.metrics.map((metric, idx) => (
            <div key={idx} className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-primary"></span>
              {metric}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const MultiDimensionalRadar = () => {
  const { data, isLoading } = useRadarChartData();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const averageScore = useMemo(() => {
    if (!data || data.length === 0) return 0;
    return Math.round(data.reduce((sum, d) => sum + d.score, 0) / data.length);
  }, [data]);

  const statusConfig = useMemo(() => {
    if (averageScore >= 80) return { label: t('dashboard.excellent'), variant: 'success' as const, icon: CheckCircle2, color: 'text-green-500' };
    if (averageScore >= 60) return { label: t('dashboard.good'), variant: 'default' as const, icon: CheckCircle2, color: 'text-primary' };
    if (averageScore >= 40) return { label: t('dashboard.warning'), variant: 'warning' as const, icon: AlertCircle, color: 'text-warning' };
    return { label: t('dashboard.criticalStatus'), variant: 'destructive' as const, icon: XCircle, color: 'text-destructive' };
  }, [averageScore, t]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const StatusIcon = statusConfig.icon;

  return (
    <Card className="w-full flex flex-col overflow-hidden min-w-0">
      <CardHeader>
        <CardTitle>{t('dashboard.maturity')}</CardTitle>
        <div className="flex items-center space-x-2 mt-4">
          <span className={`text-2xl font-bold ${statusConfig.color}`}>{averageScore}%</span>
          <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
          <Badge variant={statusConfig.variant}>
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="w-full overflow-hidden flex-1 flex flex-col">
        <div className="h-52 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--muted-foreground))"
              opacity={0.3}
            />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={({ x, y, payload, index }: any) => {
                const handleClick = () => {
                  if (data[index]?.link) {
                    navigate(data[index].link);
                  }
                };

                return (
                  <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    fill="hsl(var(--foreground))"
                    fontSize={10}
                    fontWeight={500}
                    onClick={handleClick}
                    style={{ cursor: 'pointer' }}
                    className="hover:fill-primary transition-colors"
                  >
                    {payload.value}
                  </text>
                );
              }}
            />
            <PolarRadiusAxis 
              domain={[0, 100]} 
              tick={{ 
                fill: 'hsl(var(--muted-foreground))',
                fontSize: 10
              }}
              axisLine={false}
            />
            <Radar
              name="Score"
              dataKey="score"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.3}
              strokeWidth={2}
              animationDuration={800}
              animationBegin={0}
              dot={<CustomDot navigate={navigate} />}
            />
            <Tooltip content={(props) => <CustomTooltip {...props} />} />
          </RadarChart>
        </ResponsiveContainer>
        </div>
        
        <div className="mt-auto grid grid-cols-2 sm:grid-cols-4 gap-4 text-center border-t pt-4">
          {(data ?? []).slice(0, 4).map((item) => {
            const color = item.score >= 80 ? 'text-green-500' : item.score >= 60 ? 'text-primary' : item.score >= 40 ? 'text-warning' : 'text-destructive';
            return (
              <div key={item.subject}>
                <p className={`text-lg font-bold ${color}`}>{item.score}%</p>
                <p className="text-xs text-muted-foreground">{item.subject}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
