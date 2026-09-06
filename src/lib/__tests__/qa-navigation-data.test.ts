import { describe, expect, it, vi } from 'vitest';
import { paginationPages } from '../pagination';
import { matchesSearch } from '../search-utils';
import { loadAccessInfo, userAccessState } from '../user-access-info';

describe('QA — paginação sem páginas repetidas', () => {
  it.each([[1, [1, 2, 3, 4, 5]], [5, [3, 4, 5, 6, 7]], [9, [6, 7, 8, 9, 10]], [10, [6, 7, 8, 9, 10]]])('janela na página %s', (page, expected) => {
    expect(paginationPages(page as number, 10)).toEqual(expected);
  });
  it('limita os índices e lida com lista vazia ou pequena', () => {
    expect(paginationPages(10, 0)).toEqual([]);
    expect(paginationPages(100, 3)).toEqual([1, 2, 3]);
    expect(paginationPages(-5, 10)).toEqual([1, 2, 3, 4, 5]);
    expect(paginationPages(1, Infinity)).toEqual([]);
  });
});

describe('QA — busca consistente', () => {
  it('encontra nomes com acentos, espaços extras e campos ausentes', () => {
    expect(matchesSearch('  TECNICO  ', 'Suporte Técnico', null, undefined)).toBe(true);
    expect(matchesSearch('suporte fornecedor', 'Suporte Técnico', 'Fornecedor A')).toBe(true);
    expect(matchesSearch('outro', null, undefined)).toBe(false);
    expect(matchesSearch(' ', null)).toBe(true);
  });
  it('encontra códigos e não remove outros termos da consulta', () => {
    expect(matchesSearch('CTRL-0006 acessos', 'CTRL-0006', 'Gestão de Acessos')).toBe(true);
    expect(matchesSearch('CTRL-0006 backup', 'CTRL-0006', 'Gestão de Acessos')).toBe(false);
  });
});

describe('QA — informações de acesso', () => {
  const record = { user_id: 'a', last_sign_in_at: null, first_access_pending: false };
  it('nunca confunde pendência ou indisponibilidade com ausência de acesso', () => {
    expect(userAccessState(undefined, true, false)).toBe('loading');
    expect(userAccessState(undefined, false, false)).toBe('unavailable');
    expect(userAccessState(record, false, true)).toBe('unavailable');
    expect(userAccessState(record, false, false)).toBe('never');
    expect(userAccessState({ ...record, first_access_pending: true }, false, false)).toBe('pending');
    expect(userAccessState({ ...record, last_sign_in_at: '2026-09-01' }, false, false)).toBe('used');
  });
  it('consulta mais de 250 usuários em lotes sem truncar, duplicar ou aceitar IDs externos', async () => {
    const ids = Array.from({ length: 602 }, (_, i) => String(i));
    const fetchBatch = vi.fn(async (batch: string[]) => [...batch.map(user_id => ({ ...record, user_id })), { ...record, user_id: 'external' }]);
    const result = await loadAccessInfo([...ids, '1', ''], fetchBatch);
    expect(fetchBatch.mock.calls.map(([batch]) => batch.length)).toEqual([250, 250, 102]);
    expect(result.size).toBe(602);
    expect(result.has('601')).toBe(true);
    expect(result.has('external')).toBe(false);
  });
  it('não inventa registros ausentes e propaga erros', async () => {
    expect((await loadAccessInfo(['a', 'b'], async () => [record])).has('b')).toBe(false);
    const empty = vi.fn();
    expect((await loadAccessInfo([], empty)).size).toBe(0);
    expect(empty).not.toHaveBeenCalled();
    await expect(loadAccessInfo(['a'], async () => { throw new Error('offline'); })).rejects.toThrow('offline');
  });
});
