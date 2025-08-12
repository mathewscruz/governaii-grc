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
      action = 'chat',
      doc_type_hint
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
      const systemPrompt = `Você é um especialista em documentação corporativa com amplo conhecimento em frameworks de compliance, regulamentações e melhores práticas empresariais.

CONTEXTO:
- Empresa: ${context.empresa_nome}
- Tipo de documento solicitado: ${doc_type_hint || 'documento corporativo'}
- Usuário: ${context.user_name}

INSTRUÇÕES CRÍTICAS:
1. Identifique EXATAMENTE o tipo de documento que o usuário está solicitando
2. Faça perguntas específicas e detalhadas para coletar todas as informações necessárias
3. Quando tiver informações suficientes, gere um documento EXTREMAMENTE COMPLETO E DETALHADO
4. O documento deve ser um exemplo de excelência, seguindo as melhores práticas do mercado
5. Inclua seções técnicas, procedimentos detalhados, controles específicos e métricas quando aplicável

TIPOS DE DOCUMENTOS E SEUS REQUISITOS:
- **Políticas de Segurança**: Deve incluir objetivos, escopo, responsabilidades, procedimentos detalhados, controles, monitoramento, penalidades, revisões
- **Política de Senhas**: Complexidade, rotação, armazenamento seguro, procedimentos de recuperação, auditoria, exceções
- **Política de Mesa Limpa**: Classificação de informações, procedimentos por tipo de documento, controles físicos, monitoramento, responsabilidades
- **Procedimentos Operacionais**: Passo-a-passo detalhado, responsáveis, controles, indicadores, contingências
- **Controles Internos**: Objetivos, atividades de controle, monitoramento, documentação, testes
- **Documentos de Compliance**: Framework aplicável, requisitos legais, controles, auditoria, relatórios

REGRAS PARA PERGUNTAS DETALHADAS:
- Faça NO MÁXIMO 4-6 perguntas por vez, mas seja MUITO específico
- Para políticas de segurança: pergunte sobre ambiente tecnológico, tipos de sistemas, usuários, riscos específicos
- Para procedimentos: pergunte sobre processos atuais, sistemas envolvidos, responsáveis, frequência
- Considere aspectos técnicos, organizacionais e regulatórios
- Adapte às regulamentações aplicáveis (LGPD, ISO 27001, SOX, COSO, ITIL, etc.)

REGRAS PARA GERAÇÃO DO DOCUMENTO COMPLETO:
- O documento deve ter NO MÍNIMO 8-12 seções bem estruturadas
- Inclua: Objetivo, Escopo, Definições, Responsabilidades, Procedimentos Detalhados, Controles, Monitoramento, Penalidades, Revisões
- Para cada seção, forneça conteúdo substantivo e específico
- Inclua tabelas, listas detalhadas, fluxos quando apropriado
- Adicione métricas e indicadores de desempenho
- Inclua procedimentos de exceção e contingência
- Referencie frameworks e regulamentações aplicáveis
- O documento deve ser implementável imediatamente pela empresa

ESTRUTURA OBRIGATÓRIA PARA DOCUMENTOS:
1. **Cabeçalho**: Título, versão, data, aprovação
2. **Índice**: Se necessário para documentos longos
3. **Objetivo e Escopo**: Claro e específico
4. **Definições**: Termos técnicos relevantes
5. **Responsabilidades**: Papéis específicos por área/cargo
6. **Procedimentos**: Detalhados e implementáveis
7. **Controles e Monitoramento**: Como verificar cumprimento
8. **Indicadores**: Métricas de sucesso
9. **Penalidades**: Consequências do não cumprimento
10. **Revisão e Atualização**: Frequência e responsáveis
11. **Anexos**: Se aplicável (formulários, checklists, etc.)

QUALIDADE EXIGIDA:
- Cada seção deve ter conteúdo substancial (não apenas tópicos)
- Use linguagem técnica apropriada mas clara
- Inclua exemplos práticos quando relevante
- Referencie melhores práticas do mercado
- O documento deve ser profissional e completo o suficiente para ser usado em auditorias

FORMATO DE RESPOSTA (JSON SOMENTE):
{
  "message": "texto da resposta que termina com uma pergunta específica",
  "tipo_documento_identificado": "politica|procedimento|norma|formulario|outro",
  "documento_nome_identificado": "ex.: Política de Senhas",
  "frameworks_relacionados": ["ISO 27001", "LGPD"],
  "informacoes_coletadas": {"chave": "valor"},
  "informacoes_necessarias": ["objetivo", "escopo", "diretrizes", "responsabilidades", "revisao"],
  "etapa_atual": "coleta|validacao|pronto",
  "documento_pronto": false
}

Quando tiver informações suficientes, diga "GERAR_DOCUMENTO" e crie o documento seguindo estes padrões de excelência.

Responda sempre em português brasileiro.`;

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
        documento_nome_identificado: parsedResponse.documento_nome_identificado || (context as any).documento_nome_identificado,
        frameworks_relacionados: parsedResponse.frameworks_relacionados || (context as any).frameworks_relacionados,
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
        documento_nome_identificado: (updatedContext as any).documento_nome_identificado || null,
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

      // Selecionar template: priorizar por nome identificado (doc_type_hint/documento_nome_identificado)
      const hintName = (doc_type_hint || (context as any).documento_nome_identificado || '').toLowerCase();
      let template = templates?.find(t => (t.nome || '').toLowerCase() === hintName)
        || templates?.find(t => hintName && (t.nome || '').toLowerCase().includes(hintName))
        || templates?.find(t => t.tipo_documento === context.tipo_documento_identificado);
      if (!template) {
        throw new Error('Template não encontrado para o tipo/nome de documento');
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

      const documentPrompt = `Gere um documento COMPLETO e ESPECÍFICO do tipo solicitado.

DOCUMENTO_EXATO: ${(context as any).documento_nome_identificado || doc_type_hint || context.tipo_documento_identificado}
FRAMEWORKS_REQUERIDOS: ${JSON.stringify((context as any).frameworks_relacionados || [])}
EMPRESA: ${context.empresa_nome}

Use a estrutura do template abaixo e cubra explicitamente os requisitos do(s) framework(s) citado(s) quando aplicável.

TEMPLATE: ${JSON.stringify(templateEstrutura || template.estrutura)}
INFORMAÇÕES COLETADAS: ${JSON.stringify(context.informacoes_coletadas)}

Requisitos obrigatórios de formatação:
- Capa com título igual a DOCUMENTO_EXATO, versão 1.0, data atual e nome da empresa
- Sumário
- Todas as seções definidas no template
- Conteúdo detalhado e profissional alinhado aos frameworks
- Rodapé com informações da empresa

Responda APENAS com um JSON na seguinte estrutura:
{
  "titulo": "título do documento (igual a DOCUMENTO_EXATO)",
  "versao": "1.0",
  "data_criacao": "YYYY-MM-DD",
  "secoes": [
    { "nome": "Objetivo", "conteudo": "..." }
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