import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  denuncia_id: string;
  empresa_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    const { denuncia_id, empresa_id }: NotificationRequest = await req.json();

    // Buscar dados da denúncia
    const { data: denuncia, error: denunciaError } = await supabaseClient
      .from('denuncias')
      .select(`
        *,
        categoria:denuncias_categorias(nome),
        empresa:empresas(nome)
      `)
      .eq('id', denuncia_id)
      .single();

    if (denunciaError || !denuncia) {
      throw new Error('Denúncia não encontrada');
    }

    // Buscar configurações da empresa
    const { data: config, error: configError } = await supabaseClient
      .from('denuncias_configuracoes')
      .select('*')
      .eq('empresa_id', empresa_id)
      .single();

    if (configError || !config || !config.notificar_administradores) {
      console.log('Notificações desabilitadas ou configuração não encontrada');
      return new Response(JSON.stringify({ success: true, message: 'Notificações desabilitadas' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar administradores da empresa
    const { data: admins, error: adminsError } = await supabaseClient
      .from('profiles')
      .select('email, nome')
      .eq('empresa_id', empresa_id)
      .in('role', ['admin', 'super_admin']);

    if (adminsError || !admins || admins.length === 0) {
      console.log('Nenhum administrador encontrado');
      return new Response(JSON.stringify({ success: true, message: 'Nenhum administrador encontrado' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Preparar lista de e-mails
    const emailList = new Set<string>();
    
    // Adicionar e-mails dos administradores
    admins.forEach(admin => {
      if (admin.email) {
        emailList.add(admin.email);
      }
    });

    // Adicionar e-mails da configuração
    if (config.emails_notificacao && config.emails_notificacao.length > 0) {
      config.emails_notificacao.forEach((email: string) => {
        if (email && email.includes('@')) {
          emailList.add(email.trim());
        }
      });
    }

    if (emailList.size === 0) {
      console.log('Nenhum e-mail válido encontrado');
      return new Response(JSON.stringify({ success: true, message: 'Nenhum e-mail válido' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Preparar conteúdo do e-mail
    const gravidadeMap: Record<string, string> = {
      baixa: 'Baixa',
      media: 'Média',
      alta: 'Alta',
      critica: 'Crítica'
    };

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 20px; }
            .content { background-color: #ffffff; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #495057; }
            .value { margin-top: 5px; }
            .alert { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
            .badge-alta { background-color: #ffeaa7; color: #856404; }
            .badge-critica { background-color: #f8d7da; color: #721c24; }
            .badge-media { background-color: #fff3cd; color: #856404; }
            .badge-baixa { background-color: #d1ecf1; color: #0c5460; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Nova Denúncia Recebida</h1>
              <p>Canal de Denúncia - ${denuncia.empresa?.nome || 'Sistema'}</p>
            </div>
            
            <div class="content">
              <div class="field">
                <div class="label">Protocolo:</div>
                <div class="value"><strong>${denuncia.protocolo}</strong></div>
              </div>
              
              <div class="field">
                <div class="label">Título:</div>
                <div class="value">${denuncia.titulo}</div>
              </div>
              
              <div class="field">
                <div class="label">Gravidade:</div>
                <div class="value">
                  <span class="badge badge-${denuncia.gravidade}">${gravidadeMap[denuncia.gravidade] || denuncia.gravidade}</span>
                </div>
              </div>
              
              ${denuncia.categoria ? `
              <div class="field">
                <div class="label">Categoria:</div>
                <div class="value">${denuncia.categoria.nome}</div>
              </div>
              ` : ''}
              
              <div class="field">
                <div class="label">Tipo:</div>
                <div class="value">${denuncia.anonima ? 'Denúncia Anônima' : 'Denúncia Identificada'}</div>
              </div>
              
              <div class="field">
                <div class="label">Data/Hora:</div>
                <div class="value">${new Date(denuncia.created_at).toLocaleString('pt-BR')}</div>
              </div>
              
              <div class="field">
                <div class="label">Descrição:</div>
                <div class="value" style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; white-space: pre-wrap;">${denuncia.descricao}</div>
              </div>
            </div>
            
            <div class="alert">
              <strong>Ação Necessária:</strong> Uma nova denúncia foi registrada e requer sua atenção. 
              Acesse o sistema para revisar e iniciar o processo de tratamento adequado.
            </div>
            
            <p style="font-size: 12px; color: #6c757d; text-align: center; margin-top: 30px;">
              Este é um e-mail automático do sistema de Canal de Denúncia. 
              Trate esta informação com confidencialidade.
            </p>
          </div>
        </body>
      </html>
    `;

    // Enviar e-mails
    const emailPromises = Array.from(emailList).map(async (email) => {
      try {
        const { error: emailError } = await resend.emails.send({
          from: 'Canal de Denúncia <noreply@governaii.com>',
          to: [email],
          subject: `Nova Denúncia - Protocolo ${denuncia.protocolo}`,
          html: emailHtml,
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

    return new Response(JSON.stringify({ 
      success: true, 
      sent: successCount, 
      total: results.length,
      results 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Erro na função de notificação:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Erro interno do servidor' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);