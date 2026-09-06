import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CategoryCoverage } from '../CategoryCoverage';
import { FrameworkHeader } from '../FrameworkHeader';

afterEach(cleanup);
const categories = Array.from({ length: 5 }, (_, index) => ({ categoria: `Categoria ${index}`, score: index * 20, conforme: 1, parcial: 0, nao_conforme: 0, nao_aplicavel: 0, total: 5 }));

describe('visão executiva do framework', () => {
  it('expande as categorias e mantém o acesso aos requisitos', () => {
    const select = vi.fn();
    render(<CategoryCoverage categories={categories} onSelect={select} />);
    expect(screen.queryByText('Categoria 4')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar mais 2' }));
    fireEvent.click(screen.getByRole('button', { name: /Categoria 4/ }));
    expect(select).toHaveBeenCalledWith('Categoria 4');
  });
  it('exclui categorias fora do escopo e não trata sem avaliação como score zero', () => {
    render(<CategoryCoverage categories={[{ ...categories[0], categoria: 'Fora', nao_aplicavel: 5 }, { ...categories[0], categoria: 'Sem resposta', conforme: 0 }]} onSelect={vi.fn()} />);
    expect(screen.queryByText('Fora')).toBeNull();
    expect(screen.getByRole('img', { name: 'Sem resposta: —' })).toBeInTheDocument();
  });
  it('usa a chave original da categoria mesmo quando o rótulo é traduzido', () => {
    const select = vi.fn();
    render(<CategoryCoverage categories={[{ ...categories[0], categoria: 'Technology', filterCategory: 'Tecnologia' }]} onSelect={select} />);
    fireEvent.click(screen.getByRole('button', { name: /Technology/ }));
    expect(select).toHaveBeenCalledWith('Tecnologia');
  });
  it('separa aderência, cobertura e bloqueios com filtros funcionais', () => {
    const filter = vi.fn();
    render(<FrameworkHeader frameworkName="ISO/IEC 27001" overallScore={50} totalRequirements={10}
      conforme={5} parcial={0} naoConforme={2} naoAvaliado={3} naoAplicavel={0} conformesSemProva={2} onFiltrarPorEstado={filter} />);
    expect(screen.getByRole('img', { name: 'Score de aderência: 50%' })).toBeInTheDocument();
    expect(screen.getByRole('meter', { name: 'Cobertura da avaliação' })).toHaveAttribute('aria-valuenow', '70');
    fireEvent.click(screen.getByRole('button', { name: '2 Conformes sem evidência' }));
    expect(filter).toHaveBeenCalledWith('conforme');
    expect(screen.getByText(/A suficiência de cada prova/)).toBeInTheDocument();
  });
});
