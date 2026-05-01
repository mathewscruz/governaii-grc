import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { getScoreHsl, normalizeScore } from "@/lib/gap-analysis-tokens";

interface AreaScore {
  area: string;
  score: number;
  total: number;
  evaluated: number;
}

interface AreaBarChartProps {
  areaScores: AreaScore[];
  config: {
    scoreType: 'decimal' | 'percentage' | 'scale_0_5';
  };
}

export const AreaBarChart: React.FC<AreaBarChartProps> = ({ areaScores, config }) => {
  const chartData = areaScores.slice(0, 8).map(area => ({
    name: area.area.length > 20 ? area.area.substring(0, 18) + '...' : area.area,
    fullName: area.area,
    score: area.score,
    displayScore: config.scoreType === 'percentage' ? `${area.score.toFixed(1)}%` : area.score.toFixed(1),
    evaluated: `${area.evaluated}/${area.total}`,
    fill: getScoreHsl(normalizeScore(area.score, config.scoreType)),
  }));

  const maxValue = config.scoreType === 'percentage' ? 100 : 5;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Score por Área Responsável</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 10, left: 70, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              type="number"
              domain={[0, maxValue]}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
              width={65}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
              formatter={(value: any, name: string, props: any) => [
                `${props.payload.displayScore} (${props.payload.evaluated} avaliados)`,
                props.payload.fullName
              ]}
            />
            <Bar dataKey="score" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
