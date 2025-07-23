import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, Clock, User, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Documento {
  id: string;
  nome: string;
  data_aprovacao?: string;
  aprovado_por?: string;
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
  const [formData, setFormData] = useState({
    aprovador_id: '',
    status: 'pendente',
    comentarios: ''
  });
  const { toast } = useToast();

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
      const aprovacaoData = {
        documento_id: documento.id,
        aprovador_id: formData.aprovador_id,
        status: formData.status,
        comentarios: formData.comentarios.trim() || null,
        data_aprovacao: formData.status !== 'pendente' ? new Date().toISOString() : null,
      };

      const { error } = await supabase
        .from('documentos_aprovacoes')
        .insert([aprovacaoData]);

      if (error) throw error;

      // Se aprovado, atualizar o documento
      if (formData.status === 'aprovado') {
        const { error: updateError } = await supabase
          .from('documentos')
          .update({
            data_aprovacao: new Date().toISOString(),
            aprovado_por: formData.aprovador_id
          })
          .eq('id', documento.id);

        if (updateError) throw updateError;
      }

      toast({
        title: "Aprovação registrada",
        description: "A aprovação foi registrada com sucesso.",
      });

      resetForm();
      fetchAprovacoes();
      onSuccess();
    } catch (error) {
      console.error('Erro ao registrar aprovação:', error);
      toast({
        title: "Erro ao registrar aprovação",
        description: error instanceof Error ? error.message : "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

      // Se aprovado, atualizar o documento
      if (novoStatus === 'aprovado') {
        const aprovacao = aprovacoes.find(a => a.id === aprovacaoId);
        if (aprovacao) {
          const { error: updateError } = await supabase
            .from('documentos')
            .update({
              data_aprovacao: new Date().toISOString(),
              aprovado_por: aprovacao.aprovador_id
            })
            .eq('id', documento.id);

          if (updateError) throw updateError;
        }
      }

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
      'pendente': { variant: 'secondary' as const, icon: Clock, color: 'text-yellow-600' },
      'aprovado': { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      'rejeitado': { variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' }
    };

    const config = variants[status as keyof typeof variants] || variants.pendente;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Aprovação
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
                    <p className="text-sm text-muted-foreground">Clique em "Nova Aprovação" para começar</p>
                  </CardContent>
                </Card>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aprovador</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Comentários</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aprovacoes.map((aprovacao) => (
                      <TableRow key={aprovacao.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="font-medium">{aprovacao.aprovador_nome}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(aprovacao.status)}</TableCell>
                        <TableCell>{aprovacao.comentarios || '-'}</TableCell>
                        <TableCell>
                          {aprovacao.data_aprovacao 
                            ? format(new Date(aprovacao.data_aprovacao), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                            : format(new Date(aprovacao.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                          }
                        </TableCell>
                        <TableCell>
                          {aprovacao.status === 'pendente' && (
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusChange(aprovacao.id, 'aprovado')}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusChange(aprovacao.id, 'rejeitado')}
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Nova Aprovação</h3>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Voltar
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="aprovador_id">Aprovador *</Label>
                  <Select value={formData.aprovador_id} onValueChange={(value) => setFormData(prev => ({ ...prev, aprovador_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o aprovador" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.user_id} value={profile.user_id}>
                          <div className="space-y-1">
                            <div>{profile.nome}</div>
                            <div className="text-sm text-muted-foreground">{profile.email}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status Inicial</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="aprovado">Aprovado</SelectItem>
                      <SelectItem value="rejeitado">Rejeitado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comentarios">Comentários</Label>
                <Textarea
                  id="comentarios"
                  value={formData.comentarios}
                  onChange={(e) => setFormData(prev => ({ ...prev, comentarios: e.target.value }))}
                  placeholder="Comentários sobre a aprovação"
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
                      Registrando...
                    </>
                  ) : (
                    'Registrar Aprovação'
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
    </Dialog>
  );
}