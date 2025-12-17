import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MentionNotificationRequest {
  user_id: string;
  controle_id: string;
  controle_nome: string;
  mencionado_por: string;
  comentario: string;
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      user_id, 
      controle_id, 
      controle_nome,
      mencionado_por,
      comentario 
    }: MentionNotificationRequest = await req.json();

    console.log("Enviando notificação de menção:", { user_id, controle_id, controle_nome });

    // Buscar dados do usuário mencionado
    const { data: usuario, error: usuarioError } = await supabase
      .from("profiles")
      .select("nome, email, empresa_id")
      .eq("user_id", user_id)
      .single();

    if (usuarioError || !usuario) {
      console.error("Usuário não encontrado:", usuarioError);
      throw new Error("Usuário não encontrado");
    }

    // Buscar nome de quem mencionou
    const { data: autorMencao } = await supabase
      .from("profiles")
      .select("nome")
      .eq("user_id", mencionado_por)
      .single();

    const autorNome = autorMencao?.nome || "Um usuário";

    // Buscar dados da empresa
    const { data: empresa } = await supabase
      .from("empresas")
      .select("nome, logo_url")
      .eq("id", usuario.empresa_id)
      .single();

    const companyName = empresa?.nome || "GovernAII";
    const companyLogo = empresa?.logo_url || "https://governaii.com.br/governaii-logo.png";

    const appUrl = Deno.env.get("APP_URL") || "https://governaii.com.br";
    const controleLink = `${appUrl}/controles?detalhe=${controle_id}`;

    // Truncar comentário se for muito longo
    const comentarioTruncado = comentario.length > 200 
      ? comentario.substring(0, 200) + "..." 
      : comentario;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px; text-align: center; border-bottom: 1px solid #e4e4e7;">
              <img src="${companyLogo}" alt="${companyName}" style="max-height: 50px; max-width: 200px;" onerror="this.style.display='none'">
              <h2 style="color: #1e3a5f; margin: 16px 0 0 0; font-size: 20px;">${companyName}</h2>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <h1 style="color: #1e3a5f; margin: 0 0 24px 0; font-size: 24px;">
                💬 Você foi mencionado em um comentário
              </h1>
              
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Olá <strong>${usuario.nome}</strong>,
              </p>
              
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                <strong>${autorNome}</strong> mencionou você em um comentário no controle interno <strong>"${controle_nome}"</strong>.
              </p>
              
              <!-- Comentário Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f9ff; border-radius: 8px; border-left: 4px solid #0D9488; margin: 24px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px 0; color: #0D9488; font-size: 14px; font-weight: 600;">
                      Comentário:
                    </p>
                    <p style="margin: 0; color: #1e3a5f; font-size: 14px; line-height: 1.6; font-style: italic;">
                      "${comentarioTruncado}"
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                Clique no botão abaixo para visualizar o controle e responder ao comentário.
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${controleLink}" style="display: inline-block; background-color: #0D9488; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Ver Controle
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f4f4f5; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; color: #71717a; font-size: 12px;">
                Esta é uma mensagem automática do sistema ${companyName}.
              </p>
              <p style="margin: 8px 0 0 0; color: #71717a; font-size: 12px;">
                Powered by GovernAII
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const { error: emailError } = await resend.emails.send({
      from: `${companyName} <noreply@governaii.com.br>`,
      to: [usuario.email],
      subject: `[Controle Interno] ${autorNome} mencionou você em "${controle_nome}"`,
      html: emailHtml,
    });

    if (emailError) {
      console.error("Erro ao enviar e-mail:", emailError);
      throw emailError;
    }

    console.log(`E-mail de menção enviado para ${usuario.email}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro na função:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
