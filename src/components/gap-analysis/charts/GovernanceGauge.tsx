import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface GovernanceGaugeProps {
  overallScore: number;
  maxScore?: number;
  title?: string;
}

const GAUGE_COLORS = [
  { threshold: 80, color: "#16a34a", label: "Excelente" },
  { threshold: 60, color: "#2563eb", label: "Bom" },
  { threshold: 40, color: "#eab308", label: "Regular" },
  { threshold: 20, color: "#f97316", label: "Insuficiente" },
  { threshold: 0, color: "#dc2626", label: "Crítico" },
];

export const GovernanceGauge: React.FC<GovernanceGaugeProps> = ({ 
  overallScore, 
  maxScore = 100,
  title = "Nível de Governança" 
}) => {
  const percentage = (overallScore / maxScore) * 100;
  
  const getGaugeColor = () => {
    for (const level of GAUGE_COLORS) {
      if (percentage >= level.threshold) {
        return { color: level.color, label: level.label };
      }
    }
    return GAUGE_COLORS[GAUGE_COLORS.length - 1];
  };

  const { color, label } = getGaugeColor();

  // Create gauge data (semicircle)
  const gaugeData = [
    { name: 'Score', value: percentage },
    { name: 'Remaining', value: 100 - percentage }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={gaugeData}
                cx="50%"
                cy="85%"
                startAngle={180}
                endAngle={0}
                innerRadius={60}
                outerRadius={90}
                paddingAngle={0}
                dataKey="value"
              >
                <Cell fill={color} />
                <Cell fill="hsl(var(--muted))" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          
          <div className="text-center -mt-8">
            <div className="text-4xl font-bold" style={{ color }}>
              {overallScore.toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {label}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-6 justify-center">
            {GAUGE_COLORS.map((level) => (
              <div key={level.label} className="flex items-center gap-1">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: level.color }}
                />
                <span className="text-xs text-muted-foreground">{level.label}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
