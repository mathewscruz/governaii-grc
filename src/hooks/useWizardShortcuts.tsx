import { useEffect, type RefObject } from 'react';

interface UseWizardShortcutsOptions {
  enabled?: boolean;
  /** Restrict keyboard commands to the frontmost dialog. */
  scopeRef?: RefObject<HTMLElement>;
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
  scopeRef,
  onSave,
  onNext,
  onPrev,
  onClose,
}: UseWizardShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.repeat) return;
      if (scopeRef) {
        const dialogs = document.querySelectorAll('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]');
        const topmost = dialogs[dialogs.length - 1];
        if (!scopeRef.current || (topmost && topmost !== scopeRef.current)) return;
      }
      const meta = e.ctrlKey || e.metaKey;
      const target = e.target as HTMLElement | null;
      const isEditingText = !!target?.closest?.('input, textarea, [contenteditable="true"], [role="textbox"]');

      if (meta && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onSave?.();
        return;
      }

      // Preserve word navigation inside every editable field
      if (meta && e.key === 'ArrowRight' && !isEditingText && onNext) {
        e.preventDefault();
        onNext?.();
        return;
      }

      if (meta && e.key === 'ArrowLeft' && !isEditingText && onPrev) {
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
  }, [enabled, scopeRef, onSave, onNext, onPrev, onClose]);
}
