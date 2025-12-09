import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Edit,
  MessageSquare,
  Send,
  Trash2,
  User,
  Calendar,
  Loader2,
  AtSign,
  Shield,
  Activity,
  Link2,
} from "lucide-react";
import { toast } from "sonner";
import { formatDateOnly } from "@/lib/date-utils";
import ConfirmDialog from "@/components/ConfirmDialog";
import { capitalizeText } from "@/lib/text-utils";

interface ControleDetalheDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  controle: any;
  onEdit: () => void;
}

const statusOptions: Record<string, { label: string; color: string }> = {
  ativo: { label: "Ativo", color: "bg-green-100 text-green-800" },
  inativo: { label: "Inativo", color: "bg-gray-100 text-gray-800" },
  em_revisao: { label: "Em Revisão", color: "bg-amber-100 text-amber-800" },
  descontinuado: { label: "Descontinuado", color: "bg-red-100 text-red-800" },
};

const criticidadeOptions: Record<string, { label: string; color: string }> = {
  critico: { label: "Crítico", color: "bg-red-600 text-white" },
  alto: { label: "Alto", color: "bg-orange-100 text-orange-800" },
  medio: { label: "Médio", color: "bg-yellow-100 text-yellow-800" },
  baixo: { label: "Baixo", color: "bg-green-100 text-green-800" },
};

export function ControleDetalheDialog({
  open,
  onOpenChange,
  controle,
  onEdit,
}: ControleDetalheDialogProps) {
  const queryClient = useQueryClient();
  const [novoComentario, setNovoComentario] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string } | null>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Buscar usuários da empresa para menções
  const { data: usuarios } = useQuery({
    queryKey: ["usuarios-empresa"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, nome, email")
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  // Buscar comentários
  const { data: comentarios, refetch: refetchComentarios } = useQuery({
    queryKey: ["controle-comentarios", controle?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("controles_comentarios")
        .select("*")
        .eq("controle_id", controle.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const userIds = [...new Set(data.map(c => c.user_id))];

      const { data: users } = await supabase
        .from("profiles")
        .select("user_id, nome")
        .in("user_id", userIds);

      const userMap = new Map(users?.map(u => [u.user_id, u.nome]) || []);
      
      return data.map(c => ({
        ...c,
        user_nome: userMap.get(c.user_id) || "Usuário"
      }));
    },
    enabled: open && !!controle?.id,
  });

  // Buscar auditorias vinculadas
  const { data: auditoriasVinculadas } = useQuery({
    queryKey: ["controle-auditorias", controle?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("controles_auditorias")
        .select(`
          auditoria_id,
          auditoria:auditorias(id, nome, status)
        `)
        .eq("controle_id", controle.id);

      if (error) throw error;
      return data || [];
    },
    enabled: open && !!controle?.id,
  });

  // Filtrar usuários para menção
  const filteredUsers = usuarios?.filter(u => 
    u.nome?.toLowerCase().includes(mentionSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(mentionSearch.toLowerCase())
  ).slice(0, 5);

  // Detectar @ no texto
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const position = e.target.selectionStart || 0;
    setNovoComentario(value);
    setCursorPosition(position);

    const textBeforeCursor = value.substring(0, position);
    const atIndex = textBeforeCursor.lastIndexOf("@");
    
    if (atIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(atIndex + 1);
      if (!textAfterAt.includes(" ")) {
        setMentionSearch(textAfterAt);
        setShowMentions(true);
        return;
      }
    }
    setShowMentions(false);
  };

  // Inserir menção
  const insertMention = (user: { user_id: string; nome: string }) => {
    const textBeforeCursor = novoComentario.substring(0, cursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf("@");
    const textAfterCursor = novoComentario.substring(cursorPosition);
    
    const newText = 
      novoComentario.substring(0, atIndex) + 
      `@${user.nome} ` + 
      textAfterCursor;
    
    setNovoComentario(newText);
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  // Extrair menções do comentário
  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+(?:\s+\w+)?)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      const mentionName = match[1];
      const user = usuarios?.find(u => u.nome?.includes(mentionName));
      if (user) {
        mentions.push(user.user_id);
      }
    }
    
    return mentions;
  };

  const handleAddComentario = async () => {
    if (!novoComentario.trim()) return;

    setIsSubmittingComment(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const mencoes = extractMentions(novoComentario);

      const { error } = await supabase.from("controles_comentarios").insert({
        controle_id: controle.id,
        user_id: userData.user?.id,
        comentario: novoComentario.trim(),
        mencoes: mencoes.length > 0 ? mencoes : null,
      });

      if (error) throw error;

      // Notificar usuários mencionados
      if (mencoes.length > 0) {
        for (const userId of mencoes) {
          await supabase.from("notifications").insert({
            user_id: userId,
            title: "Você foi mencionado",
            message: `Você foi mencionado em um comentário no controle "${controle.nome}"`,
            type: "info",
            link_to: "/controles",
          });
        }
      }

      setNovoComentario("");
      refetchComentarios();
      toast.success("Comentário adicionado");
    } catch (error: any) {
      toast.error(error.message || "Erro ao adicionar comentário");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComentario = async (comentarioId: string) => {
    try {
      const { error } = await supabase
        .from("controles_comentarios")
        .delete()
        .eq("id", comentarioId);

      if (error) throw error;

      refetchComentarios();
      toast.success("Comentário removido");
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover comentário");
    }
    setDeleteTarget(null);
  };

  // Renderizar comentário com menções destacadas
  const renderCommentWithMentions = (text: string) => {
    const parts = text.split(/(@\w+(?:\s+\w+)?)/g);
    return parts.map((part, index) => {
      if (part.startsWith("@")) {
        return (
          <span key={index} className="text-primary font-medium">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  if (!controle) return null;

  const statusInfo = statusOptions[controle.status] || statusOptions.ativo;
  const criticidadeInfo = criticidadeOptions[controle.criticidade] || criticidadeOptions.medio;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="gap-1">
                    <Shield className="h-3 w-3" />
                    {capitalizeText(controle.tipo)}
                  </Badge>
                  <Badge className={`${criticidadeInfo.color} border-0`}>
                    {criticidadeInfo.label}
                  </Badge>
                  <Badge className={`${statusInfo.color} border-0`}>
                    {statusInfo.label}
                  </Badge>
                </div>
                <DialogTitle className="text-xl">{controle.nome}</DialogTitle>
              </div>
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>
          </DialogHeader>

          {/* Metadados do controle - linha separada */}
          <div className="flex-shrink-0 flex flex-wrap gap-4 items-center text-sm border-b pb-4">
            {controle.responsavel_nome && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{controle.responsavel_nome}</span>
              </div>
            )}
            {controle.frequencia && (
              <div className="flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span>{capitalizeText(controle.frequencia)}</span>
              </div>
            )}
            {controle.proxima_avaliacao && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatDateOnly(controle.proxima_avaliacao)}</span>
              </div>
            )}
            {controle.categoria && (
              <Badge 
                variant="outline" 
                style={{ borderColor: controle.categoria.cor, color: controle.categoria.cor }}
              >
                {controle.categoria.nome}
              </Badge>
            )}
          </div>

          {/* Descrição separada com suporte a quebras de linha */}
          {controle.descricao && (
            <div className="flex-shrink-0 bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {controle.descricao}
              </p>
            </div>
          )}

          {/* Tabs */}
          <Tabs defaultValue="comentarios" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="flex-shrink-0">
              <TabsTrigger value="comentarios" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Comentários ({comentarios?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="auditorias" className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Auditorias Vinculadas ({auditoriasVinculadas?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="comentarios" className="flex-1 overflow-hidden flex flex-col mt-4">
              {/* Input de novo comentário com menções */}
              <div className="flex gap-2 mb-4 flex-shrink-0 relative">
                <div className="flex-1 relative">
                  <Textarea
                    ref={textareaRef}
                    placeholder="Adicione um comentário... Use @ para mencionar alguém"
                    value={novoComentario}
                    onChange={handleCommentChange}
                    rows={2}
                    className="w-full pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2 h-6 w-6 p-0"
                    onClick={() => {
                      setNovoComentario(prev => prev + "@");
                      setShowMentions(true);
                      textareaRef.current?.focus();
                    }}
                    title="Mencionar usuário"
                  >
                    <AtSign className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  
                  {/* Popover de menções */}
                  {showMentions && filteredUsers && filteredUsers.length > 0 && (
                    <div className="absolute left-0 top-full mt-1 w-64 bg-popover border rounded-md shadow-lg z-50">
                      {filteredUsers.map((user) => (
                        <button
                          key={user.user_id}
                          className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2 text-sm"
                          onClick={() => insertMention(user)}
                        >
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{user.nome}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleAddComentario}
                  disabled={!novoComentario.trim() || isSubmittingComment}
                  className="self-end"
                >
                  {isSubmittingComment ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Lista de comentários */}
              <ScrollArea className="flex-1">
                <div className="space-y-3 pr-4">
                  {comentarios?.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum comentário ainda
                    </p>
                  ) : (
                    comentarios?.map((c) => (
                      <div
                        key={c.id}
                        className="bg-muted/30 rounded-lg p-3 border border-border/50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm">{c.user_nome}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {new Date(c.created_at).toLocaleString("pt-BR")}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => setDeleteTarget({ id: c.id })}
                            >
                              <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">
                          {renderCommentWithMentions(c.comentario)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="auditorias" className="flex-1 overflow-hidden mt-4">
              <ScrollArea className="h-full">
                <div className="space-y-2 pr-4">
                  {auditoriasVinculadas?.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Este controle não está vinculado a nenhuma auditoria
                    </p>
                  ) : (
                    auditoriasVinculadas?.map((av: any) => (
                      <div
                        key={av.auditoria_id}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50"
                      >
                        <div className="flex items-center gap-2">
                          <Link2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{av.auditoria?.nome}</span>
                        </div>
                        <Badge variant="outline">
                          {capitalizeText(av.auditoria?.status?.replace(/_/g, ' ') || '')}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Excluir Comentário"
        description="Tem certeza que deseja excluir este comentário? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={() => deleteTarget && handleDeleteComentario(deleteTarget.id)}
      />
    </>
  );
}
