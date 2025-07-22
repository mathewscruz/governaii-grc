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

interface TrabalhosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  auditoria?: any;
}

const TrabalhosDialog = ({ open, onOpenChange, auditoria }: TrabalhosDialogProps) => {
  const [showForm, setShowForm] = useState(false);
  const [editingTrabalho, setEditingTrabalho] = useState<any>(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    tipo: '',
    status: 'nao_iniciado',
    responsavel: '',
    data_inicio: null as Date | null,
    data_conclusao: null as Date | null,
    conclusoes: '',
    observacoes: ''
  });

  const { data: trabalhos, refetch } = useQuery({
    queryKey: ['auditoria-trabalhos', auditoria?.id],
    queryFn: async () => {
      if (!auditoria?.id) return [];
      
      const { data, error } = await supabase
        .from('auditoria_trabalhos')
        .select('*')
        .eq('auditoria_id', auditoria.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!auditoria?.id
  });

  const { data: usuarios } = useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, nome')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      return data || [];
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trabalhoData = {
      ...formData,
      auditoria_id: auditoria.id,
      data_inicio: formData.data_inicio?.toISOString().split('T')[0] || null,
      data_conclusao: formData.data_conclusao?.toISOString().split('T')[0] || null,
      responsavel: formData.responsavel || null,
    };

    try {
      if (editingTrabalho) {
        const { error } = await supabase
          .from('auditoria_trabalhos')
          .update(trabalhoData)
          .eq('id', editingTrabalho.id);

        if (error) throw error;
        toast.success('Trabalho atualizado com sucesso');
      } else {
        const { error } = await supabase
          .from('auditoria_trabalhos')
          .insert(trabalhoData);

        if (error) throw error;
        toast.success('Trabalho criado com sucesso');
      }

      setShowForm(false);
      setEditingTrabalho(null);
      setFormData({
        nome: '',
        descricao: '',
        tipo: '',
        status: 'nao_iniciado',
        responsavel: '',
        data_inicio: null,
        data_conclusao: null,
        conclusoes: '',
        observacoes: ''
      });
      refetch();
    } catch (error) {
      toast.error('Erro ao salvar trabalho');
    }
  };

  const handleEdit = (trabalho: any) => {
    setEditingTrabalho(trabalho);
    setFormData({
      nome: trabalho.nome || '',
      descricao: trabalho.descricao || '',
      tipo: trabalho.tipo || '',
      status: trabalho.status || 'nao_iniciado',
      responsavel: trabalho.responsavel || '',
      data_inicio: trabalho.data_inicio ? new Date(trabalho.data_inicio) : null,
      data_conclusao: trabalho.data_conclusao ? new Date(trabalho.data_conclusao) : null,
      conclusoes: trabalho.conclusoes || '',
      observacoes: trabalho.observacoes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este trabalho?')) return;

    try {
      const { error } = await supabase
        .from('auditoria_trabalhos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Trabalho excluído com sucesso');
      refetch();
    } catch (error) {
      toast.error('Erro ao excluir trabalho');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      nao_iniciado: { label: "Não Iniciado", variant: "secondary" as const },
      em_andamento: { label: "Em Andamento", variant: "default" as const },
      concluido: { label: "Concluído", variant: "outline" as const },
      revisao: { label: "Em Revisão", variant: "destructive" as const },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: "secondary" as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Trabalhos de Auditoria - {auditoria?.nome}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Lista de Trabalhos</h3>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Trabalho
            </Button>
          </div>

          {showForm && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingTrabalho ? 'Editar Trabalho' : 'Novo Trabalho'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome do Trabalho *</Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
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
                          <SelectItem value="checklist">Checklist</SelectItem>
                          <SelectItem value="teste">Teste</SelectItem>
                          <SelectItem value="entrevista">Entrevista</SelectItem>
                          <SelectItem value="analise">Análise</SelectItem>
                          <SelectItem value="observacao">Observação</SelectItem>
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
                          <SelectItem value="nao_iniciado">Não Iniciado</SelectItem>
                          <SelectItem value="em_andamento">Em Andamento</SelectItem>
                          <SelectItem value="concluido">Concluído</SelectItem>
                          <SelectItem value="revisao">Em Revisão</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="responsavel">Responsável</Label>
                      <Select
                        value={formData.responsavel}
                        onValueChange={(value) => setFormData({ ...formData, responsavel: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o responsável" />
                        </SelectTrigger>
                        <SelectContent>
                          {usuarios?.map((usuario) => (
                            <SelectItem key={usuario.user_id} value={usuario.user_id}>
                              {usuario.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Data de Início</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.data_inicio ? format(formData.data_inicio, "PPP", { locale: ptBR }) : "Selecione a data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.data_inicio || undefined}
                            onSelect={(date) => setFormData({ ...formData, data_inicio: date || null })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>Data de Conclusão</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.data_conclusao ? format(formData.data_conclusao, "PPP", { locale: ptBR }) : "Selecione a data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.data_conclusao || undefined}
                            onSelect={(date) => setFormData({ ...formData, data_conclusao: date || null })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="conclusoes">Conclusões</Label>
                    <Textarea
                      id="conclusoes"
                      value={formData.conclusoes}
                      onChange={(e) => setFormData({ ...formData, conclusoes: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={formData.observacoes}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowForm(false);
                        setEditingTrabalho(null);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingTrabalho ? 'Atualizar' : 'Criar'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {trabalhos?.map((trabalho) => (
              <Card key={trabalho.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{trabalho.nome}</CardTitle>
                      <div className="flex gap-2 mt-2">
                        {getStatusBadge(trabalho.status)}
                        <Badge variant="outline">{trabalho.tipo}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(trabalho)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(trabalho.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {trabalho.descricao && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Descrição:</strong> {trabalho.descricao}
                      </p>
                    )}
                    {trabalho.responsavel && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Responsável:</strong> {trabalho.responsavel}
                      </p>
                    )}
                    {trabalho.data_inicio && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Data de Início:</strong> {new Date(trabalho.data_inicio).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                    {trabalho.data_conclusao && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Data de Conclusão:</strong> {new Date(trabalho.data_conclusao).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                    {trabalho.conclusoes && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Conclusões:</strong> {trabalho.conclusoes}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {trabalhos?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum trabalho cadastrado para esta auditoria.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TrabalhosDialog;