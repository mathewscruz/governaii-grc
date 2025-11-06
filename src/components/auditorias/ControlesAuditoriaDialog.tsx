import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Shield, Trash2, Plus, ExternalLink } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import ConfirmDialog from "@/components/ConfirmDialog";

interface ControlesAuditoriaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  auditoria: any;
}

interface ControleVinculado {
  id: string;
  controle_id: string;
  tipo_relacao: string;
  observacoes: string | null;
  controles: {
    id: string;
    nome: string;
    tipo: string;
    categoria_id: string | null;
    status: string;
  };
}

export default function ControlesAuditoriaDialog({
  open,
  onOpenChange,
  auditoria
}: ControlesAuditoriaDialogProps) {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedControleId, setSelectedControleId] = useState<string>("");
  const [tipoRelacao, setTipoRelacao] = useState<string>("avaliacao");
  const [observacoes, setObservacoes] = useState<string>("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; nome?: string }>({ open: false, id: '' });

  // Buscar controles vinculados
  const { data: controlesVinculados, isLoading } = useQuery({
    queryKey: ['controles-auditoria', auditoria?.id],
    queryFn: async () => {
      if (!auditoria?.id) return [];

      const { data, error } = await supabase
        .from('controles_auditorias')
        .select(`
          id,
          controle_id,
          tipo_relacao,
          observacoes,
          controles (
            id,
            nome,
            tipo,
            categoria_id,
            status
          )
        `)
        .eq('auditoria_id', auditoria.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ControleVinculado[];
    },
    enabled: !!auditoria?.id && open,
  });

  // Buscar controles disponíveis para adicionar
  const { data: controlesDisponiveis } = useQuery({
    queryKey: ['controles-disponiveis', auditoria?.id],
    queryFn: async () => {
      if (!auditoria?.empresa_id) return [];

      const { data, error } = await supabase
        .from('controles')
        .select('id, nome, tipo, status')
        .eq('empresa_id', auditoria.empresa_id)
        .eq('status', 'ativo')
        .order('nome');

      if (error) throw error;

      // Filtrar apenas controles que ainda não estão vinculados
      const controlesVinculadosIds = controlesVinculados?.map(cv => cv.controle_id) || [];
      return data.filter(c => !controlesVinculadosIds.includes(c.id));
    },
    enabled: !!auditoria?.empresa_id && open && showAddForm,
  });

  // Mutation para adicionar vinculação
  const addVinculacao = useMutation({
    mutationFn: async () => {
      if (!selectedControleId || !auditoria?.id) return;

      const { error } = await supabase
        .from('controles_auditorias')
        .insert({
          auditoria_id: auditoria.id,
          controle_id: selectedControleId,
          tipo_relacao: tipoRelacao,
          observacoes: observacoes || null
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controles-auditoria', auditoria?.id] });
      toast.success('Controle vinculado com sucesso');
      setShowAddForm(false);
      setSelectedControleId("");
      setTipoRelacao("avaliacao");
      setObservacoes("");
    },
    onError: (error) => {
      console.error('Erro ao vincular controle:', error);
      toast.error('Erro ao vincular controle');
    }
  });

  // Mutation para remover vinculação
  const removeVinculacao = useMutation({
    mutationFn: async (vinculacaoId: string) => {
      const { error } = await supabase
        .from('controles_auditorias')
        .delete()
        .eq('id', vinculacaoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controles-auditoria', auditoria?.id] });
      toast.success('Controle desvinculado com sucesso');
      setDeleteConfirm({ open: false, id: '' });
    },
    onError: (error) => {
      console.error('Erro ao desvincular controle:', error);
      toast.error('Erro ao desvincular controle');
      setDeleteConfirm({ open: false, id: '' });
    }
  });

  const handleRemove = (vinculacaoId: string, nome?: string) => {
    setDeleteConfirm({ open: true, id: vinculacaoId, nome });
  };

  const confirmDelete = () => {
    removeVinculacao.mutate(deleteConfirm.id);
  };

  const handleAdd = () => {
    if (!selectedControleId) {
      toast.error('Selecione um controle');
      return;
    }
    addVinculacao.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Controles Vinculados
          </DialogTitle>
          <DialogDescription>
            Gerencie os controles associados à auditoria: {auditoria?.nome}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Botão para adicionar */}
          {!showAddForm && (
            <Button onClick={() => setShowAddForm(true)} className="w-full" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Controle
            </Button>
          )}

          {/* Formulário de adição */}
          {showAddForm && (
            <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Adicionar Novo Controle</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setShowAddForm(false);
                    setSelectedControleId("");
                    setTipoRelacao("avaliacao");
                    setObservacoes("");
                  }}
                >
                  Cancelar
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <Label>Controle *</Label>
                  <Select value={selectedControleId} onValueChange={setSelectedControleId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um controle" />
                    </SelectTrigger>
                    <SelectContent>
                      {controlesDisponiveis?.map((controle) => (
                        <SelectItem key={controle.id} value={controle.id}>
                          {controle.nome} ({controle.tipo})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Tipo de Relação *</Label>
                  <Select value={tipoRelacao} onValueChange={setTipoRelacao}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="avaliacao">Avaliação</SelectItem>
                      <SelectItem value="teste">Teste</SelectItem>
                      <SelectItem value="validacao">Validação</SelectItem>
                      <SelectItem value="monitoramento">Monitoramento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Observações</Label>
                  <Textarea
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Observações sobre a vinculação..."
                    rows={3}
                  />
                </div>

                <Button 
                  onClick={handleAdd} 
                  disabled={addVinculacao.isPending || !selectedControleId}
                  className="w-full"
                >
                  {addVinculacao.isPending ? 'Adicionando...' : 'Adicionar'}
                </Button>
              </div>
            </div>
          )}

          {/* Lista de controles vinculados */}
          <div className="border rounded-lg">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                Carregando controles vinculados...
              </div>
            ) : !controlesVinculados || controlesVinculados.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Nenhum controle vinculado a esta auditoria
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Controle</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Relação</TableHead>
                    <TableHead>Observações</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {controlesVinculados.map((vinculacao) => (
                    <TableRow key={vinculacao.id}>
                      <TableCell className="font-medium">
                        {vinculacao.controles.nome}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {vinculacao.controles.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={vinculacao.controles.status === 'ativo' ? 'default' : 'secondary'}
                        >
                          {vinculacao.controles.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {vinculacao.tipo_relacao}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                        {vinculacao.observacoes || '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(vinculacao.id, vinculacao.controles.nome)}
                          disabled={removeVinculacao.isPending}
                          title="Desvincular controle"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Resumo */}
          {controlesVinculados && controlesVinculados.length > 0 && (
            <div className="text-sm text-muted-foreground text-center">
              Total: {controlesVinculados.length} controle(s) vinculado(s)
            </div>
          )}
        </div>

        <ConfirmDialog
          open={deleteConfirm.open}
          onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, open }))}
          title="Desvincular Controle"
          description={`Tem certeza que deseja desvincular "${deleteConfirm.nome}"? Esta ação não pode ser desfeita.`}
          confirmText="Desvincular"
          cancelText="Cancelar"
          variant="destructive"
          onConfirm={confirmDelete}
          loading={removeVinculacao.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
