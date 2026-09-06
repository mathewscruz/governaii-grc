import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/components/gap-analysis/GenericRequirementsTable.tsx', 'utf8');
describe('QA — estrutura estável dos filtros de requisitos', () => {
  it('não remonta o campo de busca como um novo componente a cada tecla', () => {
    expect(source).not.toContain('<SearchAndFilterBar');
    expect(source.match(/\{renderSearchAndFilterBar\(\)\}/g)).toHaveLength(2);
    expect(source).not.toContain('<PaginationControls');
  });
  it('identifica filtro, seleção por requisito e paginação sem depender dos ícones', () => {
    expect(source).toContain("aria-label={t('gapUi.table.selectRequirement', { code: req.codigo })}");
    expect(source).toContain("aria-label={t('gapUi.table.filterByStatus')}");
    expect(source).toContain("aria-label={t('common.previous')}");
    expect(source).toContain("aria-label={t('common.next')}");
  });
  it('recusa tamanhos e páginas inválidos recebidos por URL', () => {
    expect(source).toContain('[10, 20, 50, 100].includes(size)');
    expect(source).toContain('Number.isSafeInteger(page) && page > 0');
  });
});
