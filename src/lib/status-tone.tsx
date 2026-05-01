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
