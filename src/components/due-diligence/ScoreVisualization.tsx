import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, Award, AlertTriangle } from 'lucide-react';

interface ScoreData {
  score_total: number;
  classificacao: string;
  score_breakdown: Record<string, number>;
  observacoes_ia?: string;
  created_at: string;
}

interface ScoreVisualizationProps {
  scoreData: ScoreData;
  assessmentData?: {
    fornecedor_nome: string;
    template: { nome: string; categoria: string };
  };
}

export function ScoreVisualization({ scoreData, assessmentData }: ScoreVisualizationProps) {
  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'excelente': return 'text-green-600';
      case 'bom': return 'text-blue-600';
      case 'regular': return 'text-yellow-600';
      case 'ruim': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  const getClassificationBadge = (classification: string) => {
    switch (classification) {
      case 'excelente': return { variant: 'default' as const, icon: Award };
      case 'bom': return { variant: 'secondary' as const, icon: TrendingUp };
      case 'regular': return { variant: 'outline' as const, icon: Minus };
      case 'ruim': return { variant: 'destructive' as const, icon: AlertTriangle };
      default: return { variant: 'outline' as const, icon: Minus };
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 6) return 'bg-blue-500';
    if (score >= 4) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const classificationBadge = getClassificationBadge(scoreData.classificacao);
  const ClassificationIcon = classificationBadge.icon;

  const breakdownEntries = Object.entries(scoreData.score_breakdown || {});

  return (
    <div className="space-y-6">
      {/* Header com informações principais */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                {assessmentData ? `Avaliação de ${assessmentData.fornecedor_nome}` : 'Resultado da Avaliação'}
              </CardTitle>
              {assessmentData && (
                <p className="text-sm text-muted-foreground">
                  Template: {assessmentData.template.nome} • Categoria: {assessmentData.template.categoria}
                </p>
              )}
            </div>
            <Badge variant={classificationBadge.variant} className="flex items-center gap-1">
              <ClassificationIcon className="h-3 w-3" />
              {scoreData.classificacao.charAt(0).toUpperCase() + scoreData.classificacao.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Score principal */}
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <div className={`text-4xl font-bold ${getClassificationColor(scoreData.classificacao)}`}>
                {scoreData.score_total.toFixed(1)}
              </div>
              <div className="text-lg text-muted-foreground">
                de 10.0 pontos
              </div>
            </div>
            
            <div className="w-full max-w-sm mx-auto">
              <Progress 
                value={scoreData.score_total * 10} 
                className="h-3"
                style={{
                  '--progress-background': getScoreColor(scoreData.score_total)
                } as React.CSSProperties}
              />
            </div>
          </div>

          {/* Data da avaliação */}
          <div className="text-center text-sm text-muted-foreground">
            Avaliado em {new Date(scoreData.created_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </CardContent>
      </Card>

      {/* Breakdown por categoria */}
      {breakdownEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pontuação por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {breakdownEntries.map(([categoria, score]) => (
                <div key={categoria} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium capitalize">{categoria}</span>
                    <span className={`font-semibold ${getClassificationColor(
                      score >= 8 ? 'excelente' : score >= 6 ? 'bom' : score >= 4 ? 'regular' : 'ruim'
                    )}`}>
                      {score.toFixed(1)}
                    </span>
                  </div>
                  <Progress 
                    value={score * 10} 
                    className="h-2"
                    style={{
                      '--progress-background': getScoreColor(score)
                    } as React.CSSProperties}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Observações da IA */}
      {scoreData.observacoes_ia && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-4 w-4" />
              Análise Detalhada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              {scoreData.observacoes_ia}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recomendações baseadas na classificação */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recomendações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {scoreData.classificacao === 'excelente' && (
              <p className="text-green-600">
                ✅ Fornecedor demonstra excelente nível de compliance e governança. Recomendado para parcerias estratégicas.
              </p>
            )}
            {scoreData.classificacao === 'bom' && (
              <p className="text-blue-600">
                ✅ Fornecedor apresenta bom nível de compliance. Pode ser aprovado com monitoramento regular.
              </p>
            )}
            {scoreData.classificacao === 'regular' && (
              <p className="text-yellow-600">
                ⚠️ Fornecedor precisa de melhorias em alguns aspectos. Recomenda-se plano de ação para adequações.
              </p>
            )}
            {scoreData.classificacao === 'ruim' && (
              <p className="text-red-600">
                ❌ Fornecedor apresenta riscos significativos. Não recomendado ou necessita ações corretivas imediatas.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}