import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LicencaVencendo {
  id: string;
  nome: string;
  data_vencimento: string;
  tipo_licenca: string;
  responsavel: string | null;
  empresa_id: string;
  diasRestantes: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Buscar empresas ativas
    const { data: empresas, error: empresasError } = await supabase
      .from('empresas')
      .select('id, nome')
      .eq('ativo', true);

    if (empresasError) throw empresasError;

    const hoje = new Date();
    const resultados: any[] = [];

    for (const empresa of empresas || []) {
      // Buscar licenças ativas da empresa
      const { data: licencas, error: licencasError } = await supabase
        .from('ativos_licencas')
        .select('*')
        .eq('empresa_id', empresa.id)
        .eq('status', 'ativa')
        .not('data_vencimento', 'is', null);

      if (licencasError) {
        console.error(`Erro ao buscar licenças da empresa ${empresa.id}:`, licencasError);
        continue;
      }

      // Processar cada licença
      for (const licenca of licencas || []) {
        const dataVencimento = new Date(licenca.data_vencimento);
        const diffTime = dataVencimento.getTime() - hoje.getTime();
        const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Notificar se faltam 7, 15 ou 30 dias, ou se já venceu
        let tipoNotificacao = '';
        if (diasRestantes < 0) {
          tipoNotificacao = 'vencido';
        } else if (diasRestantes <= 7) {
          tipoNotificacao = 'vencimento_7d';
        } else if (diasRestantes <= 15) {
          tipoNotificacao = 'vencimento_15d';
        } else if (diasRestantes <= 30) {
          tipoNotificacao = 'vencimento_30d';
        }

        if (!tipoNotificacao) continue;

        // Verificar se já foi enviada notificação deste tipo
        const { data: jaEnviado } = await supabase
          .from('ativos_notificacoes_enviadas')
          .select('id')
          .eq('empresa_id', empresa.id)
          .eq('modulo', 'licencas')
          .eq('registro_id', licenca.id)
          .eq('tipo_notificacao', tipoNotificacao)
          .gte('enviado_em', new Date(hoje.getTime() - 24 * 60 * 60 * 1000).toISOString())
          .single();

        if (jaEnviado) continue;

        // Buscar usuários admin da empresa para enviar email
        const { data: admins } = await supabase
          .from('profiles')
          .select('email, nome')
          .eq('empresa_id', empresa.id)
          .in('role', ['admin', 'super_admin']);

        if (admins && admins.length > 0) {
          for (const admin of admins) {
            try {
              const mensagem = diasRestantes < 0
                ? `A licença "${licenca.nome}" venceu há ${Math.abs(diasRestantes)} dias`
                : `A licença "${licenca.nome}" vence em ${diasRestantes} dias`;

              await resend.emails.send({
                from: "GovernAI <noreply@governaii.com>",
                to: [admin.email],
                subject: diasRestantes < 0 
                  ? `⚠️ Licença Vencida - ${licenca.nome}` 
                  : `🔔 Licença Vencendo - ${licenca.nome}`,
                html: `
                  <h2>Alerta de Vencimento de Licença</h2>
                  <p>Olá ${admin.nome},</p>
                  <p>${mensagem}</p>
                  <p><strong>Detalhes:</strong></p>
                  <ul>
                    <li><strong>Nome:</strong> ${licenca.nome}</li>
                    <li><strong>Tipo:</strong> ${licenca.tipo_licenca}</li>
                    <li><strong>Data de Vencimento:</strong> ${new Date(licenca.data_vencimento).toLocaleDateString('pt-BR')}</li>
                    <li><strong>Fornecedor:</strong> ${licenca.fornecedor || 'N/A'}</li>
                  </ul>
                  <p>Acesse o sistema para renovar esta licença.</p>
                  <p>Atenciosamente,<br>Equipe GovernAI</p>
                `,
              });

              // Registrar notificação enviada
              await supabase
                .from('ativos_notificacoes_enviadas')
                .insert({
                  empresa_id: empresa.id,
                  modulo: 'licencas',
                  registro_id: licenca.id,
                  tipo_notificacao: tipoNotificacao,
                  canal: 'email',
                  destinatario_email: admin.email,
                  status: 'enviado'
                });

              resultados.push({
                licenca: licenca.nome,
                email: admin.email,
                tipo: tipoNotificacao,
                status: 'enviado'
              });
            } catch (emailError) {
              console.error('Erro ao enviar email:', emailError);
              resultados.push({
                licenca: licenca.nome,
                email: admin.email,
                tipo: tipoNotificacao,
                status: 'erro',
                erro: emailError
              });
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, resultados }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Erro no processamento:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
