import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface CategoryScore {
  category: string;
  score: number;
  total: number;
  evaluated: number;
}

interface CategoryBarChartProps {
  categoryScores: CategoryScore[];
  config: {
    scoreType: 'decimal' | 'percentage' | 'scale_0_5';
  };
}

export const CategoryBarChart: React.FC<CategoryBarChartProps> = ({ categoryScores, config }) => {
  const getScoreColor = (score: number) => {
    // Cores sóbrias em tons de azul
    if (config.scoreType === 'percentage') {
      if (score >= 80) return "#2563eb"; // Azul forte
      if (score >= 60) return "#3b82f6"; // Azul médio
      if (score >= 40) return "#60a5fa"; // Azul claro
      if (score >= 20) return "#93c5fd"; // Azul muito claro
      return "#dbeafe"; // Azul pálido
    } else {
      // decimal (0-5) or scale_0_5
      if (score >= 4.5) return "#2563eb"; // Azul forte
      if (score >= 3.5) return "#3b82f6"; // Azul médio
      if (score >= 2.5) return "#60a5fa"; // Azul claro
      if (score >= 1.5) return "#93c5fd"; // Azul muito claro
      return "#dbeafe"; // Azul pálido
    }
  };

  const chartData = categoryScores.map(cat => ({
    name: cat.category,
    score: config.scoreType === 'percentage' ? cat.score : cat.score,
    displayScore: config.scoreType === 'percentage' ? `${cat.score.toFixed(1)}%` : cat.score.toFixed(1),
    evaluated: `${cat.evaluated}/${cat.total}`,
    fill: getScoreColor(cat.score)
  }));

  const maxValue = config.scoreType === 'percentage' ? 100 : 5;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Aderência por Categoria</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
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
              width={75}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
              formatter={(value: any, name: string, props: any) => [
                `${props.payload.displayScore} (${props.payload.evaluated} avaliados)`,
                'Score'
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
