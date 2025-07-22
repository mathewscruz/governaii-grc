import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, UserCheck, UserX, Key, User } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';

const usuarioSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  role: z.enum(['super_admin', 'admin', 'user', 'readonly']),
  empresa_id: z.string().optional(),
});

type UsuarioForm = z.infer<typeof usuarioSchema>;

interface Usuario {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
  empresa_id?: string;
  foto_url?: string;
  created_at: string;
  empresas?: {
    nome: string;
  };
}

interface Empresa {
  id: string;
  nome: string;
}

interface Props {
  userRole: string;
}

const GerenciamentoUsuarios = ({ userRole }: Props) => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmpresa, setFilterEmpresa] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [usuarioToDelete, setUsuarioToDelete] = useState<Usuario | null>(null);

  const form = useForm<UsuarioForm>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      nome: '',
      email: '',
      role: 'user',
      empresa_id: '',
    },
  });

  const isSuperAdmin = userRole === 'super_admin';

  const fetchUsuarios = async () => {
    try {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          empresas (
            nome
          )
        `)
        .order('nome');

      // Se não for super admin, filtrar apenas usuários da mesma empresa
      if (!isSuperAdmin) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('empresa_id')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .single();

        if (userProfile?.empresa_id) {
          query = query.eq('empresa_id', userProfile.empresa_id);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmpresas = async () => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setEmpresas(data || []);
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
    }
  };

  useEffect(() => {
    fetchUsuarios();
    if (isSuperAdmin) {
      fetchEmpresas();
    }
  }, [isSuperAdmin]);

  const filteredUsuarios = usuarios.filter(usuario => {
    const matchesSearch = usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         usuario.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEmpresa = filterEmpresa === 'all' || usuario.empresa_id === filterEmpresa;
    const matchesRole = filterRole === 'all' || usuario.role === filterRole;
    
    return matchesSearch && matchesEmpresa && matchesRole;
  });

  const handleSubmit = async (data: UsuarioForm) => {
    try {
      if (editingUsuario) {
        const { error } = await supabase
          .from('profiles')
          .update({
            nome: data.nome,
            email: data.email,
            role: data.role,
            empresa_id: data.empresa_id || null,
          })
          .eq('id', editingUsuario.id);

        if (error) throw error;
        toast.success('Usuário atualizado com sucesso');
      } else {
        // Para criar usuário, seria necessário usar uma função do servidor
        // Por agora, vamos apenas mostrar uma mensagem
        toast.info('Funcionalidade de criação de usuário será implementada');
      }

      setDialogOpen(false);
      setEditingUsuario(null);
      form.reset();
      fetchUsuarios();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      toast.error('Erro ao salvar usuário');
    }
  };

  const handleEdit = (usuario: Usuario) => {
    setEditingUsuario(usuario);
    form.reset({
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role as any,
      empresa_id: usuario.empresa_id || '',
    });
    setDialogOpen(true);
  };

  const toggleUserStatus = async (usuario: Usuario) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ ativo: !usuario.ativo })
        .eq('id', usuario.id);

      if (error) throw error;
      toast.success(`Usuário ${!usuario.ativo ? 'ativado' : 'desativado'} com sucesso`);
      fetchUsuarios();
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
      toast.error('Erro ao alterar status do usuário');
    }
  };

  const openDeleteDialog = (usuario: Usuario) => {
    setUsuarioToDelete(usuario);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!usuarioToDelete) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', usuarioToDelete.id);

      if (error) throw error;
      toast.success('Usuário excluído com sucesso');
      fetchUsuarios();
      setDeleteDialogOpen(false);
      setUsuarioToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast.error('Erro ao excluir usuário');
    }
  };

  const resetPassword = async (usuario: Usuario) => {
    try {
      // Esta funcionalidade requer implementação no servidor
      toast.info('Funcionalidade de reset de senha será implementada');
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      toast.error('Erro ao resetar senha');
    }
  };

  const openCreateDialog = () => {
    setEditingUsuario(null);
    form.reset();
    setDialogOpen(true);
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      super_admin: 'destructive',
      admin: 'default',
      user: 'secondary',
      readonly: 'outline',
    } as const;

    const labels = {
      super_admin: 'Super Admin',
      admin: 'Administrador',
      user: 'Usuário',
      readonly: 'Somente Leitura',
    } as const;

    return (
      <Badge variant={variants[role as keyof typeof variants] || 'secondary'}>
        {labels[role as keyof typeof labels] || role}
      </Badge>
    );
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
      <div className="flex flex-col lg:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          
          {isSuperAdmin && (
            <Select value={filterEmpresa} onValueChange={setFilterEmpresa}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as empresas</SelectItem>
                {empresas.map((empresa) => (
                  <SelectItem key={empresa.id} value={empresa.id}>
                    {empresa.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrar por perfil" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os perfis</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
              <SelectItem value="user">Usuário</SelectItem>
              <SelectItem value="readonly">Somente Leitura</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingUsuario ? 'Editar Usuário' : 'Novo Usuário'}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="email@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Perfil</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o perfil" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isSuperAdmin && (
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                          )}
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="user">Usuário</SelectItem>
                          <SelectItem value="readonly">Somente Leitura</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {isSuperAdmin && (
                  <FormField
                    control={form.control}
                    name="empresa_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Empresa</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a empresa" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {empresas.map((empresa) => (
                              <SelectItem key={empresa.id} value={empresa.id}>
                                {empresa.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingUsuario ? 'Atualizar' : 'Criar'}
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
              <TableHead>Usuário</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Perfil</TableHead>
              {isSuperAdmin && <TableHead>Empresa</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsuarios.map((usuario) => (
              <TableRow key={usuario.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {usuario.foto_url ? (
                      <img
                        src={usuario.foto_url}
                        alt={usuario.nome}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <span className="font-medium">{usuario.nome}</span>
                  </div>
                </TableCell>
                <TableCell>{usuario.email}</TableCell>
                <TableCell>{getRoleBadge(usuario.role)}</TableCell>
                {isSuperAdmin && (
                  <TableCell>
                    {usuario.empresas?.nome || '-'}
                  </TableCell>
                )}
                <TableCell>
                  <Badge variant={usuario.ativo ? 'default' : 'secondary'}>
                    {usuario.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(usuario)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleUserStatus(usuario)}
                    >
                      {usuario.ativo ? (
                        <UserX className="h-4 w-4" />
                      ) : (
                        <UserCheck className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => resetPassword(usuario)}
                    >
                      <Key className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteDialog(usuario)}
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

      {filteredUsuarios.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm || filterEmpresa !== 'all' || filterRole !== 'all' 
            ? 'Nenhum usuário encontrado com os filtros aplicados' 
            : 'Nenhum usuário cadastrado'}
        </div>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir Usuário"
        description={`Tem certeza que deseja excluir o usuário "${usuarioToDelete?.nome}"? Esta ação não pode ser desfeita.`}
        onConfirm={handleDelete}
        variant="destructive"
        confirmText="Excluir"
      />
    </div>
  );
};

export default GerenciamentoUsuarios;