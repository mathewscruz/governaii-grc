import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getScoreBgClass, normalizeScore } from "@/lib/gap-analysis-tokens";

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
  onCategoryClick?: (category: string) => void;
  activeCategory?: string;
}

export const CategoryBarChart: React.FC<CategoryBarChartProps> = ({
  categoryScores,
  config,
  onCategoryClick,
  activeCategory,
}) => {
  const maxValue = config.scoreType === 'percentage' ? 100 : 5;

  const formatScore = (score: number) =>
    config.scoreType === 'percentage' ? `${score.toFixed(0)}%` : score.toFixed(1);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Aderência por Categoria</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
          <TooltipProvider>
            {categoryScores.map((cat, i) => {
              const pct = (cat.score / maxValue) * 100;
              const normalized = normalizeScore(cat.score, config.scoreType);
              const isActive = activeCategory === cat.category;
              const clickable = !!onCategoryClick;

              return (
                <Tooltip key={i}>
                  <TooltipTrigger asChild>
                    <div
                      role={clickable ? 'button' : undefined}
                      tabIndex={clickable ? 0 : undefined}
                      onClick={() => clickable && onCategoryClick?.(cat.category)}
                      onKeyDown={(e) => {
                        if (clickable && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          onCategoryClick?.(cat.category);
                        }
                      }}
                      className={`group grid grid-cols-[140px_1fr_auto_auto] items-center gap-3 py-1 px-2 -mx-2 rounded-md transition-colors ${
                        clickable ? 'cursor-pointer hover:bg-muted/50' : 'cursor-default'
                      } ${isActive ? 'bg-primary/5 ring-1 ring-primary/20' : ''}`}
                    >
                      <span className={`text-xs leading-tight truncate ${isActive ? 'font-semibold text-foreground' : 'text-foreground'}`}>
                        {cat.category}
                      </span>
                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className={`h-full rounded-full transition-all ${getScoreBgClass(normalized)}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-foreground whitespace-nowrap min-w-[42px] text-right">
                        {formatScore(cat.score)}
                      </span>
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap min-w-[60px] text-right">
                        {cat.evaluated}/{cat.total} req.
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">{cat.category}</p>
                    <p className="text-xs">{formatScore(cat.score)} — {cat.evaluated}/{cat.total} avaliados</p>
                    {clickable && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Clique para filtrar requisitos
                      </p>
                    )}
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
