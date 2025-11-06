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

    const prompt = `Você é um auditor de conformidade especializado. Analise o documento fornecido contra o framework ${framework.nome} ${framework.versao}.

ETAPA 1: IDENTIFICAÇÃO
Primeiro, identifique quais requisitos do framework são RELEVANTES e APLICÁVEIS ao documento fornecido.
- Considere o tipo de documento (política, procedimento, formulário, etc)
- Considere o escopo do documento (backup, acesso, incidentes, etc)
- Ignore requisitos claramente não relacionados ao documento

DOCUMENTO:
Nome: ${documentName}
Conteúdo (primeiros 15000 caracteres):
${documentText.substring(0, 15000)}${documentText.length > 15000 ? '\n\n[...documento continua...]' : ''}

REQUISITOS DO FRAMEWORK (${requirements.length} total):
${requirementsList}

ETAPA 2: ANÁLISE PROFUNDA
Para APENAS os requisitos relevantes identificados, analise:
- O que a norma exige nesse requisito
- O que o documento apresenta
- Se está conforme, não conforme ou parcialmente conforme
- Evidências encontradas (resumidas)
- Gaps específicos (resumidos)
- Score de conformidade (0-10)

⚠️ IMPORTANTE - GESTÃO DE RESPOSTA:
- Se identificar MAIS DE 15 requisitos aplicáveis: SEJA CONCISO
  - Evidências: máximo 100 caracteres por requisito
  - Gaps: máximo 80 caracteres por requisito
  - Observações: máximo 120 caracteres por requisito
- Se identificar ATÉ 15 requisitos: pode ser mais detalhado
  - Evidências: até 200 caracteres
  - Gaps: até 150 caracteres
  - Observações: até 250 caracteres
- Retorne APENAS os requisitos relevantes identificados
- NÃO retorne requisitos não aplicáveis na lista principal
- Foque em QUALIDADE e PRECISÃO, não em volume de texto
- Priorize informações ACIONÁVEIS

FORMATO DE RESPOSTA (JSON):
{
  "documento_tipo_identificado": "tipo do documento (ex: política, procedimento)",
  "documento_escopo_identificado": "escopo/tema principal (máx 50 caracteres)",
  "total_requisitos_relevantes": número,
  "resultado_geral": "conforme"|"nao_conforme"|"parcial",
  "percentual_conformidade": 0-100,
  "pontos_fortes": [
    {"titulo": "resumo (máx 50 chars)", "descricao": "detalhamento (máx 150 chars)"}
  ],
  "pontos_melhoria": [
    {"titulo": "resumo (máx 50 chars)", "descricao": "detalhamento (máx 150 chars)", "prioridade": "alta|media|baixa"}
  ],
  "requisitos_analisados": [
    {
      "requirement_id": "uuid do requisito (ID entre colchetes acima)",
      "requisito_codigo": "código do requisito",
      "status_aderencia": "conforme"|"nao_conforme"|"parcial"|"nao_aplicavel",
      "evidencias_encontradas": "citações específicas RESUMIDAS (respeite limites acima)",
      "gaps_especificos": "o que falta RESUMIDO (respeite limites acima)",
      "score_conformidade": 0-10,
      "observacoes_ia": "análise RESUMIDA comparando norma vs documento (respeite limites acima)",
      "justificativa_relevancia": "por que é relevante (máx 80 chars)"
    }
  ],
  "requisitos_nao_aplicaveis": [
    "lista de IDs (apenas IDs, sem descrições)"
  ],
  "recomendacoes": [
    "ações específicas RESUMIDAS - máximo 100 caracteres cada (máximo 5 recomendações)"
  ],
  "analise_detalhada": "resumo executivo em markdown: tipo do documento, requisitos relevantes, pontos fortes, principais gaps, próximos passos (máximo 300 palavras - OBRIGATÓRIO respeitar limite)"
}

⚠️ CRÍTICO: Se você perceber que está gerando muito texto, PARE e RESUMA. É melhor ter análise concisa e completa do que truncada.`;

    // 6. Chamar Lovable AI Gateway com Gemini 2.5 Flash
    console.log('Calling Lovable AI Gateway...');
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash', // Modelo padrão do Lovable AI - rápido e eficiente
        messages: [
          {
            role: 'system',
            content: 'Você é um auditor de conformidade especializado. Analise documentos contra frameworks regulatórios e retorne sempre JSON válido e estruturado. Seja objetivo e preciso.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_completion_tokens: 20000, // Aumentado para 20000 como margem de segurança
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
      analysisResult = JSON.parse(content);
      console.log('Analysis result parsed successfully:', {
        resultado_geral: analysisResult.resultado_geral,
        percentual: analysisResult.percentual_conformidade,
        requisitos_analisados: analysisResult.requisitos_analisados?.length || 0,
        documento_tipo: analysisResult.documento_tipo_identificado,
        documento_escopo: analysisResult.documento_escopo_identificado
      });
    } catch (e) {
      const content = aiResponse.choices[0].message.content;
      console.error('Failed to parse AI response. Content length:', content?.length);
      console.error('Content preview (first 500 chars):', content?.substring(0, 500));
      console.error('Content end (last 200 chars):', content?.substring(content.length - 200));
      console.error('Parse error:', e);
      throw new Error('Erro ao processar resposta da IA - JSON inválido ou incompleto. Tente com um documento mais simples.');
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
          modelo_usado: 'google/gemini-2.5-flash',
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