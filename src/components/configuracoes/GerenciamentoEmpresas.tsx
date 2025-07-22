import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, Building2, Upload } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';

const empresaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cnpj: z.string().optional(),
  contato: z.string().optional(),
});

type EmpresaForm = z.infer<typeof empresaSchema>;

interface Empresa {
  id: string;
  nome: string;
  cnpj?: string;
  contato?: string;
  logo_url?: string;
  ativo: boolean;
  created_at: string;
}

const GerenciamentoEmpresas = () => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [empresaToDelete, setEmpresaToDelete] = useState<Empresa | null>(null);

  const form = useForm<EmpresaForm>({
    resolver: zodResolver(empresaSchema),
    defaultValues: {
      nome: '',
      cnpj: '',
      contato: '',
    },
  });

  const fetchEmpresas = async () => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .order('nome');

      if (error) throw error;
      setEmpresas(data || []);
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
      toast.error('Erro ao carregar empresas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmpresas();
  }, []);

  const filteredEmpresas = empresas.filter(empresa =>
    empresa.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (data: EmpresaForm) => {
    try {
      if (editingEmpresa) {
        const { error } = await supabase
          .from('empresas')
          .update(data)
          .eq('id', editingEmpresa.id);

        if (error) throw error;
        toast.success('Empresa atualizada com sucesso');
      } else {
        const { error } = await supabase
          .from('empresas')
          .insert([{ ...data, nome: data.nome }]);

        if (error) throw error;
        toast.success('Empresa criada com sucesso');
      }

      setDialogOpen(false);
      setEditingEmpresa(null);
      form.reset();
      fetchEmpresas();
    } catch (error) {
      console.error('Erro ao salvar empresa:', error);
      toast.error('Erro ao salvar empresa');
    }
  };

  const handleEdit = (empresa: Empresa) => {
    setEditingEmpresa(empresa);
    form.reset({
      nome: empresa.nome,
      cnpj: empresa.cnpj || '',
      contato: empresa.contato || '',
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (empresa: Empresa) => {
    setEmpresaToDelete(empresa);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!empresaToDelete) return;
    
    try {
      const { error } = await supabase
        .from('empresas')
        .delete()
        .eq('id', empresaToDelete.id);

      if (error) throw error;
      toast.success('Empresa excluída com sucesso');
      fetchEmpresas();
      setDeleteDialogOpen(false);
      setEmpresaToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir empresa:', error);
      toast.error('Erro ao excluir empresa');
    }
  };

  const handleLogoUpload = async (empresaId: string, file: File) => {
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${empresaId}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('empresa-logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('empresa-logos')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('empresas')
        .update({ logo_url: urlData.publicUrl })
        .eq('id', empresaId);

      if (updateError) throw updateError;

      toast.success('Logo atualizado com sucesso');
      fetchEmpresas();
    } catch (error) {
      console.error('Erro ao fazer upload do logo:', error);
      toast.error('Erro ao fazer upload do logo');
    } finally {
      setUploading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingEmpresa(null);
    form.reset();
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar empresas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nova Empresa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingEmpresa ? 'Editar Empresa' : 'Nova Empresa'}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Empresa</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da empresa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ</FormLabel>
                      <FormControl>
                        <Input placeholder="00.000.000/0000-00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contato"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contato</FormLabel>
                      <FormControl>
                        <Input placeholder="Email ou telefone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingEmpresa ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Logo</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmpresas.map((empresa) => (
              <TableRow key={empresa.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {empresa.logo_url ? (
                      <img
                        src={empresa.logo_url}
                        alt={empresa.nome}
                        className="h-8 w-8 object-contain rounded"
                      />
                    ) : (
                      <div className="h-8 w-8 bg-muted rounded flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleLogoUpload(empresa.id, file);
                        }}
                        disabled={uploading}
                      />
                      <Upload className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </label>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{empresa.nome}</TableCell>
                <TableCell>{empresa.cnpj || '-'}</TableCell>
                <TableCell>{empresa.contato || '-'}</TableCell>
                <TableCell>
                  <Badge variant={empresa.ativo ? 'default' : 'secondary'}>
                    {empresa.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(empresa)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteDialog(empresa)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredEmpresas.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm ? 'Nenhuma empresa encontrada' : 'Nenhuma empresa cadastrada'}
        </div>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir Empresa"
        description={`Tem certeza que deseja excluir a empresa "${empresaToDelete?.nome}"? Esta ação não pode ser desfeita.`}
        onConfirm={handleDelete}
        variant="destructive"
        confirmText="Excluir"
      />
    </div>
  );
};

export default GerenciamentoEmpresas;