import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useRef } from 'react';
import { DialogShell } from '../dialog-shell';
import { WizardDialog } from '../wizard-dialog';
import { useWizardShortcuts } from '@/hooks/useWizardShortcuts';

vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
afterEach(cleanup);
const save = () => fireEvent.keyDown(window, { key: 's', ctrlKey: true });

describe('QA — atalhos respeitam os botões e o diálogo ativo', () => {
  it.each([{ submitDisabled: true }, { isSubmitting: true }])('não salva um DialogShell bloqueado %j', props => {
    const submit = vi.fn();
    render(<DialogShell open title="Contrato" onOpenChange={() => {}} onSubmit={submit} {...props}><input aria-label="Nome" /></DialogShell>);
    save();
    expect(submit).not.toHaveBeenCalled();
  });
  it('salva apenas uma vez e ignora repetição da tecla', () => {
    const submit = vi.fn();
    render(<DialogShell open title="Contrato" onOpenChange={() => {}} onSubmit={submit}>Dados</DialogShell>);
    save();
    fireEvent.keyDown(window, { key: 's', metaKey: true, repeat: true });
    expect(submit).toHaveBeenCalledTimes(1);
  });
  it('não salva o formulário atrás da confirmação de descarte', () => {
    const submit = vi.fn();
    render(<DialogShell open isDirty title="Contrato" onOpenChange={() => {}} onSubmit={submit}>Dados</DialogShell>);
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    save();
    expect(submit).not.toHaveBeenCalled();
  });
  it.each([{ submitDisabled: true }, { isSubmitting: true }])('não salva o WizardDialog bloqueado %j', props => {
    const submit = vi.fn();
    render(<WizardDialog open title="Novo item" description="Dados" onOpenChange={() => {}} onSubmit={submit} tabs={[{ id: 'a', label: 'Revisão', content: 'Dados' }]} {...props} />);
    save();
    expect(submit).not.toHaveBeenCalled();
  });
  it('preserva navegação de palavras em campos editáveis', () => {
    const next = vi.fn();
    function Harness() {
      const ref = useRef<HTMLDivElement>(null);
      useWizardShortcuts({ scopeRef: ref, onNext: next });
      return <div role="dialog" data-state="open" ref={ref}><input aria-label="Descrição" /><button>Avançar</button></div>;
    }
    render(<Harness />);
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'ArrowRight', ctrlKey: true });
    expect(next).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowRight', ctrlKey: true });
    expect(next).toHaveBeenCalledTimes(1);
  });
});
