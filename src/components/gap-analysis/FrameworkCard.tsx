import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Shield, Lock, Scale, Building2 } from "lucide-react";
import { FrameworkLogo } from "./FrameworkLogos";
import {
  CATEGORY_BADGE_CLASS,
  CATEGORY_LABEL,
  getEffortLevel,
  getScoreTextClass,
  type FrameworkCategory,
} from "@/lib/gap-analysis-tokens";

interface FrameworkProgress {
  totalRequirements: number;
  evaluatedRequirements: number;
  conformeCount: number;
  averageScore: number;
}

interface StatusCounts {
  conforme: number;
  parcial: number;
  nao_conforme: number;
  nao_aplicavel: number;
  nao_avaliado: number;
}

interface FrameworkCardProps {
  id: string;
  nome: string;
  versao: string;
  tipo_framework: string;
  descricao?: string;
  requirementCount: number;
  progress?: FrameworkProgress;
  statusCounts?: StatusCounts;
  variant?: 'active' | 'available';
  onClick: () => void;
}

const CATEGORY_ICON: Record<FrameworkCategory, React.ElementType> = {
  seguranca: Shield,
  privacidade: Lock,
  governanca: Building2,
  qualidade: Scale,
};

const FRAMEWORK_AUDIENCES: Record<string, string> = {
  'ISO 27001': 'Gestão de segurança da informação',
  'LGPD': 'Proteção de dados pessoais no Brasil',
  'NIST CSF 2.0': 'Maturidade em cibersegurança',
  'ISO 27701': 'Gestão de privacidade (extensão ISO 27001)',
  'PCI DSS': 'Segurança de dados de cartões',
  'SOC 2': 'Controles de segurança para empresas de TI',
  'GDPR': 'Proteção de dados pessoais na Europa',
  'ISO 22301': 'Continuidade de negócios',
  'COBIT': 'Governança de TI corporativa',
  'CIS Controls': 'Controles críticos de segurança',
  'ISO 9001': 'Gestão de qualidade',
  'HIPAA': 'Proteção de dados de saúde (EUA)',
};

function getCategory(tipo: string): FrameworkCategory {
  const t = tipo?.toLowerCase() || '';
  if (t.includes('privacidade') || t.includes('privacy') || t.includes('lgpd') || t.includes('gdpr')) return 'privacidade';
  if (t.includes('governanca') || t.includes('governance') || t.includes('cobit') || t.includes('sox')) return 'governanca';
  if (t.includes('qualidade') || t.includes('quality') || t.includes('iso 9') || t.includes('itil')) return 'qualidade';
  return 'seguranca';
}

export const FrameworkCard: React.FC<FrameworkCardProps> = ({
  nome,
  versao,
  tipo_framework,
  descricao,
  requirementCount,
  progress,
  statusCounts,
  variant = 'available',
  onClick,
}) => {
  const progressPercent = progress && progress.totalRequirements > 0
    ? Math.round((progress.evaluatedRequirements / progress.totalRequirements) * 100)
    : 0;

  // Active variant - larger card with status blocks
  if (variant === 'active' && statusCounts) {
    const totalApplicable = (statusCounts.conforme + statusCounts.parcial + statusCounts.nao_conforme + statusCounts.nao_avaliado) || 1;
    const conformePercent = Math.round((statusCounts.conforme / totalApplicable) * 100);
    const parcialPercent = Math.round((statusCounts.parcial / totalApplicable) * 100);
    const naoConformePercent = Math.round((statusCounts.nao_conforme / totalApplicable) * 100);
    const pendenteCount = statusCounts.nao_avaliado;

    // Mini donut inline para variante ativa
    const normalized = progress?.averageScore ?? 0;
    const donutSize = 56;
    const donutR = donutSize / 2 - 5;
    const donutC = 2 * Math.PI * donutR;
    const donutOffset = donutC - (normalized / 100) * donutC;
    const donutStroke =
      normalized >= 80 ? 'hsl(var(--success))' :
      normalized >= 60 ? 'hsl(var(--primary))' :
      normalized >= 40 ? 'hsl(var(--warning))' :
      'hsl(var(--destructive))';

    return (
      <Card
        className="group hover:shadow-elegant transition-all duration-300 cursor-pointer h-full flex flex-col"
        onClick={onClick}
      >
        <div className="flex items-start gap-4 p-4 pb-3">
          <FrameworkLogo nome={nome} className="h-9 w-9 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
              {nome} <span className="text-xs font-normal text-muted-foreground">{versao}</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {progress ? `${progress.evaluatedRequirements} de ${progress.totalRequirements} requisitos avaliados` : `${requirementCount} requisitos`}
            </p>
          </div>
          {progress && (
            <svg width={donutSize} height={donutSize} viewBox={`0 0 ${donutSize} ${donutSize}`} className="shrink-0">
              <circle cx={donutSize/2} cy={donutSize/2} r={donutR} fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
              <circle
                cx={donutSize/2} cy={donutSize/2} r={donutR}
                fill="none"
                stroke={donutStroke}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={donutC}
                strokeDashoffset={donutOffset}
                transform={`rotate(-90 ${donutSize/2} ${donutSize/2})`}
                className="transition-all duration-700"
              />
              <text x={donutSize/2} y={donutSize/2 + 4} textAnchor="middle" className="fill-foreground font-bold" fontSize="13">
                {progress.averageScore}%
              </text>
            </svg>
          )}
        </div>

        {/* Progress section */}
        <div className="px-4 pb-3 space-y-2.5">
          {/* Segmented progress bar */}
          {progress && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden flex">
                  {conformePercent > 0 && (
                    <div className="h-full bg-success transition-all" style={{ width: `${conformePercent}%` }} />
                  )}
                  {parcialPercent > 0 && (
                    <div className="h-full bg-warning transition-all" style={{ width: `${parcialPercent}%` }} />
                  )}
                  {naoConformePercent > 0 && (
                    <div className="h-full bg-destructive transition-all" style={{ width: `${naoConformePercent}%` }} />
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                  {progressPercent}% avaliado
                </span>
              </div>
            </div>
          )}

          {/* Status summary — pílulas sóbrias (sem fundo) */}
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {statusCounts.conforme > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                <span className="text-foreground font-medium">{statusCounts.conforme}</span> Conforme
              </span>
            )}
            {statusCounts.parcial > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                <span className="text-foreground font-medium">{statusCounts.parcial}</span> Parcial
              </span>
            )}
            {statusCounts.nao_conforme > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                <span className="text-foreground font-medium">{statusCounts.nao_conforme}</span> Não Conforme
              </span>
            )}
            {pendenteCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                <span className="text-foreground font-medium">{pendenteCount}</span> Pendente{pendenteCount > 1 ? 's' : ''}
              </span>
            )}
            {statusCounts.nao_aplicavel > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="text-foreground font-medium">{statusCounts.nao_aplicavel}</span> N/A
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-end p-3 pt-0 mt-auto">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs group-hover:text-primary"
            onClick={(e) => { e.stopPropagation(); onClick(); }}
          >
            Abrir framework
            <ArrowRight className="h-3.5 w-3.5 ml-1" strokeWidth={1.5} />
          </Button>
        </div>
      </Card>
    );
  }

  // Available variant - compact card with category tag and effort
  const cat = getCategory(tipo_framework);
  const CategoryIcon = CATEGORY_ICON[cat];
  const effort = getEffortLevel(requirementCount);
  const audience = FRAMEWORK_AUDIENCES[nome];

  return (
    <Card
      className="group hover:shadow-elegant hover:border-primary/30 transition-all duration-300 cursor-pointer h-full flex flex-col"
      onClick={onClick}
    >
      <div className="p-3 pb-0">
        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 inline-flex items-center gap-1 ${CATEGORY_BADGE_CLASS[cat]}`}>
          <CategoryIcon className="h-2.5 w-2.5" strokeWidth={1.5} />
          {CATEGORY_LABEL[cat]}
        </Badge>
      </div>

      <div className="flex justify-center pt-3 pb-2">
        <FrameworkLogo nome={nome} className="h-10 w-10" />
      </div>

      <div className="text-center px-3 pb-1">
        <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
          {nome}
        </h3>
        <span className="text-xs text-muted-foreground">{versao}</span>
      </div>

      <div className="flex-1 px-3 py-1">
        <p className="text-xs text-muted-foreground text-center line-clamp-2">
          {audience || descricao || 'Framework de conformidade organizacional'}
        </p>
      </div>

      <div className="px-3 py-2 flex items-center justify-center gap-2">
        <span className="text-xs text-muted-foreground">{requirementCount} requisitos</span>
        <span className="text-muted-foreground">·</span>
        <Badge variant={effort.variant} className="text-[10px] px-1.5 py-0">
          Esforço {effort.label}
        </Badge>
      </div>

      <div className="flex justify-center p-3 pt-0">
        <Button
          variant="outline"
          size="sm"
          className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          onClick={(e) => { e.stopPropagation(); onClick(); }}
        >
          Iniciar Avaliação
          <ArrowRight className="h-4 w-4 ml-1" strokeWidth={1.5} />
        </Button>
      </div>
    </Card>
  );
};
