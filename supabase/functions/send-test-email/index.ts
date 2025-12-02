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

interface TestEmailRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Não autorizado");
    }

    const { email }: TestEmailRequest = await req.json();
    
    if (!email || !email.includes("@")) {
      throw new Error("E-mail inválido");
    }

    console.log(`Enviando e-mail de teste para: ${email}`);

    // Buscar dados da empresa do usuário
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Usuário não autenticado");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("empresa:empresas(nome, logo_url)")
      .eq("user_id", user.id)
      .single();

    const companyName = profile?.empresa?.nome || "GovernAII";
    const logoUrl = profile?.empresa?.logo_url || "https://governaii.com.br/governaii-logo.png";

    const emailHtml = `
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
              padding: 0;
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
              color: #3c4149;
              font-size: 14px;
              line-height: 24px;
              margin: 0 0 16px;
            }
            .info-box {
              background-color: #f6f9fc;
              border: 1px solid #e6ebf1;
              border-radius: 6px;
              padding: 16px;
              margin: 16px 0;
            }
            .code {
              background-color: #f6f9fc;
              border: 1px solid #e6ebf1;
              border-radius: 4px;
              color: #1a1a1a;
              font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
              font-size: 14px;
              font-weight: 600;
              padding: 12px 16px;
              display: block;
              text-align: center;
              letter-spacing: 0.5px;
              margin: 8px 0;
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
            .warning-box {
              background-color: #fff8e6;
              border: 1px solid #ffd666;
              border-left: 4px solid #faad14;
              border-radius: 6px;
              padding: 16px;
              margin: 16px 0;
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
            </div>
            
            <div class="header">
              <h1>Bem-vindo, Usuário de Teste!</h1>
            </div>
            
            <div class="content">
              <p>
                Sua conta foi criada com sucesso no GovernAII.
              </p>

              <p>
                Use as credenciais abaixo para fazer seu primeiro acesso:
              </p>

              <div class="info-box">
                <p style="margin: 0 0 8px;">
                  <strong>E-mail:</strong> ${email}
                </p>
                <p style="margin: 0 0 8px;">
                  <strong>Senha temporária:</strong>
                </p>
                <div class="code">Teste@123</div>
              </div>

              <div class="button-section">
                <a href="https://governaii.com.br" class="button">
                  Acessar Plataforma
                </a>
              </div>

              <div class="warning-box">
                <p style="margin: 0; font-size: 13px;">
                  <strong>Importante:</strong> Por segurança, você será solicitado a alterar sua senha no primeiro acesso.
                </p>
              </div>

              <p>
                Se você não solicitou este cadastro, por favor desconsidere este e-mail.
              </p>
            </div>
            
            <div class="footer">
              <p>Este é um e-mail automático do GovernAII.</p>
              <p>Em caso de dúvidas, entre em contato conosco.</p>
              <p>
                <a href="https://governaii.com.br" style="color: #2563eb; text-decoration: none;">GovernAII</a>
                • Plataforma de Governança, Risco e Compliance
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const { error: emailError } = await resend.emails.send({
      from: `${companyName} <noreply@governaii.com.br>`,
      to: [email],
      subject: `[TESTE] ${companyName} - Novo Layout de E-mail`,
      html: emailHtml,
    });

    if (emailError) {
      console.error("Erro ao enviar e-mail:", emailError);
      throw emailError;
    }

    console.log("E-mail de teste enviado com sucesso");

    return new Response(JSON.stringify({ 
      success: true, 
      message: "E-mail de teste enviado com sucesso!" 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Erro na função send-test-email:", error);
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