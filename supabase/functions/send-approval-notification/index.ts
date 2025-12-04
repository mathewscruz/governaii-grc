import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  documento_id: string;
  aprovador_id: string;
  solicitante_id: string;
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      documento_id, 
      aprovador_id, 
      solicitante_id
    }: NotificationRequest = await req.json();

    console.log("Enviando notificação de aprovação:", {
      documento_id,
      aprovador_id,
      solicitante_id
    });

    // Buscar dados do solicitante
    console.log("Buscando solicitante com ID:", solicitante_id);
    const { data: solicitante, error: solicitanteError } = await supabase
      .from('profiles')
      .select('nome')
      .eq('user_id', solicitante_id)
      .single();

    if (solicitanteError || !solicitante) {
      console.error("Erro ao buscar solicitante:", solicitanteError);
      throw new Error("Solicitante não encontrado");
    }

    const solicitanteNome = solicitante.nome;
    console.log("Solicitante encontrado:", solicitanteNome);

    // Buscar dados do aprovador
    console.log("Buscando aprovador com ID:", aprovador_id);
    const { data: aprovador, error: aprovadorError } = await supabase
      .from('profiles')
      .select('nome, email')
      .eq('user_id', aprovador_id)
      .single();

    if (aprovadorError || !aprovador) {
      console.error("Erro ao buscar aprovador:", aprovadorError);
      throw new Error("Aprovador não encontrado");
    }

    console.log("Aprovador encontrado:", aprovador.nome);

    // Buscar dados do documento
    console.log("Buscando documento com ID:", documento_id);
    const { data: document, error: docError } = await supabase
      .from('documentos')
      .select('nome, empresa_id')
      .eq('id', documento_id)
      .single();

    if (docError || !document) {
      console.error("Erro ao buscar documento:", docError);
      throw new Error("Documento não encontrado");
    }

    console.log("Documento encontrado:", document.nome);

    // Buscar dados da empresa separadamente
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('nome, logo_url')
      .eq('id', document.empresa_id)
      .single();

    if (empresaError) {
      console.error("Erro ao buscar empresa:", empresaError);
    }

    const companyName = empresa?.nome || "GovernAII";
    // Usar logo da empresa se disponível, senão usar logo do site publicado
    const logoUrl = empresa?.logo_url || 'https://governaii.com.br/governaii-logo.png';

    const emailResponse = await resend.emails.send({
      from: `${companyName} <noreply@governaii.com.br>`,
      to: [aprovador.email],
      subject: `Solicitação de Aprovação de Documento - ${document.nome}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
                line-height: 1.6;
                color: #3c4149;
                background-color: #f6f9fc;
                margin: 0;
                padding: 0;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
              }
              .logo-section {
                padding: 32px 32px 24px;
                text-align: center;
                border-bottom: 1px solid #e6ebf1;
              }
              .logo {
                max-height: 60px;
                max-width: 200px;
              }
              .logo-text {
                font-size: 24px;
                font-weight: 700;
                color: #2563eb;
                margin: 0;
              }
              .header {
                padding: 32px 32px 16px;
              }
              .header h1 {
                color: #1a1a1a;
                font-size: 24px;
                font-weight: 600;
                margin: 0;
              }
              .content {
                padding: 0 32px;
              }
              .content p {
                margin: 0 0 16px;
              }
              .info-box {
                background-color: #f6f9fc;
                border: 1px solid #e6ebf1;
                border-radius: 6px;
                padding: 16px;
                margin: 16px 0;
              }
              .button {
                display: inline-block;
                padding: 12px 24px;
                background-color: #2563eb;
                color: #ffffff;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                margin: 24px 0;
              }
              .button-section {
                text-align: center;
                margin: 24px 0;
              }
              .footer {
                border-top: 1px solid #e6ebf1;
                margin: 32px 32px 0;
                padding: 24px 0;
                text-align: center;
              }
              .footer p {
                color: #8898aa;
                font-size: 12px;
                margin: 8px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="logo-section">
                <img src="${logoUrl}" alt="${companyName}" class="logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                <p class="logo-text" style="display: none;">${companyName}</p>
              </div>
              
              <div class="header">
                <h1>Solicitação de Aprovação</h1>
              </div>
              
              <div class="content">
                <p>Olá <strong>${aprovador.nome}</strong>,</p>
                
                <p><strong>${solicitanteNome}</strong> solicitou sua aprovação para o seguinte documento:</p>
                
                <div class="info-box">
                  <p style="margin: 0 0 8px;"><strong>Documento:</strong> ${document.nome}</p>
                  <p style="margin: 0;"><strong>Empresa:</strong> ${companyName}</p>
                </div>
                
                <div class="button-section">
                  <a href="https://governaii.com.br/documentos?aprovar=${documento_id}" class="button">
                    Aprovar Documento
                  </a>
                </div>
                
                <p>Por favor, acesse o sistema para revisar e aprovar o documento.</p>
              </div>
              
              <div class="footer">
                <p>Este é um e-mail automático de <strong>${companyName}</strong>.</p>
                <p>Em caso de dúvidas, entre em contato conosco.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email enviado com sucesso:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Notificação enviada com sucesso",
      emailResponse 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Erro na função send-approval-notification:", error);
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