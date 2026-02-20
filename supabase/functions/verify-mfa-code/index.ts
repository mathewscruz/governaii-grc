import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VerifyMFARequest {
  userId: string
  code: string
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

    const { userId, code }: VerifyMFARequest = await req.json()

    if (!userId || !code) {
      throw new Error('userId e code são obrigatórios')
    }

    // Buscar código válido (não usado e não expirado)
    const { data: mfaCode, error: fetchError } = await supabaseAdmin
      .from('mfa_codes')
      .select('*')
      .eq('user_id', userId)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (fetchError) {
      console.error('Erro ao buscar código MFA:', fetchError)
      throw new Error('Erro ao verificar código')
    }

    if (!mfaCode) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Código expirado ou inválido. Solicite um novo código.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Verificar tentativas (máximo 5)
    if (mfaCode.attempts >= 5) {
      // Marcar como usado para bloquear
      await supabaseAdmin
        .from('mfa_codes')
        .update({ used: true })
        .eq('id', mfaCode.id)

      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Muitas tentativas. Solicite um novo código.' 
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Incrementar tentativas
    await supabaseAdmin
      .from('mfa_codes')
      .update({ attempts: mfaCode.attempts + 1 })
      .eq('id', mfaCode.id)

    // Verificar código
    if (mfaCode.code !== code.trim()) {
      const remaining = 4 - mfaCode.attempts
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Código incorreto. ${remaining} tentativa(s) restante(s).` 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Código correto - marcar como usado
    await supabaseAdmin
      .from('mfa_codes')
      .update({ used: true })
      .eq('id', mfaCode.id)

    // Criar sessão MFA válida por 24h
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('empresa_id')
      .eq('user_id', userId)
      .single()

    if (profile?.empresa_id) {
      const { error: sessionError } = await supabaseAdmin
        .from('mfa_sessions')
        .insert({
          user_id: userId,
          empresa_id: profile.empresa_id,
          verified_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })

      if (sessionError) {
        console.error('Erro ao criar sessão MFA:', sessionError)
        // Não bloquear o login por causa disso
      } else {
        console.log('Sessão MFA criada para userId:', userId, '- válida por 24h')
      }
    }

    console.log('Código MFA verificado com sucesso para userId:', userId)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (error: any) {
    console.error('Erro na função verify-mfa-code:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }
})
