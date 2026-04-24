import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tipo, webhook_url, email, api_token, instance_url, project_key, headers } = await req.json();

    console.log(`Testing connection for: ${tipo}`);

    let success = false;
    let errorMessage = '';

    switch (tipo) {
      case 'slack': {
        // Enviar mensagem de teste para Slack
        const slackPayload = {
          text: "🔗 *GovernAII - Teste de Conexão*",
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "✅ *Conexão com GovernAII estabelecida com sucesso!*\n\nVocê receberá notificações neste canal."
              }
            },
            {
              type: "context",
              elements: [
                {
                  type: "mrkdwn",
                  text: `📅 Teste realizado em ${new Date().toLocaleString('pt-BR')}`
                }
              ]
            }
          ]
        };

        const slackResponse = await fetch(webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slackPayload)
        });

        success = slackResponse.ok;
        if (!success) {
          errorMessage = `Slack retornou status ${slackResponse.status}`;
        }
        break;
      }

      case 'teams': {
        // Enviar Adaptive Card para Teams
        const teamsPayload = {
          "@type": "MessageCard",
          "@context": "http://schema.org/extensions",
          "themeColor": "0D9488",
          "summary": "GovernAII - Teste de Conexão",
          "sections": [{
            "activityTitle": "✅ Conexão com GovernAII estabelecida!",
            "activitySubtitle": new Date().toLocaleString('pt-BR'),
            "activityImage": "https://akuris.com.br/akuris-logo.png",
            "facts": [{
              "name": "Status",
              "value": "Conectado com sucesso"
            }],
            "markdown": true
          }]
        };

        const teamsResponse = await fetch(webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(teamsPayload)
        });

        success = teamsResponse.ok;
        if (!success) {
          errorMessage = `Teams retornou status ${teamsResponse.status}`;
        }
        break;
      }

      case 'webhook': {
        // Enviar payload de teste para webhook genérico
        const testPayload = {
          evento: "teste_conexao",
          timestamp: new Date().toISOString(),
          mensagem: "Teste de conexão do GovernAII",
          dados: {
            fonte: "GovernAII",
            tipo: "teste"
          }
        };

        const webhookHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(headers || {})
        };

        const webhookResponse = await fetch(webhook_url, {
          method: 'POST',
          headers: webhookHeaders,
          body: JSON.stringify(testPayload)
        });

        // Aceita 2xx e alguns 3xx como sucesso
        success = webhookResponse.status >= 200 && webhookResponse.status < 400;
        if (!success) {
          errorMessage = `Webhook retornou status ${webhookResponse.status}`;
        }
        break;
      }

      case 'jira': {
        // Testar autenticação com Jira
        const auth = btoa(`${email}:${api_token}`);
        
        // Primeiro testar autenticação buscando o usuário atual
        const jiraResponse = await fetch(`${instance_url}/rest/api/3/myself`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          }
        });

        if (!jiraResponse.ok) {
          success = false;
          errorMessage = `Falha na autenticação: ${jiraResponse.status}`;
          break;
        }

        // Se tiver project_key, verificar se o projeto existe
        if (project_key) {
          const projectResponse = await fetch(`${instance_url}/rest/api/3/project/${project_key}`, {
            method: 'GET',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/json'
            }
          });

          if (!projectResponse.ok) {
            success = false;
            errorMessage = `Projeto ${project_key} não encontrado`;
            break;
          }
        }

        success = true;
        break;
      }

      default:
        errorMessage = `Tipo de integração não suportado: ${tipo}`;
    }

    console.log(`Connection test result: ${success ? 'SUCCESS' : 'FAILED'} - ${errorMessage}`);

    return new Response(
      JSON.stringify({ success, error: errorMessage || null }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error testing connection:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error instanceof Error ? error.message : String(error)) || 'Erro ao testar conexão' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  }
});
