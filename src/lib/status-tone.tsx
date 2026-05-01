import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  PauseCircle,
  XCircle,
  Eye,
  ShieldCheck,
  FileSearch,
  Activity,
  CircleDot,
} from 'lucide-react';
import type { StatusTone, StatusIntensity } from '@/components/ui/status-badge';

export interface ToneResult {
  tone: StatusTone;
  intensity?: StatusIntensity;
  icon?: React.ReactNode;
}

/** Normaliza string (remove acentos + lowercase + trim). */
const norm = (raw?: string | null): string =>
  (raw ?? '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const ICON_PROPS = { strokeWidth: 1.5, className: 'h-3 w-3' };

// ─────────────────────────────────────────────────────────────────────────────
// Riscos: status ciclo de vida
// ─────────────────────────────────────────────────────────────────────────────
export const resolveRiscoStatusTone = (raw?: string | null): ToneResult => {
  const v = norm(raw);
  switch (v) {
    case 'identificado':
      return { tone: 'neutral', icon: <CircleDot {...ICON_PROPS} /> };
    case 'analisado':
    case 'em analise':
    case 'em_analise':
      return { tone: 'info', icon: <FileSearch {...ICON_PROPS} /> };
    case 'tratado':
      return { tone: 'success', icon: <CheckCircle2 {...ICON_PROPS} /> };
    case 'monitorado':
      return { tone: 'success', icon: <Eye {...ICON_PROPS} /> };
    case 'aceito':
      return { tone: 'warning', icon: <ShieldCheck {...ICON_PROPS} /> };
    default:
      return { tone: 'neutral' };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Riscos: nível (escala de severidade)
// ─────────────────────────────────────────────────────────────────────────────
export const resolveNivelRiscoTone = (raw?: string | null): ToneResult => {
  const v = norm(raw);
  if (v === 'critico')
    return { tone: 'destructive', intensity: 'high', icon: <AlertTriangle {...ICON_PROPS} /> };
  if (v === 'muito alto') return { tone: 'destructive', intensity: 'high' };
  if (v === 'alto') return { tone: 'destructive' };
  if (v === 'medio') return { tone: 'warning' };
  if (v === 'baixo') return { tone: 'success' };
  if (v === 'muito baixo') return { tone: 'success' };
  if (v === 'nao avaliado' || v === 'nao_avaliado' || v === '') return { tone: 'neutral' };
  return { tone: 'neutral' };
};

// ─────────────────────────────────────────────────────────────────────────────
// Tratamentos: tipo (categoria funcional)
// ─────────────────────────────────────────────────────────────────────────────
export const resolveTratamentoTipoTone = (raw?: string | null): ToneResult => {
  const v = norm(raw);
  switch (v) {
    case 'mitigar':
      return { tone: 'info' };
    case 'transferir':
      return { tone: 'primary' };
    case 'aceitar':
      return { tone: 'warning' };
    case 'evitar':
      return { tone: 'success' };
    default:
      return { tone: 'neutral' };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Tratamentos: status (ciclo de execução)
// ─────────────────────────────────────────────────────────────────────────────
export const resolveTratamentoStatusTone = (raw?: string | null): ToneResult => {
  const v = norm(raw);
  switch (v) {
    case 'pendente':
      return { tone: 'neutral', icon: <Clock {...ICON_PROPS} /> };
    case 'em andamento':
    case 'em_andamento':
      return { tone: 'info', icon: <Activity {...ICON_PROPS} /> };
    case 'concluido':
      return { tone: 'success', icon: <CheckCircle2 {...ICON_PROPS} /> };
    case 'cancelado':
      return { tone: 'destructive', icon: <XCircle {...ICON_PROPS} /> };
    default:
      return { tone: 'neutral' };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Due Diligence: status do assessment
// ─────────────────────────────────────────────────────────────────────────────
export const resolveDueDiligenceStatusTone = (raw?: string | null): ToneResult => {
  const v = norm(raw);
  switch (v) {
    case 'pendente':
      return { tone: 'neutral', icon: <Clock {...ICON_PROPS} /> };
    case 'ativo':
    case 'em andamento':
    case 'em_andamento':
      return { tone: 'info', icon: <Activity {...ICON_PROPS} /> };
    case 'concluido':
      return { tone: 'success', icon: <CheckCircle2 {...ICON_PROPS} /> };
    case 'expirado':
      return { tone: 'destructive', icon: <XCircle {...ICON_PROPS} /> };
    case 'pausado':
      return { tone: 'warning', icon: <PauseCircle {...ICON_PROPS} /> };
    default:
      return { tone: 'neutral' };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Aprovação (Aprovado / Rejeitado / Pendente)
// ─────────────────────────────────────────────────────────────────────────────
export const resolveAprovacaoTone = (raw?: string | null): ToneResult => {
  const v = norm(raw);
  switch (v) {
    case 'aprovado':
      return { tone: 'success', icon: <CheckCircle2 {...ICON_PROPS} /> };
    case 'rejeitado':
      return { tone: 'destructive', icon: <XCircle {...ICON_PROPS} /> };
    case 'pendente':
      return { tone: 'warning', icon: <Clock {...ICON_PROPS} /> };
    default:
      return { tone: 'neutral' };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Revisão por dias (vencida, próxima, ok)
// ─────────────────────────────────────────────────────────────────────────────
export const resolveRevisaoTone = (diasParaRevisao: number): ToneResult => {
  if (diasParaRevisao < 0) return { tone: 'destructive', icon: <AlertTriangle {...ICON_PROPS} /> };
  if (diasParaRevisao <= 7) return { tone: 'warning', icon: <Clock {...ICON_PROPS} /> };
  if (diasParaRevisao <= 30) return { tone: 'info' };
  return { tone: 'success' };
};

// ─────────────────────────────────────────────────────────────────────────────
// Severidade (vulnerabilidades, incidentes)
// ─────────────────────────────────────────────────────────────────────────────
export const resolveSeveridadeTone = (raw?: string | null): ToneResult => {
  const v = norm(raw);
  if (v === 'critica' || v === 'critico')
    return { tone: 'destructive', intensity: 'high', icon: <AlertTriangle {...ICON_PROPS} /> };
  if (v === 'alta' || v === 'alto') return { tone: 'destructive' };
  if (v === 'media' || v === 'medio') return { tone: 'warning' };
  if (v === 'baixa' || v === 'baixo') return { tone: 'success' };
  if (v === 'informativa' || v === 'info') return { tone: 'info' };
  return { tone: 'neutral' };
};

// ─────────────────────────────────────────────────────────────────────────────
// Controles: status (ativo, inativo, em_revisao, descontinuado)
// ─────────────────────────────────────────────────────────────────────────────
export const resolveControleStatusTone = (raw?: string | null): ToneResult => {
  const v = norm(raw);
  switch (v) {
    case 'ativo':
      return { tone: 'success', icon: <CheckCircle2 {...ICON_PROPS} /> };
    case 'inativo':
      return { tone: 'neutral' };
    case 'em revisao':
    case 'em_revisao':
      return { tone: 'warning', icon: <FileSearch {...ICON_PROPS} /> };
    case 'descontinuado':
      return { tone: 'destructive', icon: <XCircle {...ICON_PROPS} /> };
    default:
      return { tone: 'neutral' };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Criticidade (controles, ativos)
// ─────────────────────────────────────────────────────────────────────────────
export const resolveCriticidadeTone = (raw?: string | null): ToneResult => {
  const v = norm(raw);
  if (v === 'critico' || v === 'critica')
    return { tone: 'destructive', intensity: 'high', icon: <AlertTriangle {...ICON_PROPS} /> };
  if (v === 'alto' || v === 'alta') return { tone: 'destructive' };
  if (v === 'medio' || v === 'media') return { tone: 'warning' };
  if (v === 'baixo' || v === 'baixa') return { tone: 'success' };
  return { tone: 'neutral' };
};

// ─────────────────────────────────────────────────────────────────────────────
// Auditoria: status do item (pendente, em_andamento, concluido, nao_aplicavel)
// ─────────────────────────────────────────────────────────────────────────────
export const resolveItemAuditoriaStatusTone = (raw?: string | null): ToneResult => {
  const v = norm(raw);
  switch (v) {
    case 'pendente':
      return { tone: 'neutral', icon: <Clock {...ICON_PROPS} /> };
    case 'em andamento':
    case 'em_andamento':
      return { tone: 'info', icon: <Activity {...ICON_PROPS} /> };
    case 'concluido':
      return { tone: 'success', icon: <CheckCircle2 {...ICON_PROPS} /> };
    case 'nao aplicavel':
    case 'nao_aplicavel':
      return { tone: 'neutral' };
    default:
      return { tone: 'neutral' };
  }
};

// Alias semântico — Prioridade (alta/media/baixa)
export const resolvePrioridadeTone = resolveCriticidadeTone;

// ─────────────────────────────────────────────────────────────────────────────
// Contratos: status de marco (pendente, concluido, atrasado, cancelado)
// ─────────────────────────────────────────────────────────────────────────────
export const resolveMarcoStatusTone = (raw?: string | null): ToneResult => {
  const v = norm(raw);
  switch (v) {
    case 'pendente':
      return { tone: 'warning', icon: <Clock {...ICON_PROPS} /> };
    case 'concluido':
      return { tone: 'success', icon: <CheckCircle2 {...ICON_PROPS} /> };
    case 'atrasado':
      return { tone: 'destructive', intensity: 'high', icon: <AlertTriangle {...ICON_PROPS} /> };
    case 'cancelado':
      return { tone: 'neutral', icon: <XCircle {...ICON_PROPS} /> };
    default:
      return { tone: 'neutral' };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Contratos: tipo de marco (categoria — tons distintos sem alarme)
// ─────────────────────────────────────────────────────────────────────────────
export const resolveMarcoTipoTone = (raw?: string | null): ToneResult => {
  const v = norm(raw);
  switch (v) {
    case 'vencimento':
      return { tone: 'destructive' };
    case 'renovacao':
      return { tone: 'info' };
    case 'pagamento':
      return { tone: 'success' };
    case 'entrega':
      return { tone: 'primary' };
    case 'revisao':
      return { tone: 'warning' };
    default:
      return { tone: 'neutral' };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Gap Analysis: status de conformidade
// ─────────────────────────────────────────────────────────────────────────────
export const resolveConformityTone = (raw?: string | null): ToneResult => {
  const v = norm(raw);
  switch (v) {
    case 'conforme':
      return { tone: 'success', icon: <CheckCircle2 {...ICON_PROPS} /> };
    case 'parcial':
      return { tone: 'warning' };
    case 'nao conforme':
    case 'nao_conforme':
      return { tone: 'destructive', icon: <XCircle {...ICON_PROPS} /> };
    case 'nao aplicavel':
    case 'nao_aplicavel':
      return { tone: 'neutral' };
    case 'nao avaliado':
    case 'nao_avaliado':
      return { tone: 'neutral' };
    default:
      return { tone: 'neutral' };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Estado ativo/inativo (boolean)
// ─────────────────────────────────────────────────────────────────────────────
export const resolveAtivoTone = (ativo?: boolean | null): ToneResult => {
  if (ativo) return { tone: 'success', icon: <CheckCircle2 {...ICON_PROPS} /> };
  return { tone: 'neutral' };
};

// ─────────────────────────────────────────────────────────────────────────────
// Acessos privilegiados: tipo de acesso (leitura, escrita, admin, completo)
// ─────────────────────────────────────────────────────────────────────────────
export const resolveTipoAcessoTone = (raw?: string | null): ToneResult => {
  const v = norm(raw);
  switch (v) {
    case 'leitura':
      return { tone: 'info' };
    case 'escrita':
      return { tone: 'success' };
    case 'admin':
      return { tone: 'warning', icon: <ShieldCheck {...ICON_PROPS} /> };
    case 'completo':
      return { tone: 'destructive', intensity: 'high', icon: <AlertTriangle {...ICON_PROPS} /> };
    default:
      return { tone: 'neutral' };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Documentos: tipo de vinculação (categoria semântica)
// ─────────────────────────────────────────────────────────────────────────────
export const resolveTipoVinculacaoTone = (raw?: string | null): ToneResult => {
  const v = norm(raw);
  switch (v) {
    case 'relacionado':
      return { tone: 'info' };
    case 'evidencia':
      return { tone: 'success' };
    case 'suporte':
      return { tone: 'warning' };
    case 'implementacao':
      return { tone: 'primary' };
    case 'aprovacao':
      return { tone: 'destructive' };
    case 'revisao':
      return { tone: 'neutral' };
    default:
      return { tone: 'neutral' };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Genérico (fallback heurístico para qualquer status snake_case)
// ─────────────────────────────────────────────────────────────────────────────
export const resolveGenericTone = (raw?: string | null): ToneResult => {
  const v = norm(raw);
  if (!v) return { tone: 'neutral' };

  // Negativos
  if (
    /(critic|expir|rejeit|cancel|reprov|venci|falh|err|inativ|bloqued|bloque)/.test(v)
  )
    return { tone: 'destructive' };

  // Atenção
  if (/(pendent|atras|alta|alto|atenc|aceit|aguard|revis|risco)/.test(v))
    return { tone: 'warning' };

  // Em curso
  if (/(andament|process|analis|ativ|abert|nov|em_)/.test(v))
    return { tone: 'info' };

  // Positivos
  if (
    /(conclu|aprov|tratad|monitor|fechad|resolv|finaliz|sucess|valid|ok|ativ_ok)/.test(v)
  )
    return { tone: 'success' };

  // Categoria/tipo neutro
  if (/(rascunh|identific|nao_avaliad)/.test(v)) return { tone: 'neutral' };

  return { tone: 'neutral' };
};
