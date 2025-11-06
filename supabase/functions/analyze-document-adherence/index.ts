import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY não configurada');
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

    // 3. Extrair texto do documento (deve ser TXT pré-processado)
    console.log('Reading document text...');
    let documentText = '';
    const fileExtension = storageFileName.toLowerCase().split('.').pop();
    
    console.log('File extension detected:', fileExtension);

    try {
      if (fileExtension === 'txt') {
        // Documento já foi pré-processado no frontend
        documentText = await fileData.text();
        console.log('Text extracted, length:', documentText.length);
      } else {
        throw new Error(`Tipo de arquivo não suportado: ${fileExtension}. Apenas arquivos TXT são aceitos (pré-processados no frontend).`);
      }
    } catch (e: any) {
      console.error('Error reading document:', e.message);
      throw new Error(`Não foi possível ler o documento: ${e.message}`);
    }

    if (!documentText || documentText.trim().length < 100) {
      throw new Error('Documento não contém texto suficiente para análise (mínimo 100 caracteres)');
    }

    // 5. Montar prompt inteligente para IA - identifica requisitos relevantes
    const requirementsList = requirements?.map((r, idx) => 
      `${idx + 1}. [ID:${r.id}] ${r.codigo || 'N/A'} - ${r.titulo}`
    ).join('\n');

    const documentName = storageFileName.split('/').pop()?.replace('.txt', '') || 'Documento';

    const prompt = `Analise o documento contra ${framework.nome}.

DOCUMENTO (primeiros 10000 chars):
${documentText.substring(0, 10000)}

REQUISITOS (${requirements.length}):
${requirements.slice(0, 50).map((r, i) => `${i+1}. [${r.id}] ${r.codigo} - ${r.titulo}`).join('\n')}

TAREFA: Retorne JSON com requisitos relevantes.

LIMITES RÍGIDOS:
- evidencias_encontradas: 40 chars
- gaps_especificos: 35 chars
- observacoes_ia: 60 chars
- justificativa_relevancia: 40 chars
- titulo: 30 chars
- descricao: 80 chars

EXEMPLO requisito:
{
  "requirement_id": "uuid",
  "requisito_codigo": "5.1",
  "status_aderencia": "parcial",
  "evidencias_encontradas": "Define responsabilidades cap 3.2",
  "gaps_especificos": "Falta revisão anual",
  "score_conformidade": 7,
  "observacoes_ia": "Política define roles mas não define frequência revisão",
  "justificativa_relevancia": "Req central para governança"
}`;

    // 6. Chamar Lovable AI Gateway com Gemini 2.5 Flash
    console.log('Calling Lovable AI Gateway...');
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: 'Você é auditor. Retorne JSON válido com campos CURTOS.' },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 10000, // Reduzido para forçar respostas menores
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI Gateway error:', response.status, errorText);
      
      // Tratamento específico para erros de rate limit e pagamento
      if (response.status === 429) {
        throw new Error('Limite de requisições excedido. Aguarde alguns minutos e tente novamente.');
      }
      if (response.status === 402) {
        throw new Error('Créditos do Lovable AI esgotados. Adicione créditos em Settings > Workspace > Usage.');
      }
      
      throw new Error(`Erro na API (${response.status}): ${errorText}`);
    }

    const aiResponse = await response.json();
    console.log('Lovable AI response received:', JSON.stringify({
      hasChoices: !!aiResponse.choices,
      choicesLength: aiResponse.choices?.length,
      hasMessage: !!aiResponse.choices?.[0]?.message,
      hasContent: !!aiResponse.choices?.[0]?.message?.content,
      contentLength: aiResponse.choices?.[0]?.message?.content?.length,
      finishReason: aiResponse.choices?.[0]?.finish_reason
    }));
    
    // Verificar se resposta foi truncada ANTES de verificar conteúdo
    if (aiResponse.choices?.[0]?.finish_reason === 'length') {
      console.error('Response truncated - muitos requisitos aplicáveis.');
      console.error('Content até truncamento:', aiResponse.choices[0].message?.content?.substring(0, 500));
      throw new Error(
        'O documento analisado possui requisitos demais para uma única análise. ' +
        'Sugestão: analise o documento em seções menores ou revise o framework para reduzir requisitos.'
      );
    }
    
    if (!aiResponse.choices?.[0]?.message?.content) {
      console.error('Invalid AI response structure:', JSON.stringify(aiResponse, null, 2));
      throw new Error('Resposta da IA inválida - estrutura de resposta não contém conteúdo');
    }

    let analysisResult;
    try {
      const content = aiResponse.choices[0].message.content;
      
      console.log('AI response length:', content.length);
      
      // Validar tamanho
      if (content.length > 30000) {
        throw new Error(`Resposta muito longa (${content.length} chars). Reduzindo análise...`);
      }
      
      // Parse JSON
      analysisResult = JSON.parse(content);
      
      // TRUNCAR CAMPOS - forçar limites mesmo se IA não seguir
      if (analysisResult.requisitos_analisados) {
        analysisResult.requisitos_analisados = analysisResult.requisitos_analisados.map((req: any) => ({
          ...req,
          evidencias_encontradas: (req.evidencias_encontradas || '').substring(0, 100),
          gaps_especificos: (req.gaps_especificos || '').substring(0, 80),
          observacoes_ia: (req.observacoes_ia || '').substring(0, 150),
          justificativa_relevancia: (req.justificativa_relevancia || '').substring(0, 80)
        }));
      }
      
      if (analysisResult.pontos_fortes) {
        analysisResult.pontos_fortes = analysisResult.pontos_fortes.map((p: any) => ({
          titulo: (p.titulo || '').substring(0, 60),
          descricao: (p.descricao || '').substring(0, 150)
        }));
      }
      
      if (analysisResult.pontos_melhoria) {
        analysisResult.pontos_melhoria = analysisResult.pontos_melhoria.map((p: any) => ({
          titulo: (p.titulo || '').substring(0, 60),
          descricao: (p.descricao || '').substring(0, 150),
          prioridade: p.prioridade
        }));
      }
      
      if (analysisResult.recomendacoes) {
        analysisResult.recomendacoes = analysisResult.recomendacoes.map((r: string) => 
          r.substring(0, 150)
        );
      }
      
      if (analysisResult.analise_detalhada) {
        // Limitar a 500 palavras
        const words = analysisResult.analise_detalhada.split(/\s+/);
        if (words.length > 500) {
          analysisResult.analise_detalhada = words.slice(0, 500).join(' ') + '...';
        }
      }
      
      console.log('Analysis parsed and truncated:', {
        resultado_geral: analysisResult.resultado_geral,
        percentual: analysisResult.percentual_conformidade,
        requisitos: analysisResult.requisitos_analisados?.length || 0
      });
    } catch (e) {
      const content = aiResponse.choices[0].message.content;
      console.error('Parse failed. Length:', content?.length);
      console.error('Preview:', content?.substring(0, 500));
      console.error('Error:', e);
      throw new Error('Resposta da IA inválida. Tente um documento menor ou com menos requisitos.');
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
          modelo_usado: 'google/gemini-2.5-flash-lite',
          tempo_processamento: Date.now(),
          total_requisitos: requirements?.length || 0,
          total_requisitos_relevantes: analysisResult.total_requisitos_relevantes || 0,
          documento_tamanho: documentText.length,
          documento_tipo: analysisResult.documento_tipo_identificado || null,
          documento_escopo: analysisResult.documento_escopo_identificado || null,
          requisitos_nao_aplicaveis: analysisResult.requisitos_nao_aplicaveis || []
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', assessmentId);

    if (updateError) {
      console.error('Error updating assessment:', updateError);
      throw updateError;
    }

    console.log('Assessment updated successfully');

    // 8. Salvar detalhes por requisito (agora requisitos_analisados)
    if (analysisResult.requisitos_analisados && analysisResult.requisitos_analisados.length > 0) {
      console.log('Saving requirement details...');
      const detailsToInsert = analysisResult.requisitos_analisados.map((req: any) => {
        const requirement = requirements?.find(r => r.id === req.requirement_id);
        return {
          assessment_id: assessmentId,
          requirement_id: req.requirement_id,
          requisito_codigo: requirement?.codigo || req.requisito_codigo || '',
          requisito_titulo: requirement?.titulo || '',
          status_aderencia: req.status_aderencia,
          evidencias_encontradas: req.evidencias_encontradas,
          gaps_especificos: req.gaps_especificos,
          score_conformidade: req.score_conformidade,
          observacoes_ia: req.observacoes_ia,
          justificativa_relevancia: req.justificativa_relevancia || null
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