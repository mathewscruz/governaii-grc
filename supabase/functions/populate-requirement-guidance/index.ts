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
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY") || supabaseKey;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate user and consume credit
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    let empresaId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const userClient = createClient(supabaseUrl, supabaseAnon, {
        global: { headers: { Authorization: authHeader } }
      });
      const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(authHeader.replace('Bearer ', ''));
      if (!claimsError && claimsData?.claims?.sub) {
        userId = claimsData.claims.sub as string;
        const { data: profile } = await supabase
          .from('profiles')
          .select('empresa_id')
          .eq('user_id', userId)
          .single();
        empresaId = profile?.empresa_id || null;
      }
    }

    // Consume credit before AI call
    if (userId && empresaId) {
      const { data: creditResult } = await supabase.rpc('consume_ai_credit', {
        p_empresa_id: empresaId,
        p_user_id: userId,
        p_funcionalidade: 'populate-requirement-guidance',
        p_descricao: 'Geração de orientações para requisito de framework'
      });

      if (creditResult === false) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

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
          perguntas_diagnostico: guidance.perguntas_diagnostico,
        })
        .eq("id", requirementId);

      if (updateError) throw updateError;

      return new Response(JSON.stringify({
        message: "Guidance generated successfully",
        orientacao_implementacao: guidance.orientacao_implementacao,
        exemplos_evidencias: guidance.exemplos_evidencias,
        perguntas_diagnostico: guidance.perguntas_diagnostico,
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
      // Consume credit per requirement in batch mode
      if (userId && empresaId) {
        const { data: batchCredit } = await supabase.rpc('consume_ai_credit', {
          p_empresa_id: empresaId,
          p_user_id: userId,
          p_funcionalidade: 'populate-requirement-guidance-batch',
          p_descricao: `Orientação requisito ${r.codigo || r.titulo}`
        });
        if (batchCredit === false) {
          // Stop processing if credits exhausted
          break;
        }
      }

      try {
        const guidance = await generateGuidance(r, lovableKey);
        if (!guidance) continue;

        const { error: updateError } = await supabase
          .from("gap_analysis_requirements")
          .update({
            orientacao_implementacao: guidance.orientacao_implementacao,
            exemplos_evidencias: guidance.exemplos_evidencias,
            perguntas_diagnostico: guidance.perguntas_diagnostico,
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

interface GuidanceResult {
  orientacao_implementacao: string;
  exemplos_evidencias: string;
  perguntas_diagnostico: string | null;
}

async function generateGuidance(
  req: { codigo: string | null; titulo: string; descricao: string | null; categoria: string | null },
  apiKey: string
): Promise<GuidanceResult | null> {
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
- Responda em português brasileiro
- NUNCA inclua frases introdutórias como "Com certeza!", "Aqui está", "Claro!" ou qualquer saudação. Comece DIRETAMENTE com o conteúdo da primeira seção (## 📋 O que este requisito significa)`;

  const evidenciasPrompt = `Para o mesmo requisito (${req.codigo} - ${req.titulo}), liste de 6 a 10 exemplos de evidências que um auditor aceitaria como prova de conformidade.

Formato: uma evidência por linha, iniciando com "- ". Cada evidência deve ser específica e prática.

Exemplos ruins: "Documento de política" (muito vago)
Exemplos bons: "Política de Controle de Acesso aprovada pela diretoria, com data de revisão nos últimos 12 meses"

Responda APENAS com a lista, sem introdução.`;

  const diagnosticoPrompt = `Você é um auditor sênior avaliando o requisito "${req.codigo} - ${req.titulo}" (${req.categoria || "Geral"}).

Gere exatamente 5 perguntas de diagnóstico rápido para que um gestor avalie se sua empresa está em conformidade com este requisito. As perguntas devem ser respondíveis com "Sim", "Parcial" ou "Não".

Retorne APENAS um JSON array com objetos no formato:
[
  {"pergunta": "A empresa possui política documentada e aprovada sobre X?", "peso": 2},
  {"pergunta": "Existe registro de treinamentos realizados nos últimos 12 meses?", "peso": 1}
]

Regras:
- Exatamente 5 perguntas
- Cada pergunta deve ser específica para o requisito, não genérica
- O "peso" indica importância: 1 (normal), 2 (alta), 3 (crítica)
- Perguntas objetivas que possam ser respondidas com Sim/Parcial/Não
- Português brasileiro
- Retorne APENAS o JSON, sem markdown ou texto adicional`;

  try {
    const [guidanceRes, evidenciasRes, diagnosticoRes] = await Promise.all([
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
      fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: diagnosticoPrompt }],
          temperature: 0.2,
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

    // Parse diagnostic questions
    let perguntasJson: string | null = null;
    if (diagnosticoRes.ok) {
      const diagnosticoData = await diagnosticoRes.json();
      const rawContent = diagnosticoData.choices?.[0]?.message?.content || "";
      // Extract JSON from potential markdown code blocks
      const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          JSON.parse(jsonMatch[0]); // validate
          perguntasJson = jsonMatch[0];
        } catch {
          console.error("Failed to parse diagnostic questions JSON");
        }
      }
    }

    return {
      orientacao_implementacao: orientacao,
      exemplos_evidencias: evidencias,
      perguntas_diagnostico: perguntasJson,
    };
  } catch (e) {
    console.error(`AI call error for ${req.codigo}:`, e);
    return null;
  }
}
