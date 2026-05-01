/**
 * Akuris Design Tokens — Gap Analysis
 * --------------------------------------------------------------------------
 * Fonte única de verdade para cores, classes e variantes do módulo.
 * Sempre usar tokens semânticos (success/warning/destructive/info/muted/primary).
 * Nunca usar cores cruas Tailwind (bg-emerald-500, text-blue-600, etc).
 */

import type { BadgeProps } from '@/components/ui/badge';

export type ConformityStatus = 'conforme' | 'parcial' | 'nao_conforme' | 'nao_aplicavel' | 'nao_avaliado';

type Variant = NonNullable<BadgeProps['variant']>;

/** Variant semântica do Badge para cada status de conformidade */
export const STATUS_BADGE_VARIANT: Record<ConformityStatus, Variant> = {
  conforme: 'success',
  parcial: 'warning',
  nao_conforme: 'destructive',
  nao_aplicavel: 'secondary',
  nao_avaliado: 'outline',
};

/** Label PT-BR canônica para cada status */
export const STATUS_LABEL: Record<ConformityStatus, string> = {
  conforme: 'Conforme',
  parcial: 'Parcial',
  nao_conforme: 'Não Conforme',
  nao_aplicavel: 'N/A',
  nao_avaliado: 'Não Avaliado',
};

/** Classe Tailwind de fundo sólido (para blocos/heatmaps) — usa tokens HSL */
export const STATUS_BG_CLASS: Record<ConformityStatus, string> = {
  conforme: 'bg-success',
  parcial: 'bg-warning',
  nao_conforme: 'bg-destructive',
  nao_aplicavel: 'bg-info',
  nao_avaliado: 'bg-muted-foreground/30',
};

/** Classe Tailwind de texto colorido para o status */
export const STATUS_TEXT_CLASS: Record<ConformityStatus, string> = {
  conforme: 'text-success',
  parcial: 'text-warning',
  nao_conforme: 'text-destructive',
  nao_aplicavel: 'text-info',
  nao_avaliado: 'text-muted-foreground',
};

/** Cor HSL crua do token (para uso em SVG/recharts/inline style) */
export const STATUS_HSL: Record<ConformityStatus, string> = {
  conforme: 'hsl(var(--success))',
  parcial: 'hsl(var(--warning))',
  nao_conforme: 'hsl(var(--destructive))',
  nao_aplicavel: 'hsl(var(--info))',
  nao_avaliado: 'hsl(var(--muted-foreground))',
};

// ---------------------------------------------------------------------------
// Score-based helpers (escala normalizada 0-100)
// ---------------------------------------------------------------------------

export type ScoreVariant = 'success' | 'primary' | 'warning' | 'destructive';

/** Retorna variant para score normalizado 0-100. Limites: 80/60/40. */
export function getScoreVariant(score: number): ScoreVariant {
  if (score >= 80) return 'success';
  if (score >= 60) return 'primary';
  if (score >= 40) return 'warning';
  return 'destructive';
}

/** Retorna variant aceito pelo Badge (mapeia primary → default) */
export function getScoreBadgeVariant(score: number): Variant {
  const v = getScoreVariant(score);
  return v === 'primary' ? 'default' : v;
}

/** Retorna cor HSL crua via token CSS — para SVG/recharts/inline */
export function getScoreHsl(score: number): string {
  switch (getScoreVariant(score)) {
    case 'success': return 'hsl(var(--success))';
    case 'primary': return 'hsl(var(--primary))';
    case 'warning': return 'hsl(var(--warning))';
    case 'destructive': return 'hsl(var(--destructive))';
  }
}

/** Retorna classes Tailwind de texto via token semântico */
export function getScoreTextClass(score: number): string {
  switch (getScoreVariant(score)) {
    case 'success': return 'text-success';
    case 'primary': return 'text-primary';
    case 'warning': return 'text-warning';
    case 'destructive': return 'text-destructive';
  }
}

/** Retorna classes Tailwind de fundo via token semântico */
export function getScoreBgClass(score: number): string {
  switch (getScoreVariant(score)) {
    case 'success': return 'bg-success';
    case 'primary': return 'bg-primary';
    case 'warning': return 'bg-warning';
    case 'destructive': return 'bg-destructive';
  }
}

/** Normaliza um score arbitrário (0-5 ou 0-100) para escala 0-100 */
export function normalizeScore(score: number, scoreType: 'percentage' | 'decimal' | 'scale_0_5'): number {
  if (scoreType === 'percentage') return score;
  return (score / 5) * 100;
}

// ---------------------------------------------------------------------------
// Categorias de framework — tokens neutros + ícone diferenciador
// ---------------------------------------------------------------------------

export type FrameworkCategory = 'seguranca' | 'privacidade' | 'governanca' | 'qualidade';

/** Classes para badge de categoria — tons neutros sobre superfície, sem cores cruas */
export const CATEGORY_BADGE_CLASS: Record<FrameworkCategory, string> = {
  seguranca: 'bg-primary/10 text-primary border-primary/20',
  privacidade: 'bg-info/10 text-info border-info/20',
  governanca: 'bg-accent/30 text-accent-foreground border-accent/40',
  qualidade: 'bg-success/10 text-success border-success/20',
};

export const CATEGORY_LABEL: Record<FrameworkCategory, string> = {
  seguranca: 'Segurança',
  privacidade: 'Privacidade',
  governanca: 'Governança',
  qualidade: 'Qualidade',
};

/** Esforço estimado a partir do nº de requisitos */
export type EffortLevel = 'baixo' | 'medio' | 'alto';

export function getEffortLevel(count: number): { level: EffortLevel; label: string; variant: Variant } {
  if (count <= 30) return { level: 'baixo', label: 'Baixo', variant: 'success' };
  if (count <= 100) return { level: 'medio', label: 'Médio', variant: 'warning' };
  return { level: 'alto', label: 'Alto', variant: 'destructive' };
}
