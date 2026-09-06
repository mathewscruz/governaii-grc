import { describe, expect, it } from 'vitest';
import { categorySearchParams, sectionForCategory } from '../gap-category-navigation';

const sections = [{ id: 'clauses', filter: (code: string) => !code.startsWith('A.') }, { id: 'annex', filter: (code: string) => code.startsWith('A.') }];
const requirements = [{ codigo: '4.1', categoria: 'Contexto' }, { codigo: 'A.8.1', categoria: 'Tecnologia' }];

describe('navegação por categoria do resumo executivo', () => {
  it('substitui a fase e reinicia a página sem perder os outros filtros', () => {
    const current = new URLSearchParams('fase=escopo&page=4&q=acesso&status=parcial');
    const next = categorySearchParams(current, 'Tecnologia');
    expect(next.get('cat')).toBe('Tecnologia');
    expect(next.has('fase')).toBe(false);
    expect(next.has('page')).toBe(false);
    expect(next.get('q')).toBe('acesso');
    expect(next.get('status')).toBe('parcial');
    expect(current.get('fase')).toBe('escopo');
  });
  it('abre a seção correspondente nos dois sentidos', () => {
    expect(sectionForCategory(sections, requirements, 'Tecnologia', 'clauses')).toBe('annex');
    expect(sectionForCategory(sections, requirements, 'Contexto', 'annex')).toBe('clauses');
  });
  it('preserva a seção válida ou não altera quando não há dados', () => {
    expect(sectionForCategory(sections, requirements, 'Tecnologia', 'annex')).toBe('annex');
    expect(sectionForCategory(sections, [], 'Tecnologia', 'clauses')).toBe('clauses');
    expect(sectionForCategory([], requirements, 'Tecnologia', '')).toBe('');
  });
});
