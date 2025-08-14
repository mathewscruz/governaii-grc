import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { agent_token, hostname, ip_address, status, system_info } = await req.json();

    if (!agent_token) {
      throw new Error('Agent token is required');
    }

    console.log(`Received heartbeat from agent: ${agent_token}, hostname: ${hostname}, status: ${status}`);

    // Atualizar status do agente
    const { data: agent, error: updateError } = await supabaseClient
      .from('asset_agents')
      .update({
        hostname: hostname,
        ip_address: ip_address,
        last_heartbeat: new Date().toISOString(),
        status: status || 'online',
        updated_at: new Date().toISOString()
      })
      .eq('agent_token', agent_token)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating agent:', updateError);
      throw new Error('Failed to update agent status');
    }

    if (!agent) {
      throw new Error('Agent not found');
    }

    // Atualizar status dos ativos associados a este agente
    const { error: ativosUpdateError } = await supabaseClient
      .from('ativos')
      .update({
        agent_status: status || 'online',
        ip_address: ip_address,
        hostname: hostname,
        last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('agent_id', agent.id);

    if (ativosUpdateError) {
      console.error('Error updating ativos status:', ativosUpdateError);
      // Não falhar aqui, apenas logar o erro
    }

    console.log(`Agent ${agent_token} heartbeat processed successfully`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Heartbeat received',
      agent_id: agent.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing heartbeat:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});