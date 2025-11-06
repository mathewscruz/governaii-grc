import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Salvar body no início para poder usar em caso de erro
  let requestBody: any = null;
  
  try {
    requestBody = await req.json();
    const { assessmentId, frameworkId, storageFileName, empresaId } = requestBody;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting adherence analysis:', { assessmentId, frameworkId, storageFileName });

    // 1. Buscar dados do framework e requisitos
    const { data: framework, error: frameworkError } = await supabase
      .from('gap_analysis_frameworks')
      .select('*')
      .eq('id', frameworkId)
      .single();

    if (frameworkError || !framework) {
      throw new Error(`Framework não encontrado: ${frameworkError?.message}`);
    }

    const { data: requirements, error: reqError } = await supabase
      .from('gap_analysis_requirements')
      .select('*')
      .eq('framework_id', frameworkId)
      .order('ordem');

    if (reqError) {
      throw new Error(`Erro ao buscar requisitos: ${reqError.message}`);
    }

    if (!requirements || requirements.length === 0) {
      throw new Error('Framework não possui requisitos cadastrados');
    }

    console.log(`Framework: ${framework.nome}, Requirements: ${requirements.length}`);

    // 2. Baixar arquivo do storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('adherence-documents')
      .download(storageFileName);

    if (downloadError || !fileData) {
      throw new Error(`Erro ao baixar documento: ${downloadError?.message}`);
    }

    console.log('Document downloaded, size:', fileData.size);

    // 3. Extrair texto do documento
    let documentText = '';
    try {
      documentText = await fileData.text();
      console.log('Document text extracted, length:', documentText.length);
    } catch (e) {
      throw new Error('Não foi possível extrair texto do documento. Verifique se é um arquivo de texto válido.');
    }

    if (!documentText || documentText.trim().length < 100) {
      throw new Error('Documento não contém texto suficiente para análise');
    }

    // 5. Montar prompt para IA
    const requirementsList = requirements?.map(r => 
      `- ${r.codigo || ''} | ${r.titulo} (Categoria: ${r.categoria || 'N/A'}, Peso: ${r.peso})`
    ).join('\n');

    const prompt = `Você é um auditor especializado em conformidade regulatória. Analise o seguinte documento corporativo em relação aos requisitos do framework ${framework.nome} - ${framework.versao}.

DOCUMENTO ANALISADO:
${documentText.substring(0, 15000)} ${documentText.length > 15000 ? '...(truncado)' : ''}

REQUISITOS DO FRAMEWORK:
${requirementsList}

Realize uma análise detalhada e retorne um JSON válido com:
{
  "resultado_geral": "conforme" | "nao_conforme" | "parcial",
  "percentual_conformidade": número de 0 a 100,
  "pontos_fortes": [{"titulo": "", "descricao": ""}],
  "pontos_melhoria": [{"titulo": "", "descricao": "", "prioridade": "alta|media|baixa"}],
  "requisitos_detalhados": [
    {
      "requirement_id": "uuid",
      "status_aderencia": "conforme|nao_conforme|parcial|nao_aplicavel",
      "evidencias_encontradas": "",
      "gaps_especificos": "",
      "score_conformidade": 0-10,
      "observacoes_ia": ""
    }
  ],
  "recomendacoes": ["ação 1", "ação 2"],
  "analise_detalhada": "texto markdown com análise completa"
}

Seja específico, cite trechos do documento quando possível, e forneça orientações práticas.`;

    // 6. Chamar OpenAI API
    console.log('Calling OpenAI API...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          {
            role: 'system',
            content: 'Você é um auditor especializado em conformidade regulatória. Analise documentos comparando-os com frameworks regulatórios. Sempre responda com JSON válido e estruturado.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_completion_tokens: 4000,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
    }

    const aiResponse = await response.json();
    console.log('OpenAI response received:', JSON.stringify({
      hasChoices: !!aiResponse.choices,
      choicesLength: aiResponse.choices?.length,
      hasMessage: !!aiResponse.choices?.[0]?.message,
      hasContent: !!aiResponse.choices?.[0]?.message?.content,
      contentLength: aiResponse.choices?.[0]?.message?.content?.length
    }));
    
    if (!aiResponse.choices?.[0]?.message?.content) {
      console.error('Invalid AI response structure:', JSON.stringify(aiResponse, null, 2));
      throw new Error('Resposta da IA inválida - estrutura de resposta não contém conteúdo');
    }

    let analysisResult;
    try {
      analysisResult = JSON.parse(aiResponse.choices[0].message.content);
      console.log('Analysis result parsed:', {
        resultado_geral: analysisResult.resultado_geral,
        percentual: analysisResult.percentual_conformidade,
        requisitos: analysisResult.requisitos_detalhados?.length
      });
    } catch (e) {
      console.error('Failed to parse AI response:', aiResponse.choices[0].message.content);
      throw new Error('Erro ao processar resposta da IA');
    }

    // 7. Salvar resultado completo na tabela de assessments
    console.log('Saving assessment results...');
    const { error: updateError } = await supabase
      .from('gap_analysis_adherence_assessments')
      .update({
        status: 'concluido',
        resultado_geral: analysisResult.resultado_geral,
        percentual_conformidade: analysisResult.percentual_conformidade,
        pontos_fortes: analysisResult.pontos_fortes || [],
        pontos_melhoria: analysisResult.pontos_melhoria || [],
        recomendacoes: analysisResult.recomendacoes || [],
        analise_detalhada: analysisResult.analise_detalhada,
        metadados_analise: {
          modelo_usado: 'gpt-5-2025-08-07',
          tempo_processamento: Date.now(),
          total_requisitos: requirements?.length || 0,
          documento_tamanho: documentText.length
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', assessmentId);

    if (updateError) {
      console.error('Error updating assessment:', updateError);
      throw updateError;
    }

    console.log('Assessment updated successfully');

    // 8. Salvar detalhes por requisito
    if (analysisResult.requisitos_detalhados && analysisResult.requisitos_detalhados.length > 0) {
      console.log('Saving requirement details...');
      const detailsToInsert = analysisResult.requisitos_detalhados.map((req: any) => {
        const requirement = requirements?.find(r => r.id === req.requirement_id);
        return {
          assessment_id: assessmentId,
          requirement_id: req.requirement_id,
          requisito_codigo: requirement?.codigo || '',
          requisito_titulo: requirement?.titulo || '',
          status_aderencia: req.status_aderencia,
          evidencias_encontradas: req.evidencias_encontradas,
          gaps_especificos: req.gaps_especificos,
          score_conformidade: req.score_conformidade,
          observacoes_ia: req.observacoes_ia
        };
      });

      const { error: detailsError } = await supabase
        .from('gap_analysis_adherence_details')
        .insert(detailsToInsert);

      if (detailsError) {
        console.error('Error inserting details:', detailsError);
      } else {
        console.log(`Saved ${detailsToInsert.length} requirement details`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          assessmentId,
          resultado_geral: analysisResult.resultado_geral,
          percentual_conformidade: analysisResult.percentual_conformidade
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in analyze-document-adherence:', error);
    console.error('Error stack:', error.stack);
    
    // Tentar atualizar o assessment com erro usando o body salvo
    try {
      if (requestBody?.assessmentId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        await supabase
          .from('gap_analysis_adherence_assessments')
          .update({
            status: 'erro',
            metadados_analise: { 
              erro: error.message,
              erro_detalhes: error.stack,
              timestamp_erro: new Date().toISOString()
            }
          })
          .eq('id', requestBody.assessmentId);
          
        console.log('Assessment marked as erro');
      }
    } catch (updateErr) {
      console.error('Failed to update assessment with error status:', updateErr);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});