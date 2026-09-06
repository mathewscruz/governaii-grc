import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { authorizedScheduledJob, beginScheduledJob, finishScheduledJob, readScheduledRows, utcDay } from '../../supabase/functions/_shared/scheduled-job';
import { sendIdempotentEmail } from '../../supabase/functions/_shared/idempotent-email';

afterEach(() => vi.unstubAllGlobals());
const token = 'a'.repeat(64);
const bearer = (value: string) => new Request('https://example.test', { headers: { Authorization: value } });

describe('scheduled worker authorization', () => {
  it('accepts only a complete scoped or service token', () => {
    expect(authorizedScheduledJob(bearer(`Bearer ${token}`), token)).toBe(true);
    expect(authorizedScheduledJob(bearer(`Bearer ${token}`), 'b'.repeat(64), token)).toBe(true);
    for (const invalid of ['', token, `Bearer ${token} extra`, `Bearer ${token.slice(1)}`]) {
      expect(authorizedScheduledJob(bearer(invalid), token)).toBe(false);
    }
  });
  it('does not reuse reminder credentials for deletion or accept an empty secret', () => {
    expect(authorizedScheduledJob(bearer(`Bearer ${token}`), 'b'.repeat(64))).toBe(false);
    expect(authorizedScheduledJob(bearer('Bearer anything'))).toBe(false);
  });
  it('uses the scheduler UTC day', () => {
    expect(utcDay(new Date('2026-09-05T23:30:00-03:00'))).toBe('2026-09-06');
  });
});

describe('job results and pagination', () => {
  it('honors an existing daily reservation and propagates storage errors', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    await expect(beginScheduledJob({ rpc }, 'lembretes-diarios')).resolves.toBeNull();
    rpc.mockResolvedValue({ data: null, error: new Error('database unavailable') });
    await expect(beginScheduledJob({ rpc }, 'lembretes-diarios')).rejects.toThrow('database unavailable');
  });
  it('does not report completion when the result could not be recorded', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: false, error: null });
    await expect(finishScheduledJob({ rpc }, 'run', true, {})).rejects.toThrow();
  });
  it('reads past the first page without silently dropping companies or reminders', async () => {
    const query = vi.fn().mockResolvedValueOnce({ data: Array.from({ length: 500 }, (_, id) => id), error: null })
      .mockResolvedValueOnce({ data: [500], error: null });
    expect(await readScheduledRows(query)).toHaveLength(501);
    expect(query.mock.calls).toEqual([[0, 499], [500, 999]]);
  });
});

describe('idempotent reminder delivery', () => {
  const email = { from: 'Akuris <test@example.test>', to: ['recipient@example.test'], subject: 'Test', html: '<p>Test</p>', text: 'Test' };
  it('passes a stable provider key without exposing it in the email body', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'email-id' }), { status: 200 }));
    vi.stubGlobal('fetch', fetcher);
    await expect(sendIdempotentEmail(email, 'reminder/test/1', 'test-api-key')).resolves.toEqual({ id: 'email-id' });
    expect(fetcher.mock.calls[0][1].headers['Idempotency-Key']).toBe('reminder/test/1');
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual(email);
  });
  it('treats a provider rejection or an absent delivery ID as failure', async () => {
    for (const response of [new Response('{}', { status: 200 }), new Response('{}', { status: 429 })]) {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
      await expect(sendIdempotentEmail(email, 'reminder/test/1', 'test-api-key')).rejects.toThrow('rejected delivery');
    }
  });
});

describe('scheduled maintenance migration contracts', () => {
  const sql = readFileSync('supabase/migrations/20260906020000_rotinas_lembretes_expurgo.sql', 'utf8');
  it('stores no secret literal in the cron command and never runs a purge during migration', () => {
    expect(sql).toContain("$cron$SELECT public.executar_rotina_agendada('lembretes-diarios');$cron$");
    expect(sql).toContain("$cron$SELECT public.executar_rotina_agendada('expurgar-denuncias');$cron$");
    expect(sql).not.toContain('format(');
    expect(sql).not.toContain('DELETE FROM public.denuncias');
    expect(sql).toContain('FROM PUBLIC, anon, authenticated');
    expect(sql).toContain('ENABLE ROW LEVEL SECURITY');
  });
  it('keeps deletion eligibility tied to closure and each company retention period', () => {
    expect(sql).toContain("d.status IN ('resolvida', 'arquivada')");
    expect(sql).toContain('d.data_conclusao IS NOT NULL');
    expect(sql).toContain('make_interval(months => c.retencao_meses)');
    expect(sql).toContain('UNIQUE (rotina, dia)');
    expect(sql).toContain("rotinas_agendadas_execucoes.status = 'falhou'");
  });
  it('resets logo links without deleting files or changing existing documents', () => {
    const logos = readFileSync('supabase/migrations/20260906021000_repor_logotipos_padrao_akuris.sql', 'utf8');
    expect(logos).toContain('UPDATE public.empresas SET logo_url = NULL');
    expect(logos).toContain('UPDATE public.denuncias_configuracoes SET logo_url = NULL');
    expect(logos).not.toMatch(/DELETE|storage.objects|UPDATE public.documentos/);
    const brand = readFileSync('src/components/denuncia/CanalBrand.tsx', 'utf8');
    expect(brand).toContain("@/assets/akuris-logo-light.png");
  });
});
