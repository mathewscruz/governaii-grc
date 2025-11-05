import jsPDF from 'jspdf';
import type { AdherenceAssessment, PontoForte, PontoMelhoria } from './types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function exportAssessmentToPDF(assessment: AdherenceAssessment, details?: any[]) {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const marginX = 40;
  const marginY = 40;
  let y = marginY;

  // Helper para adicionar nova página se necessário
  const checkAddPage = (requiredSpace: number) => {
    if (y + requiredSpace > pdf.internal.pageSize.getHeight() - marginY) {
      pdf.addPage();
      y = marginY;
    }
  };

  // Helper para adicionar texto com quebra de linha
  const addText = (text: string, fontSize: number, isBold = false, color: [number, number, number] = [0, 0, 0]) => {
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
    pdf.setTextColor(color[0], color[1], color[2]);
    const lines = pdf.splitTextToSize(text, pageWidth - 2 * marginX);
    
    lines.forEach((line: string) => {
      checkAddPage(fontSize + 5);
      pdf.text(line, marginX, y);
      y += fontSize + 5;
    });
  };

  // Título Principal
  addText('RELATÓRIO DE AVALIAÇÃO DE ADERÊNCIA', 20, true, [31, 41, 55]);
  y += 10;

  // Informações Gerais
  addText(`Nome: ${assessment.nome_analise}`, 14, true);
  addText(`Framework: ${assessment.framework_nome} ${assessment.framework_versao || ''}`, 12);
  addText(`Documento: ${assessment.documento_nome}`, 12);
  addText(`Data: ${format(new Date(assessment.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}`, 12);
  y += 20;

  // Linha separadora
  pdf.setDrawColor(200, 200, 200);
  pdf.line(marginX, y, pageWidth - marginX, y);
  y += 20;

  // Resultado Geral
  checkAddPage(80);
  const resultLabel = assessment.resultado_geral === 'conforme' 
    ? 'CONFORME' 
    : assessment.resultado_geral === 'nao_conforme' 
    ? 'NÃO CONFORME' 
    : 'PARCIALMENTE CONFORME';
  
  const resultColor: [number, number, number] = assessment.resultado_geral === 'conforme' 
    ? [34, 197, 94] 
    : assessment.resultado_geral === 'nao_conforme' 
    ? [239, 68, 68] 
    : [234, 179, 8];

  addText('RESULTADO GERAL', 16, true);
  addText(resultLabel, 24, true, resultColor);
  addText(`Percentual de Conformidade: ${assessment.percentual_conformidade}%`, 14, true);
  y += 20;

  // Distribuição
  if (details && details.length > 0) {
    const distribuicao = {
      conforme: details.filter((d: any) => d.status_aderencia === 'conforme').length,
      parcial: details.filter((d: any) => d.status_aderencia === 'parcial').length,
      nao_conforme: details.filter((d: any) => d.status_aderencia === 'nao_conforme').length,
      nao_aplicavel: details.filter((d: any) => d.status_aderencia === 'nao_aplicavel').length,
    };

    addText('RESUMO EXECUTIVO', 16, true);
    addText(`Conforme: ${distribuicao.conforme} requisitos`, 12, false, [34, 197, 94]);
    addText(`Parcial: ${distribuicao.parcial} requisitos`, 12, false, [234, 179, 8]);
    addText(`Não Conforme: ${distribuicao.nao_conforme} requisitos`, 12, false, [239, 68, 68]);
    addText(`Não Aplicável: ${distribuicao.nao_aplicavel} requisitos`, 12, false, [156, 163, 175]);
    y += 20;
  }

  // Pontos Fortes
  if (assessment.pontos_fortes && assessment.pontos_fortes.length > 0) {
    checkAddPage(60);
    addText(`PONTOS FORTES (${assessment.pontos_fortes.length})`, 16, true, [34, 197, 94]);
    y += 5;
    
    assessment.pontos_fortes.forEach((ponto: PontoForte, index: number) => {
      checkAddPage(50);
      addText(`${index + 1}. ${ponto.titulo}`, 12, true);
      addText(ponto.descricao, 10);
      y += 10;
    });
    y += 10;
  }

  // Pontos de Melhoria
  if (assessment.pontos_melhoria && assessment.pontos_melhoria.length > 0) {
    checkAddPage(60);
    addText(`PONTOS DE MELHORIA (${assessment.pontos_melhoria.length})`, 16, true, [234, 179, 8]);
    y += 5;
    
    assessment.pontos_melhoria.forEach((ponto: PontoMelhoria, index: number) => {
      checkAddPage(50);
      const prioridadeColor: [number, number, number] = ponto.prioridade === 'alta' 
        ? [239, 68, 68] 
        : ponto.prioridade === 'media' 
        ? [234, 179, 8] 
        : [156, 163, 175];
      
      addText(`${index + 1}. ${ponto.titulo} [Prioridade: ${ponto.prioridade.toUpperCase()}]`, 12, true, prioridadeColor);
      addText(ponto.descricao, 10);
      y += 10;
    });
    y += 10;
  }

  // Recomendações
  if (assessment.recomendacoes && assessment.recomendacoes.length > 0) {
    checkAddPage(60);
    addText('RECOMENDAÇÕES', 16, true, [59, 130, 246]);
    y += 5;
    
    assessment.recomendacoes.forEach((rec: string, index: number) => {
      checkAddPage(40);
      addText(`${index + 1}. ${rec}`, 10);
      y += 5;
    });
    y += 10;
  }

  // Análise Detalhada
  if (assessment.analise_detalhada) {
    pdf.addPage();
    y = marginY;
    addText('ANÁLISE DETALHADA', 16, true);
    y += 5;
    addText(assessment.analise_detalhada, 10);
  }

  // Análise por Requisito
  if (details && details.length > 0) {
    pdf.addPage();
    y = marginY;
    addText('ANÁLISE DETALHADA POR REQUISITO', 16, true);
    y += 10;

    details.forEach((detail: any) => {
      checkAddPage(80);
      
      const statusColor: [number, number, number] = detail.status_aderencia === 'conforme' 
        ? [34, 197, 94] 
        : detail.status_aderencia === 'nao_conforme' 
        ? [239, 68, 68] 
        : detail.status_aderencia === 'parcial'
        ? [234, 179, 8]
        : [156, 163, 175];

      addText(`${detail.requisito_codigo} - ${detail.requisito_titulo}`, 12, true);
      addText(`Status: ${detail.status_aderencia.toUpperCase()}`, 10, false, statusColor);
      
      if (detail.score_conformidade !== null) {
        addText(`Score: ${detail.score_conformidade}/10`, 10, true);
      }
      
      if (detail.evidencias_encontradas) {
        addText('Evidências: ' + detail.evidencias_encontradas, 9);
      }
      
      if (detail.gaps_especificos) {
        addText('Gaps: ' + detail.gaps_especificos, 9);
      }
      
      y += 15;
    });
  }

  // Rodapé em todas as páginas
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(156, 163, 175);
    pdf.text(
      `Página ${i} de ${totalPages} | Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`,
      marginX,
      pdf.internal.pageSize.getHeight() - 20
    );
  }

  // Salvar PDF
  const fileName = `${assessment.nome_analise.replace(/[^a-zA-Z0-9]/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;
  pdf.save(fileName);
}
