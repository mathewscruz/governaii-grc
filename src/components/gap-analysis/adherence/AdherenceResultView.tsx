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
import { useEmpresaId } from '@/hooks/useEmpresaId';

interface AdherenceResultViewProps {
  assessment: AdherenceAssessment;
  onBack: () => void;
}

export function AdherenceResultView({ assessment, onBack }: AdherenceResultViewProps) {
  const { toast } = useToast();
  const { empresaId } = useEmpresaId();
  
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

  // Buscar dados da empresa
  const { data: empresa } = useOptimizedQuery(
    async () => {
      if (!empresaId) return { data: null, error: null };
      
      const { data, error } = await supabase
        .from('empresas')
        .select('nome, logo_url')
        .eq('id', empresaId)
        .single();

      if (error) throw error;
      return { data, error: null };
    },
    [empresaId],
    { cacheKey: `empresa-${empresaId}`, cacheDuration: 300000 }
  );

  const getResultColor = (resultado?: string) => {
    return 'border-gray-200 bg-white';
  };

  const getResultIconColor = (resultado?: string) => {
    switch (resultado) {
      case 'conforme':
        return { bg: 'bg-green-100', icon: 'text-green-600' };
      case 'nao_conforme':
        return { bg: 'bg-red-100', icon: 'text-red-600' };
      case 'parcial':
        return { bg: 'bg-yellow-100', icon: 'text-yellow-600' };
      default:
        return { bg: 'bg-gray-100', icon: 'text-gray-600' };
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
        return 'bg-gray-600';
      case 'nao_conforme':
        return 'bg-gray-400';
      case 'parcial':
        return 'bg-gray-500';
      case 'nao_aplicavel':
        return 'bg-gray-300';
      default:
        return 'bg-gray-300';
    }
  };

  const getPrioridadeColor = (prioridade: string): string => {
    switch (prioridade) {
      case 'alta':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'media':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'baixa':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const getPrioridadeLabel = (prioridade: string): string => {
    switch (prioridade) {
      case 'alta': return 'Alta';
      case 'media': return 'Média';
      case 'baixa': return 'Baixa';
      default: return prioridade;
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

  const handleExportPDF = async () => {
    try {
      await exportAssessmentToPDF(assessment, details, empresa?.logo_url);
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
      <Card className={`p-8 border ${getResultColor(assessment.resultado_geral)}`}>
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${getResultIconColor(assessment.resultado_geral).bg} mb-3`}>
            {assessment.resultado_geral === 'conforme' ? (
              <CheckCircle2 className={`h-6 w-6 ${getResultIconColor(assessment.resultado_geral).icon}`} />
            ) : (
              <AlertTriangle className={`h-6 w-6 ${getResultIconColor(assessment.resultado_geral).icon}`} />
            )}
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900">{getResultLabel(assessment.resultado_geral)}</h2>
          <p className="text-4xl font-bold mb-4 text-gray-900">{assessment.percentual_conformidade}%</p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Framework:</span> {assessment.framework_nome} {assessment.framework_versao}
            </div>
            <div>|</div>
            <div>
              <span className="font-medium">Documento:</span> {assessment.documento_nome}
            </div>
          </div>
          <p className="text-xs mt-2 text-gray-500">
            Análise realizada em {format(new Date(assessment.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
      </Card>

      {/* Pontos Fortes */}
      {assessment.pontos_fortes && assessment.pontos_fortes.length > 0 && (
        <Card className="p-6 border-gray-200 bg-white">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-700">
            <CheckCircle2 className="h-5 w-5 text-gray-500" />
            Pontos Fortes ({assessment.pontos_fortes.length})
          </h3>
          <div className="space-y-3">
            {assessment.pontos_fortes.map((ponto: PontoForte, index: number) => (
              <Card key={index} className="p-4 bg-gray-50 border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">{ponto.titulo}</h4>
                <p className="text-sm text-muted-foreground">{ponto.descricao}</p>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Pontos de Melhoria */}
      {assessment.pontos_melhoria && assessment.pontos_melhoria.length > 0 && (
        <Card className="p-6 border-gray-200 bg-white">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-700">
            <AlertTriangle className="h-5 w-5 text-gray-500" />
            Pontos de Melhoria ({assessment.pontos_melhoria.length})
          </h3>
          <div className="space-y-3">
            {assessment.pontos_melhoria.map((ponto: PontoMelhoria, index: number) => (
              <Card key={index} className="p-4 bg-gray-50 border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{ponto.titulo}</h4>
                  <Badge className={`${getPrioridadeColor(ponto.prioridade)} border whitespace-nowrap`}>{getPrioridadeLabel(ponto.prioridade)}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{ponto.descricao}</p>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Recomendações */}
      {assessment.recomendacoes && assessment.recomendacoes.length > 0 && (
        <Card className="p-6 border-gray-200 bg-white">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-700">
            <Lightbulb className="h-5 w-5 text-gray-500" />
            Recomendações
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
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
                        <h5 className="font-semibold text-sm text-gray-700 mb-1">Evidências Encontradas:</h5>
                        <p className="text-sm text-muted-foreground">{detail.evidencias_encontradas}</p>
                      </div>
                    )}
                    {detail.gaps_especificos && (
                      <div>
                        <h5 className="font-semibold text-sm text-gray-700 mb-1">Gaps Identificados:</h5>
                        <p className="text-sm text-muted-foreground">{detail.gaps_especificos}</p>
                      </div>
                    )}
                    {detail.observacoes_ia && (
                      <div>
                        <h5 className="font-semibold text-sm text-gray-700 mb-1">Observações da IA:</h5>
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