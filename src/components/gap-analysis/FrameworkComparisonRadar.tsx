import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";

interface FrameworkComparison {
  name: string;
  score: number;
}

interface FrameworkComparisonRadarProps {
  data: FrameworkComparison[];
}

export const FrameworkComparisonRadar: React.FC<FrameworkComparisonRadarProps> = ({ data }) => {
  if (data.length < 2) return null;

  const chartData = data.map(d => ({
    framework: d.name.length > 15 ? d.name.substring(0, 15) + '…' : d.name,
    score: d.score,
    fullMark: 100
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Maturidade Comparativa</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={chartData}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis
              dataKey="framework"
              tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
              tickFormatter={(v) => `${v}%`}
            />
            <Radar
              name="Conformidade"
              dataKey="score"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.5}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
              formatter={(value: number) => [`${value.toFixed(0)}%`, 'Conformidade']}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
