import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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
    const { messages } = await req.json();

    // Consume AI credit
    const { data: creditResult, error: creditError } = await supabase
      .rpc('consume_ai_credit', {
        p_empresa_id: empresaId,
        p_user_id: user.id,
        p_funcionalidade: 'akuria_chat',
        p_descricao: 'Conversa com AkurIA chatbot'
      });

    if (creditError || creditResult === false) {
      return new Response(JSON.stringify({ error: 'Créditos de IA esgotados.' }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Gather company context in parallel
    const [
      riscosRes, controlesRes, incidentesRes, denunciasRes,
      auditoriaRes, documentosRes, frameworksRes, contratosRes
    ] = await Promise.all([
      supabase.from('riscos').select('id, nome, nivel_risco_inicial, status_tratamento').eq('empresa_id', empresaId),
      supabase.from('controles').select('id, nome, status, proxima_avaliacao, efetividade').eq('empresa_id', empresaId),
      supabase.from('incidentes').select('id, titulo, criticidade, status').eq('empresa_id', empresaId),
      supabase.from('denuncias').select('id, titulo, status, categoria').eq('empresa_id', empresaId),
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

    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const contextSummary = `
DADOS DA EMPRESA (use apenas estes dados, não invente):

RISCOS: ${riscos.length} total | ${riscos.filter(r => ['Crítico', 'Muito Alto', 'Alto'].includes(r.nivel_risco_inicial || '')).length} altos/críticos | ${riscos.filter(r => !r.status_tratamento || r.status_tratamento === 'pendente').length} sem tratamento
CONTROLES: ${controles.length} total | ${controles.filter(c => c.status === 'ativo').length} ativos | ${controles.filter(c => c.proxima_avaliacao && new Date(c.proxima_avaliacao) <= thirtyDays && new Date(c.proxima_avaliacao) >= now).length} vencendo em 30 dias
INCIDENTES: ${incidentes.length} total | ${incidentes.filter(i => ['aberto', 'investigacao'].includes(i.status || '')).length} abertos | ${incidentes.filter(i => i.criticidade === 'critica').length} críticos
DENÚNCIAS: ${denuncias.length} total | ${denuncias.filter(d => ['nova', 'em_investigacao'].includes(d.status || '')).length} pendentes
AUDITORIAS: ${auditorias.length} total | ${auditorias.filter(a => a.status === 'em_andamento').length} em andamento
DOCUMENTOS: ${documentos.length} total | ${documentos.filter(d => d.data_validade && new Date(d.data_validade) < now).length} vencidos
FRAMEWORKS: ${frameworks.map(f => `${f.nome}: ${f.score_atual || 0}%`).join(', ') || 'Nenhum configurado'}
CONTRATOS: ${contratos.length} total | ${contratos.filter(c => c.data_fim && new Date(c.data_fim) <= thirtyDays && new Date(c.data_fim) >= now).length} vencendo em 30 dias
    `.trim();

    const systemPrompt = `Você é a AkurIA, assistente inteligente de GRC (Governança, Risco e Compliance) da plataforma Akuris.

Seu papel:
- Responder perguntas sobre os módulos do sistema (Riscos, Controles, Incidentes, Auditorias, Documentos, Compliance, Contratos, Denúncias)
- Dar insights e recomendações baseados nos dados reais da empresa
- Explicar conceitos de GRC quando solicitado
- Ser objetivo, profissional e útil

Regras:
- Responda sempre em português brasileiro
- Use apenas os dados fornecidos abaixo, NUNCA invente números ou informações
- Se não tiver dados suficientes para responder, diga que a informação não está disponível
- Seja conciso mas completo nas respostas
- Use formatação com **negrito** e listas quando apropriado

${contextSummary}`;

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
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit excedido." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error("AI gateway error");
    }

    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("akuria-chat error:", error);
    return new Response(JSON.stringify({ error: error.message || "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
