/** Read Auth pages until all requested IDs are found or the directory ends. */
export async function requestedAuthUsers<T extends { id: string }>(
  ids: string[], fetchPage: (page: number, perPage: number) => Promise<T[]>,
): Promise<T[]> {
  const pending = new Set(ids);
  const found: T[] = [];
  const perPage = 1000;
  for (let page = 1; pending.size; page++) {
    const users = await fetchPage(page, perPage);
    for (const user of users) {
      if (pending.delete(user.id)) found.push(user);
    }
    if (users.length < perPage) break;
  }
  return found;
}
