/** A contiguous, unique window of valid pages, including the active page. */
export function paginationPages(current: number, total: number, windowSize = 5): number[] {
  const count = Math.max(0, Math.floor(total));
  if (!Number.isFinite(count) || !count) return [];
  const size = Math.min(count, Math.max(1, Math.floor(windowSize) || 5));
  const page = Math.max(1, Math.min(count, Math.floor(current) || 1));
  const start = Math.max(1, Math.min(page - Math.floor(size / 2), count - size + 1));
  return Array.from({ length: size }, (_, index) => start + index);
}
