import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface CategoryScore {
  category: string;
  score: number;
  total: number;
  evaluated: number;
}

interface PrivacyTreemapProps {
  categoryScores: CategoryScore[];
  title?: string;
}

const getScoreBorderColor = (score: number): string => {
  if (score >= 80) return "border-l-green-500";
  if (score >= 60) return "border-l-blue-500";
  if (score >= 40) return "border-l-yellow-500";
  if (score >= 20) return "border-l-orange-500";
  return "border-l-red-500";
};

const getScoreBarColor = (score: number): string => {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-blue-500";
  if (score >= 40) return "bg-yellow-500";
  if (score >= 20) return "bg-orange-500";
  return "bg-red-500";
};

const getScoreTextColor = (score: number): string => {
  if (score >= 80) return "text-green-600 dark:text-green-400";
  if (score >= 60) return "text-blue-600 dark:text-blue-400";
  if (score >= 40) return "text-yellow-600 dark:text-yellow-400";
  if (score >= 20) return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
};

export const PrivacyTreemap: React.FC<PrivacyTreemapProps> = ({ 
  categoryScores, 
  title = "Mapa de Conformidade por Capítulo" 
}) => {
  const validScores = categoryScores?.filter(cat => cat && cat.category && cat.total > 0) || [];
  
  if (validScores.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
            <FileText className="h-12 w-12 mb-4 opacity-50" strokeWidth={1.5}/>
            <p className="text-sm">Nenhum requisito avaliado ainda</p>
            <p className="text-xs mt-1">Avalie os requisitos para ver o mapa de conformidade</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[320px] overflow-y-auto pr-1">
          {validScores.map((cat, i) => (
            <div
              key={i}
              className={`border-l-4 ${getScoreBorderColor(cat.score)} rounded-md bg-muted/40 p-3 space-y-2`}
            >
              <p className="text-xs font-medium text-foreground leading-tight line-clamp-2">
                {cat.category}
              </p>
              <p className={`text-xl font-bold ${getScoreTextColor(cat.score)}`}>
                {cat.score.toFixed(0)}%
              </p>
              <div className="h-1.5 w-full rounded-full bg-secondary">
                <div
                  className={`h-full rounded-full ${getScoreBarColor(cat.score)} transition-all`}
                  style={{ width: `${Math.min(cat.score, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                {cat.evaluated}/{cat.total} avaliados
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
