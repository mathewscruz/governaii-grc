import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Send, Clock, AlertTriangle, FileText, Eye, User, Edit2, Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AssessmentDialog } from './AssessmentDialog';
import ConfirmDialog from '@/components/ConfirmDialog';

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

export function AssessmentsManagerEnhanced() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [filteredAssessments, setFilteredAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
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
  const { toast } = useToast();

  useEffect(() => {
    fetchAssessments();
    
    // Auto-refresh a cada 30 segundos para capturar mudanças de status
    const interval = setInterval(fetchAssessments, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterAssessments();
  }, [assessments, searchTerm, statusFilter]);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('due_diligence_assessments')
        .select(`
          *,
          templates:template_id(nome, categoria)
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

  const filterAssessments = () => {
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

    setFilteredAssessments(filtered);
  };

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestão de Assessments</h2>
        <Button 
          onClick={() => setAssessmentDialog({ open: true, assessment: null, mode: 'create' })}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nova Avaliação
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-4">
        <Input
          placeholder="Buscar por fornecedor ou template..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
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

      {/* Lista de assessments */}
      <div className="grid gap-4">
        {filteredAssessments.map((assessment) => (
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
                  <p className={`font-medium ${getScoreColor(assessment.score_final)}`}>
                    {assessment.score_final ? `${assessment.score_final.toFixed(1)}%` : 'N/A'}
                  </p>
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

      {filteredAssessments.length === 0 && !loading && (
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
    </div>
  );
}