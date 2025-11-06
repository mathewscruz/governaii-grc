import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { StatCard } from '@/components/ui/stat-card';
import { Plus, Send, Clock, AlertTriangle, FileText, Eye, User, Edit2, Trash2, RefreshCw, Award, TrendingUp, Filter, CheckCircle, Users, ArrowUpDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDueDiligenceStats } from '@/hooks/useDueDiligenceStats';
import { AssessmentDialog } from './AssessmentDialog';
import ConfirmDialog from '@/components/ConfirmDialog';
import { ScoreVisualization } from './ScoreVisualization';
import { AssessmentResponsesViewer } from './AssessmentResponsesViewer';
import { ReportsSidebar } from './ReportsSidebar';
import { IntegrationSuggestions } from './IntegrationSuggestions';
import { formatDateOnly } from '@/lib/date-utils';

interface Assessment {
  id: string;
  fornecedor_nome: string;
  fornecedor_email: string;
  status: string;
  data_inicio?: string;
  data_conclusao?: string;
  data_expiracao: string;
  data_envio?: string;
  score_final?: number;
  token: string;
  link_token: string;
  template: {
    id: string;
    nome: string;
    categoria: string;
  };
}

interface ReminderDialogProps {
  assessment: Assessment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function ReminderDialog({ assessment, open, onOpenChange, onSuccess }: ReminderDialogProps) {
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const sendReminder = async () => {
    if (!assessment) return;

    try {
      setSending(true);
      
      // Buscar dados da empresa atual
      const { data: profileData } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      let empresaNome = 'GovernAI';
      let empresaLogoUrl = null;

      if (profileData?.empresa_id) {
        const { data: empresaData } = await supabase
          .from('empresas')
          .select('nome, logo_url')
          .eq('id', profileData.empresa_id)
          .single();
        
        if (empresaData) {
          empresaNome = empresaData.nome;
          empresaLogoUrl = empresaData.logo_url;
        }
      }

      const assessmentLink = `${window.location.origin}/assessment/${assessment.link_token}`;
      
      await supabase.functions.invoke('send-due-diligence-email', {
        body: {
          type: 'reminder',
          assessment_id: assessment.id,
          fornecedor_nome: assessment.fornecedor_nome,
          fornecedor_email: assessment.fornecedor_email,
          template_nome: assessment.template.nome,
          assessment_link: assessmentLink,
          data_expiracao: assessment.data_expiracao,
          empresa_nome: empresaNome,
          empresa_logo_url: empresaLogoUrl
        }
      });

      // Atualizar último lembrete enviado
      await supabase
        .from('due_diligence_assessments')
        .update({ ultimo_lembrete_enviado: new Date().toISOString() })
        .eq('id', assessment.id);

      toast({
        title: "Lembrete enviado",
        description: `Lembrete enviado para ${assessment.fornecedor_nome}`,
      });

      onSuccess();
      onOpenChange(false);

    } catch (error: any) {
      toast({
        title: "Erro ao enviar lembrete",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar Lembrete</DialogTitle>
        </DialogHeader>
        
        {assessment && (
          <div className="space-y-4">
            <div className="space-y-2">
              <p><strong>Fornecedor:</strong> {assessment.fornecedor_nome}</p>
              <p><strong>Email:</strong> {assessment.fornecedor_email}</p>
              <p><strong>Template:</strong> {assessment.template.nome}</p>
              <p><strong>Status:</strong> {assessment.status}</p>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={sendReminder} disabled={sending}>
                {sending ? 'Enviando...' : 'Enviar Lembrete'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface AssessmentsManagerEnhancedProps {
  filter?: {
    fornecedorId?: string;
    fornecedorNome?: string;
  } | null;
}

export function AssessmentsManagerEnhanced({ filter }: AssessmentsManagerEnhancedProps = {}) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [reminderDialog, setReminderDialog] = useState<{ open: boolean; assessment: Assessment | null }>({
    open: false,
    assessment: null
  });
  const [assessmentDialog, setAssessmentDialog] = useState<{ 
    open: boolean; 
    assessment: Assessment | null; 
    mode: 'create' | 'view' 
  }>({
    open: false,
    assessment: null,
    mode: 'create'
  });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; assessment: Assessment | null }>({
    open: false,
    assessment: null
  });
  const [scoreDialog, setScoreDialog] = useState<{ 
    open: boolean; 
    assessment: Assessment | null; 
    scoreData: any 
  }>({
    open: false,
    assessment: null,
    scoreData: null
  });
  const [responsesDialog, setResponsesDialog] = useState<{ 
    open: boolean; 
    assessment: Assessment | null; 
  }>({
    open: false,
    assessment: null
  });
  const { toast } = useToast();
  const { data: stats, isLoading: statsLoading } = useDueDiligenceStats();

  useEffect(() => {
    fetchAssessments();
  }, []);

  // Aplicar filtro inicial quando filter prop mudar
  useEffect(() => {
    if (filter?.fornecedorNome) {
      setSearchTerm(filter.fornecedorNome);
    }
  }, [filter]);

  // Listener para criar nova assessment com fornecedor pré-selecionado
  useEffect(() => {
    const handleCreateAssessment = (event: CustomEvent) => {
      setAssessmentDialog({ 
        open: true, 
        assessment: {
          fornecedor_nome: event.detail.fornecedorNome,
          fornecedor_id: event.detail.fornecedorId
        } as any, 
        mode: 'create' 
      });
    };
    
    window.addEventListener('createAssessment', handleCreateAssessment as EventListener);
    
    return () => {
      window.removeEventListener('createAssessment', handleCreateAssessment as EventListener);
    };
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('due_diligence_assessments')
        .select(`
          *,
          templates:template_id(id, nome, categoria)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Processar status baseado na data de expiração e conclusão
      const formattedAssessments: Assessment[] = (data || []).map(assessment => {
        let status = assessment.status;
        
        // Se expirou e não foi concluído
        if (new Date() > new Date(assessment.data_expiracao) && status !== 'concluido') {
          status = 'expirado';
        }
        
        return {
          id: assessment.id,
          fornecedor_nome: assessment.fornecedor_nome,
          fornecedor_email: assessment.fornecedor_email,
          status: status,
          data_inicio: assessment.data_inicio,
          data_conclusao: assessment.data_conclusao,
          data_expiracao: assessment.data_expiracao,
          data_envio: assessment.data_envio,
          score_final: assessment.score_final,
          token: assessment.link_token,
          link_token: assessment.link_token,
          template: {
            id: assessment.template_id,
            nome: assessment.templates?.nome || 'Template não encontrado',
            categoria: assessment.templates?.categoria || 'N/A'
          }
        };
      });

      setAssessments(formattedAssessments);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar assessments",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar e ordenar assessments
  const filteredAndSortedAssessments = useMemo(() => {
    let filtered = assessments;

    if (searchTerm) {
      filtered = filtered.filter(assessment =>
        assessment.fornecedor_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.fornecedor_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.template.nome.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(assessment => assessment.status === statusFilter);
    }

    // Ordenar
    filtered.sort((a, b) => {
      let aValue: any = a[sortField as keyof Assessment];
      let bValue: any = b[sortField as keyof Assessment];

      // Tratar campos aninhados
      if (sortField === 'template.nome') {
        aValue = a.template.nome;
        bValue = b.template.nome;
      } else if (sortField === 'score_final') {
        aValue = a.score_final || 0;
        bValue = b.score_final || 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [assessments, searchTerm, statusFilter, sortField, sortDirection]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pendente': { variant: 'outline' as const, text: 'Pendente' },
      'ativo': { variant: 'secondary' as const, text: 'Ativo' },
      'em_andamento': { variant: 'secondary' as const, text: 'Em Andamento' },
      'concluido': { variant: 'default' as const, text: 'Concluído' },
      'expirado': { variant: 'destructive' as const, text: 'Expirado' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['pendente'];
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const getScoreColor = (score?: number) => {
    if (!score || score === 0) return 'text-muted-foreground';
    if (score >= 8) return 'text-green-600 font-semibold';
    if (score >= 6) return 'text-blue-600 font-semibold';
    if (score >= 4) return 'text-yellow-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  const getScoreBadge = (score?: number) => {
    if (!score || score === 0) return { text: "Aguardando", variant: "outline" as const };
    if (score >= 8) return { text: "Excelente", variant: "default" as const };
    if (score >= 6) return { text: "Bom", variant: "secondary" as const };
    if (score >= 4) return { text: "Regular", variant: "outline" as const };
    return { text: "Ruim", variant: "destructive" as const };
  };

  const isExpired = (dateString: string) => {
    return new Date() > new Date(dateString);
  };

  const canSendReminder = (assessment: Assessment) => {
    return assessment.status !== 'concluido' && !isExpired(assessment.data_expiracao);
  };

  const viewAssessment = (assessment: Assessment) => {
    const url = `${window.location.origin}/assessment/${assessment.link_token}`;
    window.open(url, '_blank');
  };

  const resendAssessment = async (assessment: Assessment) => {
    try {
      // Buscar dados da empresa atual
      const { data: profileData } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      let empresaNome = 'GovernAI';
      let empresaLogoUrl = null;

      if (profileData?.empresa_id) {
        const { data: empresaData } = await supabase
          .from('empresas')
          .select('nome, logo_url')
          .eq('id', profileData.empresa_id)
          .single();
        
        if (empresaData) {
          empresaNome = empresaData.nome;
          empresaLogoUrl = empresaData.logo_url;
        }
      }

      const assessmentLink = `${window.location.origin}/assessment/${assessment.link_token}`;
      
      await supabase.functions.invoke('send-due-diligence-email', {
        body: {
          type: 'send',
          assessment_id: assessment.id,
          fornecedor_nome: assessment.fornecedor_nome,
          fornecedor_email: assessment.fornecedor_email,
          template_nome: assessment.template.nome,
          assessment_link: assessmentLink,
          data_expiracao: assessment.data_expiracao,
          empresa_nome: empresaNome,
          empresa_logo_url: empresaLogoUrl
        }
      });

      toast({
        title: "Avaliação reenviada",
        description: `Convite reenviado para ${assessment.fornecedor_nome}`,
      });

    } catch (error: any) {
      toast({
        title: "Erro ao reenviar avaliação",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deleteAssessment = async (assessment: Assessment) => {
    try {
      const { error } = await supabase
        .from('due_diligence_assessments')
        .delete()
        .eq('id', assessment.id);

      if (error) throw error;

      toast({
        title: "Avaliação excluída",
        description: "Avaliação foi excluída com sucesso",
      });

      fetchAssessments();
      setDeleteDialog({ open: false, assessment: null });

    } catch (error: any) {
      toast({
        title: "Erro ao excluir avaliação",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="text-center p-8">Carregando assessments...</div>;
  }

  const calcularScoreMedio = () => {
    const concluidas = assessments.filter(a => 
      a.status === 'concluido' && a.score_final != null && a.score_final > 0
    );
    
    if (concluidas.length === 0) return 0;
    
    return (concluidas.reduce((sum, a) => sum + ((a.score_final || 0) * 10), 0) / concluidas.length);
  };

  const handleScoreClick = async (assessment: Assessment) => {
    try {
      const { data: scoreData } = await supabase
        .from('due_diligence_scores')
        .select('*')
        .eq('assessment_id', assessment.id)
        .single();
      
      if (scoreData) {
        setScoreDialog({
          open: true,
          assessment,
          scoreData
        });
      } else {
        toast({
          title: "Score não encontrado",
          description: "Não foi possível carregar os detalhes do score",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* StatCards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Avaliações"
          value={assessments.length}
          description="Avaliações criadas"
          icon={<Users className="h-4 w-4" />}
          loading={statsLoading}
        />
        <StatCard
          title="Concluídas"
          value={assessments.filter(a => a.status === 'concluido').length}
          description={`${assessments.filter(a => a.status !== 'concluido').length} pendentes`}
          icon={<CheckCircle className="h-4 w-4" />}
          loading={statsLoading}
          variant="success"
        />
        <StatCard
          title="Expiradas"
          value={assessments.filter(a => isExpired(a.data_expiracao) && a.status !== 'concluido').length}
          description="Requerem atenção"
          icon={<AlertTriangle className="h-4 w-4" />}
          loading={statsLoading}
          variant="destructive"
        />
        <StatCard
          title="Score Médio"
          value={`${calcularScoreMedio().toFixed(1)}%`}
          description="Média das avaliações concluídas"
          icon={<TrendingUp className="h-4 w-4" />}
          loading={statsLoading}
          variant={calcularScoreMedio() >= 80 ? 'success' : calcularScoreMedio() >= 60 ? 'warning' : 'destructive'}
        />
      </div>

      <Card className="rounded-lg border overflow-hidden">
      <CardContent className="p-0">
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Input
                placeholder="Buscar por fornecedor ou template..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <ReportsSidebar />
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchAssessments}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              <Button 
                size="sm"
                onClick={() => setAssessmentDialog({ open: true, assessment: null, mode: 'create' })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Avaliação
              </Button>
            </div>
          </div>
          
          {showFilters && (
            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="expirado">Expirado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Lista de assessments */}
        <div className="grid gap-4">
          {filteredAndSortedAssessments.map((assessment) => (
          <Card key={assessment.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{assessment.fornecedor_nome}</CardTitle>
                  <CardDescription>{assessment.fornecedor_email}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(assessment.status)}
                  {isExpired(assessment.data_expiracao) && assessment.status !== 'concluido' && (
                    <Badge variant="destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Expirado
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Template:</span>
                  <p className="font-medium">{assessment.template.nome}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Categoria:</span>
                  <p className="font-medium">{assessment.template.categoria}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Expira em:</span>
                  <p className="font-medium">
                    {new Date(assessment.data_expiracao).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Score:</span>
                  <div className="flex items-center gap-2">
                    {assessment.score_final && assessment.score_final > 0 ? (
                      <button
                        onClick={() => handleScoreClick(assessment)}
                        className="hover:underline cursor-pointer flex items-center gap-2"
                      >
                        <Badge 
                          variant={getScoreBadge(assessment.score_final).variant}
                          className="transition-all hover:scale-105"
                        >
                          <Award className="h-3 w-3 mr-1" />
                          {getScoreBadge(assessment.score_final).text}
                          <span className="ml-1 font-mono">
                            {(assessment.score_final * 10).toFixed(1)}%
                          </span>
                        </Badge>
                      </button>
                    ) : assessment.status === 'concluido' ? (
                      <span className="text-sm text-muted-foreground">Calculando...</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Pendente</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {assessment.data_inicio ? (
                    <span>Iniciado em {new Date(assessment.data_inicio).toLocaleDateString('pt-BR')}</span>
                  ) : (
                    <span>Ainda não iniciado</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => viewAssessment(assessment)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Visualizar
                  </Button>

                  {assessment.score_final && assessment.score_final > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setScoreDialog({ open: true, assessment, scoreData: null })}
                    >
                      <Award className="h-4 w-4 mr-1" />
                      Ver Score
                    </Button>
                  )}

                  {assessment.status === 'concluido' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setResponsesDialog({ open: true, assessment })}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Ver Respostas
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAssessmentDialog({ open: true, assessment, mode: 'view' })}
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Visualizar Dados
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => resendAssessment(assessment)}
                    disabled={assessment.status === 'concluido'}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Reenviar
                  </Button>

                  {canSendReminder(assessment) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReminderDialog({ open: true, assessment })}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Lembrete
                    </Button>
                  )}

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteDialog({ open: true, assessment })}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Excluir
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      </CardContent>
    </Card>

    <div>
      {filteredAndSortedAssessments.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum assessment encontrado</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' 
                ? 'Tente ajustar os filtros para encontrar assessments'
                : 'Crie seu primeiro assessment para começar'}
            </p>
          </CardContent>
        </Card>
      )}

      <ReminderDialog
        assessment={reminderDialog.assessment}
        open={reminderDialog.open}
        onOpenChange={(open) => setReminderDialog({ open, assessment: null })}
        onSuccess={fetchAssessments}
      />

      <AssessmentDialog
        open={assessmentDialog.open}
        onOpenChange={(open) => setAssessmentDialog({ open, assessment: null, mode: 'create' })}
        assessment={assessmentDialog.assessment as any}
        mode={assessmentDialog.mode}
        onSuccess={fetchAssessments}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, assessment: null })}
        title="Confirmar Exclusão"
        description={`Tem certeza que deseja excluir a avaliação de ${deleteDialog.assessment?.fornecedor_nome}? Esta ação não pode ser desfeita.`}
        onConfirm={() => deleteDialog.assessment && deleteAssessment(deleteDialog.assessment)}
        confirmText="Excluir"
        cancelText="Cancelar"
      />

      {/* Dialog de Score com Integrações */}
      <Dialog open={scoreDialog.open} onOpenChange={(open) => setScoreDialog({ open, assessment: null, scoreData: null })}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Resultado da Avaliação - {scoreDialog.assessment?.fornecedor_nome}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {scoreDialog.assessment && (
                <ScoreVisualizationWrapper assessment={scoreDialog.assessment} />
              )}
            </div>
            
            <div className="lg:col-span-1">
              {scoreDialog.assessment && scoreDialog.assessment.score_final && (
                <IntegrationSuggestions 
                  assessment={{
                    id: scoreDialog.assessment.id,
                    fornecedor_nome: scoreDialog.assessment.fornecedor_nome,
                    score_final: scoreDialog.assessment.score_final
                  }}
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Respostas */}
      <AssessmentResponsesViewer
        open={responsesDialog.open}
        onOpenChange={(open) => setResponsesDialog({ open, assessment: null })}
        assessment={responsesDialog.assessment}
      />
    </div>
    </div>
  );
}

// Wrapper component para buscar dados do score
function ScoreVisualizationWrapper({ assessment }: { assessment: Assessment }) {
  const [scoreData, setScoreData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScoreData = async () => {
      try {
        const { data, error } = await supabase
          .from('due_diligence_scores')
          .select('*')
          .eq('assessment_id', assessment.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        setScoreData(data);
      } catch (error) {
        console.error('Erro ao buscar dados do score:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchScoreData();
  }, [assessment.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!scoreData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Score ainda não calculado para esta avaliação.</p>
      </div>
    );
  }

  return (
    <ScoreVisualization 
      scoreData={scoreData}
      assessmentData={{
        fornecedor_nome: assessment.fornecedor_nome,
        template: assessment.template
      }}
    />
  );
}