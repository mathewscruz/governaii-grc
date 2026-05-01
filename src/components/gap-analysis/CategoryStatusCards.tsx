import { useMemo, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { StatusBlocks, StatusBlocksLegend } from "./StatusBlocks";
import { getScoreTextClass } from "@/lib/gap-analysis-tokens";

interface CategoryData {
  categoria: string;
  conforme: number;
  parcial: number;
  nao_conforme: number;
  nao_aplicavel: number;
  nao_avaliado: number;
  total: number;
}

interface CategoryStatusCardsProps {
  categories: CategoryData[];
  onCategoryClick?: (categoria: string) => void;
  activeCategory?: string;
}

export const CategoryStatusCards: React.FC<CategoryStatusCardsProps> = ({
  categories,
  onCategoryClick,
  activeCategory,
}) => {
  if (categories.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground">Visão por Categoria</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {categories.map(cat => {
          const applicable = cat.total - cat.nao_aplicavel;
          const pct = applicable > 0 ? Math.round((cat.conforme / applicable) * 100) : 0;
          const isActive = activeCategory === cat.categoria;

          return (
            <Popover key={cat.categoria}>
              <PopoverTrigger asChild>
                <Card
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isActive ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => onCategoryClick?.(cat.categoria)}
                >
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-xs font-semibold leading-tight line-clamp-2">{cat.categoria}</p>
                      <span className={`text-xs font-bold shrink-0 ${pct > 0 ? getScoreTextClass(pct) : 'text-muted-foreground'}`}>
                        {pct}%
                      </span>
                    </div>
                    <StatusBlocks
                      conforme={cat.conforme}
                      parcial={cat.parcial}
                      nao_conforme={cat.nao_conforme}
                      nao_aplicavel={cat.nao_aplicavel}
                      nao_avaliado={cat.nao_avaliado}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      {cat.conforme}/{applicable} conformes
                    </p>
                  </CardContent>
                </Card>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-3" align="start">
                <p className="text-sm font-semibold mb-2">{cat.categoria}</p>
                <StatusBlocksLegend
                  conforme={cat.conforme}
                  parcial={cat.parcial}
                  nao_conforme={cat.nao_conforme}
                  nao_aplicavel={cat.nao_aplicavel}
                  nao_avaliado={cat.nao_avaliado}
                />
                <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                  Total: {cat.total} requisitos
                </div>
              </PopoverContent>
            </Popover>
          );
        })}
      </div>
    </div>
  );
};
