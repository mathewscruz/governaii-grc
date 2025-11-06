import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ConfirmDialog from "@/components/ConfirmDialog";

interface RecomendacoesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  auditoria?: any;
}

const RecomendacoesDialog = ({ open, onOpenChange, auditoria }: RecomendacoesDialogProps) => {
  const [showForm, setShowForm] = useState(false);
  const [editingRecomendacao, setEditingRecomendacao] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string }>({ open: false, id: '' });
  const [formData, setFormData] = useState({
    achado_id: '',
    descricao: '',
    prioridade: 'media',
    responsavel: '',
    prazo_implementacao: null as Date | null,
    status: 'pendente',
    data_implementacao: null as Date | null,
    evidencia_implementacao: '',
    observacoes: ''
  });

  const { data: achados } = useQuery({
    queryKey: ['auditoria-achados-select', auditoria?.id],
    queryFn: async () => {
      if (!auditoria?.id) return [];
      
      const { data, error } = await supabase
        .from('auditoria_achados')
        .select('id, titulo')
        .eq('auditoria_id', auditoria.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!auditoria?.id
  });

  const { data: recomendacoes, refetch } = useQuery({
    queryKey: ['auditoria-recomendacoes', auditoria?.id],
    queryFn: async () => {
      if (!auditoria?.id) return [];
      
      const { data, error } = await supabase
        .from('auditoria_recomendacoes')
        .select(`
          *,
          achado:auditoria_achados(titulo)
        `)
        .in('achado_id', 
          await supabase
            .from('auditoria_achados')
            .select('id')
            .eq('auditoria_id', auditoria.id)
            .then(({ data }) => data?.map(a => a.id) || [])
        )
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!auditoria?.id
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const recomendacaoData = {
      ...formData,
      prazo_implementacao: formData.prazo_implementacao?.toISOString().split('T')[0] || null,
      data_implementacao: formData.data_implementacao?.toISOString().split('T')[0] || null,
    };

    try {
      if (editingRecomendacao) {
        const { error } = await supabase
          .from('auditoria_recomendacoes')
          .update(recomendacaoData)
          .eq('id', editingRecomendacao.id);

        if (error) throw error;
        toast.success('Recomendação atualizada com sucesso');
      } else {
        const { error } = await supabase
          .from('auditoria_recomendacoes')
          .insert(recomendacaoData);

        if (error) throw error;
        toast.success('Recomendação criada com sucesso');
      }

      setShowForm(false);
      setEditingRecomendacao(null);
      setFormData({
        achado_id: '',
        descricao: '',
        prioridade: 'media',
        responsavel: '',
        prazo_implementacao: null,
        status: 'pendente',
        data_implementacao: null,
        evidencia_implementacao: '',
        observacoes: ''
      });
      refetch();
    } catch (error) {
      toast.error('Erro ao salvar recomendação');
    }
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm({ open: true, id });
  };

  const confirmDelete = async () => {
    const { id } = deleteConfirm;

    try {
      const { error } = await supabase
        .from('auditoria_recomendacoes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Recomendação excluída com sucesso');
      setDeleteConfirm({ open: false, id: '' });
      refetch();
    } catch (error) {
      toast.error('Erro ao excluir recomendação');
      setDeleteConfirm({ open: false, id: '' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Recomendações - {auditoria?.nome}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Recomendação
          </Button>

          {showForm && (
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="achado_id">Achado *</Label>
                      <Select
                        value={formData.achado_id}
                        onValueChange={(value) => setFormData({ ...formData, achado_id: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o achado" />
                        </SelectTrigger>
                        <SelectContent>
                          {achados?.map((achado) => (
                            <SelectItem key={achado.id} value={achado.id}>
                              {achado.titulo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="prioridade">Prioridade</Label>
                      <Select
                        value={formData.prioridade}
                        onValueChange={(value) => setFormData({ ...formData, prioridade: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="baixa">Baixa</SelectItem>
                          <SelectItem value="media">Média</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="em_andamento">Em Andamento</SelectItem>
                          <SelectItem value="implementada">Implementada</SelectItem>
                          <SelectItem value="nao_aplicavel">Não Aplicável</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="responsavel">Responsável</Label>
                      <Input
                        id="responsavel"
                        value={formData.responsavel}
                        onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Prazo de Implementação</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.prazo_implementacao ? format(formData.prazo_implementacao, "PPP", { locale: ptBR }) : "Selecione a data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.prazo_implementacao || undefined}
                            onSelect={(date) => setFormData({ ...formData, prazo_implementacao: date || null })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>Data de Implementação</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.data_implementacao ? format(formData.data_implementacao, "PPP", { locale: ptBR }) : "Selecione a data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.data_implementacao || undefined}
                            onSelect={(date) => setFormData({ ...formData, data_implementacao: date || null })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição *</Label>
                    <Textarea
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      required
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingRecomendacao ? 'Atualizar' : 'Criar'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {recomendacoes?.map((recomendacao) => (
              <Card key={recomendacao.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">Recomendação</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Achado: {recomendacao.achado?.titulo}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(recomendacao.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-3">{recomendacao.descricao}</p>
                  <div className="flex gap-2 mb-3">
                    <Badge>{recomendacao.prioridade}</Badge>
                    <Badge variant="outline">{recomendacao.status}</Badge>
                  </div>
                  {recomendacao.responsavel && (
                    <p className="text-sm text-muted-foreground">
                      <strong>Responsável:</strong> {recomendacao.responsavel}
                    </p>
                  )}
                  {recomendacao.prazo_implementacao && (
                    <p className="text-sm text-muted-foreground">
                      <strong>Prazo:</strong> {new Date(recomendacao.prazo_implementacao).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <ConfirmDialog
          open={deleteConfirm.open}
          onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, open }))}
          title="Excluir Recomendação"
          description="Tem certeza que deseja excluir esta recomendação? Esta ação não pode ser desfeita."
          confirmText="Excluir"
          cancelText="Cancelar"
          variant="destructive"
          onConfirm={confirmDelete}
        />
      </DialogContent>
    </Dialog>
  );
};

export default RecomendacoesDialog;