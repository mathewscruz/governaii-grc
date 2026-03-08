import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { assessment_id } = await req.json();

    console.log('Calculating score for assessment:', assessment_id);

    // Get empresa_id from assessment to consume credit
    const { data: assessmentInfo, error: assessmentInfoError } = await supabase
      .from('due_diligence_assessments')
      .select('empresa_id')
      .eq('id', assessment_id)
      .single();

    if (assessmentInfoError) throw assessmentInfoError;

    const empresaId = assessmentInfo?.empresa_id;

    // Try to get user from auth header, otherwise use a system context
    let userId: string | null = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY') || supabaseKey;
      const userClient = createClient(supabaseUrl, supabaseAnon, {
        global: { headers: { Authorization: authHeader } }
      });
      const { data: claimsData } = await userClient.auth.getClaims(authHeader.replace('Bearer ', ''));
      if (claimsData?.claims?.sub) {
        userId = claimsData.claims.sub as string;
      }
    }

    // If no authenticated user, find the assessment creator or any admin of the empresa
    if (!userId && empresaId) {
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('empresa_id', empresaId)
        .limit(1)
        .single();
      userId = adminProfile?.user_id || null;
    }

    // Consume AI credit
    if (empresaId && userId) {
      const { data: creditResult } = await supabase.rpc('consume_ai_credit', {
        p_empresa_id: empresaId,
        p_user_id: userId,
        p_funcionalidade: 'calculate-assessment-score',
        p_descricao: 'Cálculo de score Due Diligence com IA'
      });

      if (creditResult === false) {
        return new Response(JSON.stringify({ error: 'Créditos de IA esgotados.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    const { data: responses, error: responsesError } = await supabase
      .from('due_diligence_responses')
      .select(`
        question_id,
        resposta,
        evidencia,
        justificativa,
        arquivo_url,
        question:question_id(
          id,
          titulo,
          tipo,
          peso,
          secao
        )
      `)
      .eq('assessment_id', assessment_id);

    if (responsesError) throw responsesError;

    if (!responses || responses.length === 0) {
      throw new Error('No responses found for assessment');
    }

    console.log('Found responses:', responses.length);

    const analysisData = responses.map(r => ({
      question: r.question.titulo,
      answer: r.resposta,
      evidencia: r.evidencia || null,
      justificativa: r.justificativa || null,
      arquivo_anexado: r.arquivo_url ? true : false,
      type: r.question.tipo,
      section: r.question.secao || 'Geral',
      weight: r.question.peso || 1
    }));

    const aiAnalysis = await analyzeWithAI(analysisData, lovableApiKey);
    
    const totalWeight = analysisData.reduce((sum, item) => sum + item.weight, 0);
    const weightedScore = aiAnalysis.scores.reduce((sum: number, score: number, index: number) => {
      return sum + (score * analysisData[index].weight);
    }, 0);
    
    const finalScore = (weightedScore / totalWeight) * 10;
    
    let classification = 'ruim';
    if (finalScore >= 80) classification = 'excelente';
    else if (finalScore >= 60) classification = 'bom';
    else if (finalScore >= 40) classification = 'regular';

    console.log('Final score calculated:', finalScore, 'Classification:', classification);

    const { error: scoreError } = await supabase
      .from('due_diligence_scores')
      .upsert({
        assessment_id,
        score_total: finalScore,
        score_breakdown: aiAnalysis.breakdown,
        classificacao: classification,
        observacoes_ia: aiAnalysis.summary,
        created_at: new Date().toISOString()
      });

    if (scoreError) throw scoreError;

    const { error: updateError } = await supabase
      .from('due_diligence_assessments')
      .update({ 
        score_final: finalScore,
        updated_at: new Date().toISOString()
      })
      .eq('id', assessment_id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({
      success: true,
      score: finalScore,
      classification,
      breakdown: aiAnalysis.breakdown,
      summary: aiAnalysis.summary
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error calculating assessment score:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function analyzeWithAI(analysisData: any[], apiKey: string) {
  const prompt = `
Analise as seguintes respostas de um questionário de due diligence e atribua uma pontuação de 0 a 10 para cada resposta, considerando:

- Qualidade da resposta (completude, clareza, detalhamento)
- Adequação aos padrões de compliance e governança
- Demonstração de controles e processos adequados
- Transparência e evidências fornecidas
- EVIDÊNCIAS: Se há evidência textual detalhada, adicione 1-2 pontos ao score
- DOCUMENTOS: Se há arquivo anexado como evidência, adicione 1 ponto extra ao score  
- JUSTIFICATIVAS: Para respostas "Não", avalie se a justificativa é adequada e mostra planos de melhoria

IMPORTANTE: 
- Para respostas "Sim" com evidências detalhadas + documento anexado: score deve ser 8-10
- Para respostas "Sim" com evidências básicas: score deve ser 6-8
- Para respostas "Sim" sem evidências: score deve ser 4-6
- Para respostas "Não" com boa justificativa e planos: score deve ser 2-4
- Para respostas "Não" sem justificativa adequada: score deve ser 0-2

Dados para análise:
${JSON.stringify(analysisData, null, 2)}

Responda APENAS em formato JSON válido (sem markdown) com esta estrutura:
{
  "scores": [array de números de 0-10 para cada resposta na ordem apresentada],
  "breakdown": {
    "secao1": score_médio,
    "secao2": score_médio,
    ...
  },
  "summary": "Resumo geral da avaliação em até 200 palavras"
}

IMPORTANTE: O breakdown deve ser agrupado pelo campo "section" de cada pergunta.
`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em due diligence e compliance. Analise objetivamente as respostas e forneça scores justos baseados em critérios técnicos.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    if (response.status === 402) {
      throw new Error('AI credits exhausted. Please add credits.');
    }
    throw new Error(`AI Gateway error: ${response.statusText}`);
  }

  const data = await response.json();
  let aiResponse = data.choices[0].message.content;
  
  aiResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
  
  try {
    return JSON.parse(aiResponse);
  } catch (parseError) {
    console.error('Error parsing AI response:', aiResponse);
    throw new Error('Invalid AI response format');
  }
}
