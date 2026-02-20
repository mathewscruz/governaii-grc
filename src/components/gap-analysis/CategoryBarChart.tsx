import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  const maxValue = config.scoreType === 'percentage' ? 100 : 5;

  const getScoreColor = (score: number) => {
    const ratio = score / maxValue;
    if (ratio >= 0.8) return "bg-blue-600";
    if (ratio >= 0.6) return "bg-blue-500";
    if (ratio >= 0.4) return "bg-blue-400";
    if (ratio >= 0.2) return "bg-blue-300";
    return "bg-blue-200";
  };

  const formatScore = (score: number) =>
    config.scoreType === 'percentage' ? `${score.toFixed(1)}%` : score.toFixed(1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Aderência por Categoria</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
          <TooltipProvider>
            {categoryScores.map((cat, i) => {
              const pct = (cat.score / maxValue) * 100;
              return (
                <Tooltip key={i}>
                  <TooltipTrigger asChild>
                    <div className="space-y-1 cursor-default">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs text-foreground leading-tight">{cat.category}</span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatScore(cat.score)}
                        </span>
                      </div>
                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className={`h-full rounded-full transition-all ${getScoreColor(cat.score)}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">{cat.category}</p>
                    <p className="text-xs">{formatScore(cat.score)} — {cat.evaluated}/{cat.total} avaliados</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
};
