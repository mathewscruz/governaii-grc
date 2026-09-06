import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ActionRoadmap, orderRoadmap, type RoadmapItem } from '../ActionRoadmap';

const item = (id: string, extra: Partial<RoadmapItem> = {}): RoadmapItem => ({ id, title: `Plano ${id}`, priority: 'Alta', status: 'Pendente', onOpen: vi.fn(), ...extra });
afterEach(cleanup);

describe('roteiro com prazos reais', () => {
  it('ordena datas sem modificar dados; sem prazo vai ao fim dos abertos', () => {
    const source = [item('sem'), item('feito', { done: true, deadline: '2026-01-01' }), item('depois', { deadline: '2026-10-02' }), item('antes', { deadline: '2026-10-01' })];
    expect(orderRoadmap(source).map(p => p.id)).toEqual(['antes', 'depois', 'sem', 'feito']);
    expect(source[0].deadline).toBeUndefined();
    expect(source[0].id).toBe('sem');
  });
  it('expõe a falta de responsável e prazo e abre o registro correto', () => {
    const plan = item('teste');
    render(<ActionRoadmap items={[plan]} />);
    expect(screen.getByText('Responsável a definir')).toBeInTheDocument();
    expect(screen.getByText('Sem prazo definido')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Abrir plano: Plano teste' }));
    expect(plan.onOpen).toHaveBeenCalledOnce();
  });
  it('pagina sem esconder planos e reinicia ao mudar a seleção', () => {
    const plans = Array.from({ length: 11 }, (_, n) => item(String(n).padStart(2, '0')));
    const { rerender } = render(<ActionRoadmap items={plans} />);
    expect(screen.queryByRole('button', { name: 'Abrir plano: Plano 10' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Próxima' }));
    expect(screen.getByRole('button', { name: 'Abrir plano: Plano 10' })).toBeInTheDocument();
    rerender(<ActionRoadmap items={[plans[0]]} />);
    expect(screen.getByRole('button', { name: 'Abrir plano: Plano 00' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Próxima' })).toBeNull();
  });
  it('não inventa datas nem apresenta plano concluído como atrasado', () => {
    render(<ActionRoadmap items={[item('ok', { done: true, deadline: '2020-01-01' }), item('invalid', { deadline: 'invalida' })]} />);
    expect(screen.queryByText(/Atrasado/)).toBeNull();
    expect(screen.getByText('Sem prazo definido')).toBeInTheDocument();
  });
});
