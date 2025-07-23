import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CheckCircle, FileText, ArrowRight, ArrowLeft, AlertCircle, Upload, Building2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// ETAPA 5: Sistema de logs para debugging
const assessmentLogger = {
  info: (message: string, data?: any) => {
    console.log(`[Assessment] ${message}`, data || '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[Assessment] ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[Assessment] ${message}`, error || '');
  }
};

interface QuestionData {
  id: string;
  titulo: string;
  descricao?: string;
  pergunta: string;
  tipo: 'texto' | 'multipla_escolha' | 'radio' | 'arquivo' | 'numerico' | 'booleano' | 'select';
  opcoes?: string[];
  obrigatoria: boolean;
  peso?: number;
  ordem?: number;
  configuracoes?: {
    mostrar_evidencia_quando?: string;
    mostrar_justificativa_quando?: string;
    label_evidencia?: string;
    label_justificativa?: string;
    placeholder?: string;
    min?: number;
  };
}

interface AssessmentData {
  id: string;
  fornecedor_nome: string;
  fornecedor_email: string;
  status: 'enviado' | 'em_andamento' | 'concluido';
  data_envio: string;
  data_limite: string;
  data_conclusao?: string;
  empresa: {
    nome: string;
    logo_url?: string;
  };
  template: {
    nome: string;
    descricao?: string;
  };
}

// ETAPA 1: Função de requisição Supabase mais robusta
const supabaseRequest = async (endpoint: string, options: any = {}) => {
  const url = `https://lnlkahtugwmkznasapfd.supabase.co/rest/v1/${endpoint}`;
  const headers = {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubGthaHR1Z3dta3puYXNhcGZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxOTk4MjcsImV4cCI6MjA2ODc3NTgyN30.DRHZ_55_8aH8fEDghoY84fl3rChFNgVyPA9UM3y-KCY',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
    ...options.headers
  };

  assessmentLogger.info(`Fazendo requisição para: ${endpoint}`);

  try {
    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      const errorText = await response.text();
      assessmentLogger.error(`Erro na requisição ${endpoint}:`, {
        status: response.status,
        error: errorText
      });
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    assessmentLogger.info(`Sucesso na requisição ${endpoint}`);
    return data;
  } catch (error) {
    assessmentLogger.error(`Falha na requisição ${endpoint}:`, error);
    throw error;
  }
};

export default function Assessment() {
  const { token } = useParams();
  
  // Estados principais
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [logoLoading, setLogoLoading] = useState(true);

  const questionsPerPage = 5;
  const totalPages = Math.ceil(questions.length / questionsPerPage);
  const currentQuestions = questions.slice(
    currentPage * questionsPerPage,
    (currentPage + 1) * questionsPerPage
  );

  // Calcular progresso baseado em respostas preenchidas
  const calculateProgress = () => {
    if (questions.length === 0) return 0;
    const answeredQuestions = questions.filter(q => 
      responses[q.id] && responses[q.id].toString().trim() !== ''
    ).length;
    return (answeredQuestions / questions.length) * 100;
  };

  // ETAPA 2: Validação de status no código
  const validateStatusTransition = useCallback((currentStatus: string, newStatus: string): boolean => {
    const validTransitions = {
      'enviado': ['em_andamento', 'concluido'],
      'em_andamento': ['concluido'],
      'concluido': []
    };

    assessmentLogger.info(`Validando transição de status: ${currentStatus} -> ${newStatus}`);
    
    if (currentStatus === newStatus) return true;
    return validTransitions[currentStatus as keyof typeof validTransitions]?.includes(newStatus) || false;
  }, []);

  // ETAPA 3: Função melhorada para carregamento do logo
  const handleLogoLoad = useCallback(() => {
    assessmentLogger.info('Logo carregado com sucesso');
    setLogoLoading(false);
    setLogoError(false);
  }, []);

  const handleLogoError = useCallback(() => {
    assessmentLogger.warn('Erro ao carregar logo da empresa');
    setLogoLoading(false);
    setLogoError(true);
  }, []);

  // PLANO IMPLEMENTADO: Queries separadas para evitar problemas de RLS
  const fetchAssessment = useCallback(async () => {
    if (!token) {
      assessmentLogger.error('Token não fornecido');
      return;
    }

    try {
      setLoading(true);
      assessmentLogger.info('Iniciando busca do assessment', { token });

      // ETAPA 1: Query simples para assessment básico
      const assessmentData = await supabaseRequest(
        `due_diligence_assessments?select=*&link_token=eq.${token}`,
        { method: 'GET' }
      );

      if (!assessmentData || assessmentData.length === 0) {
        assessmentLogger.error('Assessment não encontrado');
        throw new Error('Assessment não encontrado');
      }

      const assessment = assessmentData[0];
      assessmentLogger.info('Assessment básico carregado', { id: assessment.id, status: assessment.status });

      // ETAPA 2: Query separada para dados da empresa (com fallback)
      let empresaData = { nome: 'Empresa', logo_url: null };
      try {
        assessmentLogger.info('Buscando dados da empresa');
        const empresaResponse = await supabaseRequest(
          `empresas?select=nome,logo_url&id=eq.${assessment.empresa_id}`,
          { method: 'GET' }
        );
        if (empresaResponse && empresaResponse.length > 0) {
          empresaData = empresaResponse[0];
          assessmentLogger.info('Dados da empresa carregados', { nome: empresaData.nome });
        }
      } catch (error) {
        assessmentLogger.warn('Erro ao carregar dados da empresa, usando fallback:', error);
      }

      // ETAPA 3: Query separada para dados do template (com fallback)
      let templateData = { nome: 'Assessment', descricao: null };
      try {
        assessmentLogger.info('Buscando dados do template');
        const templateResponse = await supabaseRequest(
          `due_diligence_templates?select=nome,descricao&id=eq.${assessment.template_id}`,
          { method: 'GET' }
        );
        if (templateResponse && templateResponse.length > 0) {
          templateData = templateResponse[0];
          assessmentLogger.info('Dados do template carregados', { nome: templateData.nome });
        }
      } catch (error) {
        assessmentLogger.warn('Erro ao carregar dados do template, usando fallback:', error);
      }

      // Verificar se já está concluído
      if (assessment.status === 'concluido') {
        assessmentLogger.info('Assessment já concluído');
        setIsFinished(true);
        setAssessment({
          id: assessment.id,
          fornecedor_nome: assessment.fornecedor_nome,
          fornecedor_email: assessment.fornecedor_email,
          status: assessment.status,
          data_envio: assessment.data_envio,
          data_limite: assessment.data_limite,
          data_conclusao: assessment.data_conclusao,
          empresa: empresaData,
          template: templateData
        });
        return;
      }

      // Marcar como em andamento se ainda não estiver
      if (assessment.status === 'enviado') {
        assessmentLogger.info('Marcando assessment como em andamento');
        try {
          await supabaseRequest(`due_diligence_assessments?id=eq.${assessment.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ 
              status: 'em_andamento',
              data_inicio: new Date().toISOString()
            })
          });
          assessment.status = 'em_andamento';
          assessmentLogger.info('Status atualizado para em_andamento');
        } catch (error) {
          assessmentLogger.warn('Erro ao atualizar status para em_andamento:', error);
        }
      }

      // ETAPA 4: Queries em paralelo para perguntas e respostas
      assessmentLogger.info('Buscando perguntas e respostas em paralelo');
      const [questionsData, responsesData] = await Promise.all([
        supabaseRequest(
          `due_diligence_questions?template_id=eq.${assessment.template_id}&order=ordem.asc`,
          { method: 'GET' }
        ).catch(error => {
          assessmentLogger.error('Erro ao carregar perguntas:', error);
          return [];
        }),
        supabaseRequest(
          `due_diligence_responses?select=question_id,resposta,pontuacao,evidencia,justificativa,arquivo_url&assessment_id=eq.${assessment.id}`,
          { method: 'GET' }
        ).catch(error => {
          assessmentLogger.warn('Erro ao carregar respostas existentes:', error);
          return [];
        })
      ]);

      // Montar respostas em objeto
      const responsesMap: Record<string, any> = {};
      responsesData.forEach((response: any) => {
        responsesMap[response.question_id] = response.resposta || response.pontuacao;
        // Adicionar evidências e justificativas se existirem
        if (response.evidencia) {
          responsesMap[`${response.question_id}_evidencia`] = response.evidencia;
        }
        if (response.justificativa) {
          responsesMap[`${response.question_id}_justificativa`] = response.justificativa;
        }
        if (response.arquivo_url) {
          responsesMap[`${response.question_id}_arquivo`] = response.arquivo_url;
        }
      });

      // ETAPA 5: Montar objeto final do assessment
      setAssessment({
        id: assessment.id,
        fornecedor_nome: assessment.fornecedor_nome,
        fornecedor_email: assessment.fornecedor_email,
        status: assessment.status,
        data_envio: assessment.data_envio,
        data_limite: assessment.data_limite,
        data_conclusao: assessment.data_conclusao,
        empresa: empresaData,
        template: templateData
      });
      
      setQuestions(questionsData.map((q: any) => ({
        id: q.id,
        titulo: q.titulo,
        descricao: q.descricao,
        pergunta: q.titulo || q.pergunta,
        tipo: q.tipo,
        opcoes: q.opcoes,
        obrigatoria: q.obrigatoria,
        peso: q.peso,
        ordem: q.ordem,
        configuracoes: q.configuracoes
      })));
      setResponses(responsesMap);
      
      assessmentLogger.info('Assessment carregado com sucesso completamente', {
        questionsCount: questionsData.length,
        responsesCount: Object.keys(responsesMap).length
      });

    } catch (error) {
      assessmentLogger.error('Erro ao carregar assessment:', error);
      toast.error('Erro ao carregar o questionário. Por favor, verifique o link.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Função para salvar resposta
  const saveResponse = useCallback(async (questionId: string, value: any) => {
    if (!assessment) return;

    try {
      assessmentLogger.info('Salvando resposta', { questionId, value });

      // Verificar se é uma evidência, justificativa ou arquivo
      const isEvidencia = questionId.endsWith('_evidencia');
      const isJustificativa = questionId.endsWith('_justificativa');
      const isArquivo = questionId.endsWith('_arquivo');
      const baseQuestionId = isEvidencia || isJustificativa || isArquivo ? 
        questionId.replace(/_evidencia|_justificativa|_arquivo$/, '') : questionId;

      const question = questions.find(q => q.id === baseQuestionId);
      const responseData: any = {
        assessment_id: assessment.id,
        question_id: baseQuestionId
      };

      // Se for evidência, justificativa ou arquivo, buscar resposta existente para atualizar
      if (isEvidencia || isJustificativa || isArquivo) {
        try {
          const existingResponse = await supabaseRequest(
            `due_diligence_responses?assessment_id=eq.${assessment.id}&question_id=eq.${baseQuestionId}`,
            { method: 'GET' }
          );
          
          if (existingResponse && existingResponse.length > 0) {
            // Atualizar campo específico
            const updateData: any = {};
            if (isEvidencia) {
              updateData.evidencia = value;
            } else if (isJustificativa) {
              updateData.justificativa = value;
            } else if (isArquivo) {
              updateData.arquivo_url = value;
            }

            await supabaseRequest(
              `due_diligence_responses?assessment_id=eq.${assessment.id}&question_id=eq.${baseQuestionId}`,
              {
                method: 'PATCH',
                body: JSON.stringify(updateData)
              }
            );
          } else {
            // Criar nova resposta com evidência/justificativa/arquivo
            if (isEvidencia) {
              responseData.evidencia = value;
            } else if (isJustificativa) {
              responseData.justificativa = value;
            } else if (isArquivo) {
              responseData.arquivo_url = value;
            }
            await supabaseRequest('due_diligence_responses', {
              method: 'POST',
              body: JSON.stringify(responseData)
            });
          }
        } catch (error) {
          assessmentLogger.error('Erro ao salvar evidência/justificativa:', error);
        }
        return;
      }

      // Salvar resposta principal
      if (question?.tipo === 'numerico') {
        responseData.pontuacao = parseFloat(value) || 0;
      } else {
        responseData.resposta = value;
      }

      // Fazer upsert manual
      try {
        // Tentar atualizar primeiro
        const existingResponse = await supabaseRequest(
          `due_diligence_responses?assessment_id=eq.${assessment.id}&question_id=eq.${questionId}`,
          { method: 'GET' }
        );
        
        if (existingResponse && existingResponse.length > 0) {
          // Atualizar existente
          await supabaseRequest(
            `due_diligence_responses?assessment_id=eq.${assessment.id}&question_id=eq.${questionId}`,
            {
              method: 'PATCH',
              body: JSON.stringify(responseData)
            }
          );
        } else {
          // Inserir novo
          await supabaseRequest('due_diligence_responses', {
            method: 'POST',
            body: JSON.stringify(responseData)
          });
        }
      } catch (error) {
        // Se falhar, tentar inserir
        await supabaseRequest('due_diligence_responses', {
          method: 'POST',
          body: JSON.stringify(responseData)
        });
      }

      assessmentLogger.info('Resposta salva com sucesso');
    } catch (error) {
      assessmentLogger.error('Erro ao salvar resposta:', error);
    }
  }, [assessment, questions]);

  // Handler para mudança de resposta
  const handleResponseChange = useCallback((questionId: string, value: any) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
    
    // Salvar automaticamente após 1 segundo
    const timeoutId = setTimeout(() => {
      saveResponse(questionId, value);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [saveResponse]);

  // ETAPA 4: Função de finalização mais robusta
  const submitAssessment = useCallback(async () => {
    if (!assessment) return;

    try {
      setSubmitting(true);
      assessmentLogger.info('Iniciando finalização do assessment');

      // Verificar status atual
      if (assessment.status === 'concluido') {
        assessmentLogger.warn('Assessment já está concluído');
        setIsFinished(true);
        return;
      }

      // Verificar perguntas obrigatórias de forma simplificada
      const requiredQuestions = questions.filter(q => q.obrigatoria);
      const missingRequired = requiredQuestions.filter(q => !responses[q.id] || !responses[q.id].toString().trim());

      if (missingRequired.length > 0) {
        const missingTitles = missingRequired.map(q => q.pergunta || q.titulo).join(', ');
        assessmentLogger.warn('Perguntas obrigatórias não respondidas:', missingTitles);
        toast.error(`Por favor, responda as seguintes perguntas obrigatórias: ${missingTitles}`);
        return;
      }

      // Salvar todas as respostas pendentes
      assessmentLogger.info('Salvando respostas finais');
      for (const [questionId, value] of Object.entries(responses)) {
        if (value && value.toString().trim()) {
          await saveResponse(questionId, value);
        }
      }

      // Finalizar assessment usando Supabase client
      assessmentLogger.info('Finalizando assessment', { assessmentId: assessment.id, token });
      const { data: updateData, error: updateError } = await supabase
        .from('due_diligence_assessments')
        .update({
          status: 'concluido',
          data_conclusao: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('link_token', token)
        .select();

      if (updateError) {
        assessmentLogger.error('Erro ao finalizar assessment:', updateError);
        throw new Error(`Erro ao finalizar assessment: ${updateError.message}`);
      }

      assessmentLogger.info('Assessment atualizado com sucesso:', updateData);

      // Calcular score com IA
      assessmentLogger.info('Iniciando cálculo de score com IA...');
      try {
        const { error: scoreError } = await supabase.functions.invoke('calculate-assessment-score', {
          body: { assessment_id: assessment.id }
        });

        if (scoreError) {
          assessmentLogger.warn('Erro no cálculo de score:', scoreError);
        } else {
          assessmentLogger.info('Score calculado com sucesso');
        }
      } catch (scoreError) {
        assessmentLogger.warn('Erro ao calcular score:', scoreError);
        // Não falhar o envio se o cálculo de score falhar
      }

      // Atualizar estado local
      setAssessment(prev => prev ? {
        ...prev,
        status: 'concluido',
        data_conclusao: new Date().toISOString()
      } : null);

      setIsFinished(true);
      assessmentLogger.info('Assessment finalizado com sucesso');
      toast.success('Questionário enviado com sucesso e está sendo avaliado!');

    } catch (error: any) {
      assessmentLogger.error('Erro ao finalizar assessment:', error);
      toast.error(`Erro ao enviar questionário: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setSubmitting(false);
      setShowConfirmDialog(false);
    }
  }, [assessment, questions, responses, saveResponse, token]);

  // Carregar assessment ao montar o componente
  useEffect(() => {
    fetchAssessment();
  }, [fetchAssessment]);

  // Renderizar loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/80">Carregando questionário...</p>
        </div>
      </div>
    );
  }

  // Renderizar erro se assessment não encontrado
  if (!assessment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card border-border shadow-xl">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-foreground">Questionário não encontrado</h2>
            <p className="text-muted-foreground">
              O link pode ter expirado ou ser inválido.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se já concluído, mostrar tela de sucesso
  if (assessment.status === 'concluido') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <div className="text-center max-w-lg mx-auto">
          <div className="relative mb-8 animate-scale-in">
            <div className="w-24 h-24 bg-gradient-to-br from-success to-success/80 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Check className="w-12 h-12 text-white animate-fade-in" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-primary to-primary/80 rounded-full animate-pulse"></div>
          </div>
          
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-3xl font-bold text-foreground">
              Questionário Enviado!
            </h2>
            <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
              Obrigado por responder ao questionário. Suas respostas foram enviadas com sucesso e estão sendo analisadas.
            </p>
            
            <div className="mt-8 p-6 bg-card border border-border rounded-lg shadow-sm">
              <div className="flex items-center justify-center space-x-2 text-success">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Concluído com sucesso</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar se já concluído
  if (isFinished) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <div className="text-center max-w-lg mx-auto">
          {/* Header com logo da empresa melhorado */}
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center justify-center mb-6">
              {assessment.empresa.logo_url && !logoError ? (
                <div className="relative p-4 bg-card rounded-2xl shadow-lg border border-border">
                  {logoLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  )}
                  <img
                    src={assessment.empresa.logo_url}
                    alt={`Logo ${assessment.empresa.nome}`}
                    className={`h-16 w-auto object-contain ${logoLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                    onLoad={handleLogoLoad}
                    onError={handleLogoError}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-20 w-20 bg-gradient-to-br from-muted to-muted/80 rounded-2xl shadow-lg">
                  <Building2 className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
            </div>
            <p className="text-muted-foreground text-lg font-medium">Due Diligence - {assessment.template.nome}</p>
          </div>

          <div className="relative mb-8 animate-scale-in">
            <div className="w-24 h-24 bg-gradient-to-br from-success to-success/80 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <CheckCircle className="w-12 h-12 text-white animate-fade-in" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-primary to-primary/80 rounded-full animate-pulse"></div>
          </div>
          
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-3xl font-bold text-foreground">
              Questionário Concluído!
            </h2>
            <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
              Obrigado por responder ao nosso questionário de due diligence. 
              Suas respostas foram enviadas com sucesso e estão sendo analisadas.
            </p>
            
            <div className="mt-8 p-6 bg-card border border-border rounded-xl shadow-sm">
              <div className="flex items-center justify-center space-x-3 text-success mb-3">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Concluído com sucesso</span>
              </div>
              <p className="text-sm text-muted-foreground">
                <strong>Concluído em:</strong> {assessment.data_conclusao ? 
                  new Date(assessment.data_conclusao).toLocaleString('pt-BR') : 
                  'Agora'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const progress = calculateProgress();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header com logo da empresa melhorado */}
        <div className="mb-8 text-center animate-fade-in">
          <Card className="inline-block p-6 shadow-lg border-border bg-card">
            <div className="flex items-center justify-center mb-4">
              {assessment.empresa.logo_url && !logoError ? (
                <div className="relative p-3 bg-card rounded-xl shadow-sm">
                  {logoLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  )}
                  <img
                    src={assessment.empresa.logo_url}
                    alt={`Logo ${assessment.empresa.nome}`}
                    className={`h-16 w-auto object-contain ${logoLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                    onLoad={handleLogoLoad}
                    onError={handleLogoError}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-20 w-20 bg-gradient-to-br from-muted to-muted/80 rounded-xl shadow-sm">
                  <Building2 className="h-10 w-10 text-muted-foreground" />
                </div>
                )}
              </div>
              <h1 className="text-xl font-semibold text-foreground">
                Due Diligence - {assessment.template.nome}
              </h1>
            </Card>
          </div>

        {/* Progress bar */}
        <div className="mb-8 animate-fade-in">
          <Card className="p-6 shadow-sm border-border bg-card">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-muted-foreground">
                Página {currentPage + 1} de {totalPages}
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                {Math.round(progress)}% das perguntas respondidas
              </span>
            </div>
            <div className="relative">
              <Progress value={progress} className="w-full h-3 bg-muted/50" />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent rounded-full pointer-events-none"></div>
            </div>
          </Card>
        </div>

        {/* Perguntas */}
        <Card className="mb-8 shadow-lg border-border bg-card animate-fade-in">
          <CardHeader className="bg-card border-b border-border">
            <CardTitle className="text-xl flex items-center space-x-2">
              <FileText className="w-5 h-5 text-primary" />
              <span>Questionário</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            {currentQuestions.map((question, index) => (
              <div key={question.id} className="space-y-4 p-6 bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground block">
                    {question.titulo}
                    {question.obrigatoria && <span className="text-destructive ml-2">*</span>}
                  </Label>
                  {question.descricao && (
                    <p className="text-lg font-semibold text-foreground leading-relaxed">
                      {question.descricao}
                    </p>
                  )}
                </div>

                {question.tipo === 'texto' && (
                  <Textarea
                    value={responses[question.id] || ''}
                    onChange={(e) => handleResponseChange(question.id, e.target.value)}
                    placeholder="Digite sua resposta..."
                    className="min-h-[120px] bg-white border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  />
                )}

                {question.tipo === 'radio' && question.opcoes && (
                  <RadioGroup
                    value={responses[question.id] || ''}
                    onValueChange={(value) => handleResponseChange(question.id, value)}
                    className="space-y-3"
                  >
                    {question.opcoes.map((opcao, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white transition-colors duration-200">
                        <RadioGroupItem value={opcao} id={`${question.id}-${index}`} className="border-border/50" />
                        <Label htmlFor={`${question.id}-${index}`} className="text-sm font-medium cursor-pointer flex-1">{opcao}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {question.tipo === 'numerico' && (
                  <Input
                    type="number"
                    value={responses[question.id] || ''}
                    onChange={(e) => handleResponseChange(question.id, e.target.value)}
                    placeholder="Digite um número..."
                     className="bg-white border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  />
                )}

                {question.tipo === 'booleano' && (
                  <RadioGroup
                    value={responses[question.id] || ''}
                    onValueChange={(value) => handleResponseChange(question.id, value)}
                    className="flex space-x-6"
                  >
                    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white transition-colors duration-200">
                      <RadioGroupItem value="sim" id={`${question.id}-sim`} className="border-border/50" />
                      <Label htmlFor={`${question.id}-sim`} className="text-sm font-medium cursor-pointer">Sim</Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white transition-colors duration-200">
                      <RadioGroupItem value="nao" id={`${question.id}-nao`} className="border-border/50" />
                      <Label htmlFor={`${question.id}-nao`} className="text-sm font-medium cursor-pointer">Não</Label>
                    </div>
                  </RadioGroup>
                )}

                {question.tipo === 'select' && question.opcoes && (
                  <Select
                    value={responses[question.id] || ''}
                    onValueChange={(value) => handleResponseChange(question.id, value)}
                  >
                    <SelectTrigger className="bg-white border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200">
                      <SelectValue placeholder="Selecione uma opção..." />
                    </SelectTrigger>
                    <SelectContent>
                      {question.opcoes.map((opcao, index) => (
                        <SelectItem key={index} value={opcao}>
                          {opcao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {question.tipo === 'arquivo' && (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-border/50 hover:border-primary/50 rounded-xl p-8 text-center transition-colors duration-200 bg-white">
                      <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-3">
                        Arraste um arquivo ou clique para selecionar
                      </p>
                      <Input
                        type="file"
                        className="bg-white border-border/50"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleResponseChange(question.id, file.name);
                          }
                        }}
                      />
                    </div>
                    {responses[question.id] && (
                      <div className="flex items-center space-x-3 text-sm text-muted-foreground p-3 bg-white rounded-lg border border-success/20">
                        <FileText className="h-4 w-4 text-success" />
                        <span className="font-medium">{responses[question.id]}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Campos condicionais para evidência e justificativa */}
                {question.configuracoes && responses[question.id] && (
                  <>
                    {/* Campo de evidência */}
                     {question.configuracoes.mostrar_evidencia_quando && 
                     question.configuracoes.mostrar_evidencia_quando.split(',').includes(responses[question.id]) && (
                      <div className="mt-4 p-4 bg-success/5 border border-success/20 rounded-lg animate-fade-in">
                        <Label className="text-sm font-medium text-success mb-3 block">
                          {question.configuracoes.label_evidencia || 'Evidência:'}
                        </Label>
                        
                        {/* Campo de texto para evidência */}
                        <Textarea
                          value={responses[`${question.id}_evidencia`] || ''}
                          onChange={(e) => handleResponseChange(`${question.id}_evidencia`, e.target.value)}
                          placeholder="Descreva as evidências que comprovam sua resposta..."
                          className="min-h-[100px] bg-white border-border/50 focus:border-success/50 focus:ring-2 focus:ring-success/20 transition-all duration-200 mb-4"
                        />
                        
                        {/* Campo de upload de arquivo para evidência */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-success block">
                            Anexar documento (opcional):
                          </Label>
                          <div className="border-2 border-dashed border-success/30 hover:border-success/50 rounded-lg p-4 text-center transition-colors duration-200 bg-white">
                            <Upload className="h-6 w-6 text-success/60 mx-auto mb-2" />
                            <p className="text-xs text-success/60 mb-2">
                              Clique para selecionar um arquivo
                            </p>
                            <Input
                              type="file"
                              className="text-xs bg-white border-success/30 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-success/10 file:text-success"
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleResponseChange(`${question.id}_arquivo`, file.name);
                                  toast.success('Arquivo anexado com sucesso!');
                                }
                              }}
                            />
                          </div>
                          {responses[`${question.id}_arquivo`] && (
                            <div className="flex items-center space-x-2 text-xs text-success bg-success/10 p-2 rounded border border-success/20">
                              <FileText className="h-3 w-3" />
                              <span>Arquivo: {responses[`${question.id}_arquivo`]}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Campo de justificativa */}
                    {question.configuracoes.mostrar_justificativa_quando && 
                     question.configuracoes.mostrar_justificativa_quando.split(',').includes(responses[question.id]) && (
                      <div className="mt-4 p-4 bg-warning/5 border border-warning/20 rounded-lg animate-fade-in">
                        <Label className="text-sm font-medium text-warning mb-2 block">
                          {question.configuracoes.label_justificativa || 'Justificativa:'}
                        </Label>
                        <Textarea
                          value={responses[`${question.id}_justificativa`] || ''}
                          onChange={(e) => handleResponseChange(`${question.id}_justificativa`, e.target.value)}
                          placeholder="Explique o motivo e planos futuros..."
                          className="min-h-[100px] bg-white border-border/50 focus:border-warning/50 focus:ring-2 focus:ring-warning/20 transition-all duration-200"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Navegação */}
        <div className="flex justify-between items-center animate-fade-in">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            size="lg"
            className="shadow-sm hover:shadow-md transition-all duration-200 bg-background/50 backdrop-blur-sm border-border/50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>

          {currentPage === totalPages - 1 ? (
            <Button
              onClick={() => setShowConfirmDialog(true)}
              disabled={submitting}
              size="lg"
              className="shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 px-8"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Finalizar Questionário
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              size="lg"
              className="shadow-md hover:shadow-lg transition-all duration-200 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80"
            >
              Próxima
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>

        {/* Dialog de confirmação */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent className="bg-card/95 backdrop-blur-sm border-border/50 shadow-xl">
            <AlertDialogHeader className="space-y-4">
              <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mx-auto">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <AlertDialogTitle className="text-center text-xl">Finalizar Questionário</AlertDialogTitle>
              <AlertDialogDescription className="text-center text-muted-foreground leading-relaxed">
                Tem certeza que deseja finalizar e enviar o questionário? 
                Após o envio, não será possível fazer alterações.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex space-x-4 pt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowConfirmDialog(false)}
                disabled={submitting}
                className="flex-1 bg-background/50 border-border/50 hover:bg-background/80"
              >
                Cancelar
              </Button>
              <AlertDialogAction 
                onClick={submitAssessment} 
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Confirmar
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}