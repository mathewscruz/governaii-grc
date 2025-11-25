import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";

interface CategoryScore {
  category: string;
  score: number;
  total: number;
  evaluated: number;
}

interface ComplianceStackedBarProps {
  categoryScores: CategoryScore[];
  title?: string;
}

const STATUS_COLORS = {
  conforme: "#16a34a",      // green
  parcial: "#eab308",       // yellow
  naoConforme: "#dc2626",   // red
  naoAvaliado: "#94a3b8"    // gray
};

export const ComplianceStackedBar: React.FC<ComplianceStackedBarProps> = ({ 
  categoryScores, 
  title = "Status de Conformidade por Categoria" 
}) => {
  // Transform data to show status breakdown
  const chartData = categoryScores.map(cat => {
    const conformePercent = cat.score;
    const evaluatedPercent = (cat.evaluated / cat.total) * 100;
    const naoAvaliadoPercent = 100 - evaluatedPercent;
    
    // Estimate partial/non-compliant from evaluated but not fully compliant
    const remainingEvaluated = evaluatedPercent - conformePercent;
    const parcialPercent = remainingEvaluated * 0.5; // rough estimate
    const naoConformePercent = remainingEvaluated * 0.5;

    return {
      name: cat.category.length > 15 ? cat.category.substring(0, 15) + '...' : cat.category,
      fullName: cat.category,
      conforme: conformePercent,
      parcial: parcialPercent,
      naoConforme: naoConformePercent,
      naoAvaliado: naoAvaliadoPercent,
      total: cat.total,
      evaluated: cat.evaluated
    };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-md p-3 shadow-lg">
          <p className="font-semibold mb-2">{data.fullName}</p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: STATUS_COLORS.conforme }} />
              <span>Conforme: {data.conforme.toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: STATUS_COLORS.parcial }} />
              <span>Parcial: {data.parcial.toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: STATUS_COLORS.naoConforme }} />
              <span>Não Conforme: {data.naoConforme.toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: STATUS_COLORS.naoAvaliado }} />
              <span>Não Avaliado: {data.naoAvaliado.toFixed(1)}%</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {data.evaluated}/{data.total} requisitos avaliados
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 10, left: 100, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              type="number" 
              domain={[0, 100]}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              label={{ value: '%', position: 'insideRight' }}
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
              width={95}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '10px' }}
              formatter={(value) => {
                const labels: Record<string, string> = {
                  conforme: 'Conforme',
                  parcial: 'Parcial',
                  naoConforme: 'Não Conforme',
                  naoAvaliado: 'Não Avaliado'
                };
                return labels[value] || value;
              }}
            />
            <Bar dataKey="conforme" stackId="a" fill={STATUS_COLORS.conforme} radius={[0, 0, 0, 0]} />
            <Bar dataKey="parcial" stackId="a" fill={STATUS_COLORS.parcial} radius={[0, 0, 0, 0]} />
            <Bar dataKey="naoConforme" stackId="a" fill={STATUS_COLORS.naoConforme} radius={[0, 0, 0, 0]} />
            <Bar dataKey="naoAvaliado" stackId="a" fill={STATUS_COLORS.naoAvaliado} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
