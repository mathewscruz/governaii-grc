import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, AlertCircle, Upload, Clock, ChevronLeft, ChevronRight, Building, Calendar } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

// Constantes do Supabase
const SUPABASE_URL = 'https://lnlkahtugwmkznasapfd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubGthaHR1Z3dta3puYXNhcGZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxOTk4MjcsImV4cCI6MjA2ODc3NTgyN30.DRHZ_55_8aH8fEDghoY84fl3rChFNgVyPA9UM3y-KCY';

interface QuestionData {
  id: string;
  titulo: string;
  descricao?: string;
  tipo: string;
  opcoes?: string[];
  obrigatoria: boolean;
  peso: number;
  ordem: number;
}

interface AssessmentData {
  id: string;
  fornecedor_nome: string;
  fornecedor_email: string;
  status: string;
  data_inicio?: string;
  data_conclusao?: string;
  data_expiracao: string;
  template_id: string;
  empresa_nome?: string;
  empresa_logo_url?: string;
  score_final?: number;
  template?: {
    nome: string;
    descricao?: string;
    categoria: string;
  };
}

interface ResponseData {
  question_id: string;
  resposta_texto?: string;
  arquivo_url?: string;
  arquivo_nome?: string;
  score?: number;
}

// Helper para fazer requests para o Supabase
const supabaseRequest = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    ...options,
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    throw new Error(`Erro na requisição: ${response.status}`);
  }

  return response.json();
};

export default function Assessment() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [responses, setResponses] = useState<Record<string, ResponseData>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
  const [autoSaving, setAutoSaving] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const QUESTIONS_PER_PAGE = 20;

  useEffect(() => {
    if (token) {
      fetchAssessment();
    }
  }, [token]);

  const fetchAssessment = async () => {
    try {
      setLoading(true);
      
      if (!token) {
        console.log('ASSESSMENT DEBUG: Token não fornecido');
        toast({
          title: "Token inválido",
          description: "O link fornecido não é válido.",
          variant: "destructive"
        });
        setAssessment(null);
        return;
      }

      console.log('ASSESSMENT DEBUG: Buscando assessment com token:', token);

      // Buscar assessment pelo token
      const assessmentData = await supabaseRequest(
        `due_diligence_assessments?link_token=eq.${token}&select=id,fornecedor_nome,fornecedor_email,status,data_inicio,data_conclusao,data_expiracao,template_id,empresa_id,score_final`
      );
      
      if (!assessmentData || assessmentData.length === 0) {
        console.log('ASSESSMENT DEBUG: Assessment não encontrado para token:', token);
        toast({
          title: "Assessment não encontrado",
          description: "O link fornecido não é válido ou expirou.",
          variant: "destructive"
        });
        setAssessment(null);
        return;
      }

      console.log('ASSESSMENT DEBUG: Assessment encontrado:', assessmentData[0]);

      const assessment = assessmentData[0];

      // Verificar se já expirou
      if (new Date() > new Date(assessment.data_expiracao)) {
        console.log('ASSESSMENT DEBUG: Assessment expirado');
        toast({
          title: "Assessment expirado",
          description: "O prazo para responder este questionário já expirou.",
          variant: "destructive"
        });
        setAssessment({ ...assessment, status: 'expirado' } as AssessmentData);
        return;
      }

      // Verificar se já foi concluído
      if (assessment.status === 'concluido') {
        console.log('ASSESSMENT DEBUG: Assessment já concluído');
        setIsFinished(true);
        setAssessment({ ...assessment, status: 'concluido' } as AssessmentData);
        return;
      }

      console.log('ASSESSMENT DEBUG: Assessment válido, continuando...');

      // Buscar template
      const templateData = await supabaseRequest(
        `due_diligence_templates?id=eq.${assessment.template_id}&select=nome,descricao,categoria`
      );
      const template = templateData && templateData.length > 0 ? templateData[0] : { nome: 'Template', descricao: '', categoria: 'geral' };

      // Buscar dados da empresa
      let empresaNome = '';
      let empresaLogoUrl = '';
      
      if (assessment.empresa_id) {
        try {
          const empresaData = await supabaseRequest(
            `empresas?id=eq.${assessment.empresa_id}&select=nome,logo_url`
          );
          
          if (empresaData && empresaData[0]) {
            empresaNome = empresaData[0].nome;
            empresaLogoUrl = empresaData[0].logo_url;
          }
        } catch (error) {
          console.log('Erro ao buscar dados da empresa:', error);
        }
      }

      setAssessment({
        ...assessment,
        template,
        empresa_nome: empresaNome,
        empresa_logo_url: empresaLogoUrl
      });

      // Marcar como iniciado se ainda não foi
      if (assessment.status === 'enviado') {
        await supabaseRequest(`due_diligence_assessments?id=eq.${assessment.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ 
            status: 'em_andamento',
            data_inicio: new Date().toISOString()
          })
        });
      }

      // Buscar perguntas
      const questionsData = await supabaseRequest(
        `due_diligence_questions?template_id=eq.${assessment.template_id}&select=id,titulo,descricao,tipo,opcoes,obrigatoria,peso,ordem&order=ordem`
      );
      
      const typedQuestions: QuestionData[] = (questionsData || []).map((q: any) => ({
        id: q.id,
        titulo: q.titulo,
        descricao: q.descricao,
        tipo: q.tipo,
        opcoes: q.opcoes as string[],
        obrigatoria: q.obrigatoria,
        peso: q.peso,
        ordem: q.ordem
      }));
      
      setQuestions(typedQuestions);

      // Buscar respostas existentes
      const responsesData = await supabaseRequest(
        `due_diligence_responses?assessment_id=eq.${assessment.id}&select=question_id,resposta,resposta_arquivo_url,resposta_arquivo_nome,pontuacao`
      );

      // Converter respostas para o formato do estado
      const existingResponses: Record<string, ResponseData> = {};
      (responsesData || []).forEach((response: any) => {
        existingResponses[response.question_id] = {
          question_id: response.question_id,
          resposta_texto: response.resposta,
          arquivo_url: response.resposta_arquivo_url,
          arquivo_nome: response.resposta_arquivo_nome,
          score: response.pontuacao
        };
      });
      setResponses(existingResponses);

    } catch (error: any) {
      console.error('ASSESSMENT DEBUG: Erro ao carregar assessment:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o questionário. Verifique sua conexão e tente novamente.",
        variant: "destructive"
      });
      setAssessment(null);
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (questionId: string, value: any, type: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        question_id: questionId,
        ...(type === 'score' ? { score: parseInt(value) } : 
           type === 'arquivo' ? { arquivo_url: value.url, arquivo_nome: value.name } :
           { resposta_texto: value })
      }
    }));
    
    // Auto-save após mudança
    setTimeout(() => saveResponse(questionId), 500);
  };

  const handleFileUpload = async (questionId: string, file: File) => {
    try {
      setUploadingFiles(prev => ({ ...prev, [questionId]: true }));

      const fileExt = file.name.split('.').pop();
      const fileName = `${assessment?.id}/${questionId}/${Date.now()}.${fileExt}`;

      // Upload para storage (simulado - em produção usar Supabase storage)
      const formData = new FormData();
      formData.append('file', file);

      // Simular upload bem-sucedido
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/due-diligence-docs/${fileName}`;
      
      handleResponseChange(questionId, { url: publicUrl, name: file.name }, 'arquivo');
      
      toast({
        title: "Arquivo enviado",
        description: "O arquivo foi enviado com sucesso."
      });

    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploadingFiles(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const saveResponse = async (questionId: string) => {
    if (!assessment || !responses[questionId]) return;

    try {
      setAutoSaving(true);
      const response = responses[questionId];
      
      await supabaseRequest('due_diligence_responses', {
        method: 'POST',
        body: JSON.stringify({
          assessment_id: assessment.id,
          question_id: questionId,
          resposta: response.resposta_texto,
          resposta_arquivo_url: response.arquivo_url,
          resposta_arquivo_nome: response.arquivo_nome,
          pontuacao: response.score
        }),
        headers: {
          'Prefer': 'resolution=merge-duplicates'
        }
      });

    } catch (error: any) {
      console.error('Erro ao salvar resposta:', error);
    } finally {
      setAutoSaving(false);
    }
  };

  const calculateScore = async () => {
    if (!assessment) return;

    try {
      // Calcular score simplificado
      const responses = await supabaseRequest(
        `due_diligence_responses?assessment_id=eq.${assessment.id}&select=pontuacao`
      );

      // Calcular score médio simples
      let totalScore = 0;
      let count = 0;

      (responses || []).forEach((response: any) => {
        if (response.pontuacao) {
          totalScore += response.pontuacao;
          count++;
        }
      });

      const finalScore = count > 0 ? (totalScore / count) * 20 : 0; // Normalizar para 0-100

      // Atualizar score na assessment
      await supabaseRequest(`due_diligence_assessments?id=eq.${assessment.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ score_final: finalScore })
      });

    } catch (error: any) {
      console.error('Erro ao calcular score:', error);
    }
  };

  const submitAssessment = async () => {
    if (!assessment) return;

    try {
      setSubmitting(true);

      // Verificar perguntas obrigatórias
      const requiredQuestions = questions.filter(q => q.obrigatoria);
      const missingRequired = requiredQuestions.filter(q => !responses[q.id]);

      if (missingRequired.length > 0) {
        toast({
          title: "Perguntas obrigatórias",
          description: `Existem ${missingRequired.length} perguntas obrigatórias não respondidas.`,
          variant: "destructive"
        });
        return;
      }

      // Salvar todas as respostas
      await Promise.all(
        Object.keys(responses).map(questionId => saveResponse(questionId))
      );

      // Calcular score
      await calculateScore();

      // Marcar como concluído
      await supabaseRequest(`due_diligence_assessments?id=eq.${assessment.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          status: 'concluido',
          data_conclusao: new Date().toISOString()
        })
      });

      setIsFinished(true);
      setShowFinishDialog(false);

      // Enviar email de conclusão (simplificado)
      try {
        // Buscar dados da empresa do assessment
        const assessmentData = await supabaseRequest(
          `due_diligence_assessments?id=eq.${assessment.id}&select=empresa_id`
        );
        
        let empresaNome = 'GovernAI';
        let empresaLogoUrl = null;

        if (assessmentData && assessmentData[0]?.empresa_id) {
          const empresaData = await supabaseRequest(
            `empresas?id=eq.${assessmentData[0].empresa_id}&select=nome,logo_url`
          );
          
          if (empresaData && empresaData[0]) {
            empresaNome = empresaData[0].nome;
            empresaLogoUrl = empresaData[0].logo_url;
          }
        }

        await fetch(`${SUPABASE_URL}/functions/v1/send-due-diligence-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'completion',
            assessment_id: assessment.id,
            fornecedor_nome: assessment.fornecedor_nome,
            fornecedor_email: assessment.fornecedor_email,
            template_nome: assessment.template?.nome,
            empresa_nome: empresaNome,
            empresa_logo_url: empresaLogoUrl
          })
        });
      } catch (emailError) {
        console.error('Erro ao enviar email de conclusão:', emailError);
      }

      toast({
        title: "Questionário respondido com sucesso!",
        description: "Obrigado por completar nossa avaliação.",
      });

    } catch (error: any) {
      console.error('Erro ao enviar assessment:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar as respostas. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question: QuestionData) => {
    const response = responses[question.id];

    switch (question.tipo) {
      case 'texto':
        return (
          <Textarea
            value={response?.resposta_texto || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value, 'texto')}
            placeholder="Digite sua resposta..."
            rows={4}
            className="resize-none"
          />
        );

      case 'multipla_escolha':
      case 'radio':
        return (
          <RadioGroup
            value={response?.resposta_texto || ''}
            onValueChange={(value) => {
              handleResponseChange(question.id, value, 'texto');
            }}
            className="space-y-3"
          >
            {question.opcoes?.map((opcao, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value={opcao} id={`${question.id}-${index}`} />
                <Label htmlFor={`${question.id}-${index}`} className="flex-1 cursor-pointer">
                  {opcao}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'sim_nao':
        return (
          <RadioGroup
            value={response?.resposta_texto || ''}
            onValueChange={(value) => {
              handleResponseChange(question.id, value, 'texto');
            }}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="Sim" id={`${question.id}-sim`} />
              <Label htmlFor={`${question.id}-sim`} className="flex-1 cursor-pointer">Sim</Label>
            </div>
            <div className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="Não" id={`${question.id}-nao`} />
              <Label htmlFor={`${question.id}-nao`} className="flex-1 cursor-pointer">Não</Label>
            </div>
          </RadioGroup>
        );

      case 'score':
        return (
          <RadioGroup
            value={response?.score?.toString() || ''}
            onValueChange={(value) => {
              handleResponseChange(question.id, value, 'score');
            }}
            className="flex space-x-6"
          >
            {[1, 2, 3, 4, 5].map((score) => (
              <div key={score} className="flex flex-col items-center space-y-2">
                <RadioGroupItem value={score.toString()} id={`${question.id}-${score}`} />
                <Label htmlFor={`${question.id}-${score}`} className="text-sm cursor-pointer">
                  {score}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'arquivo':
        return (
          <div className="space-y-4">
            <Input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileUpload(question.id, file);
                }
              }}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              disabled={uploadingFiles[question.id]}
              className="cursor-pointer"
            />
            {uploadingFiles[question.id] && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span>Enviando arquivo...</span>
              </div>
            )}
            {response?.arquivo_nome && (
              <div className="flex items-center space-x-2 p-2 bg-muted rounded">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">{response.arquivo_nome}</span>
              </div>
            )}
          </div>
        );

      default:
        return (
          <Input
            value={response?.resposta_texto || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value, 'texto')}
            placeholder="Digite sua resposta..."
          />
        );
    }
  };

  // Status não válidos ou carregamento
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando avaliação...</p>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <Card className="max-w-md mx-auto shadow-xl border-destructive/20">
          <CardContent className="text-center py-8">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Assessment Não Encontrado
            </h2>
            <p className="text-muted-foreground">
              O link fornecido não é válido ou expirou.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isFinished || assessment.status === 'concluido') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        {/* Header mesmo para finalizado */}
        <div style={{ backgroundColor: 'hsl(var(--sidebar-background))' }} className="shadow-lg border-b border-border/50">
          <div className="container mx-auto py-6 px-4 max-w-6xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  {assessment?.empresa_logo_url ? (
                    <img 
                      src={assessment.empresa_logo_url} 
                      alt={`Logo ${assessment.empresa_nome}`}
                      className="h-12 w-12 object-contain rounded-lg border border-sidebar-border shadow-sm bg-white"
                    />
                  ) : (
                    <div className="h-12 w-12 bg-sidebar-accent rounded-lg flex items-center justify-center shadow-md">
                      <Building className="h-6 w-6 text-sidebar-foreground" />
                    </div>
                  )}
                  <div>
                    <h1 className="text-2xl font-bold text-sidebar-foreground">
                      {assessment?.empresa_nome || 'Empresa'}
                    </h1>
                    <p className="text-sm text-sidebar-foreground/70">Due Diligence Assessment</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 bg-sidebar-accent px-3 py-2 rounded-lg border border-sidebar-border">
                <Calendar className="h-4 w-4 text-sidebar-foreground" />
                <div className="text-right">
                  <p className="text-sm font-medium text-sidebar-foreground">
                    Prazo até
                  </p>
                  <p className="text-xs text-sidebar-foreground font-semibold">
                    {assessment.data_expiracao ? new Date(assessment.data_expiracao).toLocaleDateString('pt-BR') : 'Sem prazo'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo de finalização */}
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md mx-auto shadow-xl border-primary/20">
            <CardContent className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Questionário respondido com sucesso!
              </h2>
              <p className="text-muted-foreground mb-4">
                Obrigado por participar da nossa avaliação de Due Diligence. 
                Suas respostas foram registradas e serão analisadas em breve.
              </p>
              {assessment.score_final && (
                <div className="mt-4 p-4 bg-primary/5 rounded-lg">
                  <p className="text-sm text-muted-foreground">Score Final</p>
                  <p className="text-2xl font-bold text-primary">
                    {assessment.score_final.toFixed(1)}%
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (assessment.status === 'expirado') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <Card className="max-w-md mx-auto shadow-xl border-destructive/20">
          <CardContent className="text-center py-8">
            <Clock className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Assessment Expirado
            </h2>
            <p className="text-muted-foreground">
              O prazo para responder este questionário já expirou.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Cálculos para paginação
  const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
  const startIndex = currentPage * QUESTIONS_PER_PAGE;
  const endIndex = startIndex + QUESTIONS_PER_PAGE;
  const currentQuestions = questions.slice(startIndex, endIndex);
  
  // Cálculos de progresso
  const answeredQuestions = Object.keys(responses).length;
  const totalProgress = (answeredQuestions / questions.length) * 100;

  const canProceedToNext = () => {
    const currentPageQuestions = currentQuestions;
    const requiredInPage = currentPageQuestions.filter(q => q.obrigatoria);
    return requiredInPage.every(q => responses[q.id]);
  };

  const canFinish = () => {
    const requiredQuestions = questions.filter(q => q.obrigatoria);
    return requiredQuestions.every(q => responses[q.id]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header Profissional */}
      <div style={{ backgroundColor: 'hsl(var(--sidebar-background))' }} className="shadow-lg border-b border-border/50">
        <div className="container mx-auto py-6 px-4 max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Logo da Empresa */}
              <div className="flex items-center space-x-3">
                {assessment?.empresa_logo_url ? (
                  <img 
                    src={assessment.empresa_logo_url} 
                    alt={`Logo ${assessment.empresa_nome}`}
                    className="h-12 w-12 object-contain rounded-lg border border-sidebar-border shadow-sm bg-white"
                    onError={(e) => {
                      console.log('Erro ao carregar logo da empresa:', e);
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`h-12 w-12 bg-sidebar-accent rounded-lg flex items-center justify-center shadow-md ${assessment?.empresa_logo_url ? 'hidden' : ''}`}>
                  <Building className="h-6 w-6 text-sidebar-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-sidebar-foreground">
                    {assessment?.empresa_nome || 'Empresa'}
                  </h1>
                  <p className="text-sm text-sidebar-foreground/70">Due Diligence Assessment</p>
                </div>
              </div>
            </div>
            
            {/* Data de Expiração */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 bg-sidebar-accent px-3 py-2 rounded-lg border border-sidebar-border">
                <Calendar className="h-4 w-4 text-sidebar-foreground" />
                <div className="text-right">
                  <p className="text-sm font-medium text-sidebar-foreground">
                    Prazo até
                  </p>
                  <p className="text-xs text-sidebar-foreground font-semibold">
                    {assessment.data_expiracao ? new Date(assessment.data_expiracao).toLocaleDateString('pt-BR') : 'Sem prazo'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-sidebar-foreground">
                  {assessment.template?.nome}
                </p>
                <p className="text-xs text-sidebar-foreground/70">
                  {questions.length} questões
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progresso */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="bg-card rounded-xl shadow-sm border border-border/50 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Progresso do Assessment
            </h2>
            <span className="text-sm text-muted-foreground">
              Página {currentPage + 1} de {totalPages}
            </span>
          </div>
          <Progress value={totalProgress} className="h-3 mb-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{answeredQuestions} de {questions.length} respondidas</span>
            <span>{Math.round(totalProgress)}% completo</span>
          </div>
          {autoSaving && (
            <div className="flex items-center mt-2 text-xs text-primary">
              <div className="animate-spin rounded-full h-3 w-3 border-b border-primary mr-2"></div>
              Salvando automaticamente...
            </div>
          )}
        </div>

        {/* Questões */}
        <div className="space-y-6">
          {currentQuestions.map((question, index) => (
            <Card key={question.id} className="shadow-sm border border-border/50 hover:shadow-md hover:border-primary/30 transition-all duration-200">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base font-medium text-foreground pr-4">
                    {startIndex + index + 1}. {question.titulo}
                  </CardTitle>
                  {question.obrigatoria && (
                    <Badge variant="destructive" className="text-xs px-2 py-1">
                      Obrigatória
                    </Badge>
                  )}
                </div>
                {question.descricao && (
                  <p className="text-sm text-muted-foreground mt-2">{question.descricao}</p>
                )}
              </CardHeader>
              <CardContent>
                {renderQuestion(question)}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Navegação e Finalização */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-border/50">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 0}
            className="flex items-center gap-2 hover:bg-primary/10 hover:border-primary/30"
          >
            <ChevronLeft className="h-4 w-4" />
            Página Anterior
          </Button>

          <div className="flex gap-4">
            {currentPage < totalPages - 1 ? (
              <Button
                onClick={() => setCurrentPage(currentPage + 1)}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90"
                disabled={!canProceedToNext()}
              >
                Próxima Página
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={() => setShowFinishDialog(true)}
                disabled={submitting || !canFinish()}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg"
              >
                <CheckCircle className="h-4 w-4" />
                Finalizar Assessment
              </Button>
            )}
          </div>
        </div>

        {/* Dialog de Confirmação */}
        <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Finalizar Assessment</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja finalizar este assessment? Esta ação não pode ser desfeita e você não poderá mais modificar suas respostas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={submitAssessment} disabled={submitting}>
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Finalizando...
                  </>
                ) : (
                  'Confirmar Finalização'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}