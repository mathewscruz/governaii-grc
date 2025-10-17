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
  const radius = 45;
  const circumference = 2 * Math.PI * radius; // Círculo completo
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <svg 
      width="120" 
      height="120" 
      viewBox="0 0 120 120" 
      className="mx-auto"
    >
      {/* Background Circle */}
      <circle
        cx="60"
        cy="60"
        r={radius}
        fill="none"
        stroke="hsl(var(--muted))"
        strokeWidth="10"
      />
      
      {/* Progress Circle */}
      <circle
        cx="60"
        cy="60"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        transform="rotate(-90 60 60)"
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
        <CardContent className="pt-6 pb-4">
          <div className="space-y-3">
            <Skeleton className="h-3 w-16 mx-auto" />
            <Skeleton className="h-[120px] w-[120px] mx-auto rounded-full" />
            <Skeleton className="h-6 w-28 mx-auto rounded-full" />
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
      <CardContent className="pt-6 pb-4">
        {/* Variação */}
        {hasVariation && (
          <div
            className={cn(
              "flex items-center justify-center gap-1 mb-3 text-xs font-medium",
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
            <div className="text-3xl font-bold text-foreground leading-none">
              {displayScore}
            </div>
            <div className="text-xs text-muted-foreground mt-1">de 1000</div>
          </div>
        </div>

        {/* Badge de Classificação */}
        <div className="flex justify-center mt-3">
          <Badge
            variant="outline"
            className={cn(
              "px-3 py-1 rounded-full flex items-center gap-1.5 border-0 text-xs",
              classification.bgColor,
              classification.textColor
            )}
          >
            <span className="font-medium">{classification.text}</span>
            <ArrowRight className="h-3 w-3" />
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
