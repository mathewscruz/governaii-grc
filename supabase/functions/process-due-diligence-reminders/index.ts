import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { assessment_id, days_before_expiration = 3 } = await req.json();

    // Buscar assessments que expiram em X dias e ainda não estão concluídos
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.39.3");
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days_before_expiration);

    const { data: assessments, error } = await supabase
      .from('due_diligence_assessments')
      .select(`
        id,
        fornecedor_nome,
        fornecedor_email,
        token,
        data_expiracao,
        due_diligence_templates!inner(nome)
      `)
      .eq('status', 'enviado')
      .lt('data_expiracao', futureDate.toISOString())
      .gt('data_expiracao', new Date().toISOString());

    if (error) throw error;

    console.log(`Encontrados ${assessments?.length || 0} assessments para lembrete`);

    // Enviar lembretes para cada assessment
    let successCount = 0;
    let errorCount = 0;

    for (const assessment of assessments || []) {
      try {
        const assessmentLink = `${Deno.env.get('SITE_URL') || 'https://app.exemplo.com'}/assessment/${assessment.token}`;
        
        const response = await supabase.functions.invoke('send-due-diligence-email', {
          body: {
            type: 'reminder',
            assessment_id: assessment.id,
            fornecedor_nome: assessment.fornecedor_nome,
            fornecedor_email: assessment.fornecedor_email,
            template_nome: assessment.due_diligence_templates.nome,
            assessment_link: assessmentLink,
            data_expiracao: assessment.data_expiracao,
            empresa_nome: 'Akuris'
          }
        });

        if (response.error) {
          throw new Error(`Erro ao enviar email: ${response.error.message || String(response.error)}`);
        }

        successCount++;
        console.log(`Lembrete enviado para ${assessment.fornecedor_email}`);

      } catch (emailError) {
        console.error(`Erro ao enviar lembrete para ${assessment.fornecedor_email}:`, emailError);
        errorCount++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Processados ${assessments?.length || 0} assessments`,
      details: {
        total: assessments?.length || 0,
        success: successCount,
        errors: errorCount
      }
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Erro no processamento de lembretes:", error);
    return new Response(
      JSON.stringify({
        error: (error instanceof Error ? error.message : String(error)),
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