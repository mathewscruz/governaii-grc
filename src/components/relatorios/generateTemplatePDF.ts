import jsPDF from 'jspdf';
import { supabase } from '@/integrations/supabase/client';
import { loadAkurisLogo, addAkurisCover, addAkurisFooter, addSectionTitle as addPdfSectionTitle, drawTableHeader, formatLabel, AKURIS_COLORS } from '@/lib/pdf-utils';

// ── helpers ──────────────────────────────────────────────────────────
function addSectionTitleLocal(doc: jsPDF, title: string, y: number): number {
  return addPdfSectionTitle(doc, title, y, 20);
}

function addMetricRow(doc: jsPDF, label: string, value: string | number, y: number): number {
  doc.setFontSize(11);
  doc.setTextColor(AKURIS_COLORS.textLight);
  doc.text(label, 28, y);
  doc.setTextColor(AKURIS_COLORS.text);
  doc.setFont('helvetica', 'bold');
  doc.text(String(value), 120, y);
  doc.setFont('helvetica', 'normal');
  return y + 7;
}

function checkPageBreak(doc: jsPDF, y: number, margin = 40): number {
  if (y > 260 - margin) {
    doc.addPage();
    return 25;
  }
  return y;
}

function addTable(doc: jsPDF, headers: string[], rows: string[][], startY: number, colWidths: number[]): number {
  let y = startY;
  
  // Header
  doc.setFontSize(8);
  doc.setFillColor(AKURIS_COLORS.primary);
  let x = 20;
  headers.forEach((h, i) => {
    doc.rect(x, y - 5, colWidths[i], 8, 'F');
    x += colWidths[i];
  });
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  x = 20;
  headers.forEach((h, i) => {
    doc.text(h, x + 2, y);
    x += colWidths[i];
  });
  y += 6;
  
  doc.setFont('helvetica', 'normal');
  for (let ri = 0; ri < rows.length; ri++) {
    const row = rows[ri];
    y = checkPageBreak(doc, y);
    
    // Zebra striping
    if (ri % 2 === 0) {
      doc.setFillColor(248, 247, 255);
      x = 20;
      const totalW = colWidths.reduce((a, b) => a + b, 0);
      doc.rect(20, y - 3.5, totalW, 6, 'F');
    }
    
    doc.setFontSize(8);
    doc.setTextColor(AKURIS_COLORS.text);
    x = 20;
    row.forEach((cell, i) => {
      const formatted = formatLabel(cell || '-');
      const lines = doc.splitTextToSize(formatted, colWidths[i] - 4);
      doc.text(lines[0], x + 2, y);
      x += colWidths[i];
    });
    y += 6;
  }
  return y + 5;
}

// ── data fetchers ────────────────────────────────────────────────────
export async function fetchTemplateData(templateBase: string, empresaId: string) {
  switch (templateBase) {
    case 'riscos_geral': return fetchRiscosData(empresaId);
    case 'incidentes_periodo': return fetchIncidentesData(empresaId);
    case 'lgpd_anpd': return fetchLGPDData(empresaId);
    case 'iso27001_auditoria': return fetchISO27001Data(empresaId);
    case 'executivo_trimestral': return fetchExecutivoData(empresaId);
    case 'compliance_geral': return fetchComplianceData(empresaId);
    default: return { sections: [] as Section[] };
  }
}

interface Section { title: string; metrics?: { label: string; value: string | number }[]; tableHeaders?: string[]; tableRows?: string[][]; colWidths?: number[]; }

async function fetchRiscosData(empresaId: string) {
  const { data: riscos } = await supabase.from('riscos').select('*').eq('empresa_id', empresaId);
  const r = riscos || [];
  const riscoIds = r.map(ri => ri.id);
  const { data: tratamentos } = riscoIds.length > 0
    ? await supabase.from('riscos_tratamentos').select('*').in('risco_id', riscoIds)
    : { data: [] };
  const t = tratamentos || [];
  const criticos = r.filter(x => x.nivel_risco_inicial === 'critico').length;
  const altos = r.filter(x => x.nivel_risco_inicial === 'alto').length;
  const medios = r.filter(x => x.nivel_risco_inicial === 'medio').length;
  const baixos = r.filter(x => x.nivel_risco_inicial === 'baixo').length;
  const concluidos = t.filter((x: any) => x.status === 'concluido').length;
  return {
    sections: [
      { title: 'Resumo Executivo', metrics: [
        { label: 'Total de Riscos', value: r.length },
        { label: 'Criticos', value: criticos },
        { label: 'Altos', value: altos },
        { label: 'Medios', value: medios },
        { label: 'Baixos', value: baixos },
        { label: 'Tratamentos Concluidos', value: `${concluidos}/${t.length}` },
      ]},
      { title: 'Detalhamento dos Riscos', tableHeaders: ['Nome', 'Nivel', 'Status', 'Responsavel'],
        tableRows: r.map(x => [x.nome, x.nivel_risco_inicial || '-', x.status || '-', x.responsavel || '-']),
        colWidths: [60, 30, 35, 45] },
    ] as Section[]
  };
}

async function fetchIncidentesData(empresaId: string) {
  const { data: inc } = await supabase.from('incidentes').select('*').eq('empresa_id', empresaId).order('data_deteccao', { ascending: false });
  const i = inc || [];
  const critica = i.filter(x => x.criticidade === 'critica').length;
  const alta = i.filter(x => x.criticidade === 'alta').length;
  const resolvidos = i.filter(x => x.status === 'resolvido').length;
  return {
    sections: [
      { title: 'Resumo de Incidentes', metrics: [
        { label: 'Total de Incidentes', value: i.length },
        { label: 'Gravidade Critica', value: critica },
        { label: 'Gravidade Alta', value: alta },
        { label: 'Resolvidos', value: resolvidos },
      ]},
      { title: 'Lista de Incidentes', tableHeaders: ['Titulo', 'Categoria', 'Criticidade', 'Status'],
        tableRows: i.map(x => [x.titulo, x.categoria || '-', x.criticidade || '-', x.status || '-']),
        colWidths: [60, 35, 35, 40] },
    ] as Section[]
  };
}

async function fetchLGPDData(empresaId: string) {
  const [{ data: dados }, { data: sol }, { data: pol }] = await Promise.all([
    supabase.from('dados_pessoais').select('*').eq('empresa_id', empresaId),
    supabase.from('dados_solicitacoes_titular').select('*').eq('empresa_id', empresaId),
    supabase.from('politicas').select('*').eq('empresa_id', empresaId),
  ]);
  const d = dados || []; const s = sol || []; const p = pol || [];
  return {
    sections: [
      { title: 'Panorama LGPD', metrics: [
        { label: 'Dados Pessoais Mapeados', value: d.length },
        { label: 'Solicitacoes de Titulares', value: s.length },
        { label: 'Politicas Ativas', value: p.filter(x => x.status === 'ativa').length },
      ]},
      { title: 'Dados Pessoais Mapeados', tableHeaders: ['Nome', 'Categoria', 'Base Legal', 'Sensibilidade'],
        tableRows: d.map(x => [x.nome, x.categoria_dados || '-', x.base_legal || '-', x.sensibilidade || '-']),
        colWidths: [50, 35, 45, 40] },
      ...(s.length > 0 ? [{ title: 'Solicitacoes de Titulares', tableHeaders: ['Tipo', 'Status', 'Criado em'],
        tableRows: s.map((x: any) => [x.tipo_solicitacao || '-', x.status || '-', new Date(x.created_at).toLocaleDateString('pt-BR')]),
        colWidths: [60, 50, 60] }] : []),
    ] as Section[]
  };
}

async function fetchISO27001Data(empresaId: string) {
  // Frameworks are global (empresa_id IS NULL), evaluations are per-company
  const [{ data: frameworks }, { data: evaluations }, { data: controles }] = await Promise.all([
    supabase.from('gap_analysis_frameworks').select('id, nome, versao, tipo_framework').ilike('nome', '%ISO%27001%'),
    supabase.from('gap_analysis_evaluations').select('framework_id, conformity_status').eq('empresa_id', empresaId),
    supabase.from('controles').select('*').eq('empresa_id', empresaId),
  ]);
  const f = frameworks || []; const e = evaluations || []; const c = controles || [];
  const ativos = c.filter(x => x.status === 'ativo').length;
  
  // Calculate conformity stats from evaluations
  const isoFrameworkIds = f.map(fw => fw.id);
  const isoEvals = e.filter(ev => isoFrameworkIds.includes(ev.framework_id));
  const conformes = isoEvals.filter(ev => ev.conformity_status === 'conforme').length;
  const parciais = isoEvals.filter(ev => ev.conformity_status === 'parcialmente_conforme').length;
  const naoConformes = isoEvals.filter(ev => ev.conformity_status === 'nao_conforme').length;
  
  return {
    sections: [
      { title: 'Status ISO 27001', metrics: [
        { label: 'Frameworks ISO encontrados', value: f.length },
        { label: 'Requisitos avaliados', value: isoEvals.length },
        { label: 'Conformes', value: conformes },
        { label: 'Parcialmente conformes', value: parciais },
        { label: 'Nao conformes', value: naoConformes },
        { label: 'Total de Controles', value: c.length },
        { label: 'Controles Ativos', value: ativos },
      ]},
      { title: 'Controles Implementados', tableHeaders: ['Nome', 'Tipo', 'Criticidade', 'Status'],
        tableRows: c.map(x => [x.nome, x.tipo || '-', x.criticidade || '-', x.status || '-']),
        colWidths: [55, 30, 40, 45] },
    ] as Section[]
  };
}

async function fetchExecutivoData(empresaId: string) {
  const ninetyDaysAgo = new Date(); ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const { data: riscos } = await supabase.from('riscos').select('*').eq('empresa_id', empresaId);
  const { data: incidentes } = await (supabase.from('incidentes').select('*').eq('empresa_id', empresaId).gte('data_deteccao', ninetyDaysAgo.toISOString()) as any);
  const { data: controles } = await supabase.from('controles').select('*').eq('empresa_id', empresaId);
  const { data: frameworks } = await (supabase.from('gap_analysis_frameworks').select('id, nome').eq('ativo', true) as any);
  const r = riscos || []; const i = incidentes || []; const c = controles || []; const f = frameworks || [];
  return {
    sections: [
      { title: 'Resumo Executivo - Ultimos 90 dias', metrics: [
        { label: 'Riscos Ativos', value: r.length },
        { label: 'Riscos Criticos', value: r.filter(x => x.nivel_risco_inicial === 'critico').length },
        { label: 'Incidentes (90 dias)', value: i.length },
        { label: 'Controles Ativos', value: c.filter(x => x.status === 'ativo').length },
        { label: 'Frameworks Monitorados', value: f.length },
      ]},
      { title: 'Incidentes Recentes', tableHeaders: ['Titulo', 'Gravidade', 'Status'],
        tableRows: i.slice(0, 15).map(x => [x.titulo, x.criticidade || '-', x.status || '-']),
        colWidths: [80, 45, 45] },
    ] as Section[]
  };
}

async function fetchComplianceData(empresaId: string) {
  const { data: frameworks } = await (supabase.from('gap_analysis_frameworks').select('id, nome, versao, tipo_framework').eq('ativo', true) as any);
  const { data: controles } = await supabase.from('controles').select('*').eq('empresa_id', empresaId);
  const { data: politicas } = await supabase.from('politicas').select('*').eq('empresa_id', empresaId);
  const { data: auditorias } = await supabase.from('auditorias').select('*').eq('empresa_id', empresaId);
  const f = (frameworks || []) as any[]; const c = controles || []; const p = politicas || []; const a = auditorias || [];
  return {
    sections: [
      { title: 'Status Geral de Compliance', metrics: [
        { label: 'Frameworks', value: f.length },
        { label: 'Controles', value: c.length },
        { label: 'Controles Ativos', value: c.filter(x => x.status === 'ativo').length },
        { label: 'Politicas', value: p.length },
        { label: 'Auditorias', value: a.length },
      ]},
      { title: 'Frameworks', tableHeaders: ['Nome', 'Versao', 'Tipo'],
        tableRows: f.map(x => [x.nome, x.versao || '-', x.tipo_framework || '-']),
        colWidths: [80, 40, 50] },
      { title: 'Auditorias', tableHeaders: ['Nome', 'Tipo', 'Status'],
        tableRows: a.map((x: any) => [x.nome || x.titulo || '-', x.tipo || '-', x.status || '-']),
        colWidths: [80, 40, 50] },
    ] as Section[]
  };
}

// ── PDF generator ────────────────────────────────────────────────────
export async function generateTemplatePDF(relatorio: any, empresaId: string) {
  const doc = new jsPDF();
  const templateBase = relatorio.template_base;
  const data = await fetchTemplateData(templateBase, empresaId);
  const logo = await loadAkurisLogo();

  // Cover
  addAkurisCover(doc, logo, relatorio.nome, relatorio.descricao || '', {
    data: new Date().toLocaleDateString('pt-BR')
  });

  // Sections
  for (const section of data.sections) {
    doc.addPage();
    let y = 25;
    y = addSectionTitleLocal(doc, section.title, y);

    if (section.metrics) {
      for (const m of section.metrics) {
        y = checkPageBreak(doc, y);
        y = addMetricRow(doc, m.label, m.value, y);
      }
      y += 5;
    }

    if (section.tableHeaders && section.tableRows && section.colWidths) {
      y = checkPageBreak(doc, y, 60);
      y = addTable(doc, section.tableHeaders, section.tableRows, y, section.colWidths);
    }
  }

  // If no data at all
  if (data.sections.length === 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(AKURIS_COLORS.textLight);
    doc.text('Nenhum dado encontrado para este template.', 105, 140, { align: 'center' });
    doc.text('Verifique se ha dados cadastrados nos modulos correspondentes.', 105, 155, { align: 'center' });
  }

  addAkurisFooter(doc);
  doc.save(`${relatorio.nome.replace(/\s+/g, '_')}.pdf`);
}
