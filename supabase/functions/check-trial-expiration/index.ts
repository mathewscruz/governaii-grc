import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Chamar a function que verifica e desabilita empresas com trial expirado
    const { error } = await supabaseAdmin.rpc('check_trial_expiration');

    if (error) {
      console.error('Erro ao verificar trials expirados:', error);
      throw error;
    }

    // Buscar empresas que foram desabilitadas para log
    const { data: empresasDesabilitadas, error: fetchError } = await supabaseAdmin
      .from('empresas')
      .select('id, nome, data_inicio_trial')
      .eq('status_licenca', 'trial')
      .eq('ativo', false)
      .gte('updated_at', new Date(Date.now() - 60000).toISOString()); // últimas atualizações (1 min)

    if (fetchError) {
      console.error('Erro ao buscar empresas desabilitadas:', fetchError);
    }

    const resultado = {
      success: true,
      message: 'Verificação de trials concluída',
      empresas_desabilitadas: empresasDesabilitadas?.length || 0,
      empresas: empresasDesabilitadas?.map(e => ({
        id: e.id,
        nome: e.nome,
        data_inicio_trial: e.data_inicio_trial,
      })) || [],
      executed_at: new Date().toISOString(),
    };

    console.log('Resultado:', resultado);

    return new Response(JSON.stringify(resultado), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Erro na edge function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: (error instanceof Error ? error.message : String(error)),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
