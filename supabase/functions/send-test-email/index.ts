import React from 'npm:react@18.3.1'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { WelcomeEmail } from '../send-welcome-email/_templates/welcome-email.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TestEmailRequest {
  email: string
  templateType?: 'welcome' | 'password-reset' | 'reminder'
}

Deno.serve(async (req) => {
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Não autorizado')
    }

    const { email, templateType = 'welcome' }: TestEmailRequest = await req.json()
    
    if (!email) {
      throw new Error('E-mail não fornecido')
    }

    console.log(`Enviando e-mail de teste para: ${email}`)

    // Buscar dados da empresa do usuário logado (se disponível)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    
    let companyName = 'GovernAII'
    let companyLogoUrl = undefined

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa:empresas(nome, logo_url)')
        .eq('user_id', user.id)
        .single()
      
      if (profile?.empresa) {
        companyName = profile.empresa.nome || companyName
        companyLogoUrl = profile.empresa.logo_url
      }
    }

    const html = await renderAsync(
      React.createElement(WelcomeEmail, {
        userName: 'Usuário de Teste',
        userEmail: email,
        temporaryPassword: 'Teste@123',
        loginUrl: 'https://governaii.com.br',
        companyName,
        companyLogoUrl
      })
    )

    const { data, error } = await resend.emails.send({
      from: `${companyName} <noreply@governaii.com.br>`,
      to: [email],
      subject: `[TESTE] ${companyName} - Novo Layout de E-mail`,
      html,
    })

    if (error) {
      console.error('Erro ao enviar e-mail:', error)
      throw error
    }

    console.log('E-mail de teste enviado com sucesso:', data)

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'E-mail de teste enviado com sucesso!',
      data 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    })
  } catch (error: any) {
    console.error('Erro na função send-test-email:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Falha ao enviar e-mail de teste'
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