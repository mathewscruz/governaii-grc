import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FrameworkConfig, getScoreLabel, getMaturityLevel } from "@/lib/framework-configs";
import { ScoreEvolutionChart } from "./ScoreEvolutionChart";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

const ScoreDonut = ({ score, config, size = 120 }: { score: number; config: FrameworkConfig; size?: number }) => {
  const normalizedScore = config.scoreType === 'percentage' ? score : (score / 5.0) * 100;
  const radius = (size / 2) - 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalizedScore / 100) * circumference;
  const center = size / 2;

  const getColor = (s: number) => {
    if (s >= 80) return 'hsl(var(--chart-2))';
    if (s >= 60) return 'hsl(var(--primary))';
    if (s >= 40) return 'hsl(var(--chart-4))';
    return 'hsl(var(--destructive))';
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={center} cy={center} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
      <circle
        cx={center} cy={center} r={radius}
        fill="none"
        stroke={getColor(normalizedScore)}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${center} ${center})`}
        className="transition-all duration-700"
      />
      <text x={center} y={center - 4} textAnchor="middle" className="fill-foreground font-bold" fontSize="20">
        {config.scoreType === 'percentage' ? `${score.toFixed(0)}%` : score.toFixed(1)}
      </text>
      <text x={center} y={center + 14} textAnchor="middle" className="fill-muted-foreground" fontSize="11">
        Score
      </text>
    </svg>
  );
};

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
  const formatScore = (score: number) => {
    if (config.scoreType === 'percentage') return `${score.toFixed(1)}%`;
    return score.toFixed(2);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card><CardHeader><Skeleton className="h-6 w-48" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
        <Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
      </div>
    );
  }

  const evalPct = totalRequirements > 0 ? (evaluatedRequirements / totalRequirements) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Score Geral de Conformidade</CardTitle>
          </CardHeader>
          <CardContent>
            {evaluatedRequirements === 0 ? (
              <div className="flex flex-col items-center justify-center py-4 space-y-2">
                <div className="text-4xl font-bold text-muted-foreground">—</div>
                <p className="text-sm text-muted-foreground text-center">
                  Nenhum requisito avaliado ainda.<br />{totalRequirements} requisitos disponíveis para avaliação.
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-5">
                <ScoreDonut score={overallScore} config={config} size={120} />
                <div className="flex-1 space-y-3 py-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge 
                      variant={
                        overallScore >= (config.scoreType === 'percentage' ? 80 : 4.5) ? 'default' :
                        overallScore >= (config.scoreType === 'percentage' ? 60 : 3.5) ? 'secondary' :
                        overallScore >= (config.scoreType === 'percentage' ? 40 : 2.5) ? 'outline' :
                        'destructive'
                      }
                      className="text-xs"
                    >
                      {getScoreLabel(overallScore, config)}
                    </Badge>
                    {(() => {
                      const maturity = getMaturityLevel(overallScore, config);
                      return (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${maturity.bgColor} border text-xs`}>
                                <span>{maturity.icon}</span>
                                <span className={`font-semibold ${maturity.color}`}>
                                  Nível {maturity.level}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs">
                              <p className="font-medium">{maturity.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">{maturity.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })()}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progresso da avaliação</span>
                      <span className="font-medium">{evaluatedRequirements}/{totalRequirements}</span>
                    </div>
                    <Progress value={evalPct} className="h-2" />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <ScoreEvolutionChart frameworkId={frameworkId} scoreType={config.scoreType} />
      </div>

      {/* Domain scores (ISO 27001 Annex A) */}
      {domainScores.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3">Aderência por Domínio do Anexo A</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {domainScores.map((domain) => (
              <Card key={domain.domain}>
                <CardContent className="pt-4 pb-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">{domain.name}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold" style={{ color: domain.color }}>{formatScore(domain.score)}</span>
                    <Badge variant="secondary" className="text-xs">{domain.evaluatedRequirements}/{domain.totalRequirements}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Section scores */}
      {sectionScores.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3">Aderência por Seção</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sectionScores.map((section) => (
              <Card key={section.section}>
                <CardContent className="pt-4 pb-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">{section.name}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-primary">{formatScore(section.score)}</span>
                    <Badge variant="secondary" className="text-xs">{section.evaluatedRequirements}/{section.totalRequirements}</Badge>
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
