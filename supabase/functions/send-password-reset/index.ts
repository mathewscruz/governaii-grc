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
  email?: string
  userId?: string
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
    
    const { email, userId, companyLogoUrl }: PasswordResetRequest = body
    
    // Validar que pelo menos email ou userId foi fornecido
    if (!email && !userId) {
      console.error('Nem email nem userId foram fornecidos')
      throw new Error('email ou userId é obrigatório')
    }
    
    let profile: any = null
    let targetUserId: string = userId || ''
    
    // Se email foi fornecido, buscar pelo email primeiro
    if (email) {
      console.log('Buscando perfil para email:', email)
      
      const { data: profileByEmail, error: emailError } = await supabase
        .from('profiles')
        .select('user_id, nome, email, empresa:empresas(nome, logo_url)')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle()
      
      if (emailError) {
        console.error('Erro ao buscar perfil por email:', JSON.stringify(emailError))
        // Retornar sucesso silencioso para proteção contra enumeração de emails
        console.log('Retornando sucesso silencioso (email não encontrado)')
        return new Response(JSON.stringify({ success: true, message: 'Se o email existir, uma senha será enviada' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }
      
      if (!profileByEmail) {
        console.log('Perfil não encontrado para email:', email)
        // Retornar sucesso silencioso para proteção contra enumeração de emails
        return new Response(JSON.stringify({ success: true, message: 'Se o email existir, uma senha será enviada' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }
      
      profile = profileByEmail
      targetUserId = profileByEmail.user_id
      console.log('Perfil encontrado por email:', { nome: profile.nome, userId: targetUserId })
    } else {
      // Buscar pelo userId
      console.log('Buscando perfil para userId:', userId)
      
      const { data: profileByUserId, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, nome, email, empresa:empresas(nome, logo_url)')
        .eq('user_id', userId)
        .single()
      
      if (profileError) {
        console.error('Erro ao buscar perfil:', JSON.stringify(profileError))
        throw new Error(`Erro ao buscar perfil: ${profileError.message}`)
      }
      
      if (!profileByUserId) {
        console.error('Perfil não encontrado para userId:', userId)
        throw new Error('Usuário não encontrado')
      }
      
      profile = profileByUserId
      targetUserId = profileByUserId.user_id
    }
    
    console.log('Perfil a processar:', { nome: profile.nome, email: profile.email })
    
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
    console.log('Atualizando senha no Auth para userId:', targetUserId)
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      targetUserId,
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
      .upsert(
        {
          user_id: targetUserId,
          is_temporary: true,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        },
        { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        }
      )
    
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