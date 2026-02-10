import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowRight } from "lucide-react";
import { FrameworkLogo } from "./FrameworkLogos";

interface FrameworkProgress {
  totalRequirements: number;
  evaluatedRequirements: number;
  conformeCount: number;
  averageScore: number;
}

interface FrameworkCardProps {
  id: string;
  nome: string;
  versao: string;
  tipo_framework: string;
  descricao?: string;
  requirementCount: number;
  progress?: FrameworkProgress;
  onClick: () => void;
}

export const FrameworkCard: React.FC<FrameworkCardProps> = ({
  nome,
  versao,
  descricao,
  requirementCount,
  progress,
  onClick,
}) => {
  const getProgressStatus = () => {
    if (!progress || progress.evaluatedRequirements === 0) {
      return { label: 'Não iniciado', variant: 'outline' as const };
    }
    if (progress.evaluatedRequirements === progress.totalRequirements) {
      return { label: 'Concluído', variant: 'success' as const };
    }
    return { label: 'Em andamento', variant: 'secondary' as const };
  };

  const status = getProgressStatus();
  const progressPercent = progress && progress.totalRequirements > 0 
    ? Math.round((progress.evaluatedRequirements / progress.totalRequirements) * 100)
    : 0;

  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col"
      onClick={onClick}
    >
      {/* Logo centralizado */}
      <div className="flex justify-center pt-6 pb-3">
        <FrameworkLogo nome={nome} className="h-12 w-12" />
      </div>
      
      {/* Nome e versão */}
      <div className="text-center px-3 pb-2">
        <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
          {nome}
        </h3>
        <span className="text-xs text-muted-foreground">{versao}</span>
      </div>
      
      {/* Status Badge */}
      <div className="flex justify-center px-3 pb-2">
        <Badge variant={status.variant} className="text-xs">
          {status.label}
        </Badge>
      </div>
      
      {/* Descrição */}
      <div className="flex-1 px-3 py-1">
        <p className="text-xs text-muted-foreground text-center line-clamp-2">
          {descricao || 'Framework de conformidade para avaliação organizacional'}
        </p>
      </div>

      {/* Progresso */}
      <div className="px-3 py-2 space-y-2">
        {/* Contagem de requisitos */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{requirementCount} requisitos</span>
          {progress && progress.evaluatedRequirements > 0 && (
            <span className="font-medium text-foreground">
              {progress.evaluatedRequirements}/{progress.totalRequirements}
            </span>
          )}
        </div>
        
        {/* Barra de progresso */}
        {progress && progress.evaluatedRequirements > 0 && (
          <div className="space-y-1">
            <Progress value={progressPercent} className="h-1.5" />
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium text-primary">{progressPercent}%</span>
            </div>
          </div>
        )}

        {/* Score de conformidade */}
        {progress && progress.averageScore > 0 && (
          <div className="flex items-center justify-between text-xs pt-1 border-t border-border">
            <span className="text-muted-foreground">Conformidade</span>
            <span className={`font-semibold ${
              progress.averageScore >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
              progress.averageScore >= 60 ? 'text-primary' :
              progress.averageScore >= 40 ? 'text-amber-600 dark:text-amber-400' :
              'text-destructive'
            }`}>
              {progress.averageScore}%
            </span>
          </div>
        )}
      </div>
      
      {/* Botão apenas seta */}
      <div className="flex justify-end p-3">
        <Button 
          variant="ghost" 
          size="icon"
          className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </Card>
  );
};
