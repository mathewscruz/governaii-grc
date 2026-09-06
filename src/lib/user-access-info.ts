export interface AccessRecord { user_id: string; last_sign_in_at: string | null; first_access_pending: boolean }

export function userAccessState(info: AccessRecord | undefined, loading: boolean, unavailable: boolean) {
  if (loading) return 'loading';
  if (unavailable || !info) return 'unavailable';
  if (info.last_sign_in_at) return 'used';
  return info.first_access_pending ? 'pending' : 'never';
}

/** Respect the endpoint's limit without hiding users beyond the first batch. */
export async function loadAccessInfo<T extends AccessRecord>(
  ids: string[], fetchBatch: (ids: string[]) => Promise<T[]>,
): Promise<Map<string, T>> {
  const unique = [...new Set(ids.filter(Boolean))];
  const records = new Map<string, T>();
  for (let start = 0; start < unique.length; start += 250) {
    const batch = unique.slice(start, start + 250);
    const allowed = new Set(batch);
    const result = await fetchBatch(batch);
    if (!Array.isArray(result)) throw new Error('Invalid access response');
    for (const record of result) if (record && allowed.has(record.user_id)) records.set(record.user_id, record);
  }
  return records;
}
