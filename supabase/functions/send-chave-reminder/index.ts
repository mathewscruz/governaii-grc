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
      // Buscar chaves ativas da empresa
      const { data: chaves, error: chavesError } = await supabase
        .from('ativos_chaves_criptograficas')
        .select('*')
        .eq('empresa_id', empresa.id)
        .eq('status', 'ativa')
        .not('data_proxima_rotacao', 'is', null);

      if (chavesError) {
        console.error(`Erro ao buscar chaves da empresa ${empresa.id}:`, chavesError);
        continue;
      }

      // Processar cada chave
      for (const chave of chaves || []) {
        const dataRotacao = new Date(chave.data_proxima_rotacao);
        const diffTime = dataRotacao.getTime() - hoje.getTime();
        const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Notificar se faltam 7, 15 ou 30 dias, ou se já expirou
        let tipoNotificacao = '';
        if (diasRestantes < 0) {
          tipoNotificacao = 'expirado';
        } else if (diasRestantes <= 7) {
          tipoNotificacao = 'rotacao_7d';
        } else if (diasRestantes <= 15) {
          tipoNotificacao = 'rotacao_15d';
        } else if (diasRestantes <= 30) {
          tipoNotificacao = 'rotacao_30d';
        }

        if (!tipoNotificacao) continue;

        // Verificar se já foi enviada notificação deste tipo
        const { data: jaEnviado } = await supabase
          .from('ativos_notificacoes_enviadas')
          .select('id')
          .eq('empresa_id', empresa.id)
          .eq('modulo', 'chaves')
          .eq('registro_id', chave.id)
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
                ? `A chave "${chave.nome}" expirou há ${Math.abs(diasRestantes)} dias`
                : `A chave "${chave.nome}" precisa ser rotacionada em ${diasRestantes} dias`;

              await resend.emails.send({
                from: "GovernAI <noreply@governaii.com>",
                to: [admin.email],
                subject: diasRestantes < 0 
                  ? `⚠️ Chave Expirada - ${chave.nome}` 
                  : `🔔 Rotação de Chave Necessária - ${chave.nome}`,
                html: `
                  <h2>Alerta de Rotação de Chave Criptográfica</h2>
                  <p>Olá ${admin.nome},</p>
                  <p>${mensagem}</p>
                  <p><strong>Detalhes:</strong></p>
                  <ul>
                    <li><strong>Nome:</strong> ${chave.nome}</li>
                    <li><strong>Tipo:</strong> ${chave.tipo_chave}</li>
                    <li><strong>Ambiente:</strong> ${chave.ambiente}</li>
                    <li><strong>Próxima Rotação:</strong> ${new Date(chave.data_proxima_rotacao).toLocaleDateString('pt-BR')}</li>
                    <li><strong>Localização:</strong> ${chave.localizacao}</li>
                    <li><strong>Criticidade:</strong> ${chave.criticidade}</li>
                  </ul>
                  <p>Acesse o sistema para realizar a rotação desta chave.</p>
                  <p><strong>Atenção:</strong> Chaves críticas devem ser rotacionadas imediatamente para garantir a segurança.</p>
                  <p>Atenciosamente,<br>Equipe GovernAI</p>
                `,
              });

              // Registrar notificação enviada
              await supabase
                .from('ativos_notificacoes_enviadas')
                .insert({
                  empresa_id: empresa.id,
                  modulo: 'chaves',
                  registro_id: chave.id,
                  tipo_notificacao: tipoNotificacao,
                  canal: 'email',
                  destinatario_email: admin.email,
                  status: 'enviado'
                });

              resultados.push({
                chave: chave.nome,
                email: admin.email,
                tipo: tipoNotificacao,
                status: 'enviado'
              });
            } catch (emailError) {
              console.error('Erro ao enviar email:', emailError);
              resultados.push({
                chave: chave.nome,
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
