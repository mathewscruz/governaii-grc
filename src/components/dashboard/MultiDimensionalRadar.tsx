import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Legend
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
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

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <CardTitle>{t('dashboard.maturity')}</CardTitle>
        </div>
        <CardDescription>
          {t('dashboard.maturityDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="w-full overflow-hidden">
        <ResponsiveContainer width="100%" height={280}>
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
                    fontSize={12}
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
            <Legend
              iconType="circle"
              wrapperStyle={{
                paddingTop: '20px',
                fontSize: '12px',
                color: 'hsl(var(--foreground))'
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
        
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="flex items-center gap-1 text-xs">
            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
            <span className="text-muted-foreground">80-100%: {t('dashboard.excellent')}</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
            <span className="text-muted-foreground">60-79%: {t('dashboard.good')}</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <div className="w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0"></div>
            <span className="text-muted-foreground">40-59%: {t('dashboard.warning')}</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></div>
            <span className="text-muted-foreground">0-39%: {t('dashboard.criticalStatus')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
