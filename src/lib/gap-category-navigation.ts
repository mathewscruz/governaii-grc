/** Category links must replace a phase filter, never silently intersect it. */
export function categorySearchParams(current: URLSearchParams, category: string) {
  const next = new URLSearchParams(current);
  next.set('cat', category);
  next.delete('fase');
  next.delete('page');
  return next;
}

/** Keep a relevant section; otherwise reveal the first section containing the category. */
export function sectionForCategory(
  sections: readonly { id: string; filter: (code: string) => boolean }[],
  requirements: readonly { codigo: string; categoria?: string | null }[],
  category: string,
  current: string,
) {
  const containsCategory = (section: typeof sections[number]) => requirements.some(
    r => section.filter(r.codigo) && (r.categoria || 'Outros') === category,
  );
  if (sections.some(section => section.id === current && containsCategory(section))) return current;
  return sections.find(containsCategory)?.id ?? current;
}
