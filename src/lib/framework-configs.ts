export type ScoreType = 'scale_0_5' | 'percentage';
export type ConformityStatus = 'conforme' | 'parcial' | 'nao_conforme' | 'nao_aplicavel' | 'nao_avaliado';

// Mapeamento de pilares NIST para português
export const NIST_PILLAR_NAMES: Record<string, string> = {
  'GOVERN': 'Governar',
  'IDENTIFY': 'Identificar',
  'PROTECT': 'Proteger',
  'DETECT': 'Detectar',
  'RESPOND': 'Responder',
  'RECOVER': 'Recuperar',
};

export interface FrameworkConfig {
  id: string;
  name: string;
  scoreType: ScoreType;
  chartType?: 'radar' | 'funnel' | 'treemap' | 'gauge' | 'stacked';
  pillarField: string;
  scoreLabels: {
    excellent: { label: string; min: number; max: number; color: string };
    good: { label: string; min: number; max: number; color: string };
    regular: { label: string; min: number; max: number; color: string };
    insufficient: { label: string; min: number; max: number; color: string };
    critical: { label: string; min: number; max: number; color: string };
  };
  statusScores: Record<ConformityStatus, number>;
  sections?: {
    id: string;
    title: string;
    filter: (codigo: string | null) => boolean;
  }[];
  domains?: {
    id: string;
    name: string;
    color: string;
  }[];
}

export const FRAMEWORK_CONFIGS: Record<string, FrameworkConfig> = {
  'nist-csf-2.0': {
    id: 'nist-csf-2.0',
    name: 'NIST CSF 2.0',
    scoreType: 'scale_0_5',
    chartType: 'radar',
    pillarField: 'categoria',
    scoreLabels: {
      excellent: { label: 'Excelente', min: 4.5, max: 5.0, color: 'text-green-600' },
      good: { label: 'Bom', min: 3.5, max: 4.4, color: 'text-blue-600' },
      regular: { label: 'Regular', min: 2.5, max: 3.4, color: 'text-yellow-600' },
      insufficient: { label: 'Insuficiente', min: 1.5, max: 2.4, color: 'text-orange-600' },
      critical: { label: 'Crítico', min: 0.0, max: 1.4, color: 'text-red-600' },
    },
    statusScores: {
      conforme: 5.0,
      parcial: 2.5,
      nao_conforme: 0.0,
      nao_aplicavel: 0.0,
      nao_avaliado: 0.0,
    },
  },
  'iso-27001': {
    id: 'iso-27001',
    name: 'ISO 27001:2022',
    scoreType: 'percentage',
    chartType: 'funnel',
    pillarField: 'categoria',
    scoreLabels: {
      excellent: { label: 'Conforme', min: 80, max: 100, color: 'text-green-600' },
      good: { label: 'Parcialmente Conforme', min: 60, max: 79, color: 'text-blue-600' },
      regular: { label: 'Em Implementação', min: 40, max: 59, color: 'text-yellow-600' },
      insufficient: { label: 'Não Conforme', min: 20, max: 39, color: 'text-orange-600' },
      critical: { label: 'Crítico', min: 0, max: 19, color: 'text-red-600' },
    },
    statusScores: {
      conforme: 100,
      parcial: 50,
      nao_conforme: 0,
      nao_aplicavel: 0,
      nao_avaliado: 0,
    },
    sections: [
      {
        id: 'sgsi',
        title: 'Requisitos do SGSI (Cláusulas 4-10)',
        filter: (codigo) => !codigo?.startsWith('A.'),
      },
      {
        id: 'anexo-a',
        title: 'Controles do Anexo A',
        filter: (codigo) => codigo?.startsWith('A.'),
      },
    ],
    domains: [
      { id: 'A.5', name: 'A.5 - Controles Organizacionais', color: '#8b5cf6' },
      { id: 'A.6', name: 'A.6 - Controles de Pessoas', color: '#3b82f6' },
      { id: 'A.7', name: 'A.7 - Controles Físicos', color: '#10b981' },
      { id: 'A.8', name: 'A.8 - Controles Tecnológicos', color: '#f59e0b' },
    ],
  },
};

export function getFrameworkConfig(frameworkName: string, frameworkType?: string): FrameworkConfig | null {
  // Detectar NIST
  if (frameworkName.toLowerCase().includes('nist') || frameworkType?.toLowerCase().includes('nist')) {
    return FRAMEWORK_CONFIGS['nist-csf-2.0'];
  }
  
  // Detectar ISO 27001
  if (frameworkName.toLowerCase().includes('iso') && frameworkName.includes('27001')) {
    return FRAMEWORK_CONFIGS['iso-27001'];
  }
  
  // Detectar frameworks de privacidade (LGPD, GDPR, CCPA, HIPAA, ISO 27701)
  if (frameworkName.toLowerCase().includes('lgpd') || 
      frameworkName.toLowerCase().includes('gdpr') ||
      frameworkName.toLowerCase().includes('ccpa') ||
      frameworkName.toLowerCase().includes('hipaa') ||
      frameworkName.includes('27701')) {
    return {
      id: 'privacy',
      name: frameworkName,
      scoreType: 'percentage',
      chartType: 'treemap',
      pillarField: 'categoria',
      scoreLabels: FRAMEWORK_CONFIGS['iso-27001'].scoreLabels,
      statusScores: FRAMEWORK_CONFIGS['iso-27001'].statusScores,
    };
  }
  
  // Detectar frameworks de governança (COBIT, COSO, ISO 31000)
  if (frameworkName.toLowerCase().includes('cobit') ||
      frameworkName.toLowerCase().includes('coso') ||
      frameworkName.includes('31000')) {
    return {
      id: 'governance',
      name: frameworkName,
      scoreType: 'percentage',
      chartType: 'gauge',
      pillarField: 'categoria',
      scoreLabels: FRAMEWORK_CONFIGS['iso-27001'].scoreLabels,
      statusScores: FRAMEWORK_CONFIGS['iso-27001'].statusScores,
    };
  }
  
  // Detectar frameworks de compliance/audit (SOC 2, SOX, PCI DSS, ITIL)
  if (frameworkName.toLowerCase().includes('soc') ||
      frameworkName.toLowerCase().includes('sox') ||
      frameworkName.toLowerCase().includes('pci') ||
      frameworkName.toLowerCase().includes('itil')) {
    return {
      id: 'compliance',
      name: frameworkName,
      scoreType: 'percentage',
      chartType: 'stacked',
      pillarField: 'categoria',
      scoreLabels: FRAMEWORK_CONFIGS['iso-27001'].scoreLabels,
      statusScores: FRAMEWORK_CONFIGS['iso-27001'].statusScores,
    };
  }
  
  // Detectar CIS Controls (similar ao NIST - usar radar)
  if (frameworkName.toLowerCase().includes('cis')) {
    return {
      id: 'cis',
      name: frameworkName,
      scoreType: 'scale_0_5',
      chartType: 'radar',
      pillarField: 'categoria',
      scoreLabels: FRAMEWORK_CONFIGS['nist-csf-2.0'].scoreLabels,
      statusScores: FRAMEWORK_CONFIGS['nist-csf-2.0'].statusScores,
    };
  }
  
  // Detectar ISOs de gestão (9001, 14001, 20000, 37301) - usar funnel PDCA
  if (frameworkName.toLowerCase().includes('iso') && 
      (frameworkName.includes('9001') || frameworkName.includes('14001') || 
       frameworkName.includes('20000') || frameworkName.includes('37301'))) {
    return {
      id: 'iso-management',
      name: frameworkName,
      scoreType: 'percentage',
      chartType: 'funnel',
      pillarField: 'categoria',
      scoreLabels: FRAMEWORK_CONFIGS['iso-27001'].scoreLabels,
      statusScores: FRAMEWORK_CONFIGS['iso-27001'].statusScores,
    };
  }
  
  // Default para outros frameworks (usar modelo percentual com gauge)
  return {
    id: 'default',
    name: frameworkName,
    scoreType: 'percentage',
    chartType: 'gauge',
    pillarField: 'categoria',
    scoreLabels: {
      excellent: { label: 'Excelente', min: 80, max: 100, color: 'text-green-600' },
      good: { label: 'Bom', min: 60, max: 79, color: 'text-blue-600' },
      regular: { label: 'Regular', min: 40, max: 59, color: 'text-yellow-600' },
      insufficient: { label: 'Insuficiente', min: 20, max: 39, color: 'text-orange-600' },
      critical: { label: 'Crítico', min: 0, max: 19, color: 'text-red-600' },
    },
    statusScores: {
      conforme: 100,
      parcial: 50,
      nao_conforme: 0,
      nao_aplicavel: 0,
      nao_avaliado: 0,
    },
  };
}

export function getScoreLabel(score: number, config: FrameworkConfig): string {
  const labels = config.scoreLabels;
  if (score >= labels.excellent.min) return labels.excellent.label;
  if (score >= labels.good.min) return labels.good.label;
  if (score >= labels.regular.min) return labels.regular.label;
  if (score >= labels.insufficient.min) return labels.insufficient.label;
  return labels.critical.label;
}

export function getScoreColor(score: number, config: FrameworkConfig): string {
  const labels = config.scoreLabels;
  if (score >= labels.excellent.min) return labels.excellent.color;
  if (score >= labels.good.min) return labels.good.color;
  if (score >= labels.regular.min) return labels.regular.color;
  if (score >= labels.insufficient.min) return labels.insufficient.color;
  return labels.critical.color;
}
