import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowRight } from "lucide-react";
import { FrameworkLogo } from "./FrameworkLogos";
import { StatusBlocks, StatusBlocksLegend } from "./StatusBlocks";

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

export const FrameworkCard: React.FC<FrameworkCardProps> = ({
  nome,
  versao,
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
    return (
      <Card 
        className="group hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col"
        onClick={onClick}
      >
        <div className="flex items-start gap-4 p-4">
          <FrameworkLogo nome={nome} className="h-10 w-10 shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                {nome} <span className="text-xs font-normal text-muted-foreground">{versao}</span>
              </h3>
              {progress && (
                <span className={`text-sm font-bold shrink-0 ${
                  progress.averageScore >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
                  progress.averageScore >= 60 ? 'text-primary' :
                  progress.averageScore >= 40 ? 'text-amber-600 dark:text-amber-400' :
                  'text-destructive'
                }`}>
                  {progress.averageScore}%
                </span>
              )}
            </div>

            {/* Status blocks */}
            <div className="mt-2">
              <StatusBlocks
                conforme={statusCounts.conforme}
                parcial={statusCounts.parcial}
                nao_conforme={statusCounts.nao_conforme}
                nao_aplicavel={statusCounts.nao_aplicavel}
                nao_avaliado={statusCounts.nao_avaliado}
                blockSize="md"
              />
            </div>

            {/* Progress bar */}
            {progress && progress.evaluatedRequirements > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <Progress value={progressPercent} className="h-1.5 flex-1" />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {progress.evaluatedRequirements}/{progress.totalRequirements}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="px-4 pb-3">
          <StatusBlocksLegend
            conforme={statusCounts.conforme}
            parcial={statusCounts.parcial}
            nao_conforme={statusCounts.nao_conforme}
            nao_aplicavel={statusCounts.nao_aplicavel}
            nao_avaliado={statusCounts.nao_avaliado}
          />
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

  // Available variant - compact card
  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col"
      onClick={onClick}
    >
      <div className="flex justify-center pt-6 pb-3">
        <FrameworkLogo nome={nome} className="h-12 w-12" />
      </div>
      
      <div className="text-center px-3 pb-2">
        <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
          {nome}
        </h3>
        <span className="text-xs text-muted-foreground">{versao}</span>
      </div>
      
      <div className="flex-1 px-3 py-1">
        <p className="text-xs text-muted-foreground text-center line-clamp-2">
          {descricao || 'Framework de conformidade para avaliação organizacional'}
        </p>
      </div>

      <div className="px-3 py-2">
        <div className="flex items-center justify-center text-xs text-muted-foreground">
          <span>{requirementCount} requisitos</span>
        </div>
      </div>
      
      <div className="flex justify-center p-3">
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
