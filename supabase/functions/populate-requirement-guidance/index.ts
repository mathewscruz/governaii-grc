import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiKey) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const frameworkId = body.framework_id;
    const batchSize = body.batch_size || 10;

    let query = supabase
      .from("gap_analysis_requirements")
      .select("id, codigo, titulo, descricao, categoria")
      .is("orientacao_implementacao", null)
      .order("ordem", { ascending: true })
      .limit(batchSize);

    if (frameworkId) {
      query = query.eq("framework_id", frameworkId);
    }

    const { data: requirements, error: fetchError } = await query;
    if (fetchError) throw fetchError;

    if (!requirements || requirements.length === 0) {
      return new Response(JSON.stringify({ message: "All requirements already have guidance", processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processed = 0;

    for (const req of requirements) {
      try {
        const prompt = `Você é um consultor especialista em conformidade e certificações (ISO 27001, NIST, LGPD, PCI DSS, SOC 2, etc.).

Para o requisito abaixo, gere orientações em linguagem simples e acessível para um gestor leigo:

Código: ${req.codigo || "N/A"}
Título: ${req.titulo}
Descrição: ${req.descricao || "Sem descrição"}
Categoria: ${req.categoria || "Geral"}

Responda em JSON com exatamente estes campos:
{
  "orientacao_implementacao": "Texto explicando em linguagem simples o que este controle exige e como implementá-lo na prática. 3-5 parágrafos curtos.",
  "exemplos_evidencias": "Lista de exemplos de evidências aceitas, uma por linha, iniciando com '- '. De 4 a 8 exemplos."
}

Regras:
- Linguagem simples, sem jargão técnico
- Exemplos práticos e específicos
- Foco em ações que o gestor pode tomar imediatamente`;

        const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openaiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            response_format: { type: "json_object" },
          }),
        });

        if (!aiResponse.ok) {
          console.error(`AI error for ${req.codigo}: ${aiResponse.statusText}`);
          continue;
        }

        const aiData = await aiResponse.json();
        const content = JSON.parse(aiData.choices[0].message.content);

        const { error: updateError } = await supabase
          .from("gap_analysis_requirements")
          .update({
            orientacao_implementacao: content.orientacao_implementacao,
            exemplos_evidencias: content.exemplos_evidencias,
          })
          .eq("id", req.id);

        if (updateError) {
          console.error(`Update error for ${req.codigo}:`, updateError);
          continue;
        }

        processed++;
      } catch (e) {
        console.error(`Error processing ${req.codigo}:`, e);
      }
    }

    return new Response(JSON.stringify({
      message: `Processed ${processed} of ${requirements.length} requirements`,
      processed,
      total: requirements.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
