import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FrameworkConfig, getScoreLabel, getScoreColor } from "@/lib/framework-configs";

interface PillarScore {
  pillar: string;
  name: string;
  score: number;
  totalRequirements: number;
  evaluatedRequirements: number;
  color: string;
}

interface GenericScoreDashboardProps {
  overallScore: number;
  pillarScores: PillarScore[];
  totalRequirements: number;
  evaluatedRequirements: number;
  config: FrameworkConfig;
  loading?: boolean;
}

export const GenericScoreDashboard: React.FC<GenericScoreDashboardProps> = ({
  overallScore,
  pillarScores,
  totalRequirements,
  evaluatedRequirements,
  config,
  loading = false,
}) => {
  const scoreLabel = getScoreLabel(overallScore, config);
  const scoreColorClass = getScoreColor(overallScore, config);
  
  const formatScore = (score: number) => {
    if (config.scoreType === 'percentage') {
      return `${score.toFixed(1)}%`;
    }
    return score.toFixed(2);
  };

  const getProgressValue = (score: number) => {
    if (config.scoreType === 'percentage') {
      return score;
    }
    return (score / 5.0) * 100;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
        <div className="h-32 bg-muted rounded-lg"></div>
        <div className="h-32 bg-muted rounded-lg"></div>
        <div className="h-32 bg-muted rounded-lg"></div>
        <div className="h-32 bg-muted rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Score Geral */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-lg">Score Geral de Conformidade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-4xl font-bold ${scoreColorClass}`}>
                {formatScore(overallScore)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {scoreLabel}
              </p>
            </div>
            <Badge variant="outline" className="text-sm">
              {evaluatedRequirements} de {totalRequirements} avaliados
            </Badge>
          </div>
          <Progress 
            value={getProgressValue(overallScore)} 
            className="mt-4 h-3"
          />
        </CardContent>
      </Card>

      {/* Scores por Pilar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pillarScores.map((pillar) => (
          <Card key={pillar.pillar}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                {pillar.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold" style={{ color: pillar.color }}>
                    {formatScore(pillar.score)}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {pillar.evaluatedRequirements}/{pillar.totalRequirements}
                  </Badge>
                </div>
                <Progress 
                  value={getProgressValue(pillar.score)} 
                  className="h-2"
                  style={{ 
                    // @ts-ignore
                    '--progress-background': pillar.color 
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  {getScoreLabel(pillar.score, config)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
