import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, UserCheck, UserX, Key, User, Send, Clock, MoreHorizontal, Shield } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PermissionMatrix } from './PermissionMatrix';

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

interface UserAccessInfo {
  user_id: string;
  last_sign_in_at: string | null;
  created_at: string;
  has_temp_password: boolean;
  temp_password_created_at?: string;
  temp_password_expires_at?: string;
  first_access_pending: boolean;
}

interface Empresa {
  id: string;
  nome: string;
}

interface Props {
  userRole: string;
}

const GerenciamentoUsuariosEnhanced = ({ userRole }: Props) => {
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
  const [usersAccessInfo, setUsersAccessInfo] = useState<Map<string, UserAccessInfo>>(new Map());
  const [accessInfoLoading, setAccessInfoLoading] = useState(false);
  const [showPermissionMatrix, setShowPermissionMatrix] = useState(false);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<string | undefined>();

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

      // Super admin pode ver usuários de todas as empresas
      if (!isSuperAdmin) {
        // Admin e outros usuários só veem usuários da mesma empresa
        const { data: profile } = await supabase
          .from('profiles')
          .select('empresa_id')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .single();

        if (profile?.empresa_id) {
          query = query.eq('empresa_id', profile.empresa_id);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      const usuariosData = data.map((usuario: any) => ({
        id: usuario.user_id,
        user_id: usuario.user_id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        ativo: usuario.ativo,
        empresa_id: usuario.empresa_id,
        foto_url: usuario.foto_url,
        created_at: usuario.created_at,
        empresas: usuario.empresas,
      }));

      setUsuarios(usuariosData);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast.error('Erro ao carregar usuários');
    }
  };

  const fetchUsersAccessInfo = async () => {
    try {
      setAccessInfoLoading(true);
      const { data, error } = await supabase.functions.invoke('get-user-access-info');
      
      if (error) throw error;
      
      const accessMap = new Map<string, UserAccessInfo>();
      data.forEach((info: UserAccessInfo) => {
        accessMap.set(info.user_id, info);
      });
      setUsersAccessInfo(accessMap);
    } catch (error) {
      console.error('Erro ao buscar informações de acesso:', error);
    } finally {
      setAccessInfoLoading(false);
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
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchUsuarios(),
        fetchEmpresas(),
        fetchUsersAccessInfo()
      ]);
      setLoading(false);
    };

    loadData();
  }, []);

  const filteredUsuarios = usuarios.filter((usuario) => {
    const matchesSearch = usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         usuario.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEmpresa = filterEmpresa === 'all' || usuario.empresa_id === filterEmpresa;
    const matchesRole = filterRole === 'all' || usuario.role === filterRole;
    
    return matchesSearch && matchesEmpresa && matchesRole;
  });

  const handleSubmit = async (data: UsuarioForm) => {
    try {
      if (editingUsuario) {
        // Editar usuário existente
        const { error } = await supabase
          .from('profiles')
          .update({
            nome: data.nome,
            email: data.email,
            role: data.role,
            empresa_id: data.empresa_id || null,
          })
          .eq('user_id', editingUsuario.user_id);

        if (error) throw error;
        toast.success('Usuário atualizado com sucesso');
      } else {
        // Criar novo usuário
        const { error } = await supabase.functions.invoke('create-user', {
          body: {
            email: data.email,
            nome: data.nome,
            role: data.role,
            empresa_id: data.empresa_id || null,
          }
        });

        if (error) throw error;
        toast.success('Usuário criado com sucesso');
      }

      await fetchUsuarios();
      await fetchUsersAccessInfo();
      setDialogOpen(false);
      form.reset();
      setEditingUsuario(null);
    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error);
      toast.error(error.message || 'Erro ao salvar usuário');
    }
  };

  const handleEdit = (usuario: Usuario) => {
    setEditingUsuario(usuario);
    form.setValue('nome', usuario.nome);
    form.setValue('email', usuario.email);
    form.setValue('role', usuario.role as any);
    form.setValue('empresa_id', usuario.empresa_id || '');
    setDialogOpen(true);
  };

  const handleManagePermissions = (userId?: string) => {
    setSelectedUserForPermissions(userId);
    setShowPermissionMatrix(true);
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      super_admin: 'default',
      admin: 'secondary',
      user: 'outline',
      readonly: 'destructive'
    } as const;

    const labels = {
      super_admin: 'Super Admin',
      admin: 'Admin',
      user: 'Usuário',
      readonly: 'Somente Leitura'
    } as const;

    return (
      <Badge variant={variants[role as keyof typeof variants] || 'outline'}>
        {labels[role as keyof typeof labels] || role}
      </Badge>
    );
  };

  if (showPermissionMatrix) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Gerenciar Permissões</h3>
            <p className="text-sm text-muted-foreground">
              Configure permissões específicas por usuário e módulo
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowPermissionMatrix(false)}
          >
            Voltar
          </Button>
        </div>
        <PermissionMatrix selectedUserId={selectedUserForPermissions} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
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
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleManagePermissions()}>
            <Shield className="h-4 w-4 mr-2" />
            Gerenciar Permissões
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
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
                          <Input {...field} />
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
                          <Input {...field} type="email" disabled={!!editingUsuario} />
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
                        <Select onValueChange={field.onChange} value={field.value}>
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
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a empresa" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">Nenhuma empresa</SelectItem>
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
                  
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
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
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Acesso</TableHead>
              <TableHead className="text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsuarios.map((usuario) => {
              const accessInfo = usersAccessInfo.get(usuario.user_id);
              
              return (
                <TableRow key={usuario.user_id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{usuario.nome}</div>
                        <div className="text-sm text-muted-foreground">{usuario.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(usuario.role)}</TableCell>
                  <TableCell>{usuario.empresas?.nome || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={usuario.ativo ? 'default' : 'secondary'}>
                      {usuario.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {accessInfo?.last_sign_in_at ? (
                        <div>
                          <div className="text-green-600 font-medium">Último acesso</div>
                          <div className="text-muted-foreground">
                            {format(new Date(accessInfo.last_sign_in_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </div>
                        </div>
                      ) : accessInfo?.first_access_pending ? (
                        <Badge variant="outline" className="text-amber-600">
                          <Clock className="h-3 w-3 mr-1" />
                          Primeiro acesso pendente
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          Nunca acessou
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(usuario)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleManagePermissions(usuario.user_id)}>
                          <Shield className="h-4 w-4 mr-2" />
                          Gerenciar Permissões
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {filteredUsuarios.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum usuário encontrado
        </div>
      )}
    </div>
  );
};

export default GerenciamentoUsuariosEnhanced;