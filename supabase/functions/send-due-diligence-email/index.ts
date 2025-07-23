import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: 'send' | 'reminder' | 'completion' | 'invitation';
  assessment_id: string;
  fornecedor_nome: string;
  fornecedor_email: string;
  template_nome: string;
  assessment_link?: string;
  data_expiracao?: string;
  empresa_nome?: string;
  empresa_logo_url?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      type, 
      assessment_id, 
      fornecedor_nome, 
      fornecedor_email, 
      template_nome, 
      assessment_link, 
      data_expiracao, 
      empresa_nome,
      empresa_logo_url
    }: EmailRequest = await req.json();

    console.log(`Processando email tipo: ${type} para ${fornecedor_email}`);

    let emailContent: { subject: string; html: string };

    switch (type) {
      case 'send':
      case 'invitation': // Aceita ambos os tipos para compatibilidade
        emailContent = {
          subject: `${empresa_nome || 'GovernAI'} - Te enviou uma avaliação de "${template_nome}"`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              ${empresa_logo_url ? `
                <div style="text-align: center; margin-bottom: 30px;">
                  <img src="${empresa_logo_url}" alt="${empresa_nome || 'GovernAI'}" style="max-height: 80px; max-width: 200px;">
                </div>
              ` : ''}
              <h1 style="color: #2563eb;">Questionário de Due Diligence</h1>
              
              <p>Olá <strong>${fornecedor_nome}</strong>,</p>
              
              <p>Você foi convidado(a) a responder um questionário de due diligence para <strong>${empresa_nome || 'GovernAI'}</strong>.</p>
              
              <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0;">Template: ${template_nome}</h3>
                <p style="margin: 0; color: #64748b;">
                  Por favor, clique no link abaixo para acessar e responder o questionário.
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${assessment_link}" 
                   style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Responder Questionário
                </a>
              </div>
              
              <p><strong>⏰ Prazo:</strong> ${data_expiracao ? new Date(data_expiracao).toLocaleString('pt-BR') : 'Conforme acordado'}</p>
              
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
              
              <p style="color: #64748b; font-size: 14px;">
                Este é um e-mail automático da <strong>${empresa_nome || 'GovernAI'}</strong>. Em caso de dúvidas, entre em contato conosco.
              </p>
            </div>
          `
        };
        break;

      case 'reminder':
        emailContent = {
          subject: `Lembrete: ${empresa_nome || 'GovernAI'} - Avaliação de "${template_nome}"`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              ${empresa_logo_url ? `
                <div style="text-align: center; margin-bottom: 30px;">
                  <img src="${empresa_logo_url}" alt="${empresa_nome || 'GovernAI'}" style="max-height: 80px; max-width: 200px;">
                </div>
              ` : ''}
              <h1 style="color: #f59e0b;">Lembrete - Questionário Pendente</h1>
              
              <p>Olá <strong>${fornecedor_nome}</strong>,</p>
              
              <p>Este é um lembrete sobre o questionário de due diligence da <strong>${empresa_nome || 'GovernAI'}</strong> que ainda não foi respondido.</p>
              
              <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <h3 style="margin: 0 0 10px 0;">Template: ${template_nome}</h3>
                <p style="margin: 0; color: #92400e;">
                  O questionário ainda não foi respondido. Por favor, responda o quanto antes.
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${assessment_link}" 
                   style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Responder Agora
                </a>
              </div>
              
              <p><strong>⏰ Prazo:</strong> ${data_expiracao ? new Date(data_expiracao).toLocaleString('pt-BR') : 'Conforme acordado'}</p>
              
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
              
              <p style="color: #64748b; font-size: 14px;">
                Este é um e-mail automático da <strong>${empresa_nome || 'GovernAI'}</strong>. Em caso de dúvidas, entre em contato conosco.
              </p>
            </div>
          `
        };
        break;

      case 'completion':
        emailContent = {
          subject: `${empresa_nome || 'GovernAI'} - Due Diligence Concluído - "${template_nome}"`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              ${empresa_logo_url ? `
                <div style="text-align: center; margin-bottom: 30px;">
                  <img src="${empresa_logo_url}" alt="${empresa_nome || 'GovernAI'}" style="max-height: 80px; max-width: 200px;">
                </div>
              ` : ''}
              <h1 style="color: #16a34a;">Questionário Concluído ✅</h1>
              
              <p>Olá <strong>${fornecedor_nome}</strong>,</p>
              
              <p>Confirmamos o recebimento das suas respostas para o questionário de due diligence da <strong>${empresa_nome || 'GovernAI'}</strong>:</p>
              
              <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
                <h3 style="margin: 0 0 10px 0;">Template: ${template_nome}</h3>
                <p style="margin: 0; color: #166534;">
                  ✅ Questionário respondido com sucesso!
                </p>
              </div>
              
              <p>Obrigado pela sua colaboração. Suas respostas estão sendo analisadas e entraremos em contato se necessário.</p>
              
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
              
              <p style="color: #64748b; font-size: 14px;">
                Este é um e-mail automático da <strong>${empresa_nome || 'GovernAI'}</strong>. Em caso de dúvidas, entre em contato conosco.
              </p>
            </div>
          `
        };
        break;

      default:
        console.error(`Tipo de e-mail inválido: ${type}`);
        throw new Error(`Tipo de e-mail inválido: ${type}. Tipos aceitos: send, invitation, reminder, completion`);
    }

    console.log(`Enviando e-mail ${type} para ${fornecedor_email}`);

    const emailResponse = await resend.emails.send({
      from: "Due Diligence <noreply@resend.dev>",
      to: [fornecedor_email],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log("E-mail enviado com sucesso:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Erro ao enviar e-mail:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);