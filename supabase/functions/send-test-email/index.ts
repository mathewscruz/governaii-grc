import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestEmailRequest { email: string; }

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autorizado");

    const { email }: TestEmailRequest = await req.json();
    if (!email || !email.includes("@")) throw new Error("E-mail inválido");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error("Usuário não autenticado");

    const { data: profile } = await supabase.from("profiles").select("empresa:empresas(nome, logo_url)").eq("user_id", user.id).single();

    const companyName = profile?.empresa?.nome || "Akuris";
    const logoUrl = profile?.empresa?.logo_url || "https://akuris.com.br/akuris-logo.png";

    const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #0a1628; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f7fa;">
  <div style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); overflow: hidden;">
    <div style="text-align: center; padding: 32px 32px 24px; border-bottom: 1px solid #e2e8f0;">
      <img src="${logoUrl}" alt="${companyName}" style="max-height: 60px; max-width: 200px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
      <p style="display: none; font-size: 24px; font-weight: 700; color: #7552ff; margin: 0;">${companyName}</p>
    </div>
    <div style="padding: 32px;">
      <h1 style="color: #0a1628; font-size: 22px; font-weight: 600; margin: 0 0 24px;">✅ E-mail de Teste</h1>
      <p style="font-size: 15px; color: #3c4149; margin: 0 0 16px;">Este é um e-mail de teste enviado pelo sistema <strong>${companyName}</strong>.</p>
      <p style="font-size: 15px; color: #3c4149; margin: 0 0 24px;">Se você está recebendo este e-mail, significa que o serviço de envio de e-mails está funcionando corretamente.</p>
      <div style="background-color: #f0eeff; border-left: 4px solid #7552ff; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
        <p style="margin: 0 0 8px; font-size: 14px;"><strong>Destinatário:</strong> ${email}</p>
        <p style="margin: 0 0 8px; font-size: 14px;"><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
        <p style="margin: 0; font-size: 14px;"><strong>Status:</strong> <span style="color: #16a34a; font-weight: 600;">Entregue com sucesso</span></p>
      </div>
      <div style="text-align: center; margin: 24px 0;">
        <a href="https://akuris.com.br" style="display: inline-block; background-color: #7552ff; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">Acessar Plataforma</a>
      </div>
    </div>
    <div style="border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center;">
      <p style="font-size: 12px; color: #8898aa; margin: 0;">Este é um e-mail automático do ${companyName}.</p>
      <p style="font-size: 12px; color: #8898aa; margin: 8px 0 0;"><a href="https://akuris.com.br" style="color: #7552ff; text-decoration: none;">Akuris</a> • Plataforma de Governança, Risco e Compliance</p>
      <p style="font-size: 12px; color: #8898aa; margin: 8px 0 0;">© ${new Date().getFullYear()} Akuris. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>`;

    const { error: emailError } = await resend.emails.send({
      from: `${companyName} <noreply@akuris.com.br>`,
      to: [email],
      subject: `[TESTE] ${companyName} - Teste de E-mail`,
      html: emailHtml,
    });

    if (emailError) throw emailError;

    return new Response(JSON.stringify({ success: true, message: "E-mail de teste enviado com sucesso!" }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (error: any) {
    console.error("Erro na função send-test-email:", error);
    return new Response(JSON.stringify({ error: error.message, success: false }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
};

serve(handler);
