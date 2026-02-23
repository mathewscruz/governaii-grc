import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Target, Zap, TrendingUp, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AIRecommendationsCardProps {
  frameworkId: string;
  frameworkNome: string;
  empresaId: string;
  overallScore: number;
  totalRequirements: number;
  evaluatedRequirements: number;
  scoreType: string;
}

interface Recommendations {
  analise_situacional: string;
  score_estimado_apos_acoes: number;
  top_5_prioridades: { codigo: string; titulo: string; justificativa: string; esforco: string }[];
  quick_wins: { codigo: string; titulo: string; acao_sugerida: string }[];
  proximo_marco: string;
  recomendacao_geral: string;
}

export function AIRecommendationsCard({
  frameworkId, frameworkNome, empresaId, overallScore,
  totalRequirements, evaluatedRequirements, scoreType,
}: AIRecommendationsCardProps) {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);

  const minEvaluated = Math.max(1, Math.ceil(totalRequirements * 0.1));
  const canAnalyze = evaluatedRequirements >= minEvaluated;

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      // Fetch evaluation data for context
      const [evalsRes, reqsRes] = await Promise.all([
        supabase.from('gap_analysis_evaluations')
          .select('requirement_id, conformity_status')
          .eq('framework_id', frameworkId).eq('empresa_id', empresaId),
        supabase.from('gap_analysis_requirements')
          .select('id, codigo, titulo, peso, categoria')
          .eq('framework_id', frameworkId).order('peso', { ascending: false }),
      ]);

      const evals = evalsRes.data || [];
      const reqs = reqsRes.data || [];
      const evalMap = new Map(evals.map(e => [e.requirement_id, e.conformity_status]));

      const conformes = evals.filter(e => e.conformity_status === 'conforme').length;
      const parciais = evals.filter(e => e.conformity_status === 'parcial').length;
      const naoConformes = evals.filter(e => e.conformity_status === 'nao_conforme').length;

      const reqsCriticos = reqs
        .filter(r => evalMap.get(r.id) === 'nao_conforme')
        .slice(0, 10);
      const reqsParciais = reqs
        .filter(r => evalMap.get(r.id) === 'parcial')
        .slice(0, 10);

      const { data, error } = await supabase.functions.invoke('ai-module-assistant', {
        body: {
          action: 'framework-recommendations',
          data: {
            framework_nome: frameworkNome,
            score_atual: overallScore,
            total_requisitos: totalRequirements,
            avaliados: evaluatedRequirements,
            conformes, parciais, nao_conformes: naoConformes,
            requisitos_criticos: reqsCriticos,
            requisitos_parciais: reqsParciais,
          },
        },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setRecommendations(data?.data || null);
    } catch (err: any) {
      console.error('AI recommendations error:', err);
      toast.error('Erro ao gerar recomendações');
    } finally {
      setLoading(false);
    }
  };

  const getEffortBadge = (esforco: string) => {
    switch (esforco) {
      case 'baixo': return <Badge variant="secondary" className="text-xs">Baixo esforço</Badge>;
      case 'medio': return <Badge variant="outline" className="text-xs">Médio esforço</Badge>;
      case 'alto': return <Badge variant="destructive" className="text-xs">Alto esforço</Badge>;
      default: return null;
    }
  };

  if (!canAnalyze && !recommendations) return null;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-5 w-5 text-primary" />
          Consultor IA de Conformidade
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!recommendations ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              Você avaliou {evaluatedRequirements} de {totalRequirements} requisitos.
              A IA pode analisar seu progresso e recomendar os próximos passos prioritários.
            </p>
            <Button onClick={handleAnalyze} disabled={loading}>
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analisando...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" />Gerar Recomendações</>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Análise situacional */}
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm text-foreground">{recommendations.analise_situacional}</p>
            </div>

            {/* Score projetado */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <TrendingUp className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium">
                  Score projetado: <span className="text-primary font-bold">
                    {recommendations.score_estimado_apos_acoes}{scoreType === 'percentage' ? '%' : '/5'}
                  </span>
                  <span className="text-muted-foreground ml-1">(atual: {overallScore}{scoreType === 'percentage' ? '%' : '/5'})</span>
                </p>
                <p className="text-xs text-muted-foreground">{recommendations.proximo_marco}</p>
              </div>
            </div>

            {/* Top 5 prioridades */}
            {recommendations.top_5_prioridades?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                  <Target className="h-4 w-4 text-destructive" />
                  Requisitos Prioritários
                </h4>
                <div className="space-y-2">
                  {recommendations.top_5_prioridades.map((p, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded border bg-card">
                      <span className="text-xs font-mono text-muted-foreground mt-0.5 shrink-0">{p.codigo}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.titulo}</p>
                        <p className="text-xs text-muted-foreground">{p.justificativa}</p>
                      </div>
                      {getEffortBadge(p.esforco)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick wins */}
            {recommendations.quick_wins?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Quick Wins (Vitórias Rápidas)
                </h4>
                <div className="space-y-2">
                  {recommendations.quick_wins.map((q, i) => (
                    <div key={i} className="p-2 rounded border bg-card">
                      <p className="text-sm"><span className="font-mono text-xs text-muted-foreground mr-1">{q.codigo}</span> {q.titulo}</p>
                      <p className="text-xs text-muted-foreground mt-1">→ {q.acao_sugerida}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recomendação geral */}
            <div className="p-3 rounded-lg border bg-muted/30">
              <p className="text-sm text-foreground">{recommendations.recomendacao_geral}</p>
            </div>

            <Button variant="outline" size="sm" onClick={handleAnalyze} disabled={loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Atualizar Análise
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
