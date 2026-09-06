import { describe, expect, it, vi } from 'vitest';
import { requestedAuthUsers } from '../../../supabase/functions/_shared/requested-auth-users';

describe('QA — consulta de acesso além do primeiro milhar de usuários', () => {
  const users = Array.from({ length: 1201 }, (_, i) => ({ id: String(i) }));
  it('não omite um usuário após os primeiros 1000', async () => {
    const fetchPage = vi.fn(async (page: number, size: number) => users.slice((page - 1) * size, page * size));
    const result = await requestedAuthUsers(['0', '1200', 'missing', '0'], fetchPage);
    expect(result.map(user => user.id)).toEqual(['0', '1200']);
    expect(fetchPage.mock.calls).toEqual([[1, 1000], [2, 1000]]);
  });
  it('para assim que encontra todos e não consulta sem IDs autorizados', async () => {
    const fetchPage = vi.fn(async () => users.slice(0, 1000));
    expect(await requestedAuthUsers(['2'], fetchPage)).toEqual([{ id: '2' }]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(await requestedAuthUsers([], fetchPage)).toEqual([]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });
  it('propaga falha em uma página posterior sem devolver lista parcialmente confiável', async () => {
    await expect(requestedAuthUsers(['1200'], async page => {
      if (page === 2) throw new Error('Auth offline');
      return users.slice(0, 1000);
    })).rejects.toThrow('Auth offline');
  });
});
