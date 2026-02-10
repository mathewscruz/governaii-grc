import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) throw new Error('LOVABLE_API_KEY not configured');

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user and empresa_id
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error('Unauthorized');

    const { data: profile } = await supabase
      .from('profiles')
      .select('empresa_id, nome')
      .eq('user_id', user.id)
      .single();

    if (!profile?.empresa_id) throw new Error('Empresa not found');

    const empresaId = profile.empresa_id;

    // Consumir crédito de IA antes de prosseguir
    const { data: creditResult, error: creditError } = await supabase
      .rpc('consume_ai_credit', {
        p_empresa_id: empresaId,
        p_user_id: user.id,
        p_funcionalidade: 'dashboard_ai_summary',
        p_descricao: 'Geração de resumo executivo IA do dashboard'
      });

    if (creditError || creditResult === false) {
      return new Response(JSON.stringify({ 
        error: 'Créditos de IA esgotados. Entre em contato para adquirir mais créditos.',
        creditsExhausted: true
      }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Gather all data in parallel
    const [
      riscosRes, controlesRes, incidentesRes, denunciasRes,
      auditoriaRes, documentosRes, frameworksRes, contratosRes
    ] = await Promise.all([
      supabase.from('riscos').select('id, nome, nivel_risco_inicial, status_tratamento, created_at').eq('empresa_id', empresaId),
      supabase.from('controles').select('id, nome, status, proxima_avaliacao, efetividade').eq('empresa_id', empresaId),
      supabase.from('incidentes').select('id, titulo, criticidade, status, created_at').eq('empresa_id', empresaId),
      supabase.from('denuncias').select('id, titulo, status, categoria, created_at').eq('empresa_id', empresaId),
      supabase.from('auditorias').select('id, nome, status, prioridade').eq('empresa_id', empresaId),
      supabase.from('documentos').select('id, nome, status, data_validade').eq('empresa_id', empresaId),
      supabase.from('gap_analysis_frameworks').select('id, nome, score_atual').eq('empresa_id', empresaId),
      supabase.from('contratos').select('id, nome_contrato, status, data_fim').eq('empresa_id', empresaId),
    ]);

    const riscos = riscosRes.data || [];
    const controles = controlesRes.data || [];
    const incidentes = incidentesRes.data || [];
    const denuncias = denunciasRes.data || [];
    const auditorias = auditoriaRes.data || [];
    const documentos = documentosRes.data || [];
    const frameworks = frameworksRes.data || [];
    const contratos = contratosRes.data || [];

    // Calculate health score
    const calcHealthScore = () => {
      let score = 100;
      const totalRiscos = riscos.length;
      const riscosCriticos = riscos.filter(r => ['Crítico', 'Muito Alto', 'Alto'].includes(r.nivel_risco_inicial || '')).length;
      const riscosSemTratamento = riscos.filter(r => !r.status_tratamento || r.status_tratamento === 'pendente').length;
      
      if (totalRiscos > 0) score -= Math.min(20, (riscosCriticos / totalRiscos) * 40);
      if (totalRiscos > 0) score -= Math.min(10, (riscosSemTratamento / totalRiscos) * 20);
      
      const incidentesAbertos = incidentes.filter(i => ['aberto', 'investigacao'].includes(i.status || '')).length;
      score -= Math.min(15, incidentesAbertos * 5);
      
      const denunciasPendentes = denuncias.filter(d => ['nova', 'em_investigacao'].includes(d.status || '')).length;
      score -= Math.min(10, denunciasPendentes * 3);
      
      const now = new Date();
      const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const controlesVencendo = controles.filter(c => c.proxima_avaliacao && new Date(c.proxima_avaliacao) <= thirtyDays && new Date(c.proxima_avaliacao) >= now).length;
      score -= Math.min(10, controlesVencendo * 2);
      
      const avgFrameworkScore = frameworks.length > 0 
        ? frameworks.reduce((sum, f) => sum + (f.score_atual || 0), 0) / frameworks.length 
        : 50;
      score -= Math.max(0, (70 - avgFrameworkScore) * 0.3);
      
      return Math.max(0, Math.min(100, Math.round(score)));
    };

    const healthScore = calcHealthScore();

    // Build data summary for AI
    const dataSummary = {
      riscos: {
        total: riscos.length,
        criticos: riscos.filter(r => r.nivel_risco_inicial === 'Crítico').length,
        altos: riscos.filter(r => ['Alto', 'Muito Alto'].includes(r.nivel_risco_inicial || '')).length,
        semTratamento: riscos.filter(r => !r.status_tratamento || r.status_tratamento === 'pendente').length,
      },
      controles: {
        total: controles.length,
        ativos: controles.filter(c => c.status === 'ativo').length,
        vencendo: controles.filter(c => {
          if (!c.proxima_avaliacao) return false;
          const d = new Date(c.proxima_avaliacao);
          const now = new Date();
          const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          return d <= thirtyDays && d >= now;
        }).length,
      },
      incidentes: {
        total: incidentes.length,
        abertos: incidentes.filter(i => ['aberto', 'investigacao'].includes(i.status || '')).length,
        criticos: incidentes.filter(i => i.criticidade === 'critica').length,
      },
      denuncias: {
        total: denuncias.length,
        pendentes: denuncias.filter(d => ['nova', 'em_investigacao'].includes(d.status || '')).length,
      },
      auditorias: {
        total: auditorias.length,
        emAndamento: auditorias.filter(a => a.status === 'em_andamento').length,
      },
      documentos: {
        total: documentos.length,
        vencidos: documentos.filter(d => d.data_validade && new Date(d.data_validade) < new Date()).length,
      },
      frameworks: frameworks.map(f => ({ nome: f.nome, score: f.score_atual })),
      contratos: {
        total: contratos.length,
        vencendo: contratos.filter(c => {
          if (!c.data_fim) return false;
          const d = new Date(c.data_fim);
          const now = new Date();
          const sixtyDays = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
          return d <= sixtyDays && d >= now;
        }).length,
      },
      healthScore,
    };

    const systemPrompt = `Você é um consultor sênior de GRC (Governança, Risco e Compliance) analisando os dados de uma empresa. 
Gere um resumo executivo conciso e acionável em português brasileiro.

Formato da resposta (use exatamente esta estrutura JSON):
{
  "resumo": "Parágrafo de 2-3 frases resumindo a situação geral da empresa",
  "destaques": ["destaque positivo 1", "destaque positivo 2"],
  "alertas": ["alerta crítico 1", "alerta 2"],
  "recomendacoes": [
    {"prioridade": "alta", "acao": "Descrição da ação recomendada", "impacto": "Impacto esperado"},
    {"prioridade": "media", "acao": "Descrição", "impacto": "Impacto"}
  ]
}

Regras:
- Máximo 3 destaques positivos
- Máximo 4 alertas
- Máximo 5 recomendações ordenadas por prioridade
- Seja específico com números e dados
- Não invente dados, use apenas o que foi fornecido
- Se não houver dados suficientes, indique que a empresa precisa cadastrar mais informações`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Dados da empresa:\n${JSON.stringify(dataSummary, null, 2)}` }
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_executive_summary",
            description: "Generate an executive GRC summary",
            parameters: {
              type: "object",
              properties: {
                resumo: { type: "string" },
                destaques: { type: "array", items: { type: "string" } },
                alertas: { type: "array", items: { type: "string" } },
                recomendacoes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      prioridade: { type: "string", enum: ["alta", "media", "baixa"] },
                      acao: { type: "string" },
                      impacto: { type: "string" }
                    },
                    required: ["prioridade", "acao", "impacto"]
                  }
                }
              },
              required: ["resumo", "destaques", "alertas", "recomendacoes"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "generate_executive_summary" } }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit excedido. Tente novamente em alguns instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    let summary;

    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        summary = JSON.parse(toolCall.function.arguments);
      } else {
        // Fallback: try to parse content directly
        const content = aiData.choices?.[0]?.message?.content || '';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          summary = JSON.parse(jsonMatch[0]);
        }
      }
    } catch (e) {
      console.error("Parse error:", e);
    }

    if (!summary) {
      summary = {
        resumo: "Não foi possível gerar o resumo executivo. Tente novamente.",
        destaques: [],
        alertas: [],
        recomendacoes: []
      };
    }

    return new Response(JSON.stringify({
      ...summary,
      healthScore,
      dataSummary,
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
