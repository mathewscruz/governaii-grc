import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PillarScore {
  pillar: string;
  name: string;
  score: number;
  totalRequirements: number;
  evaluatedRequirements: number;
  color: string;
}

interface CategoryScore {
  category: string;
  score: number;
  total: number;
  evaluated: number;
}

interface RequirementExport {
  codigo: string;
  titulo: string;
  categoria: string;
  conformity_status: string;
  peso: number | null;
  area_responsavel: string | null;
}

interface ExportFrameworkPDFParams {
  frameworkName: string;
  frameworkVersion: string;
  frameworkType: string;
  overallScore: number;
  totalRequirements: number;
  evaluatedRequirements: number;
  pillarScores: PillarScore[];
  categoryScores: CategoryScore[];
  requirements: RequirementExport[];
  empresaNome?: string;
  scoreType: 'decimal' | 'percentage';
  maxScore: number;
}

const colors = {
  primary: '#2563eb',
  secondary: '#64748b',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  text: '#1e293b',
  textLight: '#64748b',
  border: '#e2e8f0',
  background: '#f8fafc'
};

function getScoreColor(score: number, maxScore: number): string {
  const pct = (score / maxScore) * 100;
  if (pct >= 80) return colors.success;
  if (pct >= 60) return colors.primary;
  if (pct >= 40) return colors.warning;
  return colors.danger;
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    conforme: '✓ Conforme',
    parcial: '◐ Parcial',
    nao_conforme: '✗ Não Conforme',
    nao_aplicavel: '− N/A',
    nao_avaliado: '○ Não Avaliado',
  };
  return map[status] || status;
}

export async function exportFrameworkPDF(params: ExportFrameworkPDFParams) {
  const {
    frameworkName, frameworkVersion, frameworkType,
    overallScore, totalRequirements, evaluatedRequirements,
    pillarScores, categoryScores, requirements,
    empresaNome = 'Empresa', scoreType, maxScore
  } = params;

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;

  const checkPage = (space: number = 20) => {
    if (yPos + space > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
    }
  };

  const addSection = (title: string, topMargin: number = 10) => {
    checkPage(30);
    yPos += topMargin;
    doc.setFillColor(colors.primary);
    doc.rect(margin, yPos, 4, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(colors.text);
    doc.text(title, margin + 8, yPos + 6);
    yPos += 15;
  };

  const formatScore = (s: number) => scoreType === 'percentage' ? `${s.toFixed(0)}%` : s.toFixed(1);

  // === CAPA ===
  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(colors.primary);
  doc.text('Relatório de Conformidade', pageWidth / 2, yPos, { align: 'center' });
  yPos += 12;
  doc.setFontSize(18);
  doc.text(`${frameworkName} ${frameworkVersion}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;
  doc.setFontSize(12);
  doc.setTextColor(colors.textLight);
  doc.text(`Tipo: ${frameworkType}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 20;

  // Info box
  doc.setFillColor(colors.background);
  doc.setDrawColor(colors.border);
  doc.roundedRect(margin, yPos, contentWidth, 20, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(colors.textLight);
  doc.text('Empresa:', margin + 5, yPos + 7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.text);
  doc.text(empresaNome, margin + 30, yPos + 7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colors.textLight);
  doc.text('Data:', margin + 5, yPos + 15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.text);
  doc.text(format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }), margin + 20, yPos + 15);
  yPos += 30;

  // === SCORE GERAL ===
  addSection('Resultado Geral');
  const scoreColor = getScoreColor(overallScore, maxScore);
  doc.setFillColor(colors.background);
  doc.setDrawColor(colors.border);
  doc.roundedRect(margin, yPos, contentWidth, 35, 2, 2, 'FD');

  // Score circle
  doc.setFillColor(scoreColor);
  doc.circle(margin + 22, yPos + 17.5, 13, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(formatScore(overallScore), margin + 22, yPos + 20, { align: 'center' });

  // Progress text
  const progressPct = totalRequirements > 0 ? Math.round((evaluatedRequirements / totalRequirements) * 100) : 0;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(colors.text);
  doc.text(`${evaluatedRequirements} de ${totalRequirements} requisitos avaliados (${progressPct}%)`, margin + 42, yPos + 12);

  // Progress bar
  const barW = contentWidth - 52;
  doc.setFillColor(colors.border);
  doc.roundedRect(margin + 42, yPos + 18, barW, 5, 2, 2, 'F');
  doc.setFillColor(scoreColor);
  doc.roundedRect(margin + 42, yPos + 18, barW * progressPct / 100, 5, 2, 2, 'F');

  // Non-compliant count
  const nonCompliant = requirements.filter(r => r.conformity_status === 'nao_conforme').length;
  const partial = requirements.filter(r => r.conformity_status === 'parcial').length;
  doc.setFontSize(9);
  doc.setTextColor(colors.textLight);
  doc.text(`Não Conformes: ${nonCompliant}  |  Parciais: ${partial}`, margin + 42, yPos + 30);
  yPos += 45;

  // === SCORES POR CATEGORIA ===
  if (pillarScores.length > 0) {
    addSection('Pontuação por Categoria');
    const colW = (contentWidth - 6) / 3;
    let col = 0;

    pillarScores.forEach(p => {
      if (col === 3) { col = 0; yPos += 30; checkPage(30); }
      const x = margin + col * (colW + 3);
      doc.setFillColor(colors.background);
      doc.setDrawColor(colors.border);
      doc.roundedRect(x, yPos, colW, 25, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(colors.text);
      const nameLines = doc.splitTextToSize(p.name, colW - 6);
      doc.text(nameLines[0], x + colW / 2, yPos + 7, { align: 'center' });

      const pc = getScoreColor(p.score, maxScore);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(pc);
      doc.text(formatScore(p.score), x + colW / 2, yPos + 18, { align: 'center' });

      doc.setFontSize(7);
      doc.setTextColor(colors.textLight);
      doc.text(`${p.evaluatedRequirements}/${p.totalRequirements}`, x + colW / 2, yPos + 23, { align: 'center' });

      col++;
    });
    yPos += 35;
  }

  // === LISTA DE REQUISITOS NÃO CONFORMES ===
  const nonCompliantReqs = requirements.filter(r => r.conformity_status === 'nao_conforme' || r.conformity_status === 'parcial');
  if (nonCompliantReqs.length > 0) {
    addSection('Itens que Requerem Atenção');

    // Table header
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPos - 4, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(colors.text);
    doc.text('Código', margin + 2, yPos);
    doc.text('Requisito', margin + 25, yPos);
    doc.text('Categoria', margin + 110, yPos);
    doc.text('Status', margin + 145, yPos);
    yPos += 6;

    doc.setFont('helvetica', 'normal');
    nonCompliantReqs.forEach(req => {
      checkPage(8);
      doc.setFontSize(7);
      doc.setTextColor(colors.primary);
      doc.text(req.codigo || '', margin + 2, yPos);
      doc.setTextColor(colors.text);
      const titleLines = doc.splitTextToSize(req.titulo, 80);
      doc.text(titleLines[0], margin + 25, yPos);
      doc.setTextColor(colors.textLight);
      doc.text((req.categoria || '').substring(0, 20), margin + 110, yPos);
      doc.setTextColor(req.conformity_status === 'nao_conforme' ? colors.danger : colors.warning);
      doc.text(statusLabel(req.conformity_status), margin + 145, yPos);
      yPos += 5;
    });
  }

  // === TODOS OS REQUISITOS ===
  addSection('Todos os Requisitos');
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos - 4, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(colors.text);
  doc.text('Código', margin + 2, yPos);
  doc.text('Requisito', margin + 25, yPos);
  doc.text('Status', margin + 140, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'normal');
  requirements.forEach((req, i) => {
    checkPage(6);
    if (i % 2 === 0) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(248, 250, 252);
    }
    doc.rect(margin, yPos - 3.5, contentWidth, 5, 'F');

    doc.setFontSize(7);
    doc.setTextColor(colors.primary);
    doc.text(req.codigo || '', margin + 2, yPos);
    doc.setTextColor(colors.text);
    const tl = doc.splitTextToSize(req.titulo, 110);
    doc.text(tl[0], margin + 25, yPos);

    const sc = req.conformity_status === 'conforme' ? colors.success
      : req.conformity_status === 'nao_conforme' ? colors.danger
      : req.conformity_status === 'parcial' ? colors.warning
      : colors.textLight;
    doc.setTextColor(sc);
    doc.text(statusLabel(req.conformity_status), margin + 140, yPos);
    yPos += 5;
  });

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(colors.textLight);
    doc.setFont('helvetica', 'normal');
    doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text(format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }), pageWidth - margin, pageHeight - 10, { align: 'right' });
    doc.text('GovernAI - Gestão de Conformidade', margin, pageHeight - 10);
  }

  const fileName = `${frameworkName.replace(/[\/\\:]/g, '_')}_${empresaNome.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
  doc.save(fileName);
}
