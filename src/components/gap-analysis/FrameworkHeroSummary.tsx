import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveContainer, AreaChart, Area, Tooltip as ReTooltip, ReferenceLine, YAxis } from 'recharts';
import { TrendingUp, TrendingDown, Minus, ArrowRight, LineChart as LineChartIcon } from 'lucide-react';
import { FrameworkConfig, getMaturityLevel } from '@/lib/framework-configs';
import { useScoreHistory, ScoreHistoryPeriod } from '@/hooks/useScoreHistory';

interface DomainScore {
  domain: string;
  name: string;
  score: number;
  totalRequirements: number;
  evaluatedRequirements: number;
  color: string;
}

interface SectionScore {
  section: string;
  name: string;
  score: number;
  totalRequirements: number;
  evaluatedRequirements: number;
}

interface FrameworkHeroSummaryProps {
  overallScore: number;
  totalRequirements: number;
  evaluatedRequirements: number;
  domainScores?: DomainScore[];
  sectionScores?: SectionScore[];
  config: FrameworkConfig;
  frameworkId: string;
  loading?: boolean;
  /** Mensagem contextual curta (substitui o JourneyProgressBar) */
  contextMessage?: string;
  contextAction?: { label: string; onClick: () => void };
}

/**
 * Card consolidado de cabeçalho do framework: donut + sparkline de evolução
 * + delta + chips de domínio/seção + linha contextual.
 *
 * Substitui Journey + ScoreCard + ScoreEvolution (3 blocos → 1).
 */
const Donut = ({ score, config, size = 112 }: { score: number; config: FrameworkConfig; size?: number }) => {
  const normalized = config.scoreType === 'percentage' ? score : (score / 5) * 100;
  const r = size / 2 - 8;
  const c = 2 * Math.PI * r;
  const offset = c - (normalized / 100) * c;
  const center = size / 2;
  const stroke =
    normalized >= 80 ? 'hsl(var(--success))' :
    normalized >= 60 ? 'hsl(var(--primary))' :
    normalized >= 40 ? 'hsl(var(--warning))' :
    'hsl(var(--destructive))';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={center} cy={center} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="9" />
      <circle
        cx={center} cy={center} r={r}
        fill="none"
        stroke={stroke}
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${center} ${center})`}
        className="transition-all duration-700"
      />
      <text x={center} y={center - 2} textAnchor="middle" className="fill-foreground font-bold" fontSize="22">
        {config.scoreType === 'percentage' ? `${score.toFixed(0)}%` : score.toFixed(1)}
      </text>
      <text x={center} y={center + 16} textAnchor="middle" className="fill-muted-foreground" fontSize="10">
        conformidade
      </text>
    </svg>
  );
};

export function FrameworkHeroSummary({
  overallScore,
  totalRequirements,
  evaluatedRequirements,
  domainScores = [],
  sectionScores = [],
  config,
  frameworkId,
  loading = false,
  contextMessage,
  contextAction,
}: FrameworkHeroSummaryProps) {
  const [period, setPeriod] = useState<ScoreHistoryPeriod>('monthly');
  const { history, loading: historyLoading } = useScoreHistory(frameworkId, period);

  const periods: { value: ScoreHistoryPeriod; label: string }[] = [
    { value: 'daily', label: 'Dia' },
    { value: 'weekly', label: 'Semana' },
    { value: 'monthly', label: 'Mês' },
    { value: 'yearly', label: 'Ano' },
  ];

  const evalPct = totalRequirements > 0 ? (evaluatedRequirements / totalRequirements) * 100 : 0;
  const maturity = getMaturityLevel(overallScore, config);

  // Delta: compara último ponto vs penúltimo do histórico
  const delta = useMemo(() => {
    if (history.length < 2) return null;
    const last = history[history.length - 1].score;
    const prev = history[history.length - 2].score;
    const diff = last - prev;
    if (Math.abs(diff) < 0.1) return { value: 0, dir: 'flat' as const };
    return { value: diff, dir: diff > 0 ? ('up' as const) : ('down' as const) };
  }, [history]);

  // Dados para sparkline: duplica único ponto para a área renderizar como faixa
  const sparkData = useMemo(() => {
    if (history.length === 0) return [];
    if (history.length === 1) {
      return [{ ...history[0], date: 'início' }, history[0]];
    }
    return history;
  }, [history]);

  const isPercentage = config.scoreType === 'percentage';
  const goalY = isPercentage ? 80 : 4;
  const yDomain: [number, number] = isPercentage ? [0, 100] : [0, 5];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-5">
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const chips = sectionScores.length > 0 ? sectionScores : domainScores;
  const chipsLabel = sectionScores.length > 0
    ? (config.sectionLabel || 'Seções')
    : (config.domainLabel || 'Domínios');

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-0">
          {/* Coluna esquerda — score */}
          <div className="p-5 lg:border-r border-border flex items-center gap-4 min-w-0 lg:min-w-[280px]">
            {evaluatedRequirements === 0 ? (
              <div className="flex flex-col items-center justify-center w-full py-3">
                <div className="text-3xl font-bold text-muted-foreground">—</div>
                <p className="text-xs text-muted-foreground text-center mt-1">
                  {totalRequirements} requisitos para avaliar
                </p>
              </div>
            ) : (
              <>
                <Donut score={overallScore} config={config} size={112} />
                <div className="flex flex-col gap-2 min-w-0 flex-1">
                  <Badge
                    variant="outline"
                    className={`text-[10px] w-fit ${maturity.bgColor} ${maturity.color} border-current/20`}
                  >
                    Nível {maturity.level} — {maturity.name}
                  </Badge>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">{evaluatedRequirements}/{totalRequirements}</span>
                    </div>
                    <Progress value={evalPct} className="h-1.5" />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Coluna direita — evolução */}
          <div className="p-5 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Evolução do score
                </p>
                {delta && (
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                      delta.dir === 'up' ? 'text-success' :
                      delta.dir === 'down' ? 'text-destructive' :
                      'text-muted-foreground'
                    }`}
                  >
                    {delta.dir === 'up' && <TrendingUp className="h-3 w-3" strokeWidth={1.5} />}
                    {delta.dir === 'down' && <TrendingDown className="h-3 w-3" strokeWidth={1.5} />}
                    {delta.dir === 'flat' && <Minus className="h-3 w-3" strokeWidth={1.5} />}
                    {delta.value > 0 ? '+' : ''}{delta.value.toFixed(1)}{config.scoreType === 'percentage' ? '%' : ''}
                  </span>
                )}
              </div>
              <div className="flex gap-0.5 rounded-md border border-border p-0.5 bg-muted/30">
                {periods.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPeriod(p.value)}
                    className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                      period === p.value
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative h-[110px] -mx-1">
              {historyLoading ? (
                <Skeleton className="h-full w-full" />
              ) : history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-muted/20">
                  <div className="flex items-center justify-center h-7 w-7 rounded-full bg-muted">
                    <LineChartIcon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                  </div>
                  <p className="text-[11px] text-muted-foreground text-center px-3 max-w-[260px] leading-snug">
                    Sem histórico ainda — avalie requisitos para registrar a evolução.
                  </p>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sparkData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                      <defs>
                        <linearGradient id="heroSpark" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <YAxis hide domain={yDomain} />
                      <ReferenceLine
                        y={goalY}
                        stroke="hsl(var(--success))"
                        strokeDasharray="3 3"
                        strokeOpacity={0.4}
                      />
                      <ReTooltip
                        cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3' }}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 8,
                          fontSize: 12,
                          padding: '4px 8px',
                          boxShadow: '0 4px 12px hsl(var(--foreground) / 0.08)',
                        }}
                        formatter={(v: number) => [
                          isPercentage ? `${v.toFixed(0)}%` : v.toFixed(1),
                          'Score',
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2.5}
                        fill="url(#heroSpark)"
                        dot={
                          history.length <= 2
                            ? { fill: 'hsl(var(--primary))', stroke: 'hsl(var(--background))', strokeWidth: 2, r: 4 }
                            : false
                        }
                        activeDot={{ r: 5, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                  {history.length === 1 && (
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-muted/80 backdrop-blur-sm border border-border text-[10px] text-muted-foreground pointer-events-none whitespace-nowrap">
                      Primeiro registro — avalie mais para ver tendência
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Chips de domínio/seção (só se houver) */}
        {chips.length > 0 && (
          <div className="px-5 pb-4 border-t border-border pt-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              {chipsLabel}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {chips.map((c: any) => {
                const key = c.section || c.domain;
                const score = c.score;
                const normalized = config.scoreType === 'percentage' ? score : (score / 5) * 100;
                const tone =
                  normalized >= 80 ? 'text-success' :
                  normalized >= 60 ? 'text-primary' :
                  normalized >= 40 ? 'text-warning' :
                  'text-destructive';
                return (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-border bg-muted/30 text-[11px]"
                  >
                    <span className="text-muted-foreground truncate max-w-[140px]">{c.name}</span>
                    <span className={`font-semibold ${tone}`}>
                      {config.scoreType === 'percentage' ? `${score.toFixed(0)}%` : score.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {c.evaluatedRequirements}/{c.totalRequirements}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Linha contextual discreta (substitui banner Journey) */}
        {contextMessage && (
          <div className="px-5 py-2.5 bg-muted/30 border-t border-border flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-muted-foreground">{contextMessage}</p>
            {contextAction && (
              <Button
                variant="ghost"
                size="sm"
                onClick={contextAction.onClick}
                className="h-7 text-xs text-primary hover:text-primary"
              >
                {contextAction.label}
                <ArrowRight className="h-3 w-3 ml-1" strokeWidth={1.5} />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
