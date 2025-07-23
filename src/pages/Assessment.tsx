import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  pergunta: string;
  tipo: 'texto' | 'multipla_escolha' | 'radio' | 'arquivo' | 'numerico' | 'booleano';
  opcoes?: string[];
  obrigatoria: boolean;
  peso?: number;
  ordem?: number;
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
          `due_diligence_responses?select=question_id,resposta,pontuacao&assessment_id=eq.${assessment.id}`,
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
        pergunta: q.titulo || q.pergunta,
        tipo: q.tipo,
        opcoes: q.opcoes,
        obrigatoria: q.obrigatoria,
        peso: q.peso,
        ordem: q.ordem
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

      const question = questions.find(q => q.id === questionId);
      const responseData: any = {
        assessment_id: assessment.id,
        question_id: questionId
      };

      // Determinar o tipo de resposta
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

      // Validar transição de status
      if (!validateStatusTransition(assessment.status, 'concluido')) {
        throw new Error(`Transição de status inválida: ${assessment.status} -> concluido`);
      }

      // Verificar perguntas obrigatórias
      const requiredQuestions = questions.filter(q => q.obrigatoria);
      const missingRequired = requiredQuestions.filter(q => !responses[q.id]);

      if (missingRequired.length > 0) {
        const missingTitles = missingRequired.map(q => q.pergunta).join(', ');
        assessmentLogger.warn('Perguntas obrigatórias não respondidas:', missingTitles);
        toast.error(`Por favor, responda as seguintes perguntas obrigatórias: ${missingTitles}`);
        return;
      }

      // Salvar todas as respostas pendentes
      assessmentLogger.info('Salvando respostas finais');
      await Promise.all(
        Object.entries(responses).map(([questionId, value]) => 
          saveResponse(questionId, value)
        )
      );

      // Finalizar assessment
      assessmentLogger.info('Finalizando assessment');
      const updateData = {
        status: 'concluido',
        data_conclusao: new Date().toISOString()
      };

      // Usar id e link_token para satisfazer a política RLS
      await supabaseRequest(`due_diligence_assessments?id=eq.${assessment.id}&link_token=eq.${token}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      });

      // Calcular score com IA
      assessmentLogger.info('Iniciando cálculo de score com IA...');
      try {
        const { data: scoreResult, error: scoreError } = await supabase.functions.invoke('calculate-assessment-score', {
          body: { assessment_id: assessment.id }
        });

        if (scoreError) {
          assessmentLogger.warn('Erro no cálculo de score:', scoreError);
        } else {
          assessmentLogger.info('Score calculado com sucesso:', scoreResult);
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
      
      // Log específico para RLS violation
      if (error.message?.includes('violates row-level security policy') || error.message?.includes('RLS')) {
        assessmentLogger.error('Erro de RLS - verificar política de acesso:', error);
        toast.error('Erro de permissão ao enviar questionário. Verifique o acesso.');
      } else {
        toast.error('Erro ao enviar o questionário. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
      setShowConfirmDialog(false);
    }
  }, [assessment, questions, responses, validateStatusTransition, saveResponse]);

  // Carregar assessment ao montar o componente
  useEffect(() => {
    fetchAssessment();
  }, [fetchAssessment]);

  // Renderizar loading
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando questionário...</p>
        </div>
      </div>
    );
  }

  // Renderizar erro se assessment não encontrado
  if (!assessment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Questionário não encontrado</h2>
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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center p-4">
        <div className="text-center max-w-lg mx-auto">
          <div className="relative mb-8 animate-scale-in">
            <div className="w-24 h-24 bg-gradient-to-br from-success to-success/80 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-success/20">
              <Check className="w-12 h-12 text-white animate-fade-in" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-primary to-primary/80 rounded-full animate-pulse"></div>
          </div>
          
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Questionário Enviado!
            </h2>
            <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
              Obrigado por responder ao questionário. Suas respostas foram enviadas com sucesso e estão sendo analisadas.
            </p>
            
            <div className="mt-8 p-6 bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg shadow-sm">
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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center p-4">
        <div className="text-center max-w-lg mx-auto">
          {/* Header com logo da empresa melhorado */}
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center justify-center mb-6">
              {assessment.empresa.logo_url && !logoError ? (
                <div className="relative p-4 bg-card rounded-2xl shadow-lg border border-border/50">
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
            <div className="w-24 h-24 bg-gradient-to-br from-success to-success/80 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-success/20">
              <CheckCircle className="w-12 h-12 text-white animate-fade-in" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-primary to-primary/80 rounded-full animate-pulse"></div>
          </div>
          
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Questionário Concluído!
            </h2>
            <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
              Obrigado por responder ao nosso questionário de due diligence. 
              Suas respostas foram enviadas com sucesso e estão sendo analisadas.
            </p>
            
            <div className="mt-8 p-6 bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl shadow-sm">
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

  const progress = totalPages > 0 ? ((currentPage + 1) / totalPages) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header com logo da empresa melhorado */}
        <div className="mb-8 text-center animate-fade-in">
          <Card className="inline-block p-6 shadow-lg border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-center mb-4">
              {assessment.empresa.logo_url && !logoError ? (
                <div className="relative p-3 bg-background rounded-xl shadow-sm">
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
              <h1 className="text-xl font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Due Diligence - {assessment.template.nome}
              </h1>
            </Card>
          </div>

        {/* Progress bar */}
        <div className="mb-8 animate-fade-in">
          <Card className="p-6 shadow-sm border-border/50 bg-card/30 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-muted-foreground">
                Página {currentPage + 1} de {totalPages}
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                {Math.round(progress)}% concluído
              </span>
            </div>
            <div className="relative">
              <Progress value={progress} className="w-full h-3 bg-muted/50" />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent rounded-full pointer-events-none"></div>
            </div>
          </Card>
        </div>

        {/* Perguntas */}
        <Card className="mb-8 shadow-lg border-border/50 bg-card/50 backdrop-blur-sm animate-fade-in">
          <CardHeader className="bg-gradient-to-r from-card to-card/80 border-b border-border/50">
            <CardTitle className="text-xl flex items-center space-x-2">
              <FileText className="w-5 h-5 text-primary" />
              <span>Questionário</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            {currentQuestions.map((question, index) => (
              <div key={question.id} className="space-y-4 p-6 bg-background/50 rounded-xl border border-border/30 shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <Label className="text-lg font-semibold text-foreground leading-relaxed block">
                  {question.pergunta}
                  {question.obrigatoria && <span className="text-destructive ml-2 text-xl">*</span>}
                </Label>

                {question.tipo === 'texto' && (
                  <Textarea
                    value={responses[question.id] || ''}
                    onChange={(e) => handleResponseChange(question.id, e.target.value)}
                    placeholder="Digite sua resposta..."
                    className="min-h-[120px] bg-background border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  />
                )}

                {question.tipo === 'radio' && question.opcoes && (
                  <RadioGroup
                    value={responses[question.id] || ''}
                    onValueChange={(value) => handleResponseChange(question.id, value)}
                    className="space-y-3"
                  >
                    {question.opcoes.map((opcao, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/30 transition-colors duration-200">
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
                    className="bg-background border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  />
                )}

                {question.tipo === 'booleano' && (
                  <RadioGroup
                    value={responses[question.id] || ''}
                    onValueChange={(value) => handleResponseChange(question.id, value)}
                    className="flex space-x-6"
                  >
                    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/30 transition-colors duration-200">
                      <RadioGroupItem value="sim" id={`${question.id}-sim`} className="border-border/50" />
                      <Label htmlFor={`${question.id}-sim`} className="text-sm font-medium cursor-pointer">Sim</Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/30 transition-colors duration-200">
                      <RadioGroupItem value="nao" id={`${question.id}-nao`} className="border-border/50" />
                      <Label htmlFor={`${question.id}-nao`} className="text-sm font-medium cursor-pointer">Não</Label>
                    </div>
                  </RadioGroup>
                )}

                {question.tipo === 'arquivo' && (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-border/50 hover:border-primary/50 rounded-xl p-8 text-center transition-colors duration-200 bg-accent/10 hover:bg-accent/20">
                      <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-3">
                        Arraste um arquivo ou clique para selecionar
                      </p>
                      <Input
                        type="file"
                        className="bg-background border-border/50"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleResponseChange(question.id, file.name);
                          }
                        }}
                      />
                    </div>
                    {responses[question.id] && (
                      <div className="flex items-center space-x-3 text-sm text-muted-foreground p-3 bg-success/10 rounded-lg border border-success/20">
                        <FileText className="h-4 w-4 text-success" />
                        <span className="font-medium">{responses[question.id]}</span>
                      </div>
                    )}
                  </div>
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