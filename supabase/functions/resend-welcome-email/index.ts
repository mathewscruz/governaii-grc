
import React from 'npm:react@18.3.1'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { WelcomeEmail } from './_templates/welcome-email.tsx'
import { createClient } from 'npm:@supabase/supabase-js@2'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ResendWelcomeEmailRequest {
  userId: string
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
    console.log('Recebendo requisição para reenviar e-mail de boas-vindas')
    
    // Criar cliente Supabase com service role para operações administrativas
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Criar cliente normal para verificações de RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: req.headers.get('Authorization') ?? '',
          },
        },
      }
    )

    // Verificar autenticação do usuário atual
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Usuário não autenticado')
    }

    // Buscar perfil do usuário atual para verificar permissões
    const { data: currentUserProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role, empresa_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !currentUserProfile) {
      throw new Error('Perfil do usuário não encontrado')
    }

    // Validar permissões - apenas admins e super_admins podem reenviar e-mails
    const isSuperAdmin = currentUserProfile.role === 'super_admin'
    const isAdmin = currentUserProfile.role === 'admin' || isSuperAdmin
    
    if (!isAdmin) {
      throw new Error('Usuário não tem permissão para reenviar e-mails de boas-vindas')
    }
    
    const { userId }: ResendWelcomeEmailRequest = await req.json()
    
    if (!userId) {
      throw new Error('ID do usuário não fornecido')
    }

    // Buscar informações do usuário a partir do ID
    const { data: targetUser, error: userError } = await supabaseAdmin.auth.admin
      .getUserById(userId)

    if (userError || !targetUser) {
      throw new Error('Usuário não encontrado')
    }

    // Buscar perfil do usuário alvo e empresa
    const { data: userProfile, error: userProfileError } = await supabaseAdmin
      .from('profiles')
      .select('nome, email, empresa_id, empresa:empresas(nome, logo_url)')
      .eq('user_id', userId)
      .single()

    if (userProfileError || !userProfile) {
      throw new Error('Perfil do usuário não encontrado')
    }

    // Verificar se o usuário atual tem permissão para gerenciar o usuário alvo
    if (!isSuperAdmin && userProfile.empresa_id !== currentUserProfile.empresa_id) {
      throw new Error('Você não tem permissão para gerenciar este usuário')
    }

    // Gerar senha temporária
    const { data: tempPassword, error: passwordError } = await supabaseAdmin
      .rpc('generate_temp_password')

    if (passwordError || !tempPassword) {
      throw new Error('Erro ao gerar senha temporária')
    }

    // Atualizar com a senha temporária gerada
    const { error: updatePasswordError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: tempPassword }
    )

    if (updatePasswordError) {
      throw new Error('Erro ao atualizar senha')
    }

    // Registrar ou atualizar senha temporária
    const { error: tempPasswordUpsertError } = await supabaseAdmin
      .from('temporary_passwords')
      .upsert({
        user_id: userId,
        is_temporary: true,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 dias
      }, {
        onConflict: 'user_id'
      })

    if (tempPasswordUpsertError) {
      console.error('Erro ao registrar senha temporária:', tempPasswordUpsertError)
      // Não falhar o processo por causa deste erro
    }

    console.log(`Enviando e-mail de boas-vindas para: ${userProfile.email}`)
    
    const loginUrl = 'https://governaii.com.br'
    
    const html = await renderAsync(
      React.createElement(WelcomeEmail, {
        userName: userProfile.nome,
        userEmail: userProfile.email,
        temporaryPassword: tempPassword,
        loginUrl,
        companyName: userProfile.empresa?.nome,
        companyLogoUrl: userProfile.empresa?.logo_url
      })
    )

    const { data, error } = await resend.emails.send({
      from: `${userProfile.empresa?.nome || 'GovernAII'} <noreply@governaii.com.br>`,
      to: [userProfile.email],
      subject: `${userProfile.empresa?.nome || 'GovernAII'} - Seus novos dados de acesso`,
      html,
    })

    if (error) {
      console.error('Erro ao enviar e-mail:', error)
      throw error
    }

    console.log('E-mail enviado com sucesso:', data)

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    })
  } catch (error: any) {
    console.error('Erro na função resend-welcome-email:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Falha ao reenviar e-mail de boas-vindas'
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
