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
    console.log('Recebendo requisição para reset de senha')
    
    const { userId, companyLogoUrl }: PasswordResetRequest = await req.json()
    
    // Buscar dados do usuário e empresa
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('nome, email, empresa:empresas(nome, logo_url)')
      .eq('user_id', userId)
      .single()
    
    if (profileError || !profile) {
      console.error('Erro ao buscar perfil:', profileError)
      throw new Error('Usuário não encontrado')
    }
    
    // Gerar nova senha temporária
    const { data: tempPassword, error: passwordError } = await supabase
      .rpc('generate_temp_password')
    
    if (passwordError || !tempPassword) {
      console.error('Erro ao gerar senha:', passwordError)
      throw new Error('Erro ao gerar senha temporária')
    }
    
    // Atualizar senha do usuário no Auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { password: tempPassword }
    )
    
    if (updateError) {
      console.error('Erro ao atualizar senha:', updateError)
      throw new Error('Erro ao atualizar senha')
    }
    
    // Registrar senha temporária na tabela
    const { error: tempPasswordError } = await supabase
      .from('temporary_passwords')
      .upsert({
        user_id: userId,
        is_temporary: true,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })
    
    if (tempPasswordError) {
      console.error('Erro ao registrar senha temporária:', tempPasswordError)
    }
    
    console.log(`Enviando e-mail de reset para: ${profile.email}`)
    
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

    const { data, error } = await resend.emails.send({
      from: `${profile.empresa?.nome || 'GovernAII'} <noreply@governaii.com.br>`,
      to: [profile.email],
      subject: `${profile.empresa?.nome || 'GovernAII'} - Nova senha temporária`,
      html,
    })

    if (error) {
      console.error('Erro ao enviar e-mail:', error)
      throw error
    }

    console.log('E-mail de reset enviado com sucesso:', data)

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    })
  } catch (error: any) {
    console.error('Erro na função send-password-reset:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Falha ao enviar e-mail de reset de senha'
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