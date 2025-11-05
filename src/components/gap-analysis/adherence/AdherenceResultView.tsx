import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle2, AlertTriangle, Lightbulb, ArrowLeft, Download, TrendingUp, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { AdherenceAssessment, PontoForte, PontoMelhoria } from './types';
import { useOptimizedQuery } from '@/hooks/useOptimizedQuery';
import { supabase } from '@/integrations/supabase/client';
import { exportAssessmentToPDF } from './ExportPDF';
import { useToast } from '@/hooks/use-toast';

interface AdherenceResultViewProps {
  assessment: AdherenceAssessment;
  onBack: () => void;
}

export function AdherenceResultView({ assessment, onBack }: AdherenceResultViewProps) {
  const { toast } = useToast();
  
  // Buscar detalhes por requisito
  const { data: details } = useOptimizedQuery(
    async () => {
      const { data, error } = await supabase
        .from('gap_analysis_adherence_details')
        .select('*')
        .eq('assessment_id', assessment.id)
        .order('requisito_codigo');

      if (error) throw error;
      return { data, error: null };
    },
    [assessment.id],
    { cacheKey: `adherence-details-${assessment.id}`, cacheDuration: 60000 }
  );

  const getResultColor = (resultado?: string) => {
    switch (resultado) {
      case 'conforme':
        return 'border-green-500 bg-green-50 text-green-700';
      case 'nao_conforme':
        return 'border-red-500 bg-red-50 text-red-700';
      case 'parcial':
        return 'border-yellow-500 bg-yellow-50 text-yellow-700';
      default:
        return 'border-gray-500 bg-gray-50 text-gray-700';
    }
  };

  const getResultLabel = (resultado?: string) => {
    switch (resultado) {
      case 'conforme':
        return 'CONFORME';
      case 'nao_conforme':
        return 'NÃO CONFORME';
      case 'parcial':
        return 'PARCIALMENTE CONFORME';
      default:
        return 'DESCONHECIDO';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'conforme':
        return 'bg-green-500';
      case 'nao_conforme':
        return 'bg-red-500';
      case 'parcial':
        return 'bg-yellow-500';
      case 'nao_aplicavel':
        return 'bg-gray-400';
      default:
        return 'bg-gray-300';
    }
  };

  const getPrioridadeBadge = (prioridade: string) => {
    switch (prioridade) {
      case 'alta':
        return <Badge variant="destructive">Alta</Badge>;
      case 'media':
        return <Badge className="bg-yellow-500">Média</Badge>;
      case 'baixa':
        return <Badge variant="outline">Baixa</Badge>;
      default:
        return null;
    }
  };

  // Calcular distribuição
  const distribuicao = {
    conforme: details?.filter((d: any) => d.status_aderencia === 'conforme').length || 0,
    parcial: details?.filter((d: any) => d.status_aderencia === 'parcial').length || 0,
    nao_conforme: details?.filter((d: any) => d.status_aderencia === 'nao_conforme').length || 0,
    nao_aplicavel: details?.filter((d: any) => d.status_aderencia === 'nao_aplicavel').length || 0,
  };

  const total = distribuicao.conforme + distribuicao.parcial + distribuicao.nao_conforme + distribuicao.nao_aplicavel;

  const handleExportPDF = () => {
    try {
      exportAssessmentToPDF(assessment, details);
      toast({
        title: "PDF exportado",
        description: "O relatório foi exportado com sucesso.",
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "Erro ao exportar",
        description: "Ocorreu um erro ao exportar o PDF.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Resultado Geral */}
      <Card className={`p-8 border-2 ${getResultColor(assessment.resultado_geral)}`}>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/50 mb-4">
            {assessment.resultado_geral === 'conforme' ? (
              <CheckCircle2 className="h-8 w-8" />
            ) : (
              <AlertTriangle className="h-8 w-8" />
            )}
          </div>
          <h2 className="text-3xl font-bold mb-2">{getResultLabel(assessment.resultado_geral)}</h2>
          <p className="text-5xl font-bold mb-4">{assessment.percentual_conformidade}%</p>
          <div className="flex items-center justify-center gap-4 text-sm">
            <div>
              <span className="font-medium">Framework:</span> {assessment.framework_nome} {assessment.framework_versao}
            </div>
            <div>|</div>
            <div>
              <span className="font-medium">Documento:</span> {assessment.documento_nome}
            </div>
          </div>
          <p className="text-xs mt-2 opacity-75">
            Análise realizada em {format(new Date(assessment.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
      </Card>

      {/* Resumo Executivo */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Resumo Executivo
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{distribuicao.conforme}</div>
            <div className="text-sm text-muted-foreground">Conforme</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">{distribuicao.parcial}</div>
            <div className="text-sm text-muted-foreground">Parcial</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">{distribuicao.nao_conforme}</div>
            <div className="text-sm text-muted-foreground">Não Conforme</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-600">{distribuicao.nao_aplicavel}</div>
            <div className="text-sm text-muted-foreground">Não Aplicável</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex gap-1 h-4 rounded overflow-hidden">
            {distribuicao.conforme > 0 && (
              <div className="bg-green-500" style={{ width: `${(distribuicao.conforme / total) * 100}%` }} />
            )}
            {distribuicao.parcial > 0 && (
              <div className="bg-yellow-500" style={{ width: `${(distribuicao.parcial / total) * 100}%` }} />
            )}
            {distribuicao.nao_conforme > 0 && (
              <div className="bg-red-500" style={{ width: `${(distribuicao.nao_conforme / total) * 100}%` }} />
            )}
            {distribuicao.nao_aplicavel > 0 && (
              <div className="bg-gray-400" style={{ width: `${(distribuicao.nao_aplicavel / total) * 100}%` }} />
            )}
          </div>
        </div>
      </Card>

      {/* Pontos Fortes */}
      {assessment.pontos_fortes && assessment.pontos_fortes.length > 0 && (
        <Card className="p-6 border-green-200 bg-green-50/50">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            Pontos Fortes ({assessment.pontos_fortes.length})
          </h3>
          <div className="space-y-3">
            {assessment.pontos_fortes.map((ponto: PontoForte, index: number) => (
              <Card key={index} className="p-4 bg-white">
                <h4 className="font-semibold text-green-700 mb-2">{ponto.titulo}</h4>
                <p className="text-sm text-muted-foreground">{ponto.descricao}</p>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Pontos de Melhoria */}
      {assessment.pontos_melhoria && assessment.pontos_melhoria.length > 0 && (
        <Card className="p-6 border-yellow-200 bg-yellow-50/50">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-yellow-700">
            <AlertTriangle className="h-5 w-5" />
            Pontos de Melhoria ({assessment.pontos_melhoria.length})
          </h3>
          <div className="space-y-3">
            {assessment.pontos_melhoria.map((ponto: PontoMelhoria, index: number) => (
              <Card key={index} className="p-4 bg-white">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-yellow-700">{ponto.titulo}</h4>
                  {getPrioridadeBadge(ponto.prioridade)}
                </div>
                <p className="text-sm text-muted-foreground">{ponto.descricao}</p>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Recomendações */}
      {assessment.recomendacoes && assessment.recomendacoes.length > 0 && (
        <Card className="p-6 border-blue-200 bg-blue-50/50">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-blue-700">
            <Lightbulb className="h-5 w-5" />
            Recomendações
          </h3>
          <ol className="list-decimal list-inside space-y-2">
            {assessment.recomendacoes.map((rec: string, index: number) => (
              <li key={index} className="text-sm">{rec}</li>
            ))}
          </ol>
        </Card>
      )}

      {/* Análise Detalhada por Requisito */}
      {details && details.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Análise Detalhada por Requisito
          </h3>
          <Accordion type="single" collapsible className="w-full">
            {details.map((detail: any, index: number) => (
              <AccordionItem key={detail.id} value={`item-${index}`}>
                <AccordionTrigger>
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(detail.status_aderencia)}`} />
                      <span className="font-mono text-sm">{detail.requisito_codigo}</span>
                      <span className="text-sm">{detail.requisito_titulo}</span>
                    </div>
                    {detail.score_conformidade !== null && (
                      <Badge variant="outline">{detail.score_conformidade}/10</Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    {detail.evidencias_encontradas && (
                      <div>
                        <h5 className="font-semibold text-sm text-green-700 mb-1">Evidências Encontradas:</h5>
                        <p className="text-sm text-muted-foreground">{detail.evidencias_encontradas}</p>
                      </div>
                    )}
                    {detail.gaps_especificos && (
                      <div>
                        <h5 className="font-semibold text-sm text-red-700 mb-1">Gaps Identificados:</h5>
                        <p className="text-sm text-muted-foreground">{detail.gaps_especificos}</p>
                      </div>
                    )}
                    {detail.observacoes_ia && (
                      <div>
                        <h5 className="font-semibold text-sm text-blue-700 mb-1">Observações da IA:</h5>
                        <p className="text-sm text-muted-foreground">{detail.observacoes_ia}</p>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>
      )}

      {/* Análise Completa */}
      {assessment.analise_detalhada && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Análise Completa</h3>
          <div className="prose prose-sm max-w-none whitespace-pre-wrap">
            {assessment.analise_detalhada}
          </div>
        </Card>
      )}
    </div>
  );
}