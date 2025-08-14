import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseKey)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Iniciando processamento diário de lembretes de convite')
    
    // Buscar todas as empresas com lembretes habilitados
    const { data: empresasAtivas, error: empresasError } = await supabase
      .from('empresa_reminder_settings')
      .select('empresa_id')
      .eq('reminders_enabled', true)

    if (empresasError) {
      console.error('Erro ao buscar empresas ativas:', empresasError)
      throw empresasError
    }

    if (!empresasAtivas || empresasAtivas.length === 0) {
      console.log('Nenhuma empresa com lembretes habilitados encontrada')
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Nenhuma empresa com lembretes habilitados',
        empresas_processadas: 0
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    let empresasProcessadas = 0
    let totalEnviados = 0
    let totalErros = 0

    // Processar lembretes para cada empresa
    for (const empresa of empresasAtivas) {
      try {
        console.log(`Processando lembretes para empresa ${empresa.empresa_id}`)
        
        // Chamar a função de processamento de lembretes para esta empresa
        const { data, error } = await supabase.functions.invoke('process-invitation-reminders', {
          body: { empresa_id: empresa.empresa_id }
        })

        if (error) {
          console.error(`Erro ao processar empresa ${empresa.empresa_id}:`, error)
          totalErros++
          continue
        }

        console.log(`Empresa ${empresa.empresa_id} processada:`, data)
        empresasProcessadas++
        totalEnviados += data.sent || 0
        totalErros += data.errors || 0

      } catch (error) {
        console.error(`Erro ao processar empresa ${empresa.empresa_id}:`, error)
        totalErros++
      }
    }

    const resultado = {
      success: true,
      message: 'Processamento diário concluído',
      empresas_com_lembretes: empresasAtivas.length,
      empresas_processadas: empresasProcessadas,
      total_lembretes_enviados: totalEnviados,
      total_erros: totalErros,
      timestamp: new Date().toISOString()
    }

    console.log('Resultado do processamento diário:', resultado)

    return new Response(JSON.stringify(resultado), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })

  } catch (error: any) {
    console.error('Erro na função daily-reminder-processor:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Falha no processamento diário de lembretes'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    )
  }
})