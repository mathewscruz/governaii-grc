
import { jsPDF } from 'jspdf';
import { RiscosStats } from '@/hooks/useRiscosStats';

interface RiscoExport {
  nome: string;
  categoria?: { nome: string };
  nivel_risco_inicial: string;
  nivel_risco_residual?: string;
  status: string;
  responsavel_nome?: string;
  data_proxima_revisao?: string;
}

export function exportRiscosPDF(riscos: RiscoExport[], stats: RiscosStats | undefined) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório de Gestão de Riscos', pageWidth / 2, y, { align: 'center' });
  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, y, { align: 'center' });
  y += 15;

  // KPIs
  if (stats) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo Executivo', 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const kpis = [
      `Total de Riscos: ${stats.total}`,
      `Críticos: ${stats.criticos} | Altos: ${stats.altos} | Médios: ${stats.medios} | Baixos: ${stats.baixos}`,
      `Riscos Aceitos: ${stats.aceitos} | Tratados: ${stats.tratados}`,
      `Tratamentos: ${stats.tratamentos_concluidos} concluídos, ${stats.tratamentos_andamento} em andamento, ${stats.tratamentos_pendentes} pendentes`,
      `Score de Risco: ${stats.scoreAtual}/100`,
    ];
    kpis.forEach(kpi => {
      doc.text(kpi, 14, y);
      y += 6;
    });
    y += 8;
  }

  // Tabela de riscos
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Lista de Riscos', 14, y);
  y += 8;

  // Header da tabela
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(240, 240, 240);
  doc.rect(14, y - 4, pageWidth - 28, 7, 'F');
  doc.text('Nome', 16, y);
  doc.text('Categoria', 70, y);
  doc.text('Nível', 110, y);
  doc.text('Residual', 135, y);
  doc.text('Status', 162, y);
  y += 8;

  // Dados
  doc.setFont('helvetica', 'normal');
  riscos.forEach((risco) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    doc.text(risco.nome.substring(0, 30), 16, y);
    doc.text(risco.categoria?.nome?.substring(0, 20) || '-', 70, y);
    doc.text(risco.nivel_risco_inicial || '-', 110, y);
    doc.text(risco.nivel_risco_residual || '-', 135, y);
    doc.text(risco.status || '-', 162, y);
    y += 6;
  });

  doc.save('relatorio-riscos.pdf');
}

export function exportRiscosCSV(riscos: RiscoExport[]) {
  const headers = ['Nome', 'Categoria', 'Nível Inicial', 'Nível Residual', 'Status', 'Responsável', 'Próxima Revisão'];
  const rows = riscos.map(r => [
    r.nome,
    r.categoria?.nome || '',
    r.nivel_risco_inicial || '',
    r.nivel_risco_residual || '',
    r.status || '',
    r.responsavel_nome || '',
    r.data_proxima_revisao || ''
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `riscos-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}
