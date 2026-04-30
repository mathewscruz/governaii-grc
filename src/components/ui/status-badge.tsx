import React from 'react';
import { cn } from '@/lib/utils';

export type StatusTone =
  | 'success'
  | 'warning'
  | 'destructive'
  | 'info'
  | 'neutral'
  | 'primary';

interface StatusBadgeProps {
  tone?: StatusTone;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  variant?: 'soft' | 'solid' | 'outline';
}

const TONE_CLASSES: Record<StatusTone, { soft: string; solid: string; outline: string; dot: string }> = {
  success: {
    soft: 'bg-success/10 text-success border-success/20',
    solid: 'bg-success text-success-foreground border-transparent',
    outline: 'border-success/40 text-success bg-transparent',
    dot: 'bg-success',
  },
  warning: {
    soft: 'bg-warning/10 text-warning border-warning/25',
    solid: 'bg-warning text-warning-foreground border-transparent',
    outline: 'border-warning/40 text-warning bg-transparent',
    dot: 'bg-warning',
  },
  destructive: {
    soft: 'bg-destructive/10 text-destructive border-destructive/20',
    solid: 'bg-destructive text-destructive-foreground border-transparent',
    outline: 'border-destructive/40 text-destructive bg-transparent',
    dot: 'bg-destructive',
  },
  info: {
    soft: 'bg-info/10 text-info border-info/20',
    solid: 'bg-info text-info-foreground border-transparent',
    outline: 'border-info/40 text-info bg-transparent',
    dot: 'bg-info',
  },
  neutral: {
    soft: 'bg-muted text-muted-foreground border-border',
    solid: 'bg-muted-foreground text-background border-transparent',
    outline: 'border-border text-muted-foreground bg-transparent',
    dot: 'bg-muted-foreground',
  },
  primary: {
    soft: 'bg-primary/10 text-primary border-primary/20',
    solid: 'bg-primary text-primary-foreground border-transparent',
    outline: 'border-primary/40 text-primary bg-transparent',
    dot: 'bg-primary',
  },
};

/**
 * Pílula de status padronizada — substitui badges ad-hoc nos módulos.
 * Variantes: soft (default), solid, outline. Sempre com dot para reforçar leitura.
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  tone = 'neutral',
  children,
  icon,
  className,
  variant = 'soft',
}) => {
  const styles = TONE_CLASSES[tone];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap',
        styles[variant],
        className
      )}
    >
      {icon ? (
        <span className="flex items-center">{icon}</span>
      ) : (
        <span className={cn('h-1.5 w-1.5 rounded-full', styles.dot)} aria-hidden="true" />
      )}
      {children}
    </span>
  );
};

export default StatusBadge;
