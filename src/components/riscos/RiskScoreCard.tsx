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

// Componente do gráfico circular
interface CircularProgressProps {
  percentage: number;
  color: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({ percentage, color }) => {
  const radius = 35;
  const circumference = 2 * Math.PI * radius; // Círculo completo
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <svg 
      width="90" 
      height="90" 
      viewBox="0 0 90 90" 
      className="mx-auto"
    >
      {/* Background Circle */}
      <circle
        cx="45"
        cy="45"
        r={radius}
        fill="none"
        stroke="hsl(var(--muted))"
        strokeWidth="8"
      />
      
      {/* Progress Circle */}
      <circle
        cx="45"
        cy="45"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        transform="rotate(-90 45 45)"
        style={{
          transition: "stroke-dashoffset 1s ease-out",
        }}
      />
    </svg>
  );
};

// Função para calcular porcentagem do score (0-100%)
const getScorePercentage = (score: number): number => {
  return (score / 1000) * 100;
};

// Função para obter cor baseada no score
const getScoreColor = (score: number): string => {
  if (score <= 250) return "#ef4444"; // red
  if (score <= 500) return "#f97316"; // orange
  if (score <= 750) return "#eab308"; // yellow
  return "#22c55e"; // green
};

// Função para obter classificação textual
const getScoreClassification = (score: number): {
  text: string;
  bgColor: string;
  textColor: string;
} => {
  if (score <= 250)
    return {
      text: "Score Crítico",
      bgColor: "bg-red-50 dark:bg-red-950/20",
      textColor: "text-red-700 dark:text-red-400",
    };
  if (score <= 500)
    return {
      text: "Score Alto",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
      textColor: "text-orange-700 dark:text-orange-400",
    };
  if (score <= 750)
    return {
      text: "Score Médio",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
      textColor: "text-yellow-700 dark:text-yellow-400",
    };
  return {
    text: "Score Baixo",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    textColor: "text-green-700 dark:text-green-400",
  };
};

export function RiskScoreCard({ stats, loading }: RiskScoreCardProps) {
  if (loading || !stats) {
    return (
      <Card className="bg-card border border-border shadow-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent className="pt-2 pb-3">
          <div className="space-y-2">
            <Skeleton className="h-3 w-12 mx-auto" />
            <Skeleton className="h-[90px] w-[90px] mx-auto rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcular score normalizado (0-1000)
  // Inverter: quanto menor o scoreAtual interno (0-100), melhor o score exibido (0-1000)
  // scoreAtual 0 = melhor (todos baixos) → displayScore 1000
  // scoreAtual 100 = pior (todos críticos) → displayScore 0
  const displayScore = Math.round((100 - stats.scoreAtual) * 10);
  const scorePercentage = getScorePercentage(displayScore);
  const scoreColor = getScoreColor(displayScore);
  const classification = getScoreClassification(displayScore);

  const hasVariation = stats.variacao7dias !== null && stats.variacao7dias !== 0;
  const isPositiveTrend = stats.variacao7dias && stats.variacao7dias < 0;

  return (
    <Card className="bg-card border border-border shadow-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium leading-none">
          Score de Risco
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2 pb-3">
        {/* Variação */}
        {hasVariation && (
          <div
            className={cn(
              "flex items-center justify-center gap-1 mb-2 text-xs font-medium",
              isPositiveTrend
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            )}
          >
            {isPositiveTrend ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            )}
            <span>{Math.abs(stats.variacao7dias)}%</span>
          </div>
        )}

        {/* Gráfico Circular com Score Centralizado */}
        <div className="relative inline-block mx-auto">
          <CircularProgress percentage={scorePercentage} color={scoreColor} />
          
          {/* Score dentro do círculo */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-foreground leading-none">
              {displayScore}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">de 1000</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
