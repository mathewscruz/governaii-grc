import React from 'npm:react@18.3.1'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { PasswordResetEmail } from './_templates/password-reset-email.tsx'
import { createClient } from 'npm:@supabase/supabase-js@2'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PasswordResetRequest {
  userId: string
  companyLogoUrl?: string
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
    console.log('=== INÍCIO: send-password-reset ===')
    console.log('Timestamp:', new Date().toISOString())
    
    const body = await req.json()
    console.log('Body recebido:', JSON.stringify(body))
    
    const { userId, companyLogoUrl }: PasswordResetRequest = body
    
    if (!userId) {
      console.error('userId não fornecido no body')
      throw new Error('userId é obrigatório')
    }
    
    console.log('Buscando perfil para userId:', userId)
    
    // Buscar dados do usuário e empresa
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('nome, email, empresa:empresas(nome, logo_url)')
      .eq('user_id', userId)
      .single()
    
    if (profileError) {
      console.error('Erro ao buscar perfil:', JSON.stringify(profileError))
      throw new Error(`Erro ao buscar perfil: ${profileError.message}`)
    }
    
    if (!profile) {
      console.error('Perfil não encontrado para userId:', userId)
      throw new Error('Usuário não encontrado')
    }
    
    console.log('Perfil encontrado:', { nome: profile.nome, email: profile.email })
    
    // Gerar nova senha temporária
    console.log('Gerando senha temporária...')
    const { data: tempPassword, error: passwordError } = await supabase
      .rpc('generate_temp_password')
    
    if (passwordError) {
      console.error('Erro ao gerar senha:', JSON.stringify(passwordError))
      throw new Error(`Erro ao gerar senha temporária: ${passwordError.message}`)
    }
    
    if (!tempPassword) {
      console.error('Senha temporária retornou null')
      throw new Error('Senha temporária não foi gerada')
    }
    
    console.log('Senha temporária gerada com sucesso (length:', tempPassword.length, ')')
    
    // Atualizar senha do usuário no Auth
    console.log('Atualizando senha no Auth para userId:', userId)
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { password: tempPassword }
    )
    
    if (updateError) {
      console.error('Erro ao atualizar senha no Auth:', JSON.stringify(updateError))
      throw new Error(`Erro ao atualizar senha: ${updateError.message}`)
    }
    
    console.log('Senha atualizada no Auth com sucesso')
    
    // Registrar senha temporária na tabela
    console.log('Registrando senha temporária na tabela...')
    const { error: tempPasswordError } = await supabase
      .from('temporary_passwords')
      .upsert({
        user_id: userId,
        is_temporary: true,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })
    
    if (tempPasswordError) {
      console.error('Erro ao registrar senha temporária na tabela:', JSON.stringify(tempPasswordError))
      // Não lançamos erro aqui, apenas logamos
    } else {
      console.log('Senha temporária registrada na tabela com sucesso')
    }
    
    console.log('Preparando envio de e-mail para:', profile.email)
    
    const loginUrl = 'https://governaii.com.br'
    
    const html = await renderAsync(
      React.createElement(PasswordResetEmail, {
        userName: profile.nome,
        userEmail: profile.email,
        temporaryPassword: tempPassword,
        loginUrl,
        companyName: profile.empresa?.nome,
        companyLogoUrl: companyLogoUrl || profile.empresa?.logo_url
      })
    )

    console.log('Enviando e-mail via Resend...')
    console.log('From:', `${profile.empresa?.nome || 'GovernAII'} <noreply@governaii.com.br>`)
    console.log('To:', profile.email)
    
    const { data, error } = await resend.emails.send({
      from: `${profile.empresa?.nome || 'GovernAII'} <noreply@governaii.com.br>`,
      to: [profile.email],
      subject: `${profile.empresa?.nome || 'GovernAII'} - Nova senha temporária`,
      html,
    })

    if (error) {
      console.error('Erro ao enviar e-mail via Resend:', JSON.stringify(error))
      throw new Error(`Erro ao enviar e-mail: ${JSON.stringify(error)}`)
    }

    console.log('E-mail enviado com sucesso!')
    console.log('Response do Resend:', JSON.stringify(data))
    console.log('=== FIM: send-password-reset (sucesso) ===')

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    })
  } catch (error: any) {
    console.error('=== ERRO na função send-password-reset ===')
    console.error('Mensagem:', error.message)
    console.error('Stack:', error.stack)
    console.error('Erro completo:', JSON.stringify(error, Object.getOwnPropertyNames(error)))
    
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Falha ao enviar e-mail de reset de senha',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    )
  }
})