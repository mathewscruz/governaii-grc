import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ConversationContext {
  user_name?: string;
  empresa_nome?: string;
  tipo_documento_identificado?: string;
  informacoes_coletadas?: Record<string, any>;
  template_sugerido?: any;
  etapa_atual?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { 
      message, 
      conversation_id, 
      user_id, 
      empresa_id,
      action = 'chat'
    } = await req.json();

    console.log('DocGen Chat request:', { message, conversation_id, action, user_id, empresa_id });

    // Buscar informações do usuário e empresa
    const { data: profile } = await supabase
      .from('profiles')
      .select('nome')
      .eq('user_id', user_id)
      .single();

    const { data: empresa } = await supabase
      .from('empresas')
      .select('nome')
      .eq('id', empresa_id)
      .single();

    // Buscar ou criar conversa
    let conversation;
    if (conversation_id) {
      const { data } = await supabase
        .from('docgen_conversations')
        .select('*')
        .eq('id', conversation_id)
        .single();
      conversation = data;
    }

    if (!conversation) {
      const { data: newConversation } = await supabase
        .from('docgen_conversations')
        .insert({
          empresa_id,
          user_id,
          titulo: 'Nova Conversa DocGen',
          mensagens: [],
          contexto: {
            user_name: profile?.nome || 'Usuário',
            empresa_nome: empresa?.nome || 'Empresa',
            etapa_atual: 'inicio'
          }
        })
        .select()
        .single();
      conversation = newConversation;
    }

    const context: ConversationContext = conversation?.contexto || {};
    const messages: ChatMessage[] = conversation?.mensagens || [];

    if (action === 'chat') {
      // Adicionar mensagem do usuário
      messages.push({ role: 'user', content: message });

      // Buscar templates disponíveis e padrões de aprendizado
      const { data: templates } = await supabase
        .from('docgen_templates')
        .select('*')
        .or(`empresa_id.eq.${empresa_id},is_system.eq.true`);

      // Buscar padrões de aprendizado para este tipo de documento (se existir)
      let learningPatterns = [];
      try {
        const { data: patterns } = await supabase
          .from('docgen_learning_patterns')
          .select('*')
          .eq('empresa_id', empresa_id)
          .eq('tipo_documento', context.tipo_documento_identificado || 'geral')
          .order('taxa_sucesso', { ascending: false })
          .limit(5);
        learningPatterns = patterns || [];
      } catch (error) {
        console.log('Learning patterns not available:', error);
      }

      // Preparar prompt para a IA
      const systemPrompt = `Você é o DocGen, um consultor especializado em criação de documentos corporativos com conhecimento especializado em normas e frameworks.

INFORMAÇÕES DO USUÁRIO:
- Nome: ${context.user_name}
- Empresa: ${context.empresa_nome}

EXPERTISE E CONHECIMENTO:
- Especialista em ISO 27001:2022, LGPD, COBIT, ITIL
- Conhecimento profundo em estruturas documentais corporativas
- Experiência em compliance e governança corporativa

TIPOS DE DOCUMENTO DISPONÍVEIS:
${templates?.map(t => {
  // Acessar campos de forma segura
  let secoes = [];
  let frameworks = [];
  
  try {
    secoes = t.secoes_obrigatorias ? (typeof t.secoes_obrigatorias === 'string' ? JSON.parse(t.secoes_obrigatorias) : t.secoes_obrigatorias) : [];
    frameworks = Array.isArray(t.frameworks_relacionados) ? t.frameworks_relacionados : [];
  } catch (e) {
    console.log('Error parsing template data:', e);
  }
  
  return `- ${t.tipo_documento}: ${t.nome}
  Seções obrigatórias: ${secoes.map((s: any) => s.nome).join(', ') || 'N/A'}
  Frameworks relacionados: ${frameworks.join(', ') || 'N/A'}`;
}).join('\n')}

PADRÕES DE SUCESSO APRENDIDOS:
${learningPatterns?.map((p: any) => `- ${p.pergunta_padrao} (Taxa sucesso: ${(p.taxa_sucesso * 100).toFixed(1)}%)`).join('\n') || 'Nenhum padrão disponível'}

CONTEXTO ATUAL:
- Etapa: ${context.etapa_atual}
- Tipo identificado: ${context.tipo_documento_identificado || 'Não identificado'}
- Informações coletadas: ${JSON.stringify(context.informacoes_coletadas || {})}

INSTRUÇÕES CRÍTICAS - SEGUIR EXATAMENTE:

1. **PRIMEIRA IDENTIFICAÇÃO**: Quando identificar um tipo de documento, você DEVE IMEDIATAMENTE:
   - Confirmar o tipo identificado
   - Listar as seções obrigatórias 
   - FAZER A PRIMEIRA PERGUNTA ESPECÍFICA (não pare apenas na identificação)

2. **FLUXO OBRIGATÓRIO PARA POLÍTICA**: Quando identificar "política", você DEVE:
   - Dizer: "Vou ajudá-lo a criar uma [TIPO] de Política. Esta política precisa ter: Objetivo, Escopo, Diretrizes, Responsabilidades e Revisão."
   - IMEDIATAMENTE fazer a primeira pergunta: "Vamos começar pelo **OBJETIVO**. Qual é o propósito principal desta política? Por que ela é necessária na sua empresa?"

3. **NUNCA PARE SEM PERGUNTA**: Toda resposta DEVE terminar com uma pergunta específica
4. **SEQUENCIAL**: Coletar informações na ordem: Objetivo → Escopo → Diretrizes → Responsabilidades → Revisão
5. **UMA PERGUNTA POR VEZ**: Faça apenas uma pergunta específica por resposta

EXEMPLO OBRIGATÓRIO:
Usuário: "política de senhas"
Você DEVE responder: 
"Vou ajudá-lo a criar uma Política de Senhas. Esta política precisa ter: Objetivo, Escopo, Diretrizes, Responsabilidades e Revisão.

Vamos começar pelo **OBJETIVO**. Qual é o propósito principal desta política de senhas? Por que ela é necessária na sua empresa?"

FORMATO DE RESPOSTA JSON:
{
  "message": "resposta + SEMPRE uma pergunta específica",
  "tipo_documento_identificado": "politica",
  "etapa_atual": "coleta",
  "documento_pronto": false
}`;

      // Chamar OpenAI
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.slice(-10) // Últimas 10 mensagens para contexto
          ],
          temperature: 0.7,
          max_tokens: 1500,
        }),
      });

      const aiData = await response.json();
      const aiMessage = aiData.choices[0].message.content;
      
      console.log('AI Response:', aiMessage);

      // Parse da resposta da IA
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(aiMessage);
      } catch (error) {
        // Fallback se não conseguir fazer parse
        parsedResponse = {
          message: aiMessage,
          tipo_documento_identificado: context.tipo_documento_identificado,
          etapa_atual: context.etapa_atual || 'coleta',
          documento_pronto: false
        };
      }

      // Adicionar resposta da IA
      messages.push({ role: 'assistant', content: parsedResponse.message });

      // Atualizar contexto
      const updatedContext = {
        ...context,
        tipo_documento_identificado: parsedResponse.tipo_documento_identificado || context.tipo_documento_identificado,
        etapa_atual: parsedResponse.etapa_atual,
        informacoes_coletadas: {
          ...context.informacoes_coletadas,
          ...(parsedResponse.informacoes_coletadas || {})
        }
      };

      // Coletar dados para aprendizado contínuo (opcional)
      try {
        if (parsedResponse.tipo_documento_identificado && parsedResponse.message) {
          // Registrar padrão de pergunta bem-sucedida
          await supabase
            .from('docgen_learning_patterns')
            .upsert({
              empresa_id,
              tipo_documento: parsedResponse.tipo_documento_identificado,
              pergunta_padrao: parsedResponse.message.substring(0, 200),
              contexto_aplicacao: {
                etapa: parsedResponse.etapa_atual,
                frameworks_mencionados: parsedResponse.frameworks_relacionados || [],
                user_input_context: message.substring(0, 100)
              },
              numero_usos: 1
            }, {
              onConflict: 'empresa_id,tipo_documento,pergunta_padrao',
              ignoreDuplicates: false
            });
        }
      } catch (learningError) {
        console.log('Learning data collection failed:', learningError);
        // Não impedir o fluxo principal
      }

      // Salvar conversa atualizada
      await supabase
        .from('docgen_conversations')
        .update({
          mensagens: messages,
          contexto: updatedContext,
          tipo_documento_identificado: parsedResponse.tipo_documento_identificado,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversation.id);

      return new Response(JSON.stringify({
        conversation_id: conversation.id,
        message: parsedResponse.message,
        tipo_documento_identificado: parsedResponse.tipo_documento_identificado,
        termos_com_tooltip: parsedResponse.termos_com_tooltip || [],
        etapa_atual: parsedResponse.etapa_atual,
        documento_pronto: parsedResponse.documento_pronto || false,
        informacoes_necessarias: parsedResponse.informacoes_necessarias || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'generate_document') {
      // Gerar documento completo
      // Buscar templates disponíveis (precisamos desta variável neste branch)
      const { data: templates } = await supabase
        .from('docgen_templates')
        .select('*')
        .or(`empresa_id.eq.${empresa_id},is_system.eq.true`);

      const template = templates?.find(t => t.tipo_documento === context.tipo_documento_identificado);
      if (!template) {
        throw new Error('Template não encontrado para o tipo de documento');
      }

      // Garantir que a estrutura do template está em JSON
      let templateEstrutura: any = template.estrutura;
      try {
        if (typeof templateEstrutura === 'string') {
          templateEstrutura = JSON.parse(templateEstrutura);
        }
      } catch (_e) {
        // Continua com a estrutura original se não for JSON válido
      }

      const documentPrompt = `Gere um documento ${context.tipo_documento_identificado} completo baseado nas informações coletadas.

TEMPLATE: ${JSON.stringify(templateEstrutura || template.estrutura)}
INFORMAÇÕES COLETADAS: ${JSON.stringify(context.informacoes_coletadas)}
EMPRESA: ${context.empresa_nome}

Gere um documento profissional seguindo a estrutura do template, com:
- Capa com título, versão 1.0, data atual
- Sumário
- Todas as seções definidas no template
- Conteúdo detalhado e profissional
- Rodapé com informações da empresa

Responda APENAS com um JSON na seguinte estrutura:
{
  "titulo": "título do documento",
  "versao": "1.0",
  "data_criacao": "2025-01-07",
  "secoes": [
    {
      "nome": "Objetivo",
      "conteudo": "conteúdo da seção..."
    }
  ],
  "metadados": {
    "classificacao": "Interno",
    "responsavel_elaboracao": "${context.user_name}",
    "responsavel_aprovacao": "",
    "frequencia_revisao": "Anual"
  }
}`;

      const docResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: documentPrompt },
            { role: 'user', content: 'Gere o documento agora.' }
          ],
          temperature: 0.3,
          max_tokens: 4000,
        }),
      });

      const docData = await docResponse.json();
      let documentContent;
      try {
        documentContent = JSON.parse(docData.choices[0].message.content);
      } catch (_e) {
        // Se a IA não retornar JSON puro, encapsular em um documento mínimo
        documentContent = {
          titulo: `Documento ${context.tipo_documento_identificado || ''}`.trim(),
          versao: '1.0',
          data_criacao: new Date().toISOString().slice(0, 10),
          secoes: [
            { nome: 'Conteúdo', conteudo: String(docData.choices[0].message.content || '') }
          ],
          metadados: {
            classificacao: 'Interno',
            responsavel_elaboracao: context.user_name,
            responsavel_aprovacao: '',
            frequencia_revisao: 'Anual'
          }
        };
      }

      // Registrar feedback implícito de sucesso na geração (opcional)
      try {
        await supabase
          .from('docgen_feedback_implicit')
          .insert({
            empresa_id,
            conversation_id: conversation.id,
            documento_salvo: true,
            qualidade_estimada: 8, // Geração bem-sucedida
            padroes_identificados: {
              tipo_documento: context.tipo_documento_identificado,
              secoes_geradas: documentContent.secoes?.length || 0,
              frameworks_utilizados: context.informacoes_coletadas?.frameworks || []
            }
          });
      } catch (feedbackError) {
        console.log('Feedback collection failed:', feedbackError);
        // Não impedir o fluxo principal
      }

      // Salvar documento gerado
      const { data: generatedDoc } = await supabase
        .from('docgen_generated_docs')
        .insert({
          empresa_id,
          conversation_id: conversation.id,
          template_id: template.id,
          nome: documentContent.titulo,
          tipo_documento: context.tipo_documento_identificado,
          conteudo: documentContent,
          created_by: user_id
        })
        .select()
        .single();

      return new Response(JSON.stringify({
        document_id: generatedDoc.id,
        document: documentContent
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Action not supported' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in docgen-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});