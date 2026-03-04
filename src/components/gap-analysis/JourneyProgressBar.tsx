import { PlayCircle, ArrowRight, ClipboardCheck, Award, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface JourneyProgressBarProps {
  evaluatedRequirements: number;
  totalRequirements: number;
  conformeCount: number;
  hasActionPlans: boolean;
  naoConformeCount?: number;
}

function getContextualState(
  evaluated: number,
  total: number,
  conformeCount: number,
  hasActionPlans: boolean,
  naoConformeCount: number
) {
  if (total === 0) return null;
  const pctEvaluated = (evaluated / total) * 100;
  const pctConforme = total > 0 ? (conformeCount / total) * 100 : 0;

  if (evaluated === 0) {
    return {
      icon: PlayCircle,
      iconColor: 'text-primary',
      bgColor: 'bg-primary/5 border-primary/20',
      message: 'Comece avaliando os requisitos — clique em qualquer linha da tabela para iniciar.',
      action: 'Iniciar avaliação',
    };
  }
  if (pctConforme >= 80) {
    return {
      icon: Award,
      iconColor: 'text-chart-2',
      bgColor: 'bg-chart-2/5 border-chart-2/20',
      message: `Excelente! ${conformeCount} de ${total} requisitos conformes. Sua organização está pronta para auditoria externa.`,
      action: null,
    };
  }
  if (pctEvaluated >= 50 && naoConformeCount > 0 && !hasActionPlans) {
    return {
      icon: AlertTriangle,
      iconColor: 'text-chart-4',
      bgColor: 'bg-chart-4/5 border-chart-4/20',
      message: `${naoConformeCount} requisito(s) não conforme(s) identificado(s). Crie planos de ação para tratar os gaps.`,
      action: 'Ver remediação',
    };
  }
  if (pctEvaluated < 100) {
    return {
      icon: ClipboardCheck,
      iconColor: 'text-primary',
      bgColor: 'bg-primary/5 border-primary/20',
      message: `Continue avaliando — ${evaluated} de ${total} concluídos. Foque nos obrigatórios primeiro.`,
      action: null,
    };
  }
  return {
    icon: Award,
    iconColor: 'text-chart-2',
    bgColor: 'bg-chart-2/5 border-chart-2/20',
    message: `Todos os ${total} requisitos foram avaliados. Revise os itens não conformes e crie planos de ação.`,
    action: null,
  };
}

export function JourneyProgressBar({
  evaluatedRequirements,
  totalRequirements,
  conformeCount,
  hasActionPlans,
  naoConformeCount = 0,
}: JourneyProgressBarProps) {
  const state = getContextualState(evaluatedRequirements, totalRequirements, conformeCount, hasActionPlans, naoConformeCount);
  if (!state) return null;

  const Icon = state.icon;
  const pct = totalRequirements > 0 ? (evaluatedRequirements / totalRequirements) * 100 : 0;

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${state.bgColor}`}>
      <Icon className={`h-5 w-5 shrink-0 ${state.iconColor}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">{state.message}</p>
        {evaluatedRequirements > 0 && evaluatedRequirements < totalRequirements && (
          <Progress value={pct} className="h-1.5 mt-1.5" />
        )}
      </div>
      {state.action && (
        <span className="text-xs font-medium text-primary flex items-center gap-1 shrink-0 cursor-default">
          {state.action} <ArrowRight className="h-3 w-3" />
        </span>
      )}
    </div>
  );
}
