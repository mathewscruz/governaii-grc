import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Assessment from '@/pages/Assessment';
const mocks = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { functions: { invoke: mocks.invoke } } }));
beforeEach(() => mocks.invoke.mockReset());
afterEach(cleanup);
function mount() {
  render(<MemoryRouter initialEntries={['/assessment/test-token']}><Routes><Route path="/assessment/:token" element={<Assessment />} /></Routes></MemoryRouter>);
}
describe('QA — recuperação do questionário público', () => {
  it('oferece nova tentativa em falha temporária sem gravar respostas', async () => {
    mocks.invoke.mockResolvedValue({ data: null, error: new Error('offline') });
    mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Tentar novamente' }));
    await waitFor(() => expect(mocks.invoke).toHaveBeenCalledTimes(2));
    expect(mocks.invoke.mock.calls.every(([, options]) => options.body.action === 'load')).toBe(true);
    expect(await screen.findByRole('button', { name: 'Tentar novamente' })).toBeEnabled();
  });
  it('não sugere tentativas inúteis quando o servidor confirma link inválido', async () => {
    mocks.invoke.mockResolvedValue({ data: null, error: { context: { clone: () => ({ json: async () => ({ code: 'NOT_FOUND' }) }) } } });
    mount();
    await screen.findByRole('heading');
    expect(screen.queryByRole('button', { name: 'Tentar novamente' })).not.toBeInTheDocument();
  });
});
