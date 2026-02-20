import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FrameworkConfig, getScoreLabel, getScoreColor } from "@/lib/framework-configs";
import { CategoryBarChart } from "./CategoryBarChart";
import { ScoreEvolutionChart } from "./ScoreEvolutionChart";
import { Skeleton } from "@/components/ui/skeleton";

interface PillarScore {
  pillar: string;
  name: string;
  score: number;
  totalRequirements: number;
  evaluatedRequirements: number;
  color: string;
}

interface DomainScore {
  domain: string;
  name: string;
  score: number;
  totalRequirements: number;
  evaluatedRequirements: number;
  color: string;
}

interface AreaScore {
  area: string;
  score: number;
  totalRequirements: number;
  evaluatedRequirements: number;
}

interface SectionScore {
  section: string;
  name: string;
  score: number;
  totalRequirements: number;
  evaluatedRequirements: number;
}

interface CategoryScore {
  category: string;
  score: number;
  total: number;
  evaluated: number;
}

interface GenericScoreDashboardProps {
  overallScore: number;
  pillarScores: PillarScore[];
  domainScores?: DomainScore[];
  areaScores?: AreaScore[];
  sectionScores?: SectionScore[];
  categoryScores?: CategoryScore[];
  totalRequirements: number;
  evaluatedRequirements: number;
  config: FrameworkConfig;
  loading?: boolean;
  frameworkId: string;
}

export const GenericScoreDashboard: React.FC<GenericScoreDashboardProps> = ({
  overallScore,
  pillarScores,
  domainScores = [],
  areaScores = [],
  sectionScores = [],
  categoryScores = [],
  totalRequirements,
  evaluatedRequirements,
  config,
  loading = false,
  frameworkId,
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
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Score Geral + Evolução do Score (lado a lado) */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Score Geral de Conformidade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {evaluatedRequirements === 0 ? (
              <div className="space-y-3">
                <div className="text-4xl font-bold text-muted-foreground">—</div>
                <p className="text-sm text-muted-foreground">
                  Nenhum requisito avaliado ainda. Comece avaliando os requisitos na tabela abaixo para ver seu score de conformidade.
                </p>
                <p className="text-xs text-muted-foreground">
                  {totalRequirements} requisitos disponíveis para avaliação
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold">{formatScore(overallScore)}</div>
                  <Badge variant={getScoreColor(overallScore, config) as any} className="text-sm">
                    {getScoreLabel(overallScore, config)}
                  </Badge>
                </div>
                <Progress value={getProgressValue(overallScore)} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  {evaluatedRequirements} de {totalRequirements} requisitos avaliados
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <ScoreEvolutionChart frameworkId={frameworkId} scoreType={config.scoreType} />
      </div>

      {/* Scores por Seção (se houver) */}
      {sectionScores.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3">Aderência por Seção</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sectionScores.map((section) => (
              <Card key={section.section}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    {section.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">
                        {formatScore(section.score)}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {section.evaluatedRequirements}/{section.totalRequirements}
                      </Badge>
                    </div>
                    <Progress 
                      value={getProgressValue(section.score)} 
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      {getScoreLabel(section.score, config)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Scores por Domínio (para ISO 27001 Anexo A) */}
      {domainScores.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3">Aderência por Domínio do Anexo A</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {domainScores.map((domain) => (
              <Card key={domain.domain}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    {domain.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold" style={{ color: domain.color }}>
                        {formatScore(domain.score)}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {domain.evaluatedRequirements}/{domain.totalRequirements}
                      </Badge>
                    </div>
                    <Progress 
                      value={getProgressValue(domain.score)} 
                      className="h-2"
                      style={{ 
                        // @ts-ignore
                        '--progress-background': domain.color 
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      {getScoreLabel(domain.score, config)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
