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
      subject: `[${companyName}] Solicitação de Aprovação: ${document.nome}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e3a5f; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f7fa;">
  <div style="background-color: #ffffff; border-radius: 12px; padding: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.05); overflow: hidden;">
    
    <!-- Logo -->
    <div style="text-align: center; padding: 32px 32px 16px; border-bottom: 1px solid #e2e8f0;">
      <img src="${logoUrl}" alt="${companyName}" style="max-height: 50px; max-width: 200px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
      <p style="display: none; font-size: 20px; font-weight: 600; color: #1e3a5f; margin: 0;">${companyName}</p>
    </div>

    <div style="padding: 32px;">
      <!-- Title -->
      <h1 style="font-size: 22px; color: #1e3a5f; margin: 0 0 24px; font-weight: 600;">
        📄 Solicitação de Aprovação
      </h1>

      <p style="font-size: 15px; color: #3c4149; margin: 0 0 20px;">
        Olá <strong>${aprovador.nome}</strong>,
      </p>

      <p style="font-size: 15px; color: #3c4149; margin: 0 0 24px;">
        <strong>${solicitanteNome}</strong> solicitou sua aprovação para o seguinte documento:
      </p>

      <!-- Document Info Box -->
      <div style="background-color: #f0f9f8; border-radius: 8px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #0D9488;">
        <h2 style="font-size: 16px; color: #1e3a5f; margin: 0 0 8px; font-weight: 600;">
          ${document.nome}
        </h2>
        <p style="font-size: 14px; color: #64748b; margin: 0;">
          Empresa: ${companyName}
        </p>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="https://governaii.com.br/documentos?aprovar=${documento_id}" 
           style="display: inline-block; background-color: #0D9488; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">
          Revisar e Aprovar
        </a>
      </div>

      <p style="font-size: 14px; color: #64748b; text-align: center;">
        Acesse o sistema para revisar o documento e tomar sua decisão.
      </p>
    </div>

    <!-- Footer -->
    <div style="border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center;">
      <p style="font-size: 12px; color: #94a3b8; margin: 0;">
        Esta é uma mensagem automática do sistema ${companyName}.<br>
        Por favor, não responda a este e-mail.
      </p>
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