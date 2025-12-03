import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, Clock, User, Plus, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Documento {
  id: string;
  nome: string;
  data_aprovacao?: string;
  aprovado_por?: string;
  created_by?: string;
}

interface Aprovacao {
  id: string;
  aprovador_id: string;
  status: string;
  comentarios?: string;
  data_aprovacao?: string;
  created_at: string;
  aprovador_nome?: string;
}

interface Profile {
  user_id: string;
  nome: string;
  email: string;
  role: string;
}

interface AprovacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documento: Documento;
  onSuccess: () => void;
}

export function AprovacaoDialog({ open, onOpenChange, documento, onSuccess }: AprovacaoDialogProps) {
  const [aprovacoes, setAprovacoes] = useState<Aprovacao[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    aprovador_id: '',
    status: 'pendente',
    comentarios: ''
  });
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    type: 'aprovar' | 'rejeitar' | 'alteracoes' | null;
    aprovacaoId: string;
  }>({ open: false, type: null, aprovacaoId: '' });
  const [actionComment, setActionComment] = useState('');
  const { toast } = useToast();

  // Obter ID do usuário atual
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  const openActionModal = (type: 'aprovar' | 'rejeitar' | 'alteracoes', aprovacaoId: string) => {
    setActionModal({ open: true, type, aprovacaoId });
    setActionComment('');
  };

  const closeActionModal = () => {
    setActionModal({ open: false, type: null, aprovacaoId: '' });
    setActionComment('');
  };

  const executeAction = async () => {
    if (!actionModal.aprovacaoId || !actionModal.type) return;

    // Validar comentário obrigatório para rejeição/alterações
    if ((actionModal.type === 'rejeitar' || actionModal.type === 'alteracoes') && !actionComment.trim()) {
      toast({
        title: "Comentário obrigatório",
        description: actionModal.type === 'rejeitar' 
          ? "Por favor, informe o motivo da rejeição." 
          : "Por favor, descreva as alterações necessárias.",
        variant: "destructive",
      });
      return;
    }

    const novoStatus = actionModal.type === 'aprovar' ? 'aprovado' 
                     : actionModal.type === 'rejeitar' ? 'rejeitado' 
                     : 'pendente'; // alteracoes mantém pendente

    await handleStatusChange(actionModal.aprovacaoId, novoStatus, actionComment.trim() || undefined);
    closeActionModal();
  };

  // Se documento não requer aprovação, mostrar mensagem
  if (!(documento as any).requer_aprovacao) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sistema de Aprovação Desabilitado</DialogTitle>
            <DialogDescription>
              Este documento não requer aprovação. Para habilitar o sistema de aprovação,
              edite o documento e marque a opção "Requer Aprovação".
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  useEffect(() => {
    if (open) {
      fetchAprovacoes();
      fetchProfiles();
    }
  }, [open, documento.id]);

  const fetchAprovacoes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('documentos_aprovacoes')
        .select('*')
        .eq('documento_id', documento.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar nomes dos aprovadores
      const aprovacoesComNomes = await Promise.all(
        (data || []).map(async (aprovacao) => {
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('nome')
              .eq('user_id', aprovacao.aprovador_id)
              .single();

            return {
              ...aprovacao,
              aprovador_nome: profileData?.nome || 'Usuário não encontrado'
            };
          } catch (error) {
            return {
              ...aprovacao,
              aprovador_nome: 'Usuário não encontrado'
            };
          }
        })
      );

      setAprovacoes(aprovacoesComNomes);
    } catch (error) {
      console.error('Erro ao buscar aprovações:', error);
      toast({
        title: "Erro ao carregar aprovações",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, nome, email, role')
        .in('role', ['admin', 'super_admin'])
        .order('nome');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Erro ao buscar profiles:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.aprovador_id) {
      toast({
        title: "Aprovador obrigatório",
        description: "Por favor, selecione um aprovador.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      
      // Verificar se já existe solicitação para este aprovador
      const { data: existente, error: checkError } = await supabase
        .from('documentos_aprovacoes')
        .select('id, status')
        .eq('documento_id', documento.id)
        .eq('aprovador_id', formData.aprovador_id)
        .maybeSingle();

      if (checkError) {
        console.error('Erro ao verificar aprovação existente:', checkError);
      }

      if (existente) {
        toast({
          title: "Solicitação já existe",
          description: existente.status === 'pendente' 
            ? "Já existe uma solicitação pendente para este aprovador. Cancele a anterior antes de enviar uma nova."
            : "Este aprovador já avaliou este documento. Cancele a aprovação anterior se desejar reenviar.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      const aprovacaoData = {
        documento_id: documento.id,
        aprovador_id: formData.aprovador_id,
        status: 'pendente',
        comentarios: formData.comentarios.trim() || null,
        data_aprovacao: null,
        tipo_acao: 'solicitacao',
        solicitado_por: userData.user?.id || null,
        data_solicitacao: new Date().toISOString()
      };

      const { error } = await supabase
        .from('documentos_aprovacoes')
        .insert([aprovacaoData]);

      if (error) throw error;

      // Enviar e-mail de notificação
      try {
        const { error: emailError } = await supabase.functions.invoke('send-approval-notification', {
          body: {
            documento_id: documento.id,
            aprovador_id: formData.aprovador_id,
            solicitante_id: userData.user?.id
          }
        });

        if (emailError) {
          console.error('Erro ao enviar e-mail de notificação:', emailError);
        } else {
          console.log('E-mail de notificação enviado com sucesso');
        }
      } catch (emailError) {
        console.error('Erro ao chamar edge function:', emailError);
      }

      toast({
        title: "Solicitação enviada",
        description: "A solicitação de aprovação foi enviada com sucesso. O aprovador receberá uma notificação.",
      });

      resetForm();
      fetchAprovacoes();
      onSuccess();
    } catch (error) {
      console.error('Erro ao processar:', error);
      toast({
        title: "Erro ao solicitar aprovação",
        description: error instanceof Error ? error.message : "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelarSolicitacao = async (aprovacaoId: string) => {
    try {
      const { error } = await supabase
        .from('documentos_aprovacoes')
        .delete()
        .eq('id', aprovacaoId);

      if (error) throw error;

      toast({
        title: "Solicitação cancelada",
        description: "A solicitação de aprovação foi cancelada com sucesso.",
      });

      fetchAprovacoes();
    } catch (error) {
      console.error('Erro ao cancelar solicitação:', error);
      toast({
        title: "Erro ao cancelar solicitação",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (aprovacaoId: string, novoStatus: string, comentarios?: string) => {
    try {
      const { error } = await supabase
        .from('documentos_aprovacoes')
        .update({
          status: novoStatus,
          comentarios: comentarios || null,
          data_aprovacao: novoStatus !== 'pendente' ? new Date().toISOString() : null,
        })
        .eq('id', aprovacaoId);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: "O status da aprovação foi atualizado com sucesso.",
      });

      fetchAprovacoes();
      onSuccess();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro ao atualizar status",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      aprovador_id: '',
      status: 'pendente',
      comentarios: ''
    });
    setShowForm(false);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'pendente': { 
        icon: Clock, 
        className: 'border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
        label: 'Pendente'
      },
      'aprovado': { 
        icon: CheckCircle, 
        className: 'border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
        label: 'Aprovado'
      },
      'rejeitado': { 
        icon: XCircle, 
        className: 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
        label: 'Rejeitado'
      }
    };

    const config = variants[status as keyof typeof variants] || variants.pendente;
    const Icon = config.icon;

    return (
      <Badge className={`flex items-center gap-1 border ${config.className}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getActionModalTitle = () => {
    switch (actionModal.type) {
      case 'aprovar': return 'Aprovar Documento';
      case 'rejeitar': return 'Rejeitar Documento';
      case 'alteracoes': return 'Solicitar Alterações';
      default: return '';
    }
  };

  const getActionModalDescription = () => {
    switch (actionModal.type) {
      case 'aprovar': return 'Confirme a aprovação do documento. Você pode adicionar um comentário opcional.';
      case 'rejeitar': return 'Informe o motivo da rejeição. Este campo é obrigatório.';
      case 'alteracoes': return 'Descreva as alterações necessárias. O documento permanecerá pendente até as correções serem realizadas.';
      default: return '';
    }
  };

  const statusAprovacao = aprovacoes.length > 0 
    ? aprovacoes.some(a => a.status === 'aprovado') 
      ? 'aprovado' 
      : aprovacoes.some(a => a.status === 'rejeitado')
        ? 'rejeitado'
        : 'pendente'
    : 'sem_aprovacao';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Aprovação do Documento
          </DialogTitle>
          <DialogDescription>
            Gerencie as aprovações do documento "{documento.nome}".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status geral */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Status do Documento</h3>
                  <p className="text-sm text-muted-foreground">
                    {statusAprovacao === 'aprovado' && 'Documento aprovado'}
                    {statusAprovacao === 'rejeitado' && 'Documento rejeitado'}
                    {statusAprovacao === 'pendente' && 'Aguardando aprovação'}
                    {statusAprovacao === 'sem_aprovacao' && 'Nenhuma aprovação solicitada'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {statusAprovacao !== 'sem_aprovacao' && getStatusBadge(statusAprovacao)}
                  {documento.data_aprovacao && (
                    <span className="text-sm text-muted-foreground">
                      em {format(new Date(documento.data_aprovacao), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {!showForm ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Histórico de Aprovações</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowForm(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Solicitar Aprovação
                  </Button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : aprovacoes.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center h-32">
                    <CheckCircle className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Nenhuma aprovação registrada ainda</p>
                    <p className="text-sm text-muted-foreground">Use "Solicitar Aprovação" para enviar uma solicitação</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {aprovacoes.map((aprovacao) => (
                    <Card key={aprovacao.id}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <User className="h-4 w-4 shrink-0" />
                              <span className="font-medium truncate">{aprovacao.aprovador_nome}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant="outline" className="shrink-0">
                                {(aprovacao as any).tipo_acao === 'solicitacao' ? 'Solicitação' : 'Aprovação'}
                              </Badge>
                              {getStatusBadge(aprovacao.status)}
                            </div>
                          </div>
                          
                          {aprovacao.comentarios && (
                            <div className="text-sm text-muted-foreground">
                              <span className="font-medium">Comentários:</span> {aprovacao.comentarios}
                            </div>
                          )}
                          
                          <div className="text-sm text-muted-foreground">
                            {aprovacao.data_aprovacao 
                              ? format(new Date(aprovacao.data_aprovacao), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                              : format(new Date(aprovacao.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                            }
                          </div>
                          
                          {aprovacao.status === 'pendente' && (aprovacao as any).tipo_acao === 'solicitacao' && (
                            <div className="flex flex-wrap gap-2 pt-2">
                              {/* Botões para o APROVADOR - só quem foi designado pode aprovar/rejeitar */}
                              {currentUserId === aprovacao.aprovador_id && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openActionModal('aprovar', aprovacao.id)}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Aprovar
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openActionModal('alteracoes', aprovacao.id)}
                                    className="text-orange-600 hover:text-orange-700"
                                  >
                                    <MessageSquare className="h-4 w-4 mr-1" />
                                    Solicitar Alterações
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openActionModal('rejeitar', aprovacao.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Rejeitar
                                  </Button>
                                </>
                              )}
                              
                              {/* Botão Cancelar - só quem solicitou pode cancelar */}
                              {currentUserId === (aprovacao as any).solicitado_por && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCancelarSolicitacao(aprovacao.id)}
                                  className="text-gray-600 hover:text-gray-700"
                                >
                                  Cancelar Solicitação
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Solicitar Aprovação</h3>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Voltar
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aprovador_id">Aprovador *</Label>
                <Select value={formData.aprovador_id} onValueChange={(value) => setFormData(prev => ({ ...prev, aprovador_id: value }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o aprovador">
                      {formData.aprovador_id && (
                        <div className="flex items-center gap-2 min-w-0">
                          <User className="h-4 w-4 shrink-0" />
                          <span className="truncate">
                            {profiles.find(p => p.user_id === formData.aprovador_id)?.nome || 'Aprovador'}
                          </span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-w-[calc(100vw-2rem)]">
                    {profiles.map((profile) => (
                      <SelectItem key={profile.user_id} value={profile.user_id}>
                        <div className="flex items-center gap-2 min-w-0">
                          <User className="h-4 w-4 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate">{profile.nome}</div>
                            <div className="text-sm text-muted-foreground truncate">{profile.email}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comentarios">Observações da Solicitação</Label>
                <Textarea
                  id="comentarios"
                  value={formData.comentarios}
                  onChange={(e) => setFormData(prev => ({ ...prev, comentarios: e.target.value }))}
                  placeholder="Descreva o motivo da solicitação ou observações importantes"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Enviando...
                    </>
                  ) : (
                    'Enviar Solicitação'
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Modal de Ação */}
      <Dialog open={actionModal.open} onOpenChange={(open) => !open && closeActionModal()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{getActionModalTitle()}</DialogTitle>
            <DialogDescription>{getActionModalDescription()}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="action-comment">
                {actionModal.type === 'rejeitar' && 'Motivo da Rejeição *'}
                {actionModal.type === 'alteracoes' && 'Alterações Necessárias *'}
                {actionModal.type === 'aprovar' && 'Comentários (opcional)'}
              </Label>
              <Textarea
                id="action-comment"
                value={actionComment}
                onChange={(e) => setActionComment(e.target.value)}
                placeholder={
                  actionModal.type === 'alteracoes' 
                    ? 'Descreva detalhadamente as alterações necessárias...'
                    : actionModal.type === 'rejeitar'
                    ? 'Informe o motivo da rejeição...'
                    : 'Adicione um comentário sobre a aprovação...'
                }
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={closeActionModal}>
              Cancelar
            </Button>
            <Button 
              onClick={executeAction}
              variant={actionModal.type === 'rejeitar' ? 'destructive' : 'default'}
              className={actionModal.type === 'alteracoes' ? 'bg-orange-600 hover:bg-orange-700' : ''}
            >
              {actionModal.type === 'aprovar' && 'Confirmar Aprovação'}
              {actionModal.type === 'rejeitar' && 'Confirmar Rejeição'}
              {actionModal.type === 'alteracoes' && 'Enviar Solicitação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}