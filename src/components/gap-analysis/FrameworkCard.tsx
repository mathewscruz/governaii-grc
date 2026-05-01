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

    return (
      <Card
        className="group hover:shadow-elegant transition-all duration-300 cursor-pointer h-full flex flex-col border-l-4 border-l-primary/60"
        onClick={onClick}
      >
        <div className="flex items-start gap-4 p-4 pb-3">
          <FrameworkLogo nome={nome} className="h-10 w-10 shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
              {nome} <span className="text-xs font-normal text-muted-foreground">{versao}</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {progress ? `${progress.evaluatedRequirements} de ${progress.totalRequirements} requisitos avaliados` : `${requirementCount} requisitos`}
            </p>
          </div>
        </div>

        {/* Score & Progress section */}
        <div className="px-4 pb-3 space-y-3">
          {progress && (
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${getScoreTextClass(progress.averageScore)}`}>
                {progress.averageScore}%
              </span>
              <span className="text-xs text-muted-foreground">de conformidade geral</span>
            </div>
          )}

          {/* Segmented progress bar */}
          {progress && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden flex">
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

          {/* Status summary - compact pills */}
          <div className="flex flex-wrap gap-1.5">
            {statusCounts.conforme > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-md bg-success/10 text-success border border-success/20">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                {statusCounts.conforme} Conforme
              </span>
            )}
            {statusCounts.parcial > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-md bg-warning/10 text-warning border border-warning/20">
                <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                {statusCounts.parcial} Parcial
              </span>
            )}
            {statusCounts.nao_conforme > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-md bg-destructive/10 text-destructive border border-destructive/20">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                {statusCounts.nao_conforme} Não Conforme
              </span>
            )}
            {pendenteCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                {pendenteCount} Pendente{pendenteCount > 1 ? 's' : ''}
              </span>
            )}
            {statusCounts.nao_aplicavel > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                {statusCounts.nao_aplicavel} N/A
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-end p-3 pt-0 mt-auto">
          <Button
            variant="ghost"
            size="icon"
            className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
            onClick={(e) => { e.stopPropagation(); onClick(); }}
          >
            <ArrowRight className="h-5 w-5" strokeWidth={1.5} />
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
