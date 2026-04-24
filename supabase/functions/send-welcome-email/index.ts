import React from 'npm:react@18.3.1'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { WelcomeEmail } from './_templates/welcome-email.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WelcomeEmailRequest {
  userName: string
  userEmail: string
  setupPasswordUrl: string
  companyName?: string
  companyLogoUrl?: string
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
    console.log('Recebendo requisição para envio de e-mail de boas-vindas')
    
    const { userName, userEmail, setupPasswordUrl, companyName, companyLogoUrl }: WelcomeEmailRequest = await req.json()
    
    console.log(`Enviando e-mail de boas-vindas para: ${userEmail}`)
    
    const html = await renderAsync(
      React.createElement(WelcomeEmail, {
        userName,
        userEmail,
        setupPasswordUrl,
        companyName,
        companyLogoUrl
      })
    )

    const { data, error } = await resend.emails.send({
      from: 'Akuris <noreply@akuris.com.br>',
      to: [userEmail],
      subject: 'Bem-vindo ao Akuris - Defina sua senha',
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
    console.error('Erro na função send-welcome-email:', error)
    return new Response(
      JSON.stringify({
        error: (error instanceof Error ? error.message : String(error)),
        details: 'Falha ao enviar e-mail de boas-vindas'
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
