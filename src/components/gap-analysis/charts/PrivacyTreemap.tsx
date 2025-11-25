import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";

interface CategoryScore {
  category: string;
  score: number;
  total: number;
  evaluated: number;
}

interface PrivacyTreemapProps {
  categoryScores: CategoryScore[];
  title?: string;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--primary))',
  'hsl(var(--accent))',
];

const CustomizedContent = (props: any) => {
  const { x, y, width, height, name, score, total } = props;
  
  if (width < 60 || height < 40) return null;
  
  const getScoreColor = (score: number): string => {
    if (score >= 80) return "#16a34a"; // green
    if (score >= 60) return "#2563eb"; // blue
    if (score >= 40) return "#eab308"; // yellow
    if (score >= 20) return "#f97316"; // orange
    return "#dc2626"; // red
  };

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: getScoreColor(score),
          stroke: 'hsl(var(--background))',
          strokeWidth: 2,
          fillOpacity: 0.7,
        }}
      />
      <text
        x={x + width / 2}
        y={y + height / 2 - 10}
        textAnchor="middle"
        fill="white"
        fontSize={12}
        fontWeight="600"
      >
        {name.length > 20 ? name.substring(0, 20) + '...' : name}
      </text>
      <text
        x={x + width / 2}
        y={y + height / 2 + 8}
        textAnchor="middle"
        fill="white"
        fontSize={16}
        fontWeight="bold"
      >
        {score.toFixed(0)}%
      </text>
      <text
        x={x + width / 2}
        y={y + height / 2 + 24}
        textAnchor="middle"
        fill="white"
        fontSize={10}
      >
        {total} itens
      </text>
    </g>
  );
};

export const PrivacyTreemap: React.FC<PrivacyTreemapProps> = ({ 
  categoryScores, 
  title = "Mapa de Conformidade por Capítulo" 
}) => {
  const data = categoryScores.map((cat, index) => ({
    name: cat.category,
    size: cat.total,
    score: cat.score,
    total: cat.total,
    evaluated: cat.evaluated,
    fill: COLORS[index % COLORS.length]
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <Treemap
            data={data}
            dataKey="size"
            stroke="hsl(var(--background))"
            fill="hsl(var(--primary))"
            content={<CustomizedContent />}
          >
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
              formatter={(value: any, name: string, props: any) => [
                `${props.payload.score.toFixed(1)}% (${props.payload.evaluated}/${props.payload.total} avaliados)`,
                props.payload.name
              ]}
            />
          </Treemap>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
