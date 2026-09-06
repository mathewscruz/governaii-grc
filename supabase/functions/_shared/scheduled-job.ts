/** Each cron has its own token; a reminder token cannot authorize deletion. */
export function authorizedScheduledJob(req: Request, scopedSecret?: string, serviceSecret?: string): boolean {
  const match = req.headers.get('Authorization')?.match(/^Bearer ([^\s]+)$/);
  if (!match) return false;
  return [scopedSecret, serviceSecret].some(expected => {
    if (!expected || expected.length < 32 || expected.length !== match[1].length) return false;
    let difference = 0;
    for (let i = 0; i < expected.length; i++) difference |= expected.charCodeAt(i) ^ match[1].charCodeAt(i);
    return difference === 0;
  });
}

export const utcDay = (date = new Date()) => date.toISOString().slice(0, 10);

// Structural type keeps the worker compatible with the existing Supabase SDK versions.
type JobClient = { rpc: (name: string, args?: Record<string, unknown>) => PromiseLike<{ data: any; error: any }> };

export async function beginScheduledJob(client: JobClient, job: string): Promise<string | null> {
  const { data, error } = await client.rpc('iniciar_rotina_agendada', { p_rotina: job });
  if (error) throw error;
  return data;
}

export async function finishScheduledJob(client: JobClient, id: string, success: boolean, summary: Record<string, unknown>) {
  const { data, error } = await client.rpc('finalizar_rotina_agendada', {
    p_id: id, p_sucesso: success, p_resumo: summary,
  });
  if (error || data !== true) throw error || new Error('Unable to record scheduled job result');
}

export async function readScheduledRows<T>(queryPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await queryPage(offset, offset + 499);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < 500) return rows;
  }
}
