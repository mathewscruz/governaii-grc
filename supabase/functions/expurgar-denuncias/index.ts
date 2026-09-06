import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { authorizedScheduledJob, beginScheduledJob, finishScheduledJob } from '../_shared/scheduled-job.ts'

const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const authorized = authorizedScheduledJob(req, Deno.env.get('EXPURGO_DENUNCIAS_TOKEN'), serviceKey)
    || authorizedScheduledJob(req, Deno.env.get('DENUNCIA_INTERNAL_SECRET'))
  if (!authorized) return json({ error: 'nao_autorizado' }, 401)
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey!)
  let runId: string | null = null

  try {
    const body = await req.json().catch(() => ({}))
    if (body?.dry_run === true) {
      const { data, error } = await supabase.rpc('prever_expurgo_denuncias')
      if (error) throw error
      return json({ success: true, dry_run: true, ...data })
    }
    runId = await beginScheduledJob(supabase, 'expurgar-denuncias')
    if (!runId) return json({ success: true, skipped: true, reason: 'already_running_or_completed_today' })

    // Preserve the SQL predicate: closed cases, conclusion date and configured retention.
    const { data: deleted, error: deleteError } = await supabase.rpc('expurgar_denuncias_vencidas')
    if (deleteError) throw deleteError
    let removed = 0
    let errors = 0
    // Bounded work; the queue durably retains anything left for another run.
    for (let batch = 0; batch < 5; batch++) {
      const { data: queue, error: queueError } = await supabase.rpc('ficheiros_por_apagar', { p_limite: 200 })
      if (queueError) throw queueError
      const pending = (queue || []) as { id: string; caminho: string }[]
      if (!pending.length) break
      const { error: storageError } = await supabase.storage.from('denuncias-anexos').remove(pending.map(file => file.caminho))
      const { error: confirmError } = await supabase.rpc('confirmar_ficheiros_apagados', {
        p_ids: pending.map(file => file.id), p_erro: storageError ? 'Storage deletion failed; retry required' : null,
      })
      if (confirmError) throw confirmError
      if (storageError) { errors++; break }
      removed += pending.length
    }
    const { data: remaining, error: remainingError } = await supabase.rpc('prever_expurgo_denuncias')
    if (remainingError) throw remainingError
    const success = errors === 0 && Number(remaining?.ficheiros_pendentes || 0) === 0
    const result = { success, denuncias_expurgadas: (deleted || []).reduce((n: number, row: { apagadas: number }) => n + row.apagadas, 0),
      ficheiros_apagados: removed, ficheiros_na_fila: Number(remaining?.ficheiros_pendentes || 0),
      ficheiros_com_falhas: Number(remaining?.ficheiros_com_falhas || 0), total_erros: errors }
    await finishScheduledJob(supabase, runId, success, result)
    return json(result, success ? 200 : 500)
  } catch {
    if (runId) await finishScheduledJob(supabase, runId, false, { error: 'expurgo_failed' })
      .catch(() => console.error('Unable to record retention failure'))
    return json({ success: false, error: 'expurgo_failed' }, 500)
  }
})
