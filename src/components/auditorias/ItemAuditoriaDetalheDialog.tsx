import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Edit,
  Paperclip,
  MessageSquare,
  Send,
  Upload,
  Trash2,
  User,
  Calendar,
  Download,
  FileText,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { formatDateOnly } from "@/lib/date-utils";
import ConfirmDialog from "@/components/ConfirmDialog";

interface ItemAuditoriaDetalheDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any;
  onSuccess: () => void;
  onEdit: () => void;
}

const statusOptions: Record<string, { label: string; color: string }> = {
  pendente: { label: "Pendente", color: "bg-gray-100 text-gray-800" },
  em_andamento: { label: "Em Andamento", color: "bg-blue-100 text-blue-800" },
  concluido: { label: "Concluído", color: "bg-green-100 text-green-800" },
  nao_aplicavel: { label: "Não Aplicável", color: "bg-slate-100 text-slate-600" },
};

const prioridadeOptions: Record<string, { label: string; color: string }> = {
  alta: { label: "Alta", color: "bg-red-100 text-red-800" },
  media: { label: "Média", color: "bg-yellow-100 text-yellow-800" },
  baixa: { label: "Baixa", color: "bg-green-100 text-green-800" },
};

export function ItemAuditoriaDetalheDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
  onEdit,
}: ItemAuditoriaDetalheDialogProps) {
  const queryClient = useQueryClient();
  const [novoComentario, setNovoComentario] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "evidencia" | "comentario"; id: string } | null>(null);

  // Buscar comentários
  const { data: comentarios, refetch: refetchComentarios } = useQuery({
    queryKey: ["auditoria-item-comentarios", item?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("auditoria_itens_comentarios")
        .select("*")
        .eq("item_id", item.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Buscar nomes dos usuários
      const userIds = [...new Set(data?.map(c => c.user_id) || [])];
      const { data: users } = await supabase
        .from("profiles")
        .select("user_id, nome")
        .in("user_id", userIds);

      const userMap = new Map(users?.map(u => [u.user_id, u.nome]) || []);
      
      return data?.map(c => ({
        ...c,
        user_nome: userMap.get(c.user_id) || "Usuário"
      })) || [];

    },
    enabled: open && !!item?.id,
  });

  // Buscar evidências
  const { data: evidencias, refetch: refetchEvidencias } = useQuery({
    queryKey: ["auditoria-item-evidencias", item?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("auditoria_itens_evidencias")
        .select("*")
        .eq("item_id", item.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: open && !!item?.id,
  });

  const handleAddComentario = async () => {
    if (!novoComentario.trim()) return;

    setIsSubmittingComment(true);
    try {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase.from("auditoria_itens_comentarios").insert({
        item_id: item.id,
        user_id: userData.user?.id,
        comentario: novoComentario.trim(),
      });

      if (error) throw error;

      setNovoComentario("");
      refetchComentarios();
      onSuccess();
      toast.success("Comentário adicionado");
    } catch (error: any) {
      toast.error(error.message || "Erro ao adicionar comentário");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleUploadEvidencia = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const fileName = `${item.id}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("auditoria-evidencias")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("auditoria-evidencias")
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase.from("auditoria_itens_evidencias").insert({
        item_id: item.id,
        nome: file.name,
        arquivo_url: urlData.publicUrl,
        arquivo_nome: file.name,
        arquivo_tamanho: file.size,
        arquivo_tipo: file.type,
        uploaded_by: userData.user?.id,
      });

      if (insertError) throw insertError;

      refetchEvidencias();
      onSuccess();
      toast.success("Evidência anexada com sucesso");
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer upload");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleDeleteEvidencia = async (evidenciaId: string) => {
    try {
      const { error } = await supabase
        .from("auditoria_itens_evidencias")
        .delete()
        .eq("id", evidenciaId);

      if (error) throw error;

      refetchEvidencias();
      onSuccess();
      toast.success("Evidência removida");
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover evidência");
    }
    setDeleteTarget(null);
  };

  const handleDeleteComentario = async (comentarioId: string) => {
    try {
      const { error } = await supabase
        .from("auditoria_itens_comentarios")
        .delete()
        .eq("id", comentarioId);

      if (error) throw error;

      refetchComentarios();
      onSuccess();
      toast.success("Comentário removido");
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover comentário");
    }
    setDeleteTarget(null);
  };

  const handleDownload = async (evidencia: any) => {
    if (evidencia.arquivo_url) {
      window.open(evidencia.arquivo_url, "_blank");
    }
  };

  if (!item) return null;

  const statusInfo = statusOptions[item.status] || statusOptions.pendente;
  const prioridadeInfo = prioridadeOptions[item.prioridade] || prioridadeOptions.media;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="font-mono">
                    {item.codigo}
                  </Badge>
                  <Badge className={`${prioridadeInfo.color} border-0`}>
                    {prioridadeInfo.label}
                  </Badge>
                  <Badge className={`${statusInfo.color} border-0`}>
                    {statusInfo.label}
                  </Badge>
                </div>
                <DialogTitle className="text-xl">{item.titulo}</DialogTitle>
              </div>
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>
          </DialogHeader>

          {/* Info do item */}
          <div className="flex-shrink-0 bg-muted/50 rounded-lg p-4 space-y-2">
            {item.descricao && (
              <p className="text-sm text-muted-foreground">{item.descricao}</p>
            )}
            <div className="flex gap-4 text-sm">
              {item.responsavel && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{item.responsavel.nome}</span>
                </div>
              )}
              {item.prazo && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Prazo: {formatDateOnly(item.prazo)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="comentarios" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="flex-shrink-0">
              <TabsTrigger value="comentarios" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Comentários ({comentarios?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="evidencias" className="flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Evidências ({evidencias?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="comentarios" className="flex-1 overflow-hidden flex flex-col mt-4">
              {/* Input de novo comentário */}
              <div className="flex gap-2 mb-4 flex-shrink-0">
                <Textarea
                  placeholder="Adicione um comentário..."
                  value={novoComentario}
                  onChange={(e) => setNovoComentario(e.target.value)}
                  rows={2}
                  className="flex-1"
                />
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
                              onClick={() => setDeleteTarget({ type: "comentario", id: c.id })}
                            >
                              <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{c.comentario}</p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="evidencias" className="flex-1 overflow-hidden flex flex-col mt-4">
              {/* Upload de evidência */}
              <div className="flex-shrink-0 mb-4">
                <label className="cursor-pointer">
                  <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors">
                    {isUploading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Fazendo upload...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Upload className="h-5 w-5" />
                        <span>Clique para anexar evidência</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleUploadEvidencia}
                    disabled={isUploading}
                  />
                </label>
              </div>

              {/* Lista de evidências */}
              <ScrollArea className="flex-1">
                <div className="space-y-2 pr-4">
                  {evidencias?.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma evidência anexada
                    </p>
                  ) : (
                    evidencias?.map((e) => (
                      <div
                        key={e.id}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium text-sm">{e.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {e.arquivo_tamanho
                                ? `${(e.arquivo_tamanho / 1024).toFixed(1)} KB`
                                : ""}
                              {" • "}
                              {new Date(e.created_at).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(e)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget({ type: "evidencia", id: e.id })}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
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
        onOpenChange={() => setDeleteTarget(null)}
        title={deleteTarget?.type === "evidencia" ? "Remover Evidência" : "Remover Comentário"}
        description={`Tem certeza que deseja remover ${
          deleteTarget?.type === "evidencia" ? "esta evidência" : "este comentário"
        }?`}
        confirmText="Remover"
        onConfirm={() => {
          if (deleteTarget?.type === "evidencia") {
            handleDeleteEvidencia(deleteTarget.id);
          } else if (deleteTarget?.type === "comentario") {
            handleDeleteComentario(deleteTarget.id);
          }
        }}
      />
    </>
  );
}
