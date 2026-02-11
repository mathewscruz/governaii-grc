import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IntegrationConfig {
  id: string;
  tipo_integracao: string;
  webhook_url: string | null;
  configuracoes: {
    eventos?: string[];
    headers?: Record<string, string>;
  };
  status: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      empresa_id, 
      evento, 
      titulo, 
      descricao, 
      link, 
      dados, 
      gravidade,
      triggered_by,
      timestamp 
    } = await req.json();

    if (!empresa_id || !evento) {
      return new Response(
        JSON.stringify({ error: 'empresa_id e evento são obrigatórios' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Dispatching event: ${evento} for empresa: ${empresa_id}`);

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar integrações ativas da empresa
    const { data: integrations, error: fetchError } = await supabase
      .from('integracoes_config')
      .select('*')
      .eq('empresa_id', empresa_id)
      .eq('status', 'conectado');

    if (fetchError) {
      console.error('Erro ao buscar integrações:', fetchError);
      throw fetchError;
    }

    if (!integrations || integrations.length === 0) {
      console.log('Nenhuma integração ativa encontrada');
      return new Response(
        JSON.stringify({ dispatched: 0, message: 'Nenhuma integração ativa' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: { tipo: string; success: boolean; error?: string }[] = [];

    for (const integration of integrations as IntegrationConfig[]) {
      // Verificar se evento está na lista de eventos configurados
      const eventosConfigurados = integration.configuracoes?.eventos || [];
      if (eventosConfigurados.length > 0 && !eventosConfigurados.includes(evento)) {
        console.log(`Evento ${evento} não configurado para ${integration.tipo_integracao}`);
        continue;
      }

      if (!integration.webhook_url) {
        console.log(`Webhook URL não configurada para ${integration.tipo_integracao}`);
        continue;
      }

      try {
        let success = false;
        let responseStatus = 0;

        switch (integration.tipo_integracao) {
          case 'slack': {
            const gravidadeEmoji = gravidade === 'critica' ? '🔴' : 
                                   gravidade === 'alta' ? '🟠' : 
                                   gravidade === 'media' ? '🟡' : '🟢';
            
            const slackPayload = {
              blocks: [
                {
                  type: "header",
                  text: {
                    type: "plain_text",
                    text: `${gravidadeEmoji} ${titulo}`,
                    emoji: true
                  }
                },
                ...(descricao ? [{
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    text: descricao
                  }
                }] : []),
                {
                  type: "context",
                  elements: [
                    {
                      type: "mrkdwn",
                      text: `📋 *Evento:* ${evento} | 🕐 ${new Date(timestamp || Date.now()).toLocaleString('pt-BR')}`
                    }
                  ]
                },
                ...(link ? [{
                  type: "actions",
                  elements: [{
                    type: "button",
                    text: {
                      type: "plain_text",
                      text: "Ver no Akuris",
                      emoji: true
                    },
                    url: link
                  }]
                }] : [])
              ]
            };

            const slackResponse = await fetch(integration.webhook_url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(slackPayload)
            });
            
            success = slackResponse.ok;
            responseStatus = slackResponse.status;
            break;
          }

          case 'teams': {
            const themeColor = gravidade === 'critica' ? 'FF0000' : 
                              gravidade === 'alta' ? 'FFA500' : 
                              gravidade === 'media' ? 'FFFF00' : '00FF00';

            const teamsPayload = {
              "@type": "MessageCard",
              "@context": "http://schema.org/extensions",
              "themeColor": themeColor,
              "summary": titulo,
              "sections": [{
                "activityTitle": titulo,
                "activitySubtitle": new Date(timestamp || Date.now()).toLocaleString('pt-BR'),
                "activityImage": "https://akuris.com.br/akuris-logo.png",
                "facts": [
                  { "name": "Evento", "value": evento },
                  ...(gravidade ? [{ "name": "Gravidade", "value": gravidade }] : [])
                ],
                "text": descricao || '',
                "markdown": true
              }],
              ...(link ? {
                "potentialAction": [{
                  "@type": "OpenUri",
                  "name": "Ver no Akuris",
                  "targets": [{ "os": "default", "uri": link }]
                }]
              } : {})
            };

            const teamsResponse = await fetch(integration.webhook_url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(teamsPayload)
            });
            
            success = teamsResponse.ok;
            responseStatus = teamsResponse.status;
            break;
          }

          case 'webhooks': {
            const webhookPayload = {
              evento,
              timestamp: timestamp || new Date().toISOString(),
              titulo,
              descricao,
              link,
              gravidade,
              dados: dados || {},
              empresa_id
            };

            const webhookHeaders: Record<string, string> = {
              'Content-Type': 'application/json',
              ...(integration.configuracoes?.headers || {})
            };

            const webhookResponse = await fetch(integration.webhook_url, {
              method: 'POST',
              headers: webhookHeaders,
              body: JSON.stringify(webhookPayload)
            });
            
            success = webhookResponse.status >= 200 && webhookResponse.status < 400;
            responseStatus = webhookResponse.status;
            break;
          }
        }

        // Registrar log
        await supabase.from('integracoes_webhook_logs').insert({
          integracao_id: integration.id,
          evento,
          payload: { titulo, descricao, link, dados, gravidade },
          status_code: responseStatus,
          sucesso: success,
          empresa_id
        });

        results.push({ 
          tipo: integration.tipo_integracao, 
          success 
        });

        console.log(`Dispatched to ${integration.tipo_integracao}: ${success ? 'SUCCESS' : 'FAILED'}`);

      } catch (integrationError) {
        console.error(`Error dispatching to ${integration.tipo_integracao}:`, integrationError);
        
        // Registrar erro no log
        await supabase.from('integracoes_webhook_logs').insert({
          integracao_id: integration.id,
          evento,
          payload: { titulo, descricao, link, dados, gravidade },
          status_code: 0,
          sucesso: false,
          resposta: { error: integrationError.message },
          empresa_id
        });

        results.push({ 
          tipo: integration.tipo_integracao, 
          success: false, 
          error: integrationError.message 
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        dispatched: results.filter(r => r.success).length,
        total: results.length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Dispatcher error:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
