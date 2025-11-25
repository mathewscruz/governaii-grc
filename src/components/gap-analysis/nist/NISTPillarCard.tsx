import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getScoreClassification } from "@/hooks/useNISTScore";

interface NISTPillarCardProps {
  pillar: string;
  name: string;
  score: number;
  totalRequirements: number;
  evaluatedRequirements: number;
  conformeCount: number;
  parcialCount: number;
  naoConformeCount: number;
  naCount: number;
  color: string;
}

export const NISTPillarCard: React.FC<NISTPillarCardProps> = ({
  pillar,
  name,
  score,
  totalRequirements,
  evaluatedRequirements,
  conformeCount,
  parcialCount,
  naoConformeCount,
  naCount,
  color
}) => {
  const classification = getScoreClassification(score);
  const progress = totalRequirements > 0 ? (evaluatedRequirements / totalRequirements) * 100 : 0;

  return (
    <Card className="border-2 hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {pillar}
          </CardTitle>
          <Badge variant={classification.variant} className="text-xs">
            {classification.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <div className="text-3xl font-bold" style={{ color }}>
              {score.toFixed(1)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{name}</p>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progresso</span>
              <span>{evaluatedRequirements}/{totalRequirements}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-muted-foreground">Conforme: {conformeCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <span className="text-muted-foreground">Parcial: {parcialCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-muted-foreground">Não Conf.: {naoConformeCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
              <span className="text-muted-foreground">N/A: {naCount}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
