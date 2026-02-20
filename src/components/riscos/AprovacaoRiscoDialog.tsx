
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, XCircle, Send, Clock, User, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { UserSelect } from './UserSelect';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  risco: any;
  onSuccess: () => void;
}

export function AprovacaoRiscoDialog({ open, onOpenChange, risco, onSuccess }: Props) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [comentario, setComentario] = useState('');
  const [aprovadorId, setAprovadorId] = useState('');

  const statusAprovacao = risco?.status_aprovacao || 'rascunho';
  const historicoAprovacao = (risco?.historico_aprovacao as any[]) || [];
  const isAprovador = risco?.aprovador_id === profile?.user_id;

  const handleEnviarAprovacao = async () => {
    if (!aprovadorId) {
      toast.error('Selecione um aprovador');
      return;
    }
    setLoading(true);
    try {
      const novoHistorico = [
        ...historicoAprovacao,
        {
          acao: 'enviado',
          usuario_id: profile?.user_id,
          usuario_nome: profile?.nome,
          data: new Date().toISOString(),
          comentario: comentario || 'Enviado para aprovação'
        }
      ];

      const { error } = await supabase
        .from('riscos')
        .update({
          status_aprovacao: 'pendente',
          aprovador_id: aprovadorId,
          historico_aprovacao: novoHistorico
        })
        .eq('id', risco.id);

      if (error) throw error;

      // Inserir notificação para o aprovador
      await supabase.from('notifications').insert({
        user_id: aprovadorId,
        title: 'Aprovação de Risco Pendente',
        message: `O risco "${risco.nome}" foi enviado para sua aprovação.`,
        type: 'info',
        link_to: '/riscos'
      });

      toast.success('Risco enviado para aprovação!');
      setComentario('');
      onSuccess();
    } catch (error: any) {
      toast.error('Erro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDecisao = async (decisao: 'aprovado' | 'rejeitado') => {
    setLoading(true);
    try {
      const novoHistorico = [
        ...historicoAprovacao,
        {
          acao: decisao,
          usuario_id: profile?.user_id,
          usuario_nome: profile?.nome,
          data: new Date().toISOString(),
          comentario: comentario || (decisao === 'aprovado' ? 'Aprovado' : 'Rejeitado')
        }
      ];

      const { error } = await supabase
        .from('riscos')
        .update({
          status_aprovacao: decisao,
          data_aprovacao: decisao === 'aprovado' ? new Date().toISOString() : null,
          comentarios_aprovacao: comentario || null,
          historico_aprovacao: novoHistorico
        })
        .eq('id', risco.id);

      if (error) throw error;

      // Notificar o criador do risco
      if (risco.created_by) {
        await supabase.from('notifications').insert({
          user_id: risco.created_by,
          title: `Risco ${decisao === 'aprovado' ? 'Aprovado' : 'Rejeitado'}`,
          message: `O risco "${risco.nome}" foi ${decisao}.${comentario ? ` Comentário: ${comentario}` : ''}`,
          type: decisao === 'aprovado' ? 'success' : 'warning',
          link_to: '/riscos'
        });
      }

      toast.success(`Risco ${decisao}!`);
      setComentario('');
      onSuccess();
    } catch (error: any) {
      toast.error('Erro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aprovado': return <Badge className="bg-green-100 text-green-800 border-green-200">Aprovado</Badge>;
      case 'rejeitado': return <Badge className="bg-red-100 text-red-800 border-red-200">Rejeitado</Badge>;
      case 'pendente': return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendente</Badge>;
      default: return <Badge variant="outline">Rascunho</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Aprovação - {risco?.nome}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh]">
          <div className="space-y-4 p-1">
            {/* Status atual */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              {getStatusBadge(statusAprovacao)}
            </div>

            {/* Enviar para aprovação (se rascunho ou rejeitado) */}
            {(statusAprovacao === 'rascunho' || statusAprovacao === 'rejeitado') && (
              <div className="space-y-3 border rounded-lg p-4">
                <Label>Enviar para Aprovação</Label>
                <UserSelect
                  value={aprovadorId}
                  onValueChange={setAprovadorId}
                  placeholder="Selecione o aprovador"
                />
                <Textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Comentário (opcional)..."
                  className="min-h-[60px]"
                />
                <Button onClick={handleEnviarAprovacao} disabled={loading} className="w-full">
                  <Send className="mr-2 h-4 w-4" />
                  Enviar para Aprovação
                </Button>
              </div>
            )}

            {/* Ações do aprovador */}
            {statusAprovacao === 'pendente' && isAprovador && (
              <div className="space-y-3 border rounded-lg p-4">
                <Label>Sua Decisão</Label>
                <Textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Comentário da decisão..."
                  className="min-h-[60px]"
                />
                <div className="flex gap-2">
                  <Button onClick={() => handleDecisao('aprovado')} disabled={loading} className="flex-1" variant="default">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Aprovar
                  </Button>
                  <Button onClick={() => handleDecisao('rejeitado')} disabled={loading} className="flex-1" variant="destructive">
                    <XCircle className="mr-2 h-4 w-4" />
                    Rejeitar
                  </Button>
                </div>
              </div>
            )}

            {statusAprovacao === 'pendente' && !isAprovador && (
              <div className="text-sm text-muted-foreground text-center py-4 bg-muted rounded-lg">
                <Clock className="h-6 w-6 mx-auto mb-2 opacity-50" />
                Aguardando decisão do aprovador
              </div>
            )}

            {/* Histórico */}
            {historicoAprovacao.length > 0 && (
              <div className="space-y-2">
                <Label>Histórico de Aprovações</Label>
                <div className="space-y-2">
                  {[...historicoAprovacao].reverse().map((item: any, i: number) => (
                    <div key={i} className="border rounded p-3 text-sm space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3" />
                          <span className="font-medium">{item.usuario_nome || 'Sistema'}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {item.data ? format(new Date(item.data), "dd/MM/yyyy HH:mm", { locale: ptBR }) : '-'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs capitalize">{item.acao}</Badge>
                        {item.comentario && (
                          <span className="text-muted-foreground flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {item.comentario}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
