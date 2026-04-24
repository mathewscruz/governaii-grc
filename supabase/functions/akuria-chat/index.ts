import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Helper to list first N item names
const listItems = (items: any[], field: string, max = 15): string => {
  if (!items || items.length === 0) return 'Nenhum';
  const names = items.slice(0, max).map(i => i[field]).filter(Boolean);
  const suffix = items.length > max ? ` ... e mais ${items.length - max}` : '';
  return names.join(', ') + suffix;
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

    // Gather ALL company context in parallel (com colunas validadas no schema real)
    const [
      riscosRes, controlesRes, incidentesRes, denunciasRes,
      auditoriaRes, documentosRes, frameworksRes, evaluationsRes, contratosRes,
      ativosRes, contasRes, dadosRes, politicasRes,
      planosRes, fornecedoresRes
    ] = await Promise.all([
      supabase.from('riscos').select('id, nome, nivel_risco_inicial, nivel_risco_residual, status, aceito, status_aprovacao, responsavel').eq('empresa_id', empresaId),
      supabase.from('controles').select('id, nome, status, proxima_avaliacao, criticidade, frequencia').eq('empresa_id', empresaId),
      supabase.from('incidentes').select('id, titulo, criticidade, status, tipo').eq('empresa_id', empresaId),
      supabase.from('denuncias').select('id, titulo, status, gravidade, anonima').eq('empresa_id', empresaId),
      supabase.from('auditorias').select('id, nome, status, prioridade, tipo').eq('empresa_id', empresaId),
      supabase.from('documentos').select('id, nome, status, data_vencimento, tipo, arquivo_url, arquivo_url_externa').eq('empresa_id', empresaId),
      supabase.from('gap_analysis_frameworks').select('id, nome, versao, tipo_framework'),
      supabase.from('gap_analysis_evaluations').select('id, framework_id, conformity_status').eq('empresa_id', empresaId),
      supabase.from('contratos').select('id, nome, numero_contrato, status, data_fim, valor').eq('empresa_id', empresaId),
      supabase.from('ativos').select('id, nome, tipo, criticidade, status').eq('empresa_id', empresaId),
      supabase.from('contas_privilegiadas').select('id, usuario_beneficiario, tipo_acesso, nivel_privilegio, status, data_expiracao').eq('empresa_id', empresaId),
      supabase.from('dados_pessoais').select('id, nome, categoria_dados, sensibilidade, base_legal').eq('empresa_id', empresaId),
      supabase.from('politicas').select('id, titulo, status, versao, data_validade').eq('empresa_id', empresaId),
      supabase.from('planos_acao').select('id, titulo, status, prioridade, prazo').eq('empresa_id', empresaId),
      supabase.from('fornecedores').select('id, nome, status, categoria').eq('empresa_id', empresaId),
    ]);

    const riscos = riscosRes.data || [];
    const controles = controlesRes.data || [];
    const incidentes = incidentesRes.data || [];
    const denuncias = denunciasRes.data || [];
    const auditorias = auditoriaRes.data || [];
    const documentos = documentosRes.data || [];
    const frameworks = frameworksRes.data || [];
    const evaluations = evaluationsRes.data || [];
    const contratos = contratosRes.data || [];
    const ativos = ativosRes.data || [];
    const contas = contasRes.data || [];
    const dados = dadosRes.data || [];
    const politicas = politicasRes.data || [];
    const planos = planosRes.data || [];
    const fornecedores = fornecedoresRes.data || [];

    // Continuidade de Negócios (BCP/DRP)
    const [planosBCPRes, tarefasBCPRes, testesBCPRes] = await Promise.all([
      supabase.from('continuidade_planos').select('id, nome, tipo, status, rto_horas, rpo_horas, proxima_revisao').eq('empresa_id', empresaId),
      supabase.from('continuidade_tarefas').select('id, status').eq('empresa_id', empresaId),
      supabase.from('continuidade_testes').select('id, resultado, data_teste').eq('empresa_id', empresaId),
    ]);
    const planosBCP = planosBCPRes.data || [];
    const tarefasBCP = tarefasBCPRes.data || [];
    const testesBCP = testesBCPRes.data || [];

    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Score de conformidade por framework (a partir de evaluations)
    const frameworkScores = frameworks.map((f: any) => {
      const evs = evaluations.filter((e: any) => e.framework_id === f.id);
      if (evs.length === 0) return `${f.nome}: sem avaliações`;
      const conformes = evs.filter((e: any) => e.conformity_status === 'conforme').length;
      const score = Math.round((conformes / evs.length) * 100);
      return `${f.nome}: ${score}% (${conformes}/${evs.length} conformes)`;
    });

    const contextSummary = `
DADOS DA EMPRESA (use APENAS estes dados, NUNCA invente):

RISCOS (${riscos.length} total):
- ${riscos.filter(r => ['critico', 'muito_alto', 'alto', 'Crítico', 'Muito Alto', 'Alto'].includes(r.nivel_risco_inicial || '')).length} altos/críticos
- ${riscos.filter(r => r.aceito === true).length} aceitos formalmente
- ${riscos.filter(r => !r.status || r.status === 'identificado').length} identificados (sem tratamento)
- ${riscos.filter(r => r.status === 'em_tratamento' || r.status === 'tratado').length} em tratamento ou tratados
- Itens: ${listItems(riscos, 'nome')}

CONTROLES (${controles.length} total):
- ${controles.filter(c => c.status === 'ativo').length} ativos
- ${controles.filter(c => c.criticidade === 'critico').length} críticos
- ${controles.filter(c => c.proxima_avaliacao && new Date(c.proxima_avaliacao) <= thirtyDays && new Date(c.proxima_avaliacao) >= now).length} com avaliação vencendo em 30 dias
- Itens: ${listItems(controles, 'nome')}

INCIDENTES (${incidentes.length} total):
- ${incidentes.filter(i => ['aberto', 'investigacao', 'em_investigacao', 'em_andamento'].includes(i.status || '')).length} abertos/em andamento
- ${incidentes.filter(i => i.criticidade === 'critica').length} críticos
- ${incidentes.filter(i => i.status === 'resolvido').length} resolvidos
- Itens: ${listItems(incidentes, 'titulo')}

DENÚNCIAS (${denuncias.length} total):
- ${denuncias.filter(d => ['nova', 'em_investigacao', 'em_analise'].includes(d.status || '')).length} pendentes
- ${denuncias.filter(d => d.gravidade === 'alta' || d.gravidade === 'critica').length} graves
- ${denuncias.filter(d => d.anonima === true).length} anônimas
- Itens: ${listItems(denuncias, 'titulo')}

AUDITORIAS (${auditorias.length} total):
- ${auditorias.filter(a => a.status === 'em_andamento').length} em andamento
- ${auditorias.filter(a => a.status === 'concluida').length} concluídas
- Itens: ${listItems(auditorias, 'nome')}

DOCUMENTOS (${documentos.length} total):
- ${documentos.filter(d => d.data_vencimento && new Date(d.data_vencimento) < now).length} vencidos
- ${documentos.filter(d => d.data_vencimento && new Date(d.data_vencimento) <= thirtyDays && new Date(d.data_vencimento) >= now).length} vencendo em 30 dias
- ${documentos.filter(d => d.arquivo_url || d.arquivo_url_externa).length} com arquivo/URL anexado
- Itens: ${listItems(documentos, 'nome')}

ATIVOS (${ativos.length} total):
- ${ativos.filter(a => a.criticidade === 'critico').length} críticos
- ${ativos.filter(a => a.status === 'ativo').length} ativos
- Itens: ${listItems(ativos, 'nome')}

CONTAS PRIVILEGIADAS (${contas.length} total):
- ${contas.filter(c => c.status === 'ativo' || c.status === 'ativa').length} ativas
- ${contas.filter(c => c.data_expiracao && new Date(c.data_expiracao) <= thirtyDays && new Date(c.data_expiracao) >= now).length} expirando em 30 dias
- Itens: ${contas.slice(0, 15).map(c => `${c.usuario_beneficiario} (${c.tipo_acesso})`).join(', ') || 'Nenhuma'}

DADOS PESSOAIS - LGPD (${dados.length} total):
- ${dados.filter(d => d.sensibilidade === 'critico' || d.sensibilidade === 'sensivel').length} sensíveis/críticos
- Itens: ${listItems(dados, 'nome')}

POLÍTICAS (${politicas.length} total):
- ${politicas.filter(p => p.status === 'ativa' || p.status === 'vigente' || p.status === 'ativo').length} vigentes
- ${politicas.filter(p => p.data_validade && new Date(p.data_validade) < now).length} vencidas
- Itens: ${listItems(politicas, 'titulo')}

PLANOS DE AÇÃO (${planos.length} total):
- ${planos.filter(p => ['em_andamento', 'aberto', 'pendente'].includes(p.status || '')).length} em andamento/abertos
- ${planos.filter(p => p.status === 'concluido').length} concluídos
- ${planos.filter(p => p.prazo && new Date(p.prazo) < now && p.status !== 'concluido').length} atrasados
- Itens: ${listItems(planos, 'titulo')}

FORNECEDORES (${fornecedores.length} total):
- ${fornecedores.filter(f => f.status === 'ativo').length} ativos
- Itens: ${listItems(fornecedores, 'nome')}

CONTRATOS (${contratos.length} total):
- ${contratos.filter(c => c.status === 'ativo').length} ativos
- ${contratos.filter(c => c.data_fim && new Date(c.data_fim) <= thirtyDays && new Date(c.data_fim) >= now).length} vencendo em 30 dias
- Valor total contratado: R$ ${contratos.reduce((s, c) => s + (Number(c.valor) || 0), 0).toLocaleString('pt-BR')}
- Itens: ${listItems(contratos, 'nome')}

CONTINUIDADE DE NEGÓCIOS - BCP/DRP (${planosBCP.length} planos):
- ${planosBCP.filter(p => p.status === 'ativo').length} planos ativos
- ${planosBCP.filter(p => p.status === 'em_revisao').length} em revisão
- ${tarefasBCP.filter(t => t.status === 'pendente').length} tarefas pendentes
- ${testesBCP.length} testes registrados (${testesBCP.filter(t => t.resultado === 'aprovado').length} aprovados)
- Itens: ${listItems(planosBCP, 'nome')}

FRAMEWORKS DE COMPLIANCE (${frameworks.length}): 
${frameworkScores.length > 0 ? frameworkScores.join(' | ') : 'Nenhum framework com avaliações'}
    `.trim();

    const systemPrompt = `Você é a AkurIA, assistente inteligente de GRC (Governança, Risco e Compliance) da plataforma Akuris.

Seu papel:
- Responder perguntas sobre TODOS os módulos: Riscos, Controles, Incidentes, Auditorias, Documentos, Compliance/Frameworks, Contratos, Denúncias, Ativos, Contas Privilegiadas, Dados Pessoais, Políticas, Planos de Ação, Fornecedores, Continuidade de Negócios (BCP/DRP)
- Dar insights e recomendações baseados nos dados reais da empresa
- Quando o usuário perguntar "quais são meus X?", listar os itens pelo nome
- Explicar conceitos de GRC quando solicitado
- Ser objetivo, profissional e útil

Regras:
- Responda sempre em português brasileiro
- Use APENAS os dados fornecidos abaixo, NUNCA invente números ou informações
- Se não tiver dados suficientes, diga claramente
- Seja conciso mas completo
- Use formatação com **negrito** e listas quando apropriado
- Se um módulo tem 0 itens, diga que não há registros cadastrados nesse módulo

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
