import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { logger } from '@/lib/logger';

// ETAPA 5: Sistema de logs para debugging
const assessmentLogger = {
  info: (message: string, data?: any) => {
    logger.info(`[Assessment] ${message}`, { module: 'Assessment', details: data });
  },
  warn: (message: string, data?: any) => {
    logger.warn(`[Assessment] ${message}`, { module: 'Assessment', details: data });
  },
  error: (message: string, error?: any) => {
    logger.error(`[Assessment] ${message}`, { module: 'Assessment', error: String(error) });
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

const createSupabaseRequest = (assessmentToken: string | undefined) => {
  return async (endpoint: string, options: any = {}) => {
    const url = `https://lnlkahtugwmkznasapfd.supabase.co/rest/v1/${endpoint}`;
    const headers: Record<string, string> = {
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubGthaHR1Z3dta3puYXNhcGZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxOTk4MjcsImV4cCI6MjA2ODc3NTgyN30.DRHZ_55_8aH8fEDghoY84fl3rChFNgVyPA9UM3y-KCY',
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...options.headers
    };

    if (assessmentToken) {
      headers['x-assessment-token'] = assessmentToken;
    }

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
};

// Wrapper component for consistent navy background
const AssessmentShell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-[hsl(230,25%,7%)] relative overflow-hidden">
    {/* Radial neon glow */}
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_center,hsl(250,80%,55%,0.15),transparent_70%)]" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[radial-gradient(ellipse_at_center,hsl(220,80%,40%,0.08),transparent_70%)]" />
    </div>
    {/* Akuris logo header */}
    <div className="relative z-10 flex justify-center pt-8 pb-4">
      <img src="/akuris-logo.png" alt="Akuris" className="h-10 w-auto opacity-90" />
    </div>
    <div className="relative z-10">
      {children}
    </div>
    {/* Footer */}
    <div className="relative z-10 text-center pb-6 pt-8">
      <p className="text-xs text-white/30">Powered by <span className="font-semibold text-white/50">Akuris</span></p>
    </div>
  </div>
);

export default function Assessment() {
  const { token } = useParams();
  
  const supabaseRequest = useMemo(() => createSupabaseRequest(token), [token]);
  
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

  const calculateProgress = () => {
    if (questions.length === 0) return 0;
    const answeredQuestions = questions.filter(q => 
      responses[q.id] && responses[q.id].toString().trim() !== ''
    ).length;
    return (answeredQuestions / questions.length) * 100;
  };

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

  const fetchAssessment = useCallback(async () => {
    if (!token) {
      assessmentLogger.error('Token não fornecido');
      return;
    }

    try {
      setLoading(true);
      assessmentLogger.info('Iniciando busca do assessment', { token });

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

      assessmentLogger.info('Buscando perguntas e respostas em paralelo');
      const [questionsData, responsesData] = await Promise.all([
        supabaseRequest(
          `due_diligence_questions?template_id=eq.${assessment.template_id}&order=ordem.asc`,
          { method: 'GET' }
        ).catch(error => {
          assessmentLogger.error('Erro ao carregar perguntas:', error);
          throw error;
        }),
        supabaseRequest(
          `due_diligence_responses?select=question_id,resposta,pontuacao,evidencia,justificativa,arquivo_url&assessment_id=eq.${assessment.id}`,
          { method: 'GET' }
        ).catch(error => {
          assessmentLogger.warn('Erro ao carregar respostas existentes:', error);
          return [];
        })
      ]);

      if (!questionsData || questionsData.length === 0) {
        assessmentLogger.error('Nenhuma pergunta encontrada para o template');
        throw new Error('Este questionário não possui perguntas configuradas. Por favor, entre em contato com o remetente.');
      }

      const responsesMap: Record<string, any> = {};
      responsesData.forEach((response: any) => {
        responsesMap[response.question_id] = response.resposta || response.pontuacao;
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
  }, [token, supabaseRequest]);

  const saveResponse = useCallback(async (questionId: string, value: any) => {
    if (!assessment) return;

    try {
      assessmentLogger.info('Salvando resposta', { questionId, value });

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

      if (isEvidencia || isJustificativa || isArquivo) {
        try {
          const existingResponse = await supabaseRequest(
            `due_diligence_responses?assessment_id=eq.${assessment.id}&question_id=eq.${baseQuestionId}`,
            { method: 'GET' }
          );
          
          if (existingResponse && existingResponse.length > 0) {
            const updateData: any = {};
            if (isEvidencia) updateData.evidencia = value;
            else if (isJustificativa) updateData.justificativa = value;
            else if (isArquivo) updateData.arquivo_url = value;

            await supabaseRequest(
              `due_diligence_responses?assessment_id=eq.${assessment.id}&question_id=eq.${baseQuestionId}`,
              { method: 'PATCH', body: JSON.stringify(updateData) }
            );
          } else {
            if (isEvidencia) responseData.evidencia = value;
            else if (isJustificativa) responseData.justificativa = value;
            else if (isArquivo) responseData.arquivo_url = value;
            await supabaseRequest('due_diligence_responses', {
              method: 'POST', body: JSON.stringify(responseData)
            });
          }
        } catch (error) {
          assessmentLogger.error('Erro ao salvar evidência/justificativa:', error);
        }
        return;
      }

      if (question?.tipo === 'numerico') {
        responseData.pontuacao = parseFloat(value) || 0;
      } else {
        responseData.resposta = value;
      }

      try {
        const existingResponse = await supabaseRequest(
          `due_diligence_responses?assessment_id=eq.${assessment.id}&question_id=eq.${questionId}`,
          { method: 'GET' }
        );
        
        if (existingResponse && existingResponse.length > 0) {
          await supabaseRequest(
            `due_diligence_responses?assessment_id=eq.${assessment.id}&question_id=eq.${questionId}`,
            { method: 'PATCH', body: JSON.stringify(responseData) }
          );
        } else {
          await supabaseRequest('due_diligence_responses', {
            method: 'POST', body: JSON.stringify(responseData)
          });
        }
      } catch (error) {
        await supabaseRequest('due_diligence_responses', {
          method: 'POST', body: JSON.stringify(responseData)
        });
      }

      assessmentLogger.info('Resposta salva com sucesso');
    } catch (error) {
      assessmentLogger.error('Erro ao salvar resposta:', error);
    }
  }, [assessment, questions, supabaseRequest]);

  const handleResponseChange = useCallback((questionId: string, value: any) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
    const timeoutId = setTimeout(() => {
      saveResponse(questionId, value);
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [saveResponse]);

  const submitAssessment = useCallback(async () => {
    if (!assessment) return;

    try {
      setSubmitting(true);
      assessmentLogger.info('Iniciando finalização do assessment');

      if (assessment.status === 'concluido') {
        assessmentLogger.warn('Assessment já está concluído');
        setIsFinished(true);
        return;
      }

      const requiredQuestions = questions.filter(q => q.obrigatoria);
      const missingRequired = requiredQuestions.filter(q => !responses[q.id] || !responses[q.id].toString().trim());

      if (missingRequired.length > 0) {
        const missingTitles = missingRequired.map(q => q.pergunta || q.titulo).join(', ');
        assessmentLogger.warn('Perguntas obrigatórias não respondidas:', missingTitles);
        toast.error(`Por favor, responda as seguintes perguntas obrigatórias: ${missingTitles}`);
        return;
      }

      assessmentLogger.info('Salvando respostas finais');
      for (const [questionId, value] of Object.entries(responses)) {
        if (value && value.toString().trim()) {
          await saveResponse(questionId, value);
        }
      }

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
      }

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

  useEffect(() => {
    fetchAssessment();
  }, [fetchAssessment]);

  // === RENDER: Loading ===
  if (loading) {
    return (
      <AssessmentShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(250,80%,60%)] mx-auto mb-4"></div>
            <p className="text-white/60 text-sm">Carregando questionário...</p>
          </div>
        </div>
      </AssessmentShell>
    );
  }

  // === RENDER: Error ===
  if (!assessment) {
    return (
      <AssessmentShell>
        <div className="flex items-center justify-center min-h-[60vh] p-4">
          <Card className="w-full max-w-md bg-white/5 backdrop-blur-sm border-white/10 shadow-2xl">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2 text-white">Questionário não encontrado</h2>
              <p className="text-white/50">
                O link pode ter expirado ou ser inválido.
              </p>
            </CardContent>
          </Card>
        </div>
      </AssessmentShell>
    );
  }

  // === RENDER: Completed (status === 'concluido') ===
  if (assessment.status === 'concluido') {
    return (
      <AssessmentShell>
        <div className="flex items-center justify-center min-h-[60vh] p-4">
          <div className="text-center max-w-lg mx-auto">
            <div className="relative mb-8 animate-scale-in">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
                <Check className="w-12 h-12 text-white animate-fade-in" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-[hsl(250,80%,60%)] to-[hsl(250,80%,50%)] rounded-full animate-pulse"></div>
            </div>
            
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-3xl font-bold text-white">
                Questionário Enviado!
              </h2>
              <p className="text-lg text-white/60 max-w-md mx-auto leading-relaxed">
                Obrigado por responder ao questionário. Suas respostas foram enviadas com sucesso e estão sendo analisadas.
              </p>
              
              <div className="mt-8 p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
                <div className="flex items-center justify-center space-x-2 text-emerald-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Concluído com sucesso</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AssessmentShell>
    );
  }

  // === RENDER: Finished (isFinished) ===
  if (isFinished) {
    return (
      <AssessmentShell>
        <div className="flex items-center justify-center min-h-[60vh] p-4">
          <div className="text-center max-w-lg mx-auto">
            {/* Company logo */}
            <div className="mb-8 animate-fade-in">
              <div className="flex items-center justify-center mb-6">
                {assessment.empresa.logo_url && !logoError ? (
                  <div className="relative p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10">
                    {logoLoading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(250,80%,60%)]"></div>
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
                  <div className="flex items-center justify-center h-20 w-20 bg-white/10 rounded-2xl border border-white/10">
                    <Building2 className="h-10 w-10 text-white/40" />
                  </div>
                )}
              </div>
              <p className="text-white/50 text-lg font-medium">Due Diligence - {assessment.template.nome}</p>
            </div>

            <div className="relative mb-8 animate-scale-in">
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
                <CheckCircle className="w-12 h-12 text-white animate-fade-in" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-[hsl(250,80%,60%)] to-[hsl(250,80%,50%)] rounded-full animate-pulse"></div>
            </div>
            
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-3xl font-bold text-white">
                Questionário Concluído!
              </h2>
              <p className="text-lg text-white/60 max-w-md mx-auto leading-relaxed">
                Obrigado por responder ao nosso questionário de due diligence. 
                Suas respostas foram enviadas com sucesso e estão sendo analisadas.
              </p>
              
              <div className="mt-8 p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
                <div className="flex items-center justify-center space-x-3 text-emerald-400 mb-3">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Concluído com sucesso</span>
                </div>
                <p className="text-sm text-white/40">
                  <strong className="text-white/60">Concluído em:</strong> {assessment.data_conclusao ? 
                    new Date(assessment.data_conclusao).toLocaleString('pt-BR') : 
                    'Agora'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </AssessmentShell>
    );
  }

  // === RENDER: Main form ===
  const progress = calculateProgress();

  return (
    <AssessmentShell>
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        {/* Header with company logo */}
        <div className="mb-8 text-center animate-fade-in">
          <Card className="inline-block p-6 shadow-2xl border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="flex items-center justify-center mb-4">
              {assessment.empresa.logo_url && !logoError ? (
                <div className="relative p-3 bg-white/10 rounded-xl">
                  {logoLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(250,80%,60%)]"></div>
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
                <div className="flex items-center justify-center h-20 w-20 bg-white/10 rounded-xl">
                  <Building2 className="h-10 w-10 text-white/40" />
                </div>
              )}
            </div>
            <h1 className="text-xl font-semibold text-white">
              Due Diligence - {assessment.template.nome}
            </h1>
          </Card>
        </div>

        {/* Progress bar */}
        <div className="mb-8 animate-fade-in">
          <Card className="p-6 shadow-lg border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-white/50">
                Página {currentPage + 1} de {totalPages}
              </span>
              <span className="text-sm font-medium text-white/50">
                {Math.round(progress)}% das perguntas respondidas
              </span>
            </div>
            <div className="relative">
              <Progress value={progress} className="w-full h-3 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-[hsl(250,80%,60%)] [&>div]:to-[hsl(250,80%,50%)]" />
            </div>
          </Card>
        </div>

        {/* Questions */}
        <Card className="mb-8 shadow-2xl border-white/10 bg-white/5 backdrop-blur-sm animate-fade-in">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-xl flex items-center space-x-3 text-white">
              {assessment.empresa.logo_url && !logoError ? (
                <div className="relative flex-shrink-0">
                  {logoLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[hsl(250,80%,60%)]"></div>
                    </div>
                  )}
                  <img
                    src={assessment.empresa.logo_url}
                    alt={`Logo ${assessment.empresa.nome}`}
                    className={`h-8 w-auto object-contain ${logoLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                    onLoad={handleLogoLoad}
                    onError={handleLogoError}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-8 w-8 bg-white/10 rounded-lg flex-shrink-0">
                  <Building2 className="h-4 w-4 text-white/40" />
                </div>
              )}
              <span>Questionário</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            {currentQuestions.map((question, index) => (
              <div key={question.id} className="space-y-4 p-6 bg-white/[0.03] rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-white/50 block">
                    {question.titulo}
                    {question.obrigatoria && <span className="text-red-400 ml-2">*</span>}
                  </Label>
                  {question.descricao && (
                    <p className="text-lg font-semibold text-white leading-relaxed">
                      {question.descricao}
                    </p>
                  )}
                </div>

                {question.tipo === 'texto' && (
                  <Textarea
                    value={responses[question.id] || ''}
                    onChange={(e) => handleResponseChange(question.id, e.target.value)}
                    placeholder="Digite sua resposta..."
                    className="min-h-[120px] bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[hsl(250,80%,60%)]/50 focus:ring-2 focus:ring-[hsl(250,80%,60%)]/20 transition-all duration-200"
                  />
                )}

                {question.tipo === 'radio' && question.opcoes && (
                  <RadioGroup
                    value={responses[question.id] || ''}
                    onValueChange={(value) => handleResponseChange(question.id, value)}
                    className="space-y-3"
                  >
                    {question.opcoes.map((opcao, idx) => (
                      <div key={idx} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors duration-200">
                        <RadioGroupItem value={opcao} id={`${question.id}-${idx}`} className="border-white/30 text-[hsl(250,80%,60%)]" />
                        <Label htmlFor={`${question.id}-${idx}`} className="text-sm font-medium cursor-pointer flex-1 text-white/80">{opcao}</Label>
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
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[hsl(250,80%,60%)]/50 focus:ring-2 focus:ring-[hsl(250,80%,60%)]/20 transition-all duration-200"
                  />
                )}

                {question.tipo === 'booleano' && (
                  <RadioGroup
                    value={responses[question.id] || ''}
                    onValueChange={(value) => handleResponseChange(question.id, value)}
                    className="flex space-x-6"
                  >
                    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors duration-200">
                      <RadioGroupItem value="sim" id={`${question.id}-sim`} className="border-white/30 text-[hsl(250,80%,60%)]" />
                      <Label htmlFor={`${question.id}-sim`} className="text-sm font-medium cursor-pointer text-white/80">Sim</Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors duration-200">
                      <RadioGroupItem value="nao" id={`${question.id}-nao`} className="border-white/30 text-[hsl(250,80%,60%)]" />
                      <Label htmlFor={`${question.id}-nao`} className="text-sm font-medium cursor-pointer text-white/80">Não</Label>
                    </div>
                  </RadioGroup>
                )}

                {question.tipo === 'select' && question.opcoes && (
                  <Select
                    value={responses[question.id] || ''}
                    onValueChange={(value) => handleResponseChange(question.id, value)}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-[hsl(250,80%,60%)]/50 focus:ring-2 focus:ring-[hsl(250,80%,60%)]/20 transition-all duration-200">
                      <SelectValue placeholder="Selecione uma opção..." />
                    </SelectTrigger>
                    <SelectContent>
                      {question.opcoes.map((opcao, idx) => (
                        <SelectItem key={idx} value={opcao}>
                          {opcao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {question.tipo === 'arquivo' && (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-white/10 hover:border-[hsl(250,80%,60%)]/30 rounded-xl p-8 text-center transition-colors duration-200 bg-white/[0.02]">
                      <Upload className="h-10 w-10 text-white/30 mx-auto mb-3" />
                      <p className="text-sm text-white/40 mb-3">
                        Arraste um arquivo ou clique para selecionar
                      </p>
                      <Input
                        type="file"
                        className="bg-white/5 border-white/10 text-white/70"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 10 * 1024 * 1024) {
                            toast.error('Arquivo deve ter no máximo 10MB.');
                            return;
                          }
                          try {
                            toast.info('Enviando arquivo...');
                            const fileName = `${Date.now()}-${file.name}`;
                            const filePath = `${assessment?.id || 'temp'}/${question.id}/${fileName}`;
                            const { error: uploadError } = await supabase.storage
                              .from('due-diligence-evidencias')
                              .upload(filePath, file);
                            if (uploadError) throw uploadError;
                            const { data: { publicUrl } } = supabase.storage
                              .from('due-diligence-evidencias')
                              .getPublicUrl(filePath);
                            handleResponseChange(question.id, file.name);
                            handleResponseChange(`${question.id}_arquivo`, publicUrl);
                            toast.success('Arquivo enviado com sucesso!');
                          } catch (err: any) {
                            assessmentLogger.error('Erro no upload:', err);
                            toast.error('Erro ao enviar arquivo. Tente novamente.');
                          }
                        }}
                      />
                    </div>
                    {responses[question.id] && (
                      <div className="flex items-center space-x-3 text-sm text-white/60 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <FileText className="h-4 w-4 text-emerald-400" />
                        <span className="font-medium">{responses[question.id]}</span>
                        {responses[`${question.id}_arquivo`] && (
                          <a href={responses[`${question.id}_arquivo`]} target="_blank" rel="noopener noreferrer" className="text-[hsl(250,80%,60%)] underline text-xs ml-auto">
                            Ver arquivo
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Conditional evidence and justification fields */}
                {question.configuracoes && responses[question.id] && (
                  <>
                    {question.configuracoes.mostrar_evidencia_quando && 
                     question.configuracoes.mostrar_evidencia_quando.split(',').includes(responses[question.id]) && (
                      <div className="mt-4 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg animate-fade-in">
                        <Label className="text-sm font-medium text-emerald-400 mb-3 block">
                          {question.configuracoes.label_evidencia || 'Evidência:'}
                        </Label>
                        <Textarea
                          value={responses[`${question.id}_evidencia`] || ''}
                          onChange={(e) => handleResponseChange(`${question.id}_evidencia`, e.target.value)}
                          placeholder="Descreva as evidências que comprovam sua resposta..."
                          className="min-h-[100px] bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200 mb-4"
                        />
                        
                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-emerald-400 block">
                            Anexar documento (opcional):
                          </Label>
                          <div className="border-2 border-dashed border-emerald-500/20 hover:border-emerald-500/40 rounded-lg p-4 text-center transition-colors duration-200 bg-white/[0.02]">
                            <Upload className="h-6 w-6 text-emerald-400/40 mx-auto mb-2" />
                            <p className="text-xs text-emerald-400/40 mb-2">
                              Clique para selecionar um arquivo
                            </p>
                            <Input
                              type="file"
                              className="text-xs bg-white/5 border-white/10 text-white/70 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-emerald-500/10 file:text-emerald-400"
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (file.size > 10 * 1024 * 1024) {
                                  toast.error('Arquivo deve ter no máximo 10MB.');
                                  return;
                                }
                                try {
                                  toast.info('Enviando evidência...');
                                  const fileName = `${Date.now()}-${file.name}`;
                                  const filePath = `${assessment?.id || 'temp'}/evidencias/${question.id}/${fileName}`;
                                  const { error: uploadError } = await supabase.storage
                                    .from('due-diligence-evidencias')
                                    .upload(filePath, file);
                                  if (uploadError) throw uploadError;
                                  const { data: { publicUrl } } = supabase.storage
                                    .from('due-diligence-evidencias')
                                    .getPublicUrl(filePath);
                                  handleResponseChange(`${question.id}_arquivo`, publicUrl);
                                  toast.success('Evidência anexada com sucesso!');
                                } catch (err: any) {
                                  assessmentLogger.error('Erro no upload de evidência:', err);
                                  toast.error('Erro ao enviar arquivo. Tente novamente.');
                                }
                              }}
                            />
                          </div>
                          {responses[`${question.id}_arquivo`] && (
                            <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                              <FileText className="h-3 w-3" />
                              <span>Evidência anexada</span>
                              <a href={responses[`${question.id}_arquivo`]} target="_blank" rel="noopener noreferrer" className="text-[hsl(250,80%,60%)] underline ml-auto">
                                Ver
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {question.configuracoes.mostrar_justificativa_quando && 
                     question.configuracoes.mostrar_justificativa_quando.split(',').includes(responses[question.id]) && (
                      <div className="mt-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg animate-fade-in">
                        <Label className="text-sm font-medium text-amber-400 mb-2 block">
                          {question.configuracoes.label_justificativa || 'Justificativa:'}
                        </Label>
                        <Textarea
                          value={responses[`${question.id}_justificativa`] || ''}
                          onChange={(e) => handleResponseChange(`${question.id}_justificativa`, e.target.value)}
                          placeholder="Explique o motivo e planos futuros..."
                          className="min-h-[100px] bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all duration-200"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center animate-fade-in">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            size="lg"
            className="shadow-sm border-white/10 bg-white/5 backdrop-blur-sm text-white hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>

          {currentPage === totalPages - 1 ? (
            <Button
              onClick={() => setShowConfirmDialog(true)}
              disabled={submitting}
              size="lg"
              className="shadow-lg shadow-[hsl(250,80%,60%)]/20 bg-gradient-to-r from-[hsl(250,80%,60%)] to-[hsl(250,80%,50%)] hover:from-[hsl(250,80%,55%)] hover:to-[hsl(250,80%,45%)] text-white px-8"
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
              className="shadow-md shadow-[hsl(250,80%,60%)]/20 bg-gradient-to-r from-[hsl(250,80%,60%)] to-[hsl(250,80%,50%)] hover:from-[hsl(250,80%,55%)] hover:to-[hsl(250,80%,45%)] text-white"
            >
              Próxima
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>

        {/* Confirmation dialog */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent className="bg-[hsl(230,25%,12%)] backdrop-blur-sm border-white/10 shadow-2xl">
            <AlertDialogHeader className="space-y-4">
              <div className="flex items-center justify-center w-12 h-12 bg-[hsl(250,80%,60%)]/10 rounded-full mx-auto">
                <CheckCircle className="w-6 h-6 text-[hsl(250,80%,60%)]" />
              </div>
              <AlertDialogTitle className="text-center text-xl text-white">Finalizar Questionário</AlertDialogTitle>
              <AlertDialogDescription className="text-center text-white/50 leading-relaxed">
                Tem certeza que deseja finalizar e enviar o questionário? 
                Após o envio, não será possível fazer alterações.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex space-x-4 pt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowConfirmDialog(false)}
                disabled={submitting}
                className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"
              >
                Cancelar
              </Button>
              <AlertDialogAction 
                onClick={submitAssessment} 
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-[hsl(250,80%,60%)] to-[hsl(250,80%,50%)] hover:from-[hsl(250,80%,55%)] hover:to-[hsl(250,80%,45%)] text-white shadow-lg shadow-[hsl(250,80%,60%)]/20"
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
    </AssessmentShell>
  );
}
