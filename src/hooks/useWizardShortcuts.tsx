import { useEffect } from 'react';

interface UseWizardShortcutsOptions {
  enabled?: boolean;
  onSave?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onClose?: () => void;
}

/**
 * Standard keyboard shortcuts for wizard dialogs.
 * - Ctrl/Cmd + S: save
 * - Ctrl/Cmd + ArrowRight: next tab
 * - Ctrl/Cmd + ArrowLeft: previous tab
 * - Esc: close (handled by Dialog by default; included for custom flows)
 */
export function useWizardShortcuts({
  enabled = true,
  onSave,
  onNext,
  onPrev,
  onClose,
}: UseWizardShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      const meta = e.ctrlKey || e.metaKey;
      const target = e.target as HTMLElement | null;
      const isTextarea = target?.tagName === 'TEXTAREA';

      if (meta && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onSave?.();
        return;
      }

      // Avoid hijacking arrow navigation inside textareas
      if (meta && e.key === 'ArrowRight' && !isTextarea) {
        e.preventDefault();
        onNext?.();
        return;
      }

      if (meta && e.key === 'ArrowLeft' && !isTextarea) {
        e.preventDefault();
        onPrev?.();
        return;
      }

      if (e.key === 'Escape' && onClose) {
        // Let Dialog handle by default; only call custom if provided explicitly
        // (no preventDefault to keep Radix happy)
        onClose();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled, onSave, onNext, onPrev, onClose]);
}
