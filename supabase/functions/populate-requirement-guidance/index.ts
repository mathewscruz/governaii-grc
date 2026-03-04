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
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await req.json().catch(() => ({}));
    const requirementId = body.requirement_id;
    const frameworkId = body.framework_id;
    const batchSize = body.batch_size || 10;

    // Single requirement mode
    if (requirementId) {
      const { data: req_data, error: fetchError } = await supabase
        .from("gap_analysis_requirements")
        .select("id, codigo, titulo, descricao, categoria")
        .eq("id", requirementId)
        .single();

      if (fetchError) throw fetchError;

      const guidance = await generateGuidance(req_data, lovableKey);
      if (!guidance) {
        return new Response(JSON.stringify({ error: "Failed to generate guidance" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: updateError } = await supabase
        .from("gap_analysis_requirements")
        .update({
          orientacao_implementacao: guidance.orientacao_implementacao,
          exemplos_evidencias: guidance.exemplos_evidencias,
        })
        .eq("id", requirementId);

      if (updateError) throw updateError;

      return new Response(JSON.stringify({
        message: "Guidance generated successfully",
        orientacao_implementacao: guidance.orientacao_implementacao,
        exemplos_evidencias: guidance.exemplos_evidencias,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Batch mode
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
    for (const r of requirements) {
      try {
        const guidance = await generateGuidance(r, lovableKey);
        if (!guidance) continue;

        const { error: updateError } = await supabase
          .from("gap_analysis_requirements")
          .update({
            orientacao_implementacao: guidance.orientacao_implementacao,
            exemplos_evidencias: guidance.exemplos_evidencias,
          })
          .eq("id", r.id);

        if (updateError) {
          console.error(`Update error for ${r.codigo}:`, updateError);
          continue;
        }
        processed++;
      } catch (e) {
        console.error(`Error processing ${r.codigo}:`, e);
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

async function generateGuidance(
  req: { codigo: string | null; titulo: string; descricao: string | null; categoria: string | null },
  apiKey: string
): Promise<{ orientacao_implementacao: string; exemplos_evidencias: string } | null> {
  const prompt = `Você é um consultor sênior de GRC (Governança, Riscos e Compliance) com 20 anos de experiência em Big4. Seu papel é explicar requisitos de conformidade para gestores que NÃO são técnicos, de forma clara, prática e acionável.

Para o requisito abaixo, gere uma orientação detalhada e rica seguindo EXATAMENTE a estrutura Markdown indicada.

**Requisito:**
- Código: ${req.codigo || "N/A"}
- Título: ${req.titulo}
- Descrição: ${req.descricao || "Sem descrição adicional"}
- Categoria: ${req.categoria || "Geral"}

---

Gere o conteúdo em Markdown com EXATAMENTE estas seções, nesta ordem:

## 📋 O que este requisito significa

Explique em linguagem simples o que este controle/requisito pede. Use analogias do dia a dia se possível. 2-3 parágrafos curtos.

## 🎯 Por que isso importa para sua empresa

Explique as consequências reais: multas, perda de clientes, danos à reputação. Cite exemplos de mercado (sem inventar nomes de empresas). 2-3 parágrafos.

## ⚠️ O que acontece se você não faz isso

Descreva os riscos concretos de não conformidade: sanções regulatórias, vulnerabilidades, impacto operacional. Use bullets para clareza.

## 🔍 Fatores que você deve analisar

Liste 5-8 perguntas de autoavaliação que o gestor deve se fazer. Formato: lista numerada.

## 💡 Dicas práticas de implementação

Passos concretos e simples que o gestor pode tomar imediatamente. 4-6 itens com descrição breve.

---

**Regras obrigatórias:**
- Linguagem simples, sem jargão técnico desnecessário
- Quando usar termos técnicos, explique entre parênteses
- Foco em ações práticas, não teóricas
- Tom profissional mas acessível
- Conteúdo específico para o requisito, NÃO genérico
- Responda em português brasileiro`;

  const evidenciasPrompt = `Para o mesmo requisito (${req.codigo} - ${req.titulo}), liste de 6 a 10 exemplos de evidências que um auditor aceitaria como prova de conformidade.

Formato: uma evidência por linha, iniciando com "- ". Cada evidência deve ser específica e prática.

Exemplos ruins: "Documento de política" (muito vago)
Exemplos bons: "Política de Controle de Acesso aprovada pela diretoria, com data de revisão nos últimos 12 meses"

Responda APENAS com a lista, sem introdução.`;

  try {
    const [guidanceRes, evidenciasRes] = await Promise.all([
      fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.4,
        }),
      }),
      fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: evidenciasPrompt }],
          temperature: 0.3,
        }),
      }),
    ]);

    if (!guidanceRes.ok) {
      console.error(`AI gateway error for guidance: ${guidanceRes.status} ${guidanceRes.statusText}`);
      return null;
    }
    if (!evidenciasRes.ok) {
      console.error(`AI gateway error for evidencias: ${evidenciasRes.status} ${evidenciasRes.statusText}`);
      return null;
    }

    const guidanceData = await guidanceRes.json();
    const evidenciasData = await evidenciasRes.json();

    const orientacao = guidanceData.choices?.[0]?.message?.content || "";
    const evidencias = evidenciasData.choices?.[0]?.message?.content || "";

    if (!orientacao) return null;

    return {
      orientacao_implementacao: orientacao,
      exemplos_evidencias: evidencias,
    };
  } catch (e) {
    console.error(`AI call error for ${req.codigo}:`, e);
    return null;
  }
}
