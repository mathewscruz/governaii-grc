import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { RiscosStats } from "@/hooks/useRiscosStats";
import { ArrowDown, ArrowUp, ArrowRight } from "lucide-react";
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
  const radius = 70;
  const circumference = Math.PI * radius; // Semicírculo
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <svg 
      width="180" 
      height="100" 
      viewBox="0 0 180 100" 
      className="mx-auto"
    >
      {/* Background Track */}
      <path
        d="M 20 90 A 70 70 0 0 1 160 90"
        fill="none"
        stroke="hsl(var(--muted))"
        strokeWidth="12"
        strokeLinecap="round"
      />
      
      {/* Progress Arc */}
      <path
        d="M 20 90 A 70 70 0 0 1 160 90"
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
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
        <CardContent className="pt-8 pb-8">
          <div className="space-y-6">
            <Skeleton className="h-24 w-44 mx-auto rounded-full" />
            <Skeleton className="h-4 w-16 mx-auto" />
            <Skeleton className="h-16 w-32 mx-auto" />
            <Skeleton className="h-4 w-20 mx-auto" />
            <Skeleton className="h-10 w-40 mx-auto rounded-full" />
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
  const isPositiveTrend = stats.variacao7dias && stats.variacao7dias > 0;

  return (
    <Card className="bg-card border border-border shadow-card">
      <CardContent className="pt-8 pb-8">
        {/* Gráfico Circular */}
        <CircularProgress percentage={scorePercentage} color={scoreColor} />

        {/* Variação */}
        {hasVariation && (
          <div
            className={cn(
              "flex items-center justify-center gap-1 mt-3 text-sm font-medium",
              isPositiveTrend
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            )}
          >
            {isPositiveTrend ? (
              <ArrowDown className="h-4 w-4" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
            <span>{Math.abs(stats.variacao7dias)}</span>
          </div>
        )}

        {/* Score Principal */}
        <div className="text-center mt-4">
          <div className="text-6xl font-bold text-foreground leading-none">
            {displayScore}
          </div>
          <div className="text-sm text-muted-foreground mt-2">de 1000</div>
        </div>

        {/* Badge de Classificação */}
        <div className="flex justify-center mt-6">
          <Badge
            variant="outline"
            className={cn(
              "px-4 py-2 rounded-full flex items-center gap-2 border-0",
              classification.bgColor,
              classification.textColor
            )}
          >
            <span className="font-medium">{classification.text}</span>
            <ArrowRight className="h-4 w-4" />
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
