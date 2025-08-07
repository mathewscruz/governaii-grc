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

    console.log('DocGen Chat request:', { message, conversation_id, action });

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

      // Buscar templates disponíveis
      const { data: templates } = await supabase
        .from('docgen_templates')
        .select('*')
        .or(`empresa_id.eq.${empresa_id},is_system.eq.true`);

      // Preparar prompt para a IA
      const systemPrompt = `Você é o DocGen 🧠, um assistente especializado em criação de documentos corporativos.

INFORMAÇÕES DO USUÁRIO:
- Nome: ${context.user_name}
- Empresa: ${context.empresa_nome}

INSTRUÇÕES PRINCIPAIS:
1. Seja conversacional e amigável, sempre cumprimente o usuário pelo nome
2. Identifique automaticamente o tipo de documento que o usuário precisa através do diálogo
3. Faça perguntas adaptativas baseadas no tipo de documento identificado
4. Forneça explicações simples para termos técnicos
5. Colete informações necessárias para gerar um documento completo

TIPOS DE DOCUMENTO DISPONÍVEIS:
${templates?.map(t => `- ${t.tipo_documento}: ${t.nome}`).join('\n')}

TOOLTIPS PARA TERMOS TÉCNICOS:
${JSON.stringify(templates?.reduce((acc, t) => ({...acc, ...t.tooltips}), {}) || {})}

CONTEXTO ATUAL:
- Etapa: ${context.etapa_atual}
- Tipo identificado: ${context.tipo_documento_identificado || 'Não identificado'}
- Informações coletadas: ${JSON.stringify(context.informacoes_coletadas || {})}

FORMATO DE RESPOSTA:
Sempre responda em JSON com esta estrutura:
{
  "message": "sua resposta conversacional",
  "tipo_documento_identificado": "tipo identificado ou null",
  "proxima_pergunta": "próxima pergunta específica ou null",
  "informacoes_necessarias": ["lista", "de", "informações", "ainda", "necessárias"],
  "termos_com_tooltip": ["BIA", "ROPA"], // termos que aparecem na sua resposta
  "etapa_atual": "identificacao|coleta|validacao|finalizacao",
  "documento_pronto": false // true quando todas as informações necessárias foram coletadas
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
      const template = templates?.find(t => t.tipo_documento === context.tipo_documento_identificado);
      if (!template) {
        throw new Error('Template não encontrado para o tipo de documento');
      }

      const documentPrompt = `Gere um documento ${context.tipo_documento_identificado} completo baseado nas informações coletadas.

TEMPLATE: ${JSON.stringify(template.estrutura)}
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
      const documentContent = JSON.parse(docData.choices[0].message.content);

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