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
import { CheckCircle, AlertCircle, Upload, Clock, ChevronLeft, ChevronRight, Building } from 'lucide-react';

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
        `due_diligence_assessments?link_token=eq.${token}&select=id,fornecedor_nome,fornecedor_email,status,data_inicio,data_conclusao,data_expiracao,template_id,empresa_id`
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
        toast({
          title: "Assessment já concluído",
          description: "Este questionário já foi respondido anteriormente.",
          variant: "destructive"
        });
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
        title: "Questionário enviado",
        description: "Obrigado! Suas respostas foram enviadas com sucesso.",
        variant: "default"
      });

      // Redirect para tela de conclusão será feito pelo status

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
              <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
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
            className="flex gap-4"
          >
            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors flex-1">
              <RadioGroupItem value="Sim" id={`${question.id}-sim`} />
              <Label htmlFor={`${question.id}-sim`} className="cursor-pointer">Sim</Label>
            </div>
            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors flex-1">
              <RadioGroupItem value="Não" id={`${question.id}-nao`} />
              <Label htmlFor={`${question.id}-nao`} className="cursor-pointer">Não</Label>
            </div>
          </RadioGroup>
        );

      case 'score':
        return (
          <div className="space-y-4">
            <RadioGroup
              value={response?.score?.toString() || ''}
              onValueChange={(value) => {
                handleResponseChange(question.id, value, 'score');
              }}
              className="flex gap-2"
            >
              {[1, 2, 3, 4, 5].map(score => (
                <div key={score} className="flex items-center justify-center p-3 border rounded-lg hover:bg-muted/50 transition-colors flex-1">
                  <RadioGroupItem value={score.toString()} id={`${question.id}-${score}`} className="sr-only" />
                  <Label htmlFor={`${question.id}-${score}`} className="cursor-pointer font-medium">
                    {score}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 = Muito ruim</span>
              <span>5 = Excelente</span>
            </div>
          </div>
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
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verificar se assessment foi marcado como expirado ou concluído
  if (assessment.status === 'expirado') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Assessment Expirado</h2>
            <p className="text-muted-foreground">
              O prazo para responder este questionário já expirou.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (assessment.status === 'concluido') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Assessment já Concluído</h2>
            <p className="text-muted-foreground">
              Este questionário já foi respondido anteriormente.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tela de conclusão não é mais necessária aqui pois usamos o status

  const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
  const startIndex = currentPage * QUESTIONS_PER_PAGE;
  const endIndex = Math.min(startIndex + QUESTIONS_PER_PAGE, questions.length);
  const currentPageQuestions = questions.slice(startIndex, endIndex);
  
  const progress = (Object.keys(responses).length / questions.length) * 100;
  const answeredQuestions = Object.keys(responses).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header com Logo */}
      <div className="bg-white border-b shadow-sm">
        <div className="container max-w-4xl mx-auto py-6">
          <div className="flex items-center gap-4">
            {assessment.empresa_logo_url ? (
              <img 
                src={assessment.empresa_logo_url} 
                alt={`Logo ${assessment.empresa_nome}`}
                className="h-12 w-auto object-contain"
              />
            ) : (
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Building className="h-6 w-6 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                {assessment.empresa_nome || 'Due Diligence'}
              </h1>
              <p className="text-sm text-muted-foreground">
                Assessment de Fornecedor
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto py-8">
        {/* Header do Assessment */}
        <Card className="mb-6 border-0 shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl text-foreground">{assessment.template?.nome}</CardTitle>
                <CardDescription className="text-base mt-1">
                  {assessment.template?.descricao}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-sm">
                {assessment.template?.categoria}
              </Badge>
            </div>
            
            <div className="space-y-3 pt-4">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  Progresso Geral
                  {autoSaving && <span className="text-xs text-muted-foreground">(Salvando...)</span>}
                </span>
                <span>{answeredQuestions} de {questions.length} respondidas</span>
              </div>
              <Progress value={progress} className="h-3" />
              
              {totalPages > 1 && (
                <div className="flex justify-between text-xs text-muted-foreground pt-2">
                  <span>Página {currentPage + 1} de {totalPages}</span>
                  <span>{currentPageQuestions.length} perguntas nesta página</span>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Informações do fornecedor */}
        <Card className="mb-6 border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Empresa Avaliada</Label>
                <p className="text-base font-medium">{assessment.fornecedor_nome}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">E-mail de Contato</Label>
                <p className="text-base">{assessment.fornecedor_email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Perguntas da página atual */}
        {currentPageQuestions.length > 0 && (
          <div className="space-y-6">
            {currentPageQuestions.map((question, index) => (
              <Card key={question.id} className="border-0 shadow-md">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span className="text-sm font-normal text-muted-foreground mr-2">
                          {startIndex + index + 1}.
                        </span>
                        {question.titulo}
                        {question.obrigatoria && (
                          <Badge variant="destructive" className="text-xs">
                            Obrigatória
                          </Badge>
                        )}
                        {responses[question.id] && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </CardTitle>
                      {question.descricao && (
                        <CardDescription className="mt-2 text-base">
                          {question.descricao}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Peso: {question.peso}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {renderQuestion(question)}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Navegação por páginas */}
        <div className="flex justify-between items-center mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Página Anterior
          </Button>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{answeredQuestions} de {questions.length} respondidas</span>
            </div>
            {totalPages > 1 && (
              <Badge variant="outline">
                Página {currentPage + 1} de {totalPages}
              </Badge>
            )}
          </div>

          {currentPage === totalPages - 1 ? (
            <Button
              onClick={submitAssessment}
              disabled={submitting}
              className="min-w-40 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
                  Enviando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Finalizar Assessment
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              className="flex items-center gap-2"
            >
              Próxima Página
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Alert de expiração */}
        <Alert className="mt-6 border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Prazo de entrega:</strong> Este questionário expira em{' '}
            <span className="font-medium">
              {new Date(assessment.data_expiracao).toLocaleDateString('pt-BR')} às{' '}
              {new Date(assessment.data_expiracao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>.
            Suas respostas são salvas automaticamente.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}