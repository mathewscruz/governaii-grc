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

// Funções auxiliares para extração inteligente
function extractDocumentType(messageText: string): string | null {
  if (messageText.includes('política') || messageText.includes('politica')) return 'politica';
  if (messageText.includes('procedimento')) return 'procedimento';
  if (messageText.includes('norma')) return 'norma';
  if (messageText.includes('manual')) return 'manual';
  if (messageText.includes('código') || messageText.includes('codigo')) return 'codigo';
  return null;
}

function extractDocumentName(messageText: string): string | null {
  const patterns = [
    /política de ([^\n\.,]+)/i,
    /procedimento de ([^\n\.,]+)/i,
    /norma de ([^\n\.,]+)/i,
    /manual de ([^\n\.,]+)/i,
    /código de ([^\n\.,]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = messageText.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }
  return null;
}

function extractFrameworks(messageText: string): string[] {
  const frameworks = [];
  if (messageText.includes('iso 27001') || messageText.includes('iso27001')) frameworks.push('ISO 27001');
  if (messageText.includes('lgpd')) frameworks.push('LGPD');
  if (messageText.includes('coso')) frameworks.push('COSO');
  if (messageText.includes('itil')) frameworks.push('ITIL');
  if (messageText.includes('sox')) frameworks.push('SOX');
  return frameworks;
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
      const systemPrompt = `Você é DocGen, um especialista em documentação corporativa altamente qualificado, com amplo conhecimento em frameworks de compliance, regulamentações e melhores práticas empresariais.

CONTEXTO DA CONVERSA:
- Empresa: ${context.empresa_nome}
- Usuário: ${context.user_name}
- Documento solicitado: ${doc_type_hint || 'documento corporativo'}

SEU OBJETIVO:
Ajudar o usuário a criar documentos corporativos de alta qualidade, fazendo perguntas inteligentes e específicas para coletar informações precisas.

INSTRUÇÕES DE COMUNICAÇÃO:
1. **Seja conversacional e profissional** - Use um tom amigável mas competente
2. **Faça perguntas específicas** - NO MÁXIMO 4-6 perguntas por vez, mas seja muito específico
3. **Formate sua resposta claramente** - Use listas numeradas, negrito, e estrutura organizada
4. **Demonstre conhecimento** - Mencione frameworks relevantes (ISO 27001, LGPD, COSO, etc.)
5. **Seja prático** - Foque em informações que realmente impactam o documento final

TIPOS DE DOCUMENTOS ESPECIALIZADOS:
**Políticas Corporativas:**
- Política de Segurança da Informação
- Política de Senhas
- Política de Mesa Limpa
- Política de LGPD
- Código de Ética

**Procedimentos Operacionais:**
- Procedimentos de Backup
- Gestão de Incidentes
- Controle de Acesso
- Gestão de Mudanças

**Documentos de Compliance:**
- Plano de Continuidade de Negócios
- Análise de Impacto (BIA)
- Registros LGPD (ROPA)
- Matriz de Riscos

ESTRATÉGIA DE PERGUNTAS POR TIPO:

**Para Políticas:**
- Qual o escopo específico? (sistemas, usuários, processos)
- Quais são os principais riscos que vocês enfrentam?
- Existem regulamentações específicas que devem ser atendidas?
- Qual é a estrutura organizacional para este tema?

**Para Procedimentos:**
- Como o processo funciona atualmente?
- Quem são os responsáveis e suas funções?
- Quais sistemas/ferramentas são utilizados?
- Quais são os principais pontos de controle?

**Para Compliance:**
- Quais frameworks/normas devem ser atendidos?
- Qual é o ambiente tecnológico da empresa?
- Existem requisitos legais específicos?
- Como é feita a auditoria/monitoramento atual?

REGRAS PARA IDENTIFICAR QUANDO GERAR DOCUMENTO:
- O usuário respondeu pelo menos 3-4 rodadas de perguntas específicas
- Você coletou informações sobre: objetivo, escopo, responsabilidades, e procedimentos básicos
- O usuário demonstra que tem as informações necessárias
- Não há dúvidas críticas sobre o documento

FORMATO DE RESPOSTA OBRIGATÓRIO:
Responda SOMENTE com uma mensagem limpa e formatada para o usuário. NÃO inclua JSON visível, metadados técnicos ou informações de configuração na sua resposta.

Estruture sua resposta assim:
1. **Cumprimento/Reconhecimento** (se apropriado)
2. **Contexto do que foi identificado** (tipo de documento)
3. **Perguntas específicas organizadas por temas**
4. **Próximos passos claros**

Use formatação em markdown para destacar:
- **Negrito** para títulos e pontos importantes
- Listas numeradas para perguntas organizadas
- Listas com marcadores para itens relacionados

QUANDO ESTIVER PRONTO PARA GERAR O DOCUMENTO:
Diga claramente: "Tenho todas as informações necessárias! Agora posso gerar a [NOME DO DOCUMENTO] completa para a ${context.empresa_nome}. Clique no botão 'Gerar Documento' para prosseguir."

EXEMPLO DE RESPOSTA IDEAL:
"Perfeito! Identificei que você precisa de uma **Política de Senhas** para a ${context.empresa_nome}.

Para criar um documento completo e alinhado com as melhores práticas de segurança, preciso entender melhor o ambiente da sua empresa:

**1. Ambiente Tecnológico:**
   - Quais sistemas vocês utilizam? (Active Directory, Google Workspace, aplicações web?)
   - Quantos usuários aproximadamente a política irá abranger?

**2. Requisitos de Segurança:**
   - Vocês seguem algum framework específico? (ISO 27001, LGPD?)
   - Já existem controles de senha implementados atualmente?

**3. Estrutura Organizacional:**
   - Quem será responsável pela implementação desta política?
   - Existe uma área de TI/Segurança estruturada?

**4. Criticidade:**
   - Que tipo de informação sensível vocês processam?
   - Já tiveram algum incidente relacionado a senhas frágeis?

Com essas informações, posso criar uma política robusta e implementável!"

IMPORTANTE: Sempre responda em português brasileiro e mantenha o JSON válido.`;

      // Chamar OpenAI
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.slice(-15) // Mais contexto para melhor compreensão
          ],
          temperature: 0.8,
          max_tokens: 2000,
        }),
      });

      const aiData = await response.json();
      const aiMessage = aiData.choices[0].message.content;
      
      console.log('AI Response:', aiMessage);

      // Parse da resposta da IA
      let parsedResponse;
      try {
        // Tentar extrair JSON da resposta (pode estar misturado com texto)
        const jsonMatch = aiMessage.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[1]);
        } else {
          // Tentar encontrar JSON no início da resposta
          const jsonStart = aiMessage.indexOf('{');
          const jsonEnd = aiMessage.lastIndexOf('}') + 1;
          if (jsonStart !== -1 && jsonEnd > jsonStart) {
            const jsonString = aiMessage.substring(jsonStart, jsonEnd);
            parsedResponse = JSON.parse(jsonString);
          } else {
            throw new Error('JSON não encontrado');
          }
        }
        
        // Garantir que temos uma mensagem limpa
        if (!parsedResponse.message) {
          // Se não tem message no JSON, extrair apenas a parte da mensagem antes de dados técnicos
          const cleanMessage = aiMessage
            .replace(/```json[\s\S]*?```/g, '')
            .replace(/\{[\s\S]*?\}/g, '')
            .trim();
          parsedResponse.message = cleanMessage || aiMessage;
        }
        
        // Limpar a mensagem de informações técnicas desnecessárias
        if (parsedResponse.message) {
          parsedResponse.message = parsedResponse.message
            .replace(/```json[\s\S]*?```/g, '')
            .replace(/\{[\s\S]*?\}/g, '')
            .replace(/tipo_documento_identificado[\s\S]*$/g, '')
            .replace(/frameworks_relacionados[\s\S]*$/g, '')
            .replace(/informacoes_[\s\S]*$/g, '')
            .trim();
        }
        
      } catch (error) {
        console.log('Erro ao fazer parse da resposta JSON:', error);
        
        // Fallback - limpar mensagem de dados técnicos
        let cleanMessage = aiMessage
          .replace(/```json[\s\S]*?```/g, '')
          .replace(/\{[\s\S]*?\}/g, '')
          .replace(/"[^"]*":\s*[^,}]*/g, '')
          .replace(/tipo_documento_identificado[\s\S]*$/g, '')
          .replace(/frameworks_relacionados[\s\S]*$/g, '')
          .replace(/informacoes_[\s\S]*$/g, '')
          .trim();
        
        // Verificar se a resposta indica documento pronto
        const isDocumentReady = aiMessage.toLowerCase().includes('documento foi gerado') || 
                               aiMessage.toLowerCase().includes('documento está pronto') ||
                               aiMessage.toLowerCase().includes('política de senhas foi gerada') ||
                               aiMessage.toLowerCase().includes('pronto para ser implementado') ||
                               aiMessage.toLowerCase().includes('gerar_documento');
        
        parsedResponse = {
          message: cleanMessage || 'Resposta processada com sucesso.',
          tipo_documento_identificado: context.tipo_documento_identificado,
          etapa_atual: isDocumentReady ? 'pronto' : (context.etapa_atual || 'coleta'),
          documento_pronto: isDocumentReady
        };
      }

      // Detectar se documento está pronto baseado na mensagem limpa
      const messageText = parsedResponse.message.toLowerCase();
      const isDocumentReady = messageText.includes('clique no botão') || 
                             messageText.includes('gerar documento') ||
                             messageText.includes('tenho todas as informações') ||
                             messageText.includes('posso gerar') ||
                             messageText.includes('documento completa') ||
                             messageText.includes('documento está pronto');

      // Adicionar resposta da IA
      messages.push({ role: 'assistant', content: parsedResponse.message });

      // Atualizar contexto com detecção inteligente do documento
      const updatedContext = {
        ...context,
        tipo_documento_identificado: parsedResponse.tipo_documento_identificado || 
                                   extractDocumentType(messageText) || 
                                   context.tipo_documento_identificado,
        documento_nome_identificado: parsedResponse.documento_nome_identificado || 
                                   extractDocumentName(messageText) || 
                                   (context as any).documento_nome_identificado,
        frameworks_relacionados: parsedResponse.frameworks_relacionados || 
                               extractFrameworks(messageText) || 
                               (context as any).frameworks_relacionados,
        etapa_atual: isDocumentReady ? 'pronto' : (parsedResponse.etapa_atual || 'coleta'),
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
        tipo_documento_identificado: updatedContext.tipo_documento_identificado,
        documento_nome_identificado: updatedContext.documento_nome_identificado || null,
        termos_com_tooltip: parsedResponse.termos_com_tooltip || [],
        etapa_atual: updatedContext.etapa_atual,
        documento_pronto: isDocumentReady,
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
      
      // Se não encontrar template específico, usar template genérico baseado no tipo
      if (!template) {
        const docType = context.tipo_documento_identificado || 'politica';
        // Para políticas, usar o template de política
        if (docType === 'politica' || hintName.includes('política') || hintName.includes('politica')) {
          template = templates?.find(t => t.tipo_documento === 'politica') || templates?.[0];
        }
        // Para procedimentos, usar o template de procedimento
        else if (docType === 'procedimento' || hintName.includes('procedimento')) {
          template = templates?.find(t => t.tipo_documento === 'procedimento') || templates?.[0];
        }
        // Fallback para o primeiro template disponível
        else {
          template = templates?.[0];
        }
      }
      
      if (!template) {
        throw new Error('Nenhum template disponível no sistema');
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
          model: 'gpt-4.1-2025-04-14',
          messages: [
            { role: 'system', content: documentPrompt },
            { role: 'user', content: 'Gere o documento agora.' }
          ],
          temperature: 0.4,
          max_tokens: 8000,
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