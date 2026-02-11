import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NISTScoreData {
  overallScore: number;
  classification: string;
  variant: string;
  pillarScores: Array<{
    pillar: string;
    name: string;
    score: number;
    color: string;
    totalRequirements: number;
    evaluatedRequirements: number;
    conformeCount: number;
    parcialCount: number;
    naoConformeCount: number;
    naoAplicavelCount: number;
  }>;
  totalRequirements: number;
  evaluatedRequirements: number;
  progressPercentage: number;
}

interface NISTRequirement {
  id: string;
  codigo: string;
  titulo: string;
  descricao?: string;
  categoria: string;
  peso: number;
  conformity_status?: string;
  conformity_score?: number;
}

export const exportNISTPDF = async (
  scoreData: NISTScoreData,
  requirements: NISTRequirement[],
  empresaNome: string = 'Empresa',
  empresaLogoUrl?: string
) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPos = margin;

  // Color palette - professional and neutral
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

  // Helper function to check if we need a new page
  const checkAddPage = (requiredSpace: number = 20) => {
    if (yPos + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Helper function to add section title
  const addSection = (title: string, topMargin: number = 10) => {
    checkAddPage(30);
    yPos += topMargin;
    doc.setFillColor(colors.primary);
    doc.rect(margin, yPos, 4, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(colors.text);
    doc.text(title, margin + 8, yPos + 6);
    yPos += 15;
  };

  // Load and add logo
  const loadLogo = async (url: string): Promise<string | null> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error loading logo:', error);
      return null;
    }
  };

  // Add logo if available
  if (empresaLogoUrl) {
    const logoData = await loadLogo(empresaLogoUrl);
    if (logoData) {
      try {
        doc.addImage(logoData, 'PNG', margin, yPos, 40, 15);
      } catch (error) {
        console.error('Error adding logo to PDF:', error);
      }
    }
  }
  yPos += 25;

  // Cover page
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(colors.primary);
  doc.text('Relatório de Avaliação', pageWidth / 2, yPos, { align: 'center' });
  yPos += 12;
  
  doc.setFontSize(20);
  doc.text('NIST Cybersecurity Framework 2.0', pageWidth / 2, yPos, { align: 'center' });
  yPos += 20;

  // Company info box
  doc.setFillColor(colors.background);
  doc.setDrawColor(colors.border);
  doc.roundedRect(margin, yPos, contentWidth, 25, 2, 2, 'FD');
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(colors.textLight);
  doc.text('Empresa:', margin + 5, yPos + 8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.text);
  doc.text(empresaNome, margin + 5, yPos + 14);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colors.textLight);
  doc.text('Data da Avaliação:', margin + 5, yPos + 20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.text);
  doc.text(format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }), margin + 45, yPos + 20);
  yPos += 35;

  // Overall Score Section
  addSection('Resultado Geral', 10);
  
  // Score box
  const scoreBoxHeight = 45;
  doc.setFillColor(colors.background);
  doc.setDrawColor(colors.border);
  doc.roundedRect(margin, yPos, contentWidth, scoreBoxHeight, 2, 2, 'FD');

  // Score circle background
  const scoreCircleX = margin + 25;
  const scoreCircleY = yPos + scoreBoxHeight / 2;
  const scoreCircleRadius = 15;
  
  let scoreColor = colors.danger;
  if (scoreData.overallScore >= 4.5) scoreColor = colors.success;
  else if (scoreData.overallScore >= 3.5) scoreColor = colors.primary;
  else if (scoreData.overallScore >= 2.5) scoreColor = colors.warning;
  
  doc.setFillColor(scoreColor);
  doc.circle(scoreCircleX, scoreCircleY, scoreCircleRadius, 'F');
  
  // Score value
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text(scoreData.overallScore.toFixed(1), scoreCircleX, scoreCircleY + 2, { align: 'center' });
  
  // Classification
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(colors.text);
  doc.text(scoreData.classification, margin + 50, yPos + 15);
  
  // Progress info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(colors.textLight);
  doc.text(
    `${scoreData.evaluatedRequirements} de ${scoreData.totalRequirements} requisitos avaliados (${scoreData.progressPercentage.toFixed(0)}%)`,
    margin + 50,
    yPos + 25
  );
  
  // Progress bar
  const progressBarWidth = contentWidth - 60;
  const progressBarHeight = 6;
  const progressBarX = margin + 50;
  const progressBarY = yPos + 30;
  
  doc.setFillColor(colors.border);
  doc.roundedRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight, 2, 2, 'F');
  
  const progressWidth = (progressBarWidth * scoreData.progressPercentage) / 100;
  doc.setFillColor(scoreColor);
  doc.roundedRect(progressBarX, progressBarY, progressWidth, progressBarHeight, 2, 2, 'F');
  
  yPos += scoreBoxHeight + 10;

  // Pillars Section
  addSection('Pontuação por Pilares', 15);
  
  const pillarBoxWidth = (contentWidth - 10) / 3;
  const pillarBoxHeight = 35;
  let pillarX = margin;
  let pillarRowCount = 0;

  scoreData.pillarScores.forEach((pillar, index) => {
    if (pillarRowCount === 3) {
      pillarRowCount = 0;
      pillarX = margin;
      yPos += pillarBoxHeight + 5;
      checkAddPage(pillarBoxHeight + 10);
    }

    doc.setFillColor(colors.background);
    doc.setDrawColor(colors.border);
    doc.roundedRect(pillarX, yPos, pillarBoxWidth - 3, pillarBoxHeight, 2, 2, 'FD');

    // Pillar name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(colors.text);
    doc.text(pillar.name, pillarX + pillarBoxWidth / 2 - 1.5, yPos + 8, { align: 'center' });

    // Pillar score
    let pillarColor = colors.danger;
    if (pillar.score >= 4.5) pillarColor = colors.success;
    else if (pillar.score >= 3.5) pillarColor = colors.primary;
    else if (pillar.score >= 2.5) pillarColor = colors.warning;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(pillarColor);
    doc.text(pillar.score.toFixed(1), pillarX + pillarBoxWidth / 2 - 1.5, yPos + 22, { align: 'center' });

    // Pillar progress
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(colors.textLight);
    doc.text(
      `${pillar.evaluatedRequirements}/${pillar.totalRequirements}`,
      pillarX + pillarBoxWidth / 2 - 1.5,
      yPos + 30,
      { align: 'center' }
    );

    pillarX += pillarBoxWidth + 2;
    pillarRowCount++;
  });

  yPos += pillarBoxHeight + 15;

  // Detailed Analysis by Pillar
  addSection('Análise Detalhada por Pilar', 15);

  scoreData.pillarScores.forEach((pillar) => {
    checkAddPage(50);
    
    // Pillar header
    doc.setFillColor(colors.primary);
    doc.rect(margin, yPos, contentWidth, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(`${pillar.name} - Nota: ${pillar.score.toFixed(1)}`, margin + 3, yPos + 6.5);
    yPos += 12;

    // Status distribution
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(colors.text);
    
    const statusText = [
      `✓ Conforme: ${pillar.conformeCount}`,
      `◐ Parcial: ${pillar.parcialCount}`,
      `✗ Não Conforme: ${pillar.naoConformeCount}`,
      `− N/A: ${pillar.naoAplicavelCount}`
    ].join('  |  ');
    
    doc.text(statusText, margin + 3, yPos + 4);
    yPos += 10;

    // Requirements for this pillar
    const pillarRequirements = requirements.filter(req => req.categoria === pillar.pillar);
    
    pillarRequirements.forEach((req, index) => {
      checkAddPage(25);
      
      // Requirement box
      if (index % 2 === 0) {
        doc.setFillColor(255, 255, 255);
      } else {
        doc.setFillColor(248, 250, 252);
      }
      doc.rect(margin, yPos, contentWidth, 20, 'F');
      
      // Code
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(colors.primary);
      doc.text(req.codigo || '', margin + 3, yPos + 5);
      
      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(colors.text);
      const titleLines = doc.splitTextToSize(req.titulo, contentWidth - 50);
      doc.text(titleLines[0], margin + 25, yPos + 5);
      
      // Status
      let statusText = 'Não Avaliado';
      let statusColor = colors.textLight;
      
      if (req.conformity_status === 'conforme') {
        statusText = '✓ Conforme';
        statusColor = colors.success;
      } else if (req.conformity_status === 'parcial') {
        statusText = '◐ Parcial';
        statusColor = colors.warning;
      } else if (req.conformity_status === 'nao_conforme') {
        statusText = '✗ Não Conforme';
        statusColor = colors.danger;
      } else if (req.conformity_status === 'nao_aplicavel') {
        statusText = '− N/A';
        statusColor = colors.textLight;
      }
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(statusColor);
      doc.text(statusText, margin + 3, yPos + 10);
      
      // Weight
      doc.setTextColor(colors.textLight);
      doc.text(`Peso: ${req.peso}`, margin + 3, yPos + 15);
      
      // Score if evaluated
      if (req.conformity_score !== undefined) {
        doc.setTextColor(colors.text);
        doc.text(`Pontos: ${req.conformity_score.toFixed(1)}`, margin + 25, yPos + 15);
      }
      
      yPos += 22;
    });
    
    yPos += 5;
  });

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(colors.textLight);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text(
      `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
      pageWidth - margin,
      pageHeight - 10,
      { align: 'right' }
    );
    doc.text(
      'Akuris - Gestão de Governança',
      margin,
      pageHeight - 10
    );
  }

  // Save PDF
  const fileName = `NIST_CSF_2.0_${empresaNome.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
  doc.save(fileName);
};
