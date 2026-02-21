import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, Shield, Lock, Scale, Building2 } from "lucide-react";
import { FrameworkLogo } from "./FrameworkLogos";

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

const CATEGORY_MAP: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  seguranca: { label: 'Segurança', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Shield },
  privacidade: { label: 'Privacidade', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Lock },
  qualidade: { label: 'Qualidade', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Scale },
  governanca: { label: 'Governança', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Building2 },
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

function getCategory(tipo: string): string {
  const t = tipo?.toLowerCase() || '';
  if (t.includes('privacidade') || t.includes('privacy') || t.includes('lgpd') || t.includes('gdpr')) return 'privacidade';
  if (t.includes('governanca') || t.includes('governance') || t.includes('cobit') || t.includes('sox')) return 'governanca';
  if (t.includes('qualidade') || t.includes('quality') || t.includes('iso 9') || t.includes('itil')) return 'qualidade';
  return 'seguranca';
}

function getEffortLevel(count: number): { label: string; color: string } {
  if (count <= 30) return { label: 'Baixo', color: 'bg-emerald-100 text-emerald-700' };
  if (count <= 100) return { label: 'Médio', color: 'bg-amber-100 text-amber-700' };
  return { label: 'Alto', color: 'bg-red-100 text-red-700' };
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
        className="group hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col"
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
          {/* Main score */}
          {progress && (
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${
                progress.averageScore >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
                progress.averageScore >= 60 ? 'text-primary' :
                progress.averageScore >= 40 ? 'text-amber-600 dark:text-amber-400' :
                'text-destructive'
              }`}>
                {progress.averageScore}%
              </span>
              <span className="text-xs text-muted-foreground">de conformidade geral</span>
            </div>
          )}

          {/* Progress bar showing evaluation coverage */}
          {progress && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Progress value={progressPercent} className="h-1.5 flex-1" />
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                  {progressPercent}% avaliado
                </span>
              </div>
            </div>
          )}

          {/* Status summary - compact pills */}
          <div className="flex flex-wrap gap-1.5">
            {statusCounts.conforme > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {statusCounts.conforme} Conforme
              </span>
            )}
            {statusCounts.parcial > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {statusCounts.parcial} Parcial
              </span>
            )}
            {statusCounts.nao_conforme > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-md bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
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
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </Card>
    );
  }

  // Available variant - compact card with category tag and effort
  const cat = getCategory(tipo_framework);
  const catCfg = CATEGORY_MAP[cat];
  const effort = getEffortLevel(requirementCount);
  const audience = FRAMEWORK_AUDIENCES[nome];

  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col"
      onClick={onClick}
    >
      <div className="p-3 pb-0">
        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border ${catCfg.color}`}>
          {catCfg.label}
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
        <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${effort.color}`}>
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
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </Card>
  );
};
