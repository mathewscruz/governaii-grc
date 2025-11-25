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

interface GenericScoreDashboardProps {
  overallScore: number;
  pillarScores: PillarScore[];
  domainScores?: DomainScore[];
  areaScores?: AreaScore[];
  sectionScores?: SectionScore[];
  totalRequirements: number;
  evaluatedRequirements: number;
  config: FrameworkConfig;
  loading?: boolean;
}

export const GenericScoreDashboard: React.FC<GenericScoreDashboardProps> = ({
  overallScore,
  pillarScores,
  domainScores = [],
  areaScores = [],
  sectionScores = [],
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

      {/* Scores por Área Responsável */}
      {areaScores.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3">Aderência por Área Responsável</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {areaScores.slice(0, 8).map((area) => (
              <Card key={area.area}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium truncate" title={area.area}>
                    {area.area}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">
                        {formatScore(area.score)}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {area.evaluatedRequirements}/{area.totalRequirements}
                      </Badge>
                    </div>
                    <Progress 
                      value={getProgressValue(area.score)} 
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      {getScoreLabel(area.score, config)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Scores por Pilar/Categoria */}
      <div>
        <h3 className="text-sm font-medium mb-3">Aderência por Categoria</h3>
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
    </div>
  );
};
