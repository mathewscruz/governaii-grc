import React from 'npm:react@18.3.1'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { InvitationReminderEmail } from './_templates/invitation-reminder-email.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReminderRequest {
  user_id?: string
  empresa_id?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    })
  }

  try {
    console.log('Iniciando processamento de lembretes de convite')
    
    const { user_id, empresa_id }: ReminderRequest = await req.json().catch(() => ({}))

    // Buscar usuários elegíveis para receber lembretes
    let query = supabase
      .from('profiles')
      .select(`
        *,
        temporary_passwords!inner (
          user_id,
          is_temporary,
          expires_at
        ),
        empresas!inner (
          id,
          nome
        )
      `)
      .eq('temporary_passwords.is_temporary', true)
      .gt('temporary_passwords.expires_at', new Date().toISOString())

    if (user_id) {
      query = query.eq('user_id', user_id)
    }
    if (empresa_id) {
      query = query.eq('empresa_id', empresa_id)
    }

    const { data: eligibleUsers, error: usersError } = await query

    if (usersError) {
      console.error('Erro ao buscar usuários elegíveis:', usersError)
      throw usersError
    }

    console.log(`Encontrados ${eligibleUsers?.length || 0} usuários elegíveis`)

    if (!eligibleUsers || eligibleUsers.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Nenhum usuário elegível para lembretes encontrado',
        processed: 0,
        sent: 0,
        errors: 0
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    let processed = 0
    let sent = 0
    let errors = 0

    for (const user of eligibleUsers) {
      processed++
      
      try {
        // Buscar configurações de lembrete da empresa
        const { data: settings } = await supabase
          .from('empresa_reminder_settings')
          .select('*')
          .eq('empresa_id', user.empresa_id)
          .single()

        // Se lembretes estão desabilitados para esta empresa, pular
        if (settings && !settings.reminders_enabled) {
          console.log(`Lembretes desabilitados para empresa ${user.empresa_id}`)
          continue
        }

        const maxReminders = settings?.max_reminders || 3
        const intervals = settings?.reminder_intervals || [3, 7, 14]

        // Buscar histórico de lembretes do usuário
        const { data: reminderHistory } = await supabase
          .from('user_invitation_reminders')
          .select('*')
          .eq('user_id', user.user_id)
          .eq('empresa_id', user.empresa_id)
          .single()

        const currentReminderCount = reminderHistory?.reminder_count || 0

        // Se já atingiu o limite máximo, pular
        if (currentReminderCount >= maxReminders) {
          console.log(`Usuário ${user.email} já atingiu limite máximo de lembretes`)
          continue
        }

        // Verificar se é hora de enviar o próximo lembrete
        const now = new Date()
        let shouldSendReminder = false

        if (!reminderHistory) {
          // Primeiro lembrete - enviar após 3 dias do convite inicial
          const inviteDate = new Date(user.created_at)
          const daysSinceInvite = Math.floor((now.getTime() - inviteDate.getTime()) / (1000 * 60 * 60 * 24))
          shouldSendReminder = daysSinceInvite >= (intervals[0] || 3)
        } else if (reminderHistory.next_reminder_due && new Date(reminderHistory.next_reminder_due) <= now) {
          shouldSendReminder = true
        }

        if (!shouldSendReminder) {
          console.log(`Ainda não é hora de enviar lembrete para ${user.email}`)
          continue
        }

        // Enviar e-mail de lembrete
        const loginUrl = 'https://akuris.com.br'
        
        const html = await renderAsync(
          React.createElement(InvitationReminderEmail, {
            userName: user.nome,
            userEmail: user.email,
            companyName: user.empresas.nome,
            loginUrl,
            reminderNumber: currentReminderCount + 1,
            maxReminders,
          })
        )

        const { data: emailData, error: emailError } = await resend.emails.send({
          from: 'Akuris <noreply@akuris.com.br>',
          to: [user.email],
          subject: `Lembrete: Seu acesso ao Akuris está aguardando - ${user.empresas.nome}`,
          html,
        })

        if (emailError) {
          console.error(`Erro ao enviar e-mail para ${user.email}:`, emailError)
          errors++
          continue
        }

        console.log(`E-mail de lembrete enviado para ${user.email}`)

        // Atualizar ou criar registro de lembrete
        const nextReminderCount = currentReminderCount + 1
        const nextInterval = intervals[nextReminderCount] || intervals[intervals.length - 1]
        const nextReminderDue = new Date(now.getTime() + (nextInterval * 24 * 60 * 60 * 1000))

        const reminderData = {
          user_id: user.user_id,
          empresa_id: user.empresa_id,
          reminder_count: nextReminderCount,
          last_reminder_sent: now.toISOString(),
          next_reminder_due: nextReminderCount < maxReminders ? nextReminderDue.toISOString() : null,
          status: nextReminderCount >= maxReminders ? 'completed' : 'active',
          updated_at: now.toISOString()
        }

        if (!reminderHistory) {
          await supabase
            .from('user_invitation_reminders')
            .insert(reminderData)
        } else {
          await supabase
            .from('user_invitation_reminders')
            .update(reminderData)
            .eq('id', reminderHistory.id)
        }

        sent++

      } catch (error) {
        console.error(`Erro ao processar usuário ${user.email}:`, error)
        errors++
      }
    }

    console.log(`Processamento concluído: ${processed} processados, ${sent} enviados, ${errors} erros`)

    return new Response(JSON.stringify({
      success: true,
      message: 'Processamento de lembretes concluído',
      processed,
      sent,
      errors,
      details: {
        total_eligible: eligibleUsers.length,
        success_rate: processed > 0 ? Math.round((sent / processed) * 100) : 0
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })

  } catch (error: any) {
    console.error('Erro na função process-invitation-reminders:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Falha ao processar lembretes de convite'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    )
  }
})