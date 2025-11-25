export type ScoreType = 'scale_0_5' | 'percentage';
export type ConformityStatus = 'conforme' | 'parcial' | 'nao_conforme' | 'nao_aplicavel' | 'nao_avaliado';

export interface FrameworkConfig {
  id: string;
  name: string;
  scoreType: ScoreType;
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
    filter: (categoria: string | null) => boolean;
  }[];
}

export const FRAMEWORK_CONFIGS: Record<string, FrameworkConfig> = {
  'nist-csf-2.0': {
    id: 'nist-csf-2.0',
    name: 'NIST CSF 2.0',
    scoreType: 'scale_0_5',
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
        filter: (categoria) => categoria !== 'Segurança',
      },
      {
        id: 'anexo-a',
        title: 'Controles do Anexo A',
        filter: (categoria) => categoria === 'Segurança',
      },
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
  
  // Default para outros frameworks (usar modelo percentual)
  return {
    id: 'default',
    name: frameworkName,
    scoreType: 'percentage',
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
