import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, Building, Mail, Phone } from 'lucide-react';

interface Fornecedor {
  id: string;
  nome: string;
  email?: string;
  cnpj?: string;
  telefone?: string;
  endereco?: string;
  contato_responsavel?: string;
  observacoes?: string;
  status: string;
  categoria?: string;
  tipo: string;
}

interface FornecedorFormData {
  nome: string;
  email: string;
  cnpj: string;
  telefone: string;
  endereco: string;
  contato_responsavel: string;
  observacoes: string;
}

export function FornecedoresManager() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null);
  const [formData, setFormData] = useState<FornecedorFormData>({
    nome: '',
    email: '',
    cnpj: '',
    telefone: '',
    endereco: '',
    contato_responsavel: '',
    observacoes: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: fornecedores = [], isLoading } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .order('nome');

      if (error) throw error;
      return data;
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const createMutation = useMutation({
    mutationFn: async (data: FornecedorFormData) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('user_id', userData.user?.id)
        .single();

      const { error } = await supabase
        .from('fornecedores')
        .insert({
          ...data,
          empresa_id: profile?.empresa_id,
          status: 'ativo',
          tipo: 'fornecedor'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      setDialogOpen(false);
      resetForm();
      toast({
        title: "Sucesso",
        description: "Fornecedor criado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao criar fornecedor: " + error.message,
        variant: "destructive",
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FornecedorFormData }) => {
      const { error } = await supabase
        .from('fornecedores')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      setDialogOpen(false);
      resetForm();
      setEditingFornecedor(null);
      toast({
        title: "Sucesso",
        description: "Fornecedor atualizado com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar fornecedor: " + error.message,
        variant: "destructive",
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('fornecedores')
        .update({ status: 'inativo' })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      toast({
        title: "Sucesso",
        description: "Fornecedor removido com sucesso!",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao remover fornecedor: " + error.message,
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      cnpj: '',
      telefone: '',
      endereco: '',
      contato_responsavel: '',
      observacoes: ''
    });
  };

  const handleEdit = (fornecedor: Fornecedor) => {
    setEditingFornecedor(fornecedor);
    setFormData({
      nome: fornecedor.nome,
      email: fornecedor.email || '',
      cnpj: fornecedor.cnpj || '',
      telefone: fornecedor.telefone || '',
      endereco: fornecedor.endereco || '',
      contato_responsavel: fornecedor.contato_responsavel || '',
      observacoes: fornecedor.observacoes || ''
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (editingFornecedor) {
      updateMutation.mutate({ id: editingFornecedor.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingFornecedor(null);
      resetForm();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Fornecedores</h2>
          <p className="text-muted-foreground">
            Gerencie os fornecedores para questionários de due diligence
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingFornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  />
                </div>
                
                <div className="col-span-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="contato_responsavel">Contato Responsável</Label>
                  <Input
                    id="contato_responsavel"
                    value={formData.contato_responsavel}
                    onChange={(e) => setFormData({ ...formData, contato_responsavel: e.target.value })}
                  />
                </div>
                
                <div className="col-span-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingFornecedor ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <p>Carregando fornecedores...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fornecedores.filter(f => f.status === 'ativo').map((fornecedor) => (
            <Card key={fornecedor.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  {fornecedor.nome}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {fornecedor.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    {fornecedor.email}
                  </div>
                )}
                
                {fornecedor.telefone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    {fornecedor.telefone}
                  </div>
                )}
                
                {fornecedor.cnpj && (
                  <div className="text-sm text-muted-foreground">
                    CNPJ: {fornecedor.cnpj}
                  </div>
                )}
                
                <div className="flex justify-end space-x-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(fornecedor)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteMutation.mutate(fornecedor.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {fornecedores.filter(f => f.status === 'ativo').length === 0 && !isLoading && (
        <Card>
          <CardContent className="text-center py-12">
            <Building className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum fornecedor cadastrado</h3>
            <p className="text-muted-foreground mb-4">
              Comece criando seu primeiro fornecedor para realizar questionários de due diligence.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Fornecedor
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}