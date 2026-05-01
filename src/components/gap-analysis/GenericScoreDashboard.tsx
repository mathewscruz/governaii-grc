import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FrameworkConfig, getScoreLabel, getMaturityLevel } from "@/lib/framework-configs";
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

const ScoreDonut = ({ score, config, size = 120 }: { score: number; config: FrameworkConfig; size?: number }) => {
  const normalizedScore = config.scoreType === 'percentage' ? score : (score / 5.0) * 100;
  const radius = (size / 2) - 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalizedScore / 100) * circumference;
  const center = size / 2;

  // Tokens semânticos via HSL — alinhados com Akuris design system
  const getColor = (s: number) => {
    if (s >= 80) return 'hsl(var(--success))';
    if (s >= 60) return 'hsl(var(--primary))';
    if (s >= 40) return 'hsl(var(--warning))';
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
  const domainSectionLabel = config.domainLabel || 'Aderência por Domínio';
  const sectionSectionLabel = config.sectionLabel || 'Aderência por Seção';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Score Geral de Conformidade</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 space-y-4">
          {evaluatedRequirements === 0 ? (
            <div className="flex flex-col items-center justify-center py-4 space-y-2">
              <div className="text-4xl font-bold text-muted-foreground">—</div>
              <p className="text-sm text-muted-foreground text-center">
                Nenhum requisito avaliado ainda.<br />{totalRequirements} requisitos disponíveis para avaliação.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-4 py-2">
              <ScoreDonut score={overallScore} config={config} size={100} />
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <Badge 
                  variant={
                    overallScore >= (config.scoreType === 'percentage' ? 80 : 4.5) ? 'default' :
                    overallScore >= (config.scoreType === 'percentage' ? 60 : 3.5) ? 'secondary' :
                    overallScore >= (config.scoreType === 'percentage' ? 40 : 2.5) ? 'outline' :
                    'destructive'
                  }
                  className="text-xs w-fit"
                >
                  {getScoreLabel(overallScore, config)}
                </Badge>
                {(() => {
                  const maturity = getMaturityLevel(overallScore, config);
                  return (
                    <div className={`inline-flex flex-col gap-0.5 px-2 py-1 rounded-md ${maturity.bgColor} border text-xs w-fit`}>
                      <div className="flex items-center gap-1">
                        <span>{maturity.icon}</span>
                        <span className={`font-semibold ${maturity.color}`}>
                          Nível {maturity.level} — {maturity.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{maturity.description}</span>
                    </div>
                  );
                })()}
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

          {/* Domain scores */}
          {domainScores.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">
                  {domainSectionLabel}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {domainScores.map((domain) => (
                    <div key={domain.domain} className="rounded-md border border-border px-2.5 py-2">
                      <p className="text-[10px] font-medium text-muted-foreground truncate mb-1">{domain.name}</p>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold" style={{ color: domain.color }}>{formatScore(domain.score)}</span>
                        <span className="text-[9px] text-muted-foreground">{domain.evaluatedRequirements}/{domain.totalRequirements}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Section scores */}
          {sectionScores.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">
                  {sectionSectionLabel}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {sectionScores.map((section) => (
                    <div key={section.section} className="rounded-md border border-border px-2.5 py-2">
                      <p className="text-[10px] font-medium text-muted-foreground truncate mb-1">{section.name}</p>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-primary">{formatScore(section.score)}</span>
                        <span className="text-[9px] text-muted-foreground">{section.evaluatedRequirements}/{section.totalRequirements}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ScoreEvolutionChart frameworkId={frameworkId} scoreType={config.scoreType} />
    </div>
  );
};
