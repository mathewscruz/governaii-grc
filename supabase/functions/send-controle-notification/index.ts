import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  controle_id: string;
  controle_nome: string;
  controle_descricao?: string;
  proxima_avaliacao?: string;
  responsavel_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resend = new Resend(resendApiKey);

    const {
      controle_id,
      controle_nome,
      controle_descricao,
      proxima_avaliacao,
      responsavel_id
    }: NotificationRequest = await req.json();

    console.log("Processing controle notification:", {
      controle_id,
      controle_nome,
      responsavel_id
    });

    if (!controle_id || !responsavel_id || !controle_nome) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch responsible user data
    const { data: responsavelData, error: responsavelError } = await supabase
      .from("profiles")
      .select("nome, email, empresa_id")
      .eq("user_id", responsavel_id)
      .single();

    if (responsavelError || !responsavelData) {
      console.error("Error fetching responsible user:", responsavelError);
      return new Response(
        JSON.stringify({ error: "Responsible user not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!responsavelData.email) {
      console.error("Responsible user has no email");
      return new Response(
        JSON.stringify({ error: "Responsible user has no email" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch company data
    let companyName = "GovernAII";
    let companyLogoUrl = "https://governaii.com.br/governaii-logo.png";

    if (responsavelData.empresa_id) {
      const { data: empresaData } = await supabase
        .from("empresas")
        .select("nome, logo_url")
        .eq("id", responsavelData.empresa_id)
        .single();

      if (empresaData) {
        companyName = empresaData.nome || companyName;
        if (empresaData.logo_url) {
          companyLogoUrl = empresaData.logo_url;
        }
      }
    }

    // Format date
    const formatDate = (dateStr?: string): string => {
      if (!dateStr) return "Não definida";
      try {
        const date = new Date(dateStr + "T00:00:00");
        return date.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric"
        });
      } catch {
        return dateStr;
      }
    };

    // Truncate description
    const truncateDescription = (desc?: string): string => {
      if (!desc) return "Sem descrição";
      if (desc.length > 300) {
        return desc.substring(0, 300) + "...";
      }
      return desc;
    };

    // Build direct link to the control
    const controleLink = `https://governaii.com.br/governanca?tab=controles&controle=${controle_id}`;

    // Build HTML email
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e3a5f; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
    
    <!-- Logo -->
    <div style="text-align: center; margin-bottom: 24px;">
      <img src="${companyLogoUrl}" alt="${companyName}" style="max-height: 50px; max-width: 200px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
      <p style="display: none; font-size: 20px; font-weight: 600; color: #1e3a5f; margin: 0;">${companyName}</p>
    </div>

    <!-- Title -->
    <h1 style="font-size: 22px; color: #1e3a5f; text-align: center; margin-bottom: 24px; font-weight: 600;">
      📋 Você foi designado como responsável
    </h1>

    <!-- Greeting -->
    <p style="font-size: 15px; margin-bottom: 20px;">
      Olá <strong>${responsavelData.nome || "Usuário"}</strong>,
    </p>

    <p style="font-size: 15px; margin-bottom: 24px;">
      Você foi designado como responsável pelo seguinte controle interno:
    </p>

    <!-- Control Info Box -->
    <div style="background-color: #f0f7ff; border-radius: 8px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #3b82f6;">
      <h2 style="font-size: 16px; color: #1e3a5f; margin: 0 0 12px 0; font-weight: 600;">
        ${controle_nome}
      </h2>
      <p style="font-size: 14px; color: #64748b; margin: 0 0 12px 0; white-space: pre-wrap;">
        ${truncateDescription(controle_descricao)}
      </p>
      <div style="font-size: 13px; color: #475569;">
        <strong>📅 Vencimento da Avaliação:</strong> ${formatDate(proxima_avaliacao)}
      </div>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${controleLink}" 
         style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">
        Acessar Controle
      </a>
    </div>

    <!-- Footer -->
    <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 20px;">
      <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
        Esta é uma mensagem automática do sistema ${companyName}.<br>
        Por favor, não responda a este e-mail.
      </p>
    </div>
  </div>
</body>
</html>`;

    // Send email
    console.log("Sending email to:", responsavelData.email);
    const emailResponse = await resend.emails.send({
      from: `${companyName} <noreply@governaii.com.br>`,
      to: [responsavelData.email],
      subject: `[${companyName}] Você foi designado como responsável: ${controle_nome}`,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    // Create in-app notification
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: responsavel_id,
        type: "info",
        title: "Novo controle atribuído",
        message: `Você foi designado como responsável pelo controle: ${controle_nome}`,
        link_to: `/governanca?tab=controles&controle=${controle_id}`,
        read: false,
      });

    if (notificationError) {
      console.error("Error creating notification:", notificationError);
    } else {
      console.log("In-app notification created successfully");
    }

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in send-controle-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
