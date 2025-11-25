import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { NISTPillarCard } from "./NISTPillarCard";
import { NISTRadarChart } from "./NISTRadarChart";
import { getScoreClassification } from "@/hooks/useNISTScore";
import { Award, TrendingUp } from "lucide-react";

interface NISTScoreDashboardProps {
  overallScore: number;
  pillarScores: Array<{
    pillar: string;
    name: string;
    score: number;
    totalRequirements: number;
    evaluatedRequirements: number;
    conformeCount: number;
    parcialCount: number;
    naoConformeCount: number;
    naCount: number;
    color: string;
  }>;
  totalRequirements: number;
  evaluatedRequirements: number;
  progressPercentage: number;
}

export const NISTScoreDashboard: React.FC<NISTScoreDashboardProps> = ({
  overallScore,
  pillarScores,
  totalRequirements,
  evaluatedRequirements,
  progressPercentage
}) => {
  const classification = getScoreClassification(overallScore);

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Nota Geral NIST CSF 2.0
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="text-6xl font-bold text-primary mb-2">
                  {overallScore.toFixed(1)}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={classification.variant} className="text-sm">
                    {classification.label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">de 5.0</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progresso da Avaliação</span>
                  <span className="font-medium">{progressPercentage}%</span>
                </div>
                <Progress value={progressPercentage} className="h-3" />
                <p className="text-xs text-muted-foreground">
                  {evaluatedRequirements} de {totalRequirements} requisitos avaliados
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="text-center space-y-3">
                <TrendingUp className="h-16 w-16 text-primary mx-auto" />
                <p className="text-sm text-muted-foreground max-w-xs">
                  A nota geral é calculada pela média ponderada dos 6 pilares do NIST CSF 2.0
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pillar Scores Grid */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Scores por Pilar</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pillarScores.map((pillar) => (
            <NISTPillarCard key={pillar.pillar} {...pillar} />
          ))}
        </div>
      </div>

      {/* Radar Chart */}
      <NISTRadarChart pillarScores={pillarScores} />
    </div>
  );
};
