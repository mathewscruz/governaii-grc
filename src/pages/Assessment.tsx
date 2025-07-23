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
import { CheckCircle, AlertCircle, Upload, Clock } from 'lucide-react';

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
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (token) {
      fetchAssessment();
    }
  }, [token]);

  const fetchAssessment = async () => {
    try {
      setLoading(true);
      
      if (!token) {
        toast({
          title: "Token inválido",
          description: "O link fornecido não é válido.",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      // Buscar assessment pelo token
      const assessmentData = await supabaseRequest(
        `due_diligence_assessments?link_token=eq.${token}&select=id,fornecedor_nome,fornecedor_email,status,data_inicio,data_conclusao,data_expiracao,template_id`
      );
      
      if (!assessmentData || assessmentData.length === 0) {
        toast({
          title: "Assessment não encontrado",
          description: "O link fornecido não é válido ou expirou.",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      const assessment = assessmentData[0];

      // Verificar se já expirou
      if (new Date() > new Date(assessment.data_expiracao)) {
        toast({
          title: "Assessment expirado",
          description: "O prazo para responder este questionário já expirou.",
          variant: "destructive"
        });
        return;
      }

      // Verificar se já foi concluído
      if (assessment.status === 'concluido') {
        toast({
          title: "Assessment já concluído",
          description: "Este questionário já foi respondido anteriormente.",
          variant: "destructive"
        });
        return;
      }

      // Buscar template
      const templateData = await supabaseRequest(
        `due_diligence_templates?id=eq.${assessment.template_id}&select=nome,descricao,categoria`
      );
      const template = templateData && templateData.length > 0 ? templateData[0] : { nome: 'Template', descricao: '', categoria: 'geral' };

      setAssessment({
        ...assessment,
        template
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
      console.error('Erro ao carregar assessment:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o questionário.",
        variant: "destructive"
      });
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

      // Enviar email de conclusão (simplificado)
      try {
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
            empresa_nome: 'GovernAI'
          })
        });
      } catch (emailError) {
        console.error('Erro ao enviar email de conclusão:', emailError);
      }

      toast({
        title: "Questionário enviado",
        description: "Obrigado! Suas respostas foram enviadas com sucesso.",
        variant: "default"
      });

      setCurrentStep(questions.length); // Mostrar tela de conclusão

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
            onBlur={() => saveResponse(question.id)}
            placeholder="Digite sua resposta..."
            rows={4}
          />
        );

      case 'multipla_escolha':
        return (
          <RadioGroup
            value={response?.resposta_texto || ''}
            onValueChange={(value) => {
              handleResponseChange(question.id, value, 'texto');
              setTimeout(() => saveResponse(question.id), 100);
            }}
          >
            {question.opcoes?.map((opcao, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={opcao} id={`${question.id}-${index}`} />
                <Label htmlFor={`${question.id}-${index}`}>{opcao}</Label>
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
              setTimeout(() => saveResponse(question.id), 100);
            }}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Sim" id={`${question.id}-sim`} />
              <Label htmlFor={`${question.id}-sim`}>Sim</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Não" id={`${question.id}-nao`} />
              <Label htmlFor={`${question.id}-nao`}>Não</Label>
            </div>
          </RadioGroup>
        );

      case 'score':
        return (
          <RadioGroup
            value={response?.score?.toString() || ''}
            onValueChange={(value) => {
              handleResponseChange(question.id, value, 'score');
              setTimeout(() => saveResponse(question.id), 100);
            }}
          >
            <div className="flex gap-4">
              {[1, 2, 3, 4, 5].map(score => (
                <div key={score} className="flex items-center space-x-2">
                  <RadioGroupItem value={score.toString()} id={`${question.id}-${score}`} />
                  <Label htmlFor={`${question.id}-${score}`}>{score}</Label>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              1 = Muito ruim | 5 = Excelente
            </p>
          </RadioGroup>
        );

      case 'arquivo':
        return (
          <div className="space-y-2">
            <Input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(question.id, file);
              }}
              disabled={uploadingFiles[question.id]}
            />
            {uploadingFiles[question.id] && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Upload className="h-4 w-4 animate-spin" />
                Enviando arquivo...
              </div>
            )}
            {response?.arquivo_nome && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                {response.arquivo_nome}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Carregando questionário...</p>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Assessment não encontrado</h2>
            <p className="text-muted-foreground">
              O link fornecido não é válido ou expirou.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep >= questions.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Questionário Concluído!</h2>
            <p className="text-muted-foreground mb-4">
              Obrigado por completar o questionário. Suas respostas foram enviadas com sucesso.
            </p>
            <p className="text-sm text-muted-foreground">
              Você pode fechar esta página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep) / questions.length) * 100;
  const answeredQuestions = Object.keys(responses).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{assessment.template?.nome}</CardTitle>
                <CardDescription className="text-base mt-1">
                  {assessment.template?.descricao}
                </CardDescription>
              </div>
              <Badge className="text-sm">
                {assessment.template?.categoria}
              </Badge>
            </div>
            
            <div className="space-y-2 pt-4">
              <div className="flex justify-between text-sm">
                <span>Progresso</span>
                <span>{currentStep + 1} de {questions.length}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardHeader>
        </Card>

        {/* Informações do fornecedor */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Empresa</Label>
                <p className="text-base">{assessment.fornecedor_nome}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">E-mail</Label>
                <p className="text-base">{assessment.fornecedor_email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pergunta atual */}
        {currentQuestion && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {currentQuestion.titulo}
                    {currentQuestion.obrigatoria && (
                      <Badge variant="destructive" className="text-xs">
                        Obrigatória
                      </Badge>
                    )}
                  </CardTitle>
                  {currentQuestion.descricao && (
                    <CardDescription className="mt-2 text-base">
                      {currentQuestion.descricao}
                    </CardDescription>
                  )}
                </div>
                <Badge variant="outline">
                  Peso: {currentQuestion.peso}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {renderQuestion(currentQuestion)}
            </CardContent>
          </Card>
        )}

        {/* Navegação */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            Anterior
          </Button>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{answeredQuestions} de {questions.length} respondidas</span>
          </div>

          {currentStep === questions.length - 1 ? (
            <Button
              onClick={submitAssessment}
              disabled={submitting}
              className="min-w-32"
            >
              {submitting ? 'Enviando...' : 'Finalizar'}
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentStep(Math.min(questions.length - 1, currentStep + 1))}
            >
              Próxima
            </Button>
          )}
        </div>

        {/* Alert de expiração */}
        <Alert className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Este questionário expira em {new Date(assessment.data_expiracao).toLocaleDateString('pt-BR')} às {new Date(assessment.data_expiracao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.
            Certifique-se de concluir antes do prazo.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}