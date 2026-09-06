import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { authorizedScheduledJob, beginScheduledJob, finishScheduledJob, readScheduledRows, utcDay } from '../_shared/scheduled-job.ts'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  if (!authorizedScheduledJob(req, Deno.env.get('LEMBRETES_DIARIOS_TOKEN'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))) {
    return json({ error: 'Unauthorized' }, 401)
  }

  let runId: string | null = null
  try {
    const body = await req.json().catch(() => ({}))
    const dryRun = body?.dry_run === true
    if (!dryRun) {
      runId = await beginScheduledJob(supabase, 'lembretes-diarios')
      if (!runId) return json({ success: true, skipped: true, reason: 'already_running_or_completed_today' })
    }
    const companies = await readScheduledRows<any>((from, to) => supabase
      .from('empresa_reminder_settings')
      .select('empresa_id, due_diligence_expiracao_ativo, due_diligence_expiracao_dias')
      .eq('reminders_enabled', true).order('empresa_id').range(from, to))

    let sent = 0
    let eligible = 0
    let errors = 0
    let notifications = 0
    let processed = 0
    const today = utcDay()
    const endDate = new Date(`${today}T00:00:00Z`)
    endDate.setUTCDate(endDate.getUTCDate() + 7)

    for (const company of companies) {
      // Failure in invitations must not suppress this company's DD/GAP reminders.
      for (const worker of [
        { name: 'process-invitation-reminders', enabled: true, extra: {} },
        { name: 'process-due-diligence-reminders', enabled: company.due_diligence_expiracao_ativo,
          extra: { days_before_expiration: company.due_diligence_expiracao_dias ?? 7 } },
      ]) {
        if (!worker.enabled) continue
        try {
          const { data, error } = await supabase.functions.invoke(worker.name, {
            body: { empresa_id: company.empresa_id, dry_run: dryRun, ...worker.extra },
          })
          if (error || data?.success !== true) throw error || new Error('Worker failed')
          sent += data.sent ?? data.details?.success ?? 0
          eligible += data.eligible ?? data.details?.eligible ?? 0
          errors += data.errors ?? data.details?.errors ?? 0
        } catch {
          errors++
          console.error('Reminder worker failed', worker.name)
        }
      }

      try {
        // Respect the same opt-in for GAP and never search another company's rows.
        const evaluations = await readScheduledRows<any>((from, to) => supabase
          .from('gap_analysis_evaluations')
          .select('id, framework_id, requirement_id, empresa_id, prazo_implementacao, responsavel_avaliacao')
          .eq('empresa_id', company.empresa_id)
          .not('conformity_status', 'in', '(conforme,nao_aplicavel)')
          .lte('prazo_implementacao', utcDay(endDate)).order('id').range(from, to))
        eligible += evaluations.length
        if (!dryRun) for (const evaluation of evaluations) {
          const [{ data: requirement, error: requirementError }, { data: framework, error: frameworkError }] = await Promise.all([
            supabase.from('gap_analysis_requirements').select('codigo,titulo').eq('id', evaluation.requirement_id).maybeSingle(),
            supabase.from('gap_analysis_frameworks').select('nome').eq('id', evaluation.framework_id)
              .or(`empresa_id.is.null,empresa_id.eq.${company.empresa_id}`).maybeSingle(),
          ])
          if (requirementError || frameworkError) throw requirementError || frameworkError
          const users = await readScheduledRows<any>((from, to) => {
            let query = supabase.from('profiles').select('user_id').eq('empresa_id', company.empresa_id).eq('ativo', true)
            query = evaluation.responsavel_avaliacao
              ? query.eq('user_id', evaluation.responsavel_avaliacao)
              : query.in('role', ['admin', 'super_admin'])
            return query.order('user_id').range(from, to)
          })
          const overdue = evaluation.prazo_implementacao < today
          const metadata = { tipo: 'gap_analysis_prazo', evaluation_id: evaluation.id,
            framework_id: evaluation.framework_id, requirement_id: evaluation.requirement_id }
          for (const user of users) {
            const { data: existing, error: existingError } = await supabase.from('notifications').select('id')
              .eq('user_id', user.user_id).contains('metadata', { tipo: metadata.tipo, evaluation_id: evaluation.id })
              .gte('created_at', `${today}T00:00:00Z`).limit(1)
            if (existingError) throw existingError
            if (existing?.length) continue
            const date = evaluation.prazo_implementacao.split('-').reverse().join('/')
            const { error: notificationError } = await supabase.from('notifications').insert({
              user_id: user.user_id,
              title: `${overdue ? 'Prazo vencido' : 'Prazo próximo'}: ${requirement?.codigo || ''} - ${requirement?.titulo || 'Requisito'}`,
              message: `O prazo de implementação do requisito ${requirement?.codigo || ''} (${framework?.nome || 'Framework'}) ${overdue ? 'venceu' : 'vence'} em ${date}.`,
              type: overdue ? 'warning' : 'info', link_to: `/gap-analysis/framework/${evaluation.framework_id}`, metadata,
            })
            if (notificationError) throw notificationError
            notifications++
          }
        }
      } catch {
        errors++
        console.error('GAP deadline reminders failed')
      }
      processed++
    }

    const result = { success: errors === 0, dry_run: dryRun, empresas_com_lembretes: companies.length,
      empresas_processadas: processed, total_lembretes_enviados: sent, total_elegiveis: eligible,
      total_gap_analysis_notificacoes: notifications, total_erros: errors }
    if (runId) await finishScheduledJob(supabase, runId, result.success, result)
    return json(result, result.success ? 200 : 500)
  } catch {
    if (runId) await finishScheduledJob(supabase, runId, false, { error: 'daily_reminder_processor_failed' })
      .catch(() => console.error('Unable to record reminder failure'))
    return json({ success: false, error: 'Daily reminder processing failed' }, 500)
  }
})
