import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  contrato_id: string;
  nome: string;
  numero_contrato: string;
  fornecedor_nome?: string;
  data_fim: string;
  valor?: number;
  gestor_id?: string;
  empresa_id: string;
  dias_restantes: number;
}

const handler = async (req: Request): Promise<Response> => {
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
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      contrato_id,
      nome,
      numero_contrato,
      fornecedor_nome,
      data_fim,
      valor,
      gestor_id,
      empresa_id,
      dias_restantes
    }: NotificationRequest = await req.json();

    console.log("Processing contrato vencimento notification:", { contrato_id, nome, dias_restantes });

    // Buscar dados da empresa
    let companyName = "GovernAII";
    let companyLogoUrl = "https://governaii.com.br/governaii-logo.png";

    const { data: empresaData } = await supabase
      .from("empresas")
      .select("nome, logo_url")
      .eq("id", empresa_id)
      .single();

    if (empresaData) {
      companyName = empresaData.nome || companyName;
      if (empresaData.logo_url) companyLogoUrl = empresaData.logo_url;
    }

    // Buscar destinatários
    const emailList = new Set<string>();

    // Buscar gestor do contrato
    let gestorNome = "";
    if (gestor_id) {
      const { data: gestor } = await supabase
        .from("profiles")
        .select("email, nome")
        .eq("user_id", gestor_id)
        .single();

      if (gestor?.email) {
        emailList.add(gestor.email);
        gestorNome = gestor.nome || "";
      }
    }

    // Buscar administradores
    const { data: admins } = await supabase
      .from("profiles")
      .select("email")
      .eq("empresa_id", empresa_id)
      .in("role", ["admin", "super_admin"]);

    admins?.forEach(admin => {
      if (admin.email) emailList.add(admin.email);
    });

    if (emailList.size === 0) {
      console.log("Nenhum destinatário encontrado");
      return new Response(
        JSON.stringify({ success: true, message: "Nenhum destinatário" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Determinar urgência
    const isUrgent = dias_restantes <= 7;
    const isCritical = dias_restantes <= 0;
    
    const urgencyConfig = isCritical 
      ? { color: "#dc2626", bg: "#fef2f2", text: "VENCIDO", icon: "🚨" }
      : isUrgent 
        ? { color: "#f97316", bg: "#fff7ed", text: `${dias_restantes} dias`, icon: "⚠️" }
        : { color: "#f59e0b", bg: "#fffbeb", text: `${dias_restantes} dias`, icon: "📅" };

    // Formatar data
    const formatDate = (dateStr: string): string => {
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

    // Formatar valor
    const formatCurrency = (val?: number): string => {
      if (!val) return "Não informado";
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
      }).format(val);
    };

    const contratoLink = `https://governaii.com.br/contratos?contrato=${contrato_id}`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e3a5f; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f7fa;">
  <div style="background-color: #ffffff; border-radius: 12px; padding: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.05); overflow: hidden;">
    
    <!-- Alert Banner -->
    <div style="background-color: ${urgencyConfig.color}; padding: 16px 32px; text-align: center;">
      <span style="color: #ffffff; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
        ${urgencyConfig.icon} Contrato ${isCritical ? 'Vencido' : 'Próximo do Vencimento'}
      </span>
    </div>

    <!-- Logo -->
    <div style="text-align: center; padding: 24px 32px 16px;">
      <img src="${companyLogoUrl}" alt="${companyName}" style="max-height: 50px; max-width: 200px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
      <p style="display: none; font-size: 20px; font-weight: 600; color: #1e3a5f; margin: 0;">${companyName}</p>
    </div>

    <div style="padding: 0 32px 32px;">
      <!-- Title -->
      <h1 style="font-size: 22px; color: #1e3a5f; margin: 0 0 24px; font-weight: 600;">
        ${isCritical ? 'Contrato Vencido!' : 'Contrato Próximo do Vencimento'}
      </h1>

      <!-- Countdown Badge -->
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; padding: 8px 24px; background-color: ${urgencyConfig.bg}; color: ${urgencyConfig.color}; border-radius: 20px; font-weight: 700; font-size: 16px; border: 2px solid ${urgencyConfig.color};">
          ${urgencyConfig.text}
        </span>
      </div>

      <!-- Contrato Info Box -->
      <div style="background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <h2 style="font-size: 16px; color: #1e3a5f; margin: 0 0 16px; font-weight: 600;">
          ${nome}
        </h2>
        
        <div style="display: grid; gap: 12px;">
          <div style="font-size: 14px; color: #475569;">
            <strong style="color: #64748b;">Nº Contrato:</strong> ${numero_contrato}
          </div>
          ${fornecedor_nome ? `
          <div style="font-size: 14px; color: #475569;">
            <strong style="color: #64748b;">Fornecedor:</strong> ${fornecedor_nome}
          </div>
          ` : ''}
          <div style="font-size: 14px; color: #475569;">
            <strong style="color: #64748b;">Data de Vencimento:</strong> ${formatDate(data_fim)}
          </div>
          <div style="font-size: 14px; color: #475569;">
            <strong style="color: #64748b;">Valor:</strong> ${formatCurrency(valor)}
          </div>
          ${gestorNome ? `
          <div style="font-size: 14px; color: #475569;">
            <strong style="color: #64748b;">Gestor:</strong> ${gestorNome}
          </div>
          ` : ''}
        </div>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${contratoLink}" 
           style="display: inline-block; background-color: #0D9488; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">
          Ver Contrato
        </a>
      </div>

      <!-- Action Required -->
      <div style="background-color: ${urgencyConfig.bg}; border-radius: 8px; padding: 16px; border-left: 4px solid ${urgencyConfig.color};">
        <p style="font-size: 13px; color: #475569; margin: 0;">
          <strong>Ação Recomendada:</strong> ${isCritical 
            ? 'Este contrato está vencido. Verifique a situação e tome as medidas necessárias.' 
            : 'Revise o contrato e inicie o processo de renovação ou encerramento conforme necessário.'}
        </p>
      </div>
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
</html>`;

    // Enviar e-mails
    const emailPromises = Array.from(emailList).map(async (email) => {
      try {
        const { error: emailError } = await resend.emails.send({
          from: `${companyName} <noreply@governaii.com.br>`,
          to: [email],
          subject: `[${companyName}] ${urgencyConfig.icon} Contrato ${isCritical ? 'Vencido' : 'Vencendo'}: ${nome}`,
          html: htmlContent,
        });

        if (emailError) {
          console.error(`Erro ao enviar para ${email}:`, emailError);
          return { email, success: false, error: emailError };
        }
        return { email, success: true };
      } catch (error) {
        console.error(`Erro ao enviar para ${email}:`, error);
        return { email, success: false, error };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r.success).length;

    console.log(`Notificações enviadas: ${successCount}/${results.length}`);

    // Criar notificação in-app para gestor
    if (gestor_id) {
      await supabase.from("notifications").insert({
        user_id: gestor_id,
        type: isCritical ? "error" : "warning",
        title: `Contrato ${isCritical ? 'Vencido' : 'Próximo do Vencimento'}`,
        message: `${nome} - ${urgencyConfig.text}`,
        link_to: `/contratos?contrato=${contrato_id}`,
        read: false,
      });
    }

    return new Response(
      JSON.stringify({ success: true, sent: successCount, total: results.length }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in send-contrato-vencimento-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
