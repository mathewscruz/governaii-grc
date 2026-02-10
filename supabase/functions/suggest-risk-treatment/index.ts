import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    const { nome, descricao, categoria, nivel_risco, empresa_id, user_id } = await req.json();

    // Consumir crédito de IA
    if (empresa_id && user_id) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: creditResult, error: creditError } = await supabase
        .rpc('consume_ai_credit', {
          p_empresa_id: empresa_id,
          p_user_id: user_id,
          p_funcionalidade: 'suggest_risk_treatment',
          p_descricao: `Sugestão de tratamento para risco: ${nome}`
        });

      if (creditError || creditResult === false) {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Créditos de IA esgotados. Entre em contato para adquirir mais créditos.',
          creditsExhausted: true
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    const prompt = `Você é um especialista em gestão de riscos corporativos. Analise o seguinte risco e forneça sugestões de tratamento:

RISCO: ${nome}
DESCRIÇÃO: ${descricao}
CATEGORIA: ${categoria || 'Não especificada'}
NÍVEL: ${nivel_risco || 'Não especificado'}

Por favor, forneça sugestões de tratamento nos seguintes formatos:

1. MITIGAÇÃO (reduzir probabilidade/impacto):
   - Ações específicas e práticas
   - Controles preventivos
   - Monitoramento contínuo

2. CONTINGENCIAMENTO (plano B se o risco se materializar):
   - Ações de resposta imediata
   - Plano de recuperação
   - Comunicação de crise

Para cada sugestão, inclua:
- Descrição detalhada
- Responsável sugerido (cargo/área)
- Prazo estimado
- Custo aproximado (se aplicável)
- Eficácia esperada

Seja específico e prático, focando em ações implementáveis no contexto empresarial brasileiro.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'Você é um especialista em gestão de riscos corporativos com vasta experiência em identificação, análise e tratamento de riscos organizacionais. Suas sugestões devem ser práticas, específicas e implementáveis.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const suggestion = data.choices[0].message.content;

    // Parse the suggestion to extract structured data
    const parseStructuredSuggestion = (text: string) => {
      const mitigacaoMatch = text.match(/1\.\s*MITIGAÇÃO[\s\S]*?(?=2\.\s*CONTINGENCIAMENTO|$)/i);
      const contingenciamentoMatch = text.match(/2\.\s*CONTINGENCIAMENTO[\s\S]*$/i);

      return {
        mitigacao: mitigacaoMatch ? mitigacaoMatch[0].replace(/1\.\s*MITIGAÇÃO/i, '').trim() : '',
        contingenciamento: contingenciamentoMatch ? contingenciamentoMatch[0].replace(/2\.\s*CONTINGENCIAMENTO/i, '').trim() : '',
        sugestao_completa: text
      };
    };

    const structuredSuggestion = parseStructuredSuggestion(suggestion);

    return new Response(JSON.stringify({
      success: true,
      data: {
        ...structuredSuggestion,
        risco_analisado: {
          nome,
          descricao,
          categoria,
          nivel_risco
        }
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in suggest-risk-treatment function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Erro interno do servidor'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
