import * as React from 'react';
import { toast as sonnerToast } from 'sonner';
import { Icon } from '@/components/icons/Icon';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import {
  getModuleMetaByKey,
  type NotificationModuleKey,
} from '@/lib/notification-icons';

export type AkurisToastTone = 'success' | 'warning' | 'destructive' | 'info';

export interface AkurisToastOptions {
  /** Módulo de origem — define o ícone proprietário no chip. */
  module?: NotificationModuleKey;
  /** Tom semântico — define cor do acento e do chip. Default: 'info'. */
  tone?: AkurisToastTone;
  /** Eyebrow opcional acima do título (uppercase, tracking-[0.18em]). */
  eyebrow?: string;
  /** Título principal. */
  title: string;
  /** Texto secundário. */
  description?: string;
  /** Ação opcional (label + onClick). */
  action?: { label: string; onClick: () => void };
  /** Duração em ms. Default 4500. Use Infinity para persistente. */
  duration?: number;
}

const TONE_CLASSES: Record<AkurisToastTone, { accent: string; chipBg: string; chipRing: string; iconText: string }> = {
  success:     { accent: 'bg-success',     chipBg: 'bg-success/10',     chipRing: 'ring-success/20',     iconText: 'text-success' },
  warning:     { accent: 'bg-warning',     chipBg: 'bg-warning/10',     chipRing: 'ring-warning/20',     iconText: 'text-warning' },
  destructive: { accent: 'bg-destructive', chipBg: 'bg-destructive/10', chipRing: 'ring-destructive/20', iconText: 'text-destructive' },
  info:        { accent: 'bg-info',        chipBg: 'bg-info/10',        chipRing: 'ring-info/20',        iconText: 'text-info' },
};

const FALLBACK_TONE_ICON: Record<AkurisToastTone, React.ComponentType<any>> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  destructive: XCircle,
  info: Info,
};

/**
 * akurisToast — Toast com identidade editorial Akuris:
 * - Acento vertical de 2px na cor do tom
 * - Chip 32x32 com ícone proprietário do módulo (ou ícone semântico do tom)
 * - Eyebrow uppercase opcional + título + descrição
 *
 * Compatível com Sonner. Para toasts simples, continue usando `toast.success(...)` etc.
 */
export function akurisToast({
  module,
  tone = 'info',
  eyebrow,
  title,
  description,
  action,
  duration = 4500,
}: AkurisToastOptions) {
  const toneCls = TONE_CLASSES[tone];
  const moduleMeta = module ? getModuleMetaByKey(module) : null;
  const IconComp = moduleMeta?.Icon ?? FALLBACK_TONE_ICON[tone];

  return sonnerToast.custom(
    (id) => (
      <div
        role="status"
        aria-live="polite"
        className="relative w-[360px] max-w-[92vw] overflow-hidden rounded-xl border border-border/60 bg-background/95 backdrop-blur-2xl shadow-[0_12px_32px_-8px_hsl(var(--primary)/0.18)] animate-toast-slide-in"
      >
        {/* Acento vertical 2px */}
        <span
          aria-hidden
          className={`absolute left-0 top-3 bottom-3 w-[2px] rounded-full ${toneCls.accent}`}
        />
        <div className="flex items-start gap-3 pl-4 pr-3 py-3">
          {/* Chip ícone */}
          <span
            aria-hidden
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ${toneCls.chipBg} ${toneCls.chipRing} ${toneCls.iconText}`}
          >
            <IconComp className="h-4 w-4" strokeWidth={1.5} />
          </span>

          {/* Conteúdo */}
          <div className="min-w-0 flex-1">
            {eyebrow && (
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/70 leading-none mb-1">
                {eyebrow}
              </p>
            )}
            <p className="text-[13px] font-semibold text-foreground leading-tight">
              {title}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                {description}
              </p>
            )}
            {action && (
              <button
                type="button"
                onClick={() => {
                  action.onClick();
                  sonnerToast.dismiss(id);
                }}
                className="mt-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                {action.label} →
              </button>
            )}
          </div>

          {/* Fechar */}
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => sonnerToast.dismiss(id)}
            className="shrink-0 -mt-0.5 -mr-1 p-1 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    ),
    { duration }
  );
}

export { Icon };
