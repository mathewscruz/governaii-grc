import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Send, User, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Documento {
  id: string;
  nome: string;
}

interface Comentario {
  id: string;
  user_id: string;
  comentario: string;
  created_at: string;
  usuario_nome?: string;
  usuario_email?: string;
}

interface ComentariosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documento: Documento;
}

export function ComentariosDialog({ open, onOpenChange, documento }: ComentariosDialogProps) {
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [novoComentario, setNovoComentario] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchComentarios();
      getCurrentUser();
    }
  }, [open, documento.id]);

  const getCurrentUser = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        setCurrentUserId(userData.user.id);
      }
    } catch (error) {
      console.error('Erro ao obter usuário atual:', error);
    }
  };

  const fetchComentarios = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('documentos_comentarios')
        .select('*')
        .eq('documento_id', documento.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Buscar dados dos usuários
      const comentariosComUsuarios = await Promise.all(
        (data || []).map(async (comentario) => {
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('nome, email')
              .eq('user_id', comentario.user_id)
              .single();

            return {
              ...comentario,
              usuario_nome: profileData?.nome || 'Usuário desconhecido',
              usuario_email: profileData?.email || ''
            };
          } catch (error) {
            return {
              ...comentario,
              usuario_nome: 'Usuário desconhecido',
              usuario_email: ''
            };
          }
        })
      );

      setComentarios(comentariosComUsuarios);
    } catch (error) {
      console.error('Erro ao buscar comentários:', error);
      toast({
        title: "Erro ao carregar comentários",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!novoComentario.trim()) {
      toast({
        title: "Comentário vazio",
        description: "Por favor, digite um comentário.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('documentos_comentarios')
        .insert([{
          documento_id: documento.id,
          user_id: userData.user.id,
          comentario: novoComentario.trim()
        }]);

      if (error) throw error;

      toast({
        title: "Comentário adicionado",
        description: "Seu comentário foi adicionado com sucesso.",
      });

      setNovoComentario('');
      fetchComentarios();
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      toast({
        title: "Erro ao adicionar comentário",
        description: error instanceof Error ? error.message : "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (comentarioId: string) => {
    try {
      const { error } = await supabase
        .from('documentos_comentarios')
        .delete()
        .eq('id', comentarioId);

      if (error) throw error;

      toast({
        title: "Comentário removido",
        description: "O comentário foi removido com sucesso.",
      });

      fetchComentarios();
    } catch (error) {
      console.error('Erro ao remover comentário:', error);
      toast({
        title: "Erro ao remover comentário",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    }
  };

  const getInitials = (nome: string) => {
    return nome
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comentários do Documento
          </DialogTitle>
          <DialogDescription>
            Comentários sobre o documento "{documento.nome}".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Lista de comentários */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : comentarios.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-32">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Nenhum comentário ainda</p>
                  <p className="text-sm text-muted-foreground">Seja o primeiro a comentar</p>
                </CardContent>
              </Card>
            ) : (
              comentarios.map((comentario) => (
                <Card key={comentario.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {getInitials(comentario.usuario_nome || 'U')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{comentario.usuario_nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(comentario.created_at), 'dd/MM/yyyy \'às\' HH:mm', { locale: ptBR })}
                            </p>
                          </div>
                          {comentario.user_id === currentUserId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(comentario.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{comentario.comentario}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Formulário para novo comentário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Textarea
                value={novoComentario}
                onChange={(e) => setNovoComentario(e.target.value)}
                placeholder="Digite seu comentário..."
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={sending || !novoComentario.trim()}>
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Comentar
                  </>
                )}
              </Button>
            </div>
          </form>
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