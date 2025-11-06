import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ConfirmDialog from "@/components/ConfirmDialog";

interface AchadosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  auditoria?: any;
}

const AchadosDialog = ({ open, onOpenChange, auditoria }: AchadosDialogProps) => {
  const [showForm, setShowForm] = useState(false);
  const [editingAchado, setEditingAchado] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; titulo?: string }>({ open: false, id: '' });
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    tipo: '',
    criticidade: 'media',
    area_afetada: '',
    impacto: '',
    causa_raiz: '',
    status: 'aberto',
    trabalho_id: ''
  });

  const { data: achados, refetch } = useQuery({
    queryKey: ['auditoria-achados', auditoria?.id],
    queryFn: async () => {
      if (!auditoria?.id) return [];
      
      const { data, error } = await supabase
        .from('auditoria_achados')
        .select('*')
        .eq('auditoria_id', auditoria.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!auditoria?.id
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const achadoData = {
      ...formData,
      auditoria_id: auditoria.id,
      trabalho_id: formData.trabalho_id || null,
    };

    try {
      if (editingAchado) {
        const { error } = await supabase
          .from('auditoria_achados')
          .update(achadoData)
          .eq('id', editingAchado.id);

        if (error) throw error;
        toast.success('Achado atualizado com sucesso');
      } else {
        const { error } = await supabase
          .from('auditoria_achados')
          .insert(achadoData);

        if (error) throw error;
        toast.success('Achado criado com sucesso');
      }

      setShowForm(false);
      setEditingAchado(null);
      setFormData({
        titulo: '',
        descricao: '',
        tipo: '',
        criticidade: 'media',
        area_afetada: '',
        impacto: '',
        causa_raiz: '',
        status: 'aberto',
        trabalho_id: ''
      });
      refetch();
    } catch (error) {
      toast.error('Erro ao salvar achado');
    }
  };

  const handleDelete = (id: string, titulo?: string) => {
    setDeleteConfirm({ open: true, id, titulo });
  };

  const confirmDelete = async () => {
    const { id } = deleteConfirm;

    try {
      const { error } = await supabase
        .from('auditoria_achados')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Achado excluído com sucesso');
      setDeleteConfirm({ open: false, id: '' });
      refetch();
    } catch (error) {
      toast.error('Erro ao excluir achado');
      setDeleteConfirm({ open: false, id: '' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Achados de Auditoria - {auditoria?.nome}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Achado
          </Button>

          {showForm && (
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="titulo">Título *</Label>
                      <Input
                        id="titulo"
                        value={formData.titulo}
                        onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tipo">Tipo *</Label>
                      <Select
                        value={formData.tipo}
                        onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="deficiencia">Deficiência</SelectItem>
                          <SelectItem value="oportunidade_melhoria">Oportunidade de Melhoria</SelectItem>
                          <SelectItem value="observacao">Observação</SelectItem>
                          <SelectItem value="nao_conformidade">Não Conformidade</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="criticidade">Criticidade</Label>
                      <Select
                        value={formData.criticidade}
                        onValueChange={(value) => setFormData({ ...formData, criticidade: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="baixa">Baixa</SelectItem>
                          <SelectItem value="media">Média</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                          <SelectItem value="critica">Crítica</SelectItem>
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
                          <SelectItem value="aberto">Aberto</SelectItem>
                          <SelectItem value="em_tratamento">Em Tratamento</SelectItem>
                          <SelectItem value="resolvido">Resolvido</SelectItem>
                          <SelectItem value="aceito_risco">Risco Aceito</SelectItem>
                        </SelectContent>
                      </Select>
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
                      {editingAchado ? 'Atualizar' : 'Criar'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {achados?.map((achado) => (
              <Card key={achado.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{achado.titulo}</CardTitle>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(achado.id, achado.titulo)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{achado.descricao}</p>
                  <div className="flex gap-2">
                    <Badge>{achado.tipo}</Badge>
                    <Badge variant={achado.criticidade === 'critica' ? 'destructive' : 'secondary'}>
                      {achado.criticidade}
                    </Badge>
                    <Badge variant="outline">{achado.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <ConfirmDialog
          open={deleteConfirm.open}
          onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, open }))}
          title="Excluir Achado"
          description={`Tem certeza que deseja excluir "${deleteConfirm.titulo}"? Esta ação não pode ser desfeita.`}
          confirmText="Excluir"
          cancelText="Cancelar"
          variant="destructive"
          onConfirm={confirmDelete}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AchadosDialog;