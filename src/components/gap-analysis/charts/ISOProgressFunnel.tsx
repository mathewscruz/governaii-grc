import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, LucideIcon } from "lucide-react";

interface SectionScore {
  section: string;
  name?: string;
  score: number;
  totalRequirements: number;
  evaluatedRequirements: number;
}

interface ISOProgressFunnelProps {
  sectionScores: SectionScore[];
  title?: string;
}

const PDCA_SECTIONS: Array<{ key: string; label: string; icon: LucideIcon; color: string }> = [
  { key: 'Contexto', label: 'Contexto da Organização', icon: Circle, color: 'hsl(var(--chart-1))' },
  { key: 'Liderança', label: 'Liderança', icon: Circle, color: 'hsl(var(--chart-2))' },
  { key: 'Planejamento', label: 'Planejamento', icon: Circle, color: 'hsl(var(--chart-3))' },
  { key: 'Apoio', label: 'Apoio', icon: Circle, color: 'hsl(var(--chart-4))' },
  { key: 'Operação', label: 'Operação', icon: CheckCircle2, color: 'hsl(var(--primary))' },
  { key: 'Avaliação', label: 'Avaliação de Desempenho', icon: Circle, color: 'hsl(var(--chart-5))' },
  { key: 'Melhoria', label: 'Melhoria', icon: Circle, color: 'hsl(var(--accent))' },
];

export const ISOProgressFunnel: React.FC<ISOProgressFunnelProps> = ({ 
  sectionScores, 
  title = "Estrutura PDCA - ISO" 
}) => {
  const getSectionData = (sectionKey: string) => {
    return sectionScores.find(s => s.section.includes(sectionKey)) || { 
      score: 0, 
      evaluatedRequirements: 0, 
      totalRequirements: 0 
    };
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    if (score >= 20) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {PDCA_SECTIONS.map((section, index) => {
          const data = getSectionData(section.key);
          const Icon = data.evaluatedRequirements > 0 ? CheckCircle2 : Circle;
          
          return (
            <div key={section.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" style={{ color: section.color }} />
                  <span className="text-sm font-medium">{section.label}</span>
                </div>
                <span className={`text-sm font-semibold ${getScoreColor(data.score)}`}>
                  {data.score.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Progress 
                  value={data.score} 
                  className="h-2 flex-1"
                />
                <span className="text-xs text-muted-foreground min-w-[60px] text-right">
                  {data.evaluatedRequirements}/{data.totalRequirements}
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
