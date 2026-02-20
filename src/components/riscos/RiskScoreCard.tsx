import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RiscosStats } from "@/hooks/useRiscosStats";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface RiskScoreCardProps {
  stats: RiscosStats | undefined;
  loading?: boolean;
}

const getColor = (score: number): string => {
  if (score >= 80) return "hsl(var(--success))";
  if (score >= 60) return "hsl(var(--primary))";
  if (score >= 40) return "hsl(var(--warning))";
  return "hsl(var(--destructive))";
};

const getLabel = (score: number): string => {
  if (score === 0) return "Sem dados";
  if (score >= 80) return "Excelente";
  if (score >= 60) return "Bom";
  if (score >= 40) return "Atenção";
  return "Crítico";
};

const legendItems = [
  { label: "Crítico", color: "bg-destructive" },
  { label: "Atenção", color: "bg-warning" },
  { label: "Bom", color: "bg-primary" },
  { label: "Excelente", color: "bg-success" },
];

const calcDisplayScore = (stats: RiscosStats): number => {
  if (stats.total === 0) return 0;
  const positivos = stats.baixos + stats.aceitos + stats.tratamentos_concluidos;
  return Math.min(100, Math.round((positivos / stats.total) * 100));
};

export function RiskScoreCard({ stats, loading }: RiskScoreCardProps) {
  if (loading || !stats) {
    return (
      <Card className="bg-card border border-border shadow-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent className="pt-2 pb-3">
          <Skeleton className="h-[100px] w-[160px] mx-auto" />
        </CardContent>
      </Card>
    );
  }

  const displayScore = calcDisplayScore(stats);
  const scoreColor = getColor(displayScore);
  const label = getLabel(displayScore);

  const hasVariation = stats.variacao7dias !== null && stats.variacao7dias !== 0;
  const isPositiveTrend = stats.variacao7dias && stats.variacao7dias < 0;

  // SVG gauge arc (semicircle)
  const radius = 60;
  const circumference = Math.PI * radius;
  const progress = (displayScore / 100) * circumference;
  const strokeWidth = 10;

  return (
    <Card className="bg-card border border-border shadow-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
        <CardTitle className="text-sm font-medium leading-none">
          Score de Risco
        </CardTitle>
        {hasVariation && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              isPositiveTrend
                ? "text-success"
                : "text-destructive"
            )}
          >
            {isPositiveTrend ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            )}
            <span>{Math.abs(stats.variacao7dias!)}%</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-0 pb-3">
        {/* Gauge semicircular */}
        <div className="flex flex-col items-center">
          <svg width="160" height="90" viewBox="0 0 160 100">
            {/* Background arc */}
            <path
              d="M 20 90 A 60 60 0 0 1 140 90"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            {/* Progress arc */}
            <path
              d="M 20 90 A 60 60 0 0 1 140 90"
              fill="none"
              stroke={scoreColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`${progress} ${circumference}`}
              className="transition-all duration-1000"
            />
            {/* Score text */}
            <text x="80" y="72" textAnchor="middle" className="fill-foreground" fontSize="28" fontWeight="bold">
              {displayScore}
            </text>
            <text x="80" y="92" textAnchor="middle" className="fill-muted-foreground" fontSize="11">
              {label}
            </text>
          </svg>

          {/* Legenda de níveis */}
          <div className="flex items-center gap-3 mt-1">
            {legendItems.map((item) => (
              <div key={item.label} className="flex items-center gap-1">
                <div className={cn("w-2 h-2 rounded-full", item.color)} />
                <span className="text-[10px] text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
