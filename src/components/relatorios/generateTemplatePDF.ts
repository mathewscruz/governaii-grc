import jsPDF from 'jspdf';
import { supabase } from '@/integrations/supabase/client';

// ── helpers ──────────────────────────────────────────────────────────
function addCover(doc: jsPDF, title: string, subtitle: string) {
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 297, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.text(title, 105, 120, { align: 'center' });
  doc.setFontSize(12);
  doc.setTextColor(180, 180, 200);
  doc.text(subtitle, 105, 140, { align: 'center' });
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 105, 160, { align: 'center' });
}

function addPageFooter(doc: jsPDF) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${pages}`, 105, 290, { align: 'center' });
    doc.text('Gerado por Akuris GRC', 195, 290, { align: 'right' });
  }
}

function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFontSize(16);
  doc.setTextColor(60, 60, 100);
  doc.text(title, 20, y);
  doc.setDrawColor(120, 100, 220);
  doc.line(20, y + 2, 190, y + 2);
  return y + 12;
}

function addMetricRow(doc: jsPDF, label: string, value: string | number, y: number): number {
  doc.setFontSize(11);
  doc.setTextColor(80);
  doc.text(label, 25, y);
  doc.setTextColor(30);
  doc.text(String(value), 120, y);
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
  doc.setFontSize(9);
  doc.setTextColor(255);
  doc.setFillColor(60, 60, 100);
  let x = 20;
  headers.forEach((h, i) => {
    doc.rect(x, y - 5, colWidths[i], 8, 'F');
    doc.text(h, x + 2, y);
    x += colWidths[i];
  });
  y += 8;
  doc.setTextColor(40);
  for (const row of rows) {
    y = checkPageBreak(doc, y);
    x = 20;
    row.forEach((cell, i) => {
      const lines = doc.splitTextToSize(cell || '-', colWidths[i] - 4);
      doc.text(lines[0], x + 2, y);
      x += colWidths[i];
    });
    y += 7;
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
  const { data: tratamentos } = await supabase.from('riscos_tratamentos').select('*');
  const r = riscos || [];
  const t = (tratamentos || []).filter((tr: any) => r.some(ri => ri.id === tr.risco_id));
  const criticos = r.filter(x => x.nivel_risco_inicial === 'critico').length;
  const altos = r.filter(x => x.nivel_risco_inicial === 'alto').length;
  const medios = r.filter(x => x.nivel_risco_inicial === 'medio').length;
  const baixos = r.filter(x => x.nivel_risco_inicial === 'baixo').length;
  const concluidos = t.filter((x: any) => x.status === 'concluido').length;
  return {
    sections: [
      { title: 'Resumo Executivo', metrics: [
        { label: 'Total de Riscos', value: r.length },
        { label: 'Críticos', value: criticos },
        { label: 'Altos', value: altos },
        { label: 'Médios', value: medios },
        { label: 'Baixos', value: baixos },
        { label: 'Tratamentos Concluídos', value: `${concluidos}/${t.length}` },
      ]},
      { title: 'Detalhamento dos Riscos', tableHeaders: ['Nome', 'Nível', 'Status', 'Responsável'],
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
        { label: 'Criticidade Crítica', value: critica },
        { label: 'Criticidade Alta', value: alta },
        { label: 'Resolvidos', value: resolvidos },
      ]},
      { title: 'Lista de Incidentes', tableHeaders: ['Título', 'Tipo', 'Criticidade', 'Status'],
        tableRows: i.map(x => [x.titulo, x.tipo_incidente || '-', x.criticidade || '-', x.status || '-']),
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
        { label: 'Solicitações de Titulares', value: s.length },
        { label: 'Políticas Ativas', value: p.filter(x => x.status === 'ativa').length },
      ]},
      { title: 'Dados Pessoais Mapeados', tableHeaders: ['Nome', 'Categoria', 'Base Legal', 'Sensibilidade'],
        tableRows: d.map(x => [x.nome, x.categoria_dados || '-', x.base_legal || '-', x.sensibilidade || '-']),
        colWidths: [50, 35, 45, 40] },
      ...(s.length > 0 ? [{ title: 'Solicitações de Titulares', tableHeaders: ['Tipo', 'Status', 'Criado em'],
        tableRows: s.map((x: any) => [x.tipo_solicitacao || '-', x.status || '-', new Date(x.created_at).toLocaleDateString('pt-BR')]),
        colWidths: [60, 50, 60] }] : []),
    ] as Section[]
  };
}

async function fetchISO27001Data(empresaId: string) {
  const [{ data: frameworks }, { data: controles }] = await Promise.all([
    supabase.from('gap_analysis_frameworks').select('*').eq('empresa_id', empresaId).ilike('nome', '%ISO%27001%'),
    supabase.from('controles').select('*').eq('empresa_id', empresaId),
  ]);
  const f = frameworks || []; const c = controles || [];
  const ativos = c.filter(x => x.status === 'ativo').length;
  return {
    sections: [
      { title: 'Status ISO 27001', metrics: [
        { label: 'Frameworks ISO encontrados', value: f.length },
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
  const [{ data: riscos }, { data: incidentes }, { data: controles }, { data: frameworks }] = await Promise.all([
    supabase.from('riscos').select('*').eq('empresa_id', empresaId),
    supabase.from('incidentes').select('*').eq('empresa_id', empresaId).gte('data_deteccao', ninetyDaysAgo.toISOString()),
    supabase.from('controles').select('*').eq('empresa_id', empresaId),
    supabase.from('gap_analysis_frameworks').select('*').eq('empresa_id', empresaId),
  ]);
  const r = riscos || []; const i = incidentes || []; const c = controles || []; const f = frameworks || [];
  return {
    sections: [
      { title: 'Resumo Executivo - Últimos 90 dias', metrics: [
        { label: 'Riscos Ativos', value: r.length },
        { label: 'Riscos Críticos', value: r.filter(x => x.nivel_risco_inicial === 'critico').length },
        { label: 'Incidentes (90 dias)', value: i.length },
        { label: 'Controles Ativos', value: c.filter(x => x.status === 'ativo').length },
        { label: 'Frameworks Monitorados', value: f.length },
      ]},
      { title: 'Incidentes Recentes', tableHeaders: ['Título', 'Criticidade', 'Status'],
        tableRows: i.slice(0, 15).map(x => [x.titulo, x.criticidade || '-', x.status || '-']),
        colWidths: [80, 45, 45] },
    ] as Section[]
  };
}

async function fetchComplianceData(empresaId: string) {
  const [{ data: frameworks }, { data: controles }, { data: politicas }, { data: auditorias }] = await Promise.all([
    supabase.from('gap_analysis_frameworks').select('*').eq('empresa_id', empresaId),
    supabase.from('controles').select('*').eq('empresa_id', empresaId),
    supabase.from('politicas').select('*').eq('empresa_id', empresaId),
    supabase.from('auditorias').select('*').eq('empresa_id', empresaId),
  ]);
  const f = frameworks || []; const c = controles || []; const p = politicas || []; const a = auditorias || [];
  return {
    sections: [
      { title: 'Status Geral de Compliance', metrics: [
        { label: 'Frameworks', value: f.length },
        { label: 'Controles', value: c.length },
        { label: 'Controles Ativos', value: c.filter(x => x.status === 'ativo').length },
        { label: 'Políticas', value: p.length },
        { label: 'Auditorias', value: a.length },
      ]},
      { title: 'Frameworks', tableHeaders: ['Nome', 'Versão', 'Tipo'],
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

  // Cover
  addCover(doc, relatorio.nome, relatorio.descricao || '');

  // Sections
  for (const section of data.sections) {
    doc.addPage();
    let y = 25;
    y = addSectionTitle(doc, section.title, y);

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
    doc.setTextColor(100);
    doc.text('Nenhum dado encontrado para este template.', 105, 140, { align: 'center' });
    doc.text('Verifique se há dados cadastrados nos módulos correspondentes.', 105, 155, { align: 'center' });
  }

  addPageFooter(doc);
  doc.save(`${relatorio.nome.replace(/\s+/g, '_')}.pdf`);
}
