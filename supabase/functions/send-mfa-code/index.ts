import React from 'npm:react@18.3.1'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { MFACodeEmail } from './_templates/mfa-code-email.tsx'
import { createClient } from 'npm:@supabase/supabase-js@2'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendMFARequest {
  userId: string
  email: string
}

function generateOTP(): string {
  const digits = '0123456789'
  let otp = ''
  for (let i = 0; i < 6; i++) {
    otp += digits.charAt(Math.floor(Math.random() * 10))
  }
  return otp
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json() as SendMFARequest & { force?: boolean }
    const { userId, email, force } = body

    if (!userId || !email) {
      throw new Error('userId e email são obrigatórios')
    }

    // Verificar se existe uma sessão MFA válida (não expirada) para hoje
    const { data: validSession } = await supabaseAdmin
      .from('mfa_sessions')
      .select('id, verified_at, expires_at')
      .eq('user_id', userId)
      .gt('expires_at', new Date().toISOString())
      .order('verified_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (validSession) {
      console.log('MFA session válida encontrada para userId:', userId, '- pulando MFA')
      return new Response(JSON.stringify({ 
        success: true, 
        skipped: true 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Verificar se já existe código não usado e ainda válido (não expirado).
    // Se sim e não for um pedido de "reenviar" (force=true), retorna sucesso
    // indicando que o código já foi enviado — não bloqueia o fluxo de MFA.
    const { data: activeCode } = await supabaseAdmin
      .from('mfa_codes')
      .select('id, created_at, expires_at')
      .eq('user_id', userId)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (activeCode && !force) {
      console.log('Código MFA ativo encontrado para userId:', userId, '- reaproveitando')
      return new Response(JSON.stringify({
        success: true,
        alreadySent: true,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Rate limiting: aplicado apenas em pedidos explícitos de reenvio (force=true)
    // ou quando não há código ativo mas houve envio recente (<60s).
    const { data: recentCode } = await supabaseAdmin
      .from('mfa_codes')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (recentCode && force) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Aguarde 1 minuto antes de solicitar um novo código' 
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Buscar empresa_id do usuário
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('empresa_id, nome')
      .eq('user_id', userId)
      .single()

    if (!profile?.empresa_id) {
      throw new Error('Perfil do usuário não encontrado')
    }

    const code = generateOTP()

    // Inserir código (trigger invalida anteriores automaticamente)
    const { error: insertError } = await supabaseAdmin
      .from('mfa_codes')
      .insert({
        user_id: userId,
        empresa_id: profile.empresa_id,
        code,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      })

    if (insertError) {
      console.error('Erro ao inserir código MFA:', insertError)
      throw new Error('Erro ao gerar código de verificação')
    }

    // Enviar e-mail com o código
    const html = await renderAsync(
      React.createElement(MFACodeEmail, {
        userName: profile.nome || email.split('@')[0],
        code,
      })
    )

    const { error: emailError } = await resend.emails.send({
      from: 'Akuris <noreply@akuris.com.br>',
      to: [email],
      subject: `${code} - Código de Verificação Akuris`,
      html,
    })

    if (emailError) {
      console.error('Erro ao enviar e-mail MFA:', emailError)
      throw new Error('Erro ao enviar código por e-mail')
    }

    console.log('Código MFA enviado para:', email)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (error: any) {
    console.error('Erro na função send-mfa-code:', error)
    return new Response(
      JSON.stringify({ error: (error instanceof Error ? error.message : String(error)) }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }
})
