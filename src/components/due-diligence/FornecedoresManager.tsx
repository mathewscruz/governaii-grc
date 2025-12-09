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
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, Building, Mail, Phone, Filter, Eye, X } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import { formatDateOnly } from '@/lib/date-utils';

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
  created_at?: string;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ativo');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; fornecedor: Fornecedor | null }>({
    open: false,
    fornecedor: null
  });
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
      setDeleteDialog({ open: false, fornecedor: null });
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

  const handleDeleteClick = (fornecedor: Fornecedor) => {
    setDeleteDialog({ open: true, fornecedor });
  };

  const handleConfirmDelete = () => {
    if (deleteDialog.fornecedor) {
      deleteMutation.mutate(deleteDialog.fornecedor.id);
    }
  };

  // Filtragem com filtros reais
  const filteredFornecedores = fornecedores.filter(f => {
    // Filtro por status
    if (statusFilter !== 'all' && f.status !== statusFilter) return false;
    
    // Filtro por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        f.nome.toLowerCase().includes(term) ||
        f.email?.toLowerCase().includes(term) ||
        f.cnpj?.toLowerCase().includes(term)
      );
    }
    
    return true;
  });

  return (
    <TooltipProvider>
      <Card className="rounded-lg border overflow-hidden">
        <CardContent className="p-0">
          <div className="p-6 pb-4">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Input
                  placeholder="Buscar fornecedores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
                <Button 
                  size="sm"
                  onClick={() => setDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Fornecedor
                </Button>
              </div>
            </div>
            
            {showFilters && (
              <div className="bg-muted/50 rounded-lg p-4 mb-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Status:</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(statusFilter !== 'ativo' || searchTerm) && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setStatusFilter('ativo');
                      setSearchTerm('');
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Limpar Filtros
                  </Button>
                )}
              </div>
            )}
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <div />
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
          
          <div className="p-6 pt-0">
            {isLoading ? (
              <div className="text-center py-8">
                <p>Carregando fornecedores...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFornecedores.map((fornecedor) => (
                  <Card key={fornecedor.id} className={fornecedor.status === 'inativo' ? 'opacity-60' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <Building className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-semibold truncate">{fornecedor.nome}</h3>
                                {fornecedor.status === 'inativo' && (
                                  <Badge variant="secondary">Inativo</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                {fornecedor.email && (
                                  <span className="flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {fornecedor.email}
                                  </span>
                                )}
                                {fornecedor.telefone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {fornecedor.telefone}
                                  </span>
                                )}
                                {fornecedor.cnpj && (
                                  <span>CNPJ: {fornecedor.cnpj}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const event = new CustomEvent('navigateToDueDiligence', {
                                    detail: { 
                                      tab: 'assessments', 
                                      filter: { fornecedorId: fornecedor.id, fornecedorNome: fornecedor.nome }
                                    }
                                  });
                                  window.dispatchEvent(event);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Ver Avaliações
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ver avaliações deste fornecedor</TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                onClick={() => {
                                  const event = new CustomEvent('createAssessment', {
                                    detail: { fornecedorId: fornecedor.id, fornecedorNome: fornecedor.nome }
                                  });
                                  window.dispatchEvent(event);
                                }}
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Nova Avaliação
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Criar nova avaliação para este fornecedor</TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(fornecedor)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar fornecedor</TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteClick(fornecedor)}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Inativar fornecedor</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            {filteredFornecedores.length === 0 && !isLoading && (
              <Card>
                <CardContent className="text-center py-12">
                  <Building className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum fornecedor encontrado</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || statusFilter !== 'ativo' 
                      ? 'Tente ajustar os filtros para encontrar fornecedores'
                      : 'Comece criando seu primeiro fornecedor para realizar questionários de due diligence.'
                    }
                  </p>
                  {!searchTerm && statusFilter === 'ativo' && (
                    <Button onClick={() => setDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Primeiro Fornecedor
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, fornecedor: null })}
        title="Inativar Fornecedor"
        description={`Tem certeza que deseja inativar o fornecedor "${deleteDialog.fornecedor?.nome}"? Você poderá reativá-lo posteriormente.`}
        confirmText="Inativar"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </TooltipProvider>
  );
}
