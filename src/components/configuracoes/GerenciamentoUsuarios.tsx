
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
import { Plus, Search, Edit, Trash2, UserCheck, UserX, Key, User, Send, Clock } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  const [usersAccessInfo, setUsersAccessInfo] = useState<Map<string, UserAccessInfo>>(new Map());
  const [accessInfoLoading, setAccessInfoLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});

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
      
      // Buscar informações de acesso dos usuários
      if (data && data.length > 0) {
        fetchUsersAccessInfo(data.map(u => u.user_id));
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersAccessInfo = async (userIds: string[]) => {
    try {
      setAccessInfoLoading(true);
      
      const { data, error } = await supabase.functions.invoke('get-user-access-info', {
        body: { user_ids: userIds }
      });

      if (error) {
        throw error;
      }

      // Criar um Map para fácil acesso por user_id
      const accessInfoMap = new Map<string, UserAccessInfo>();
      
      if (data.users && Array.isArray(data.users)) {
        data.users.forEach((user: UserAccessInfo) => {
          accessInfoMap.set(user.user_id, user);
        });
      }
      
      setUsersAccessInfo(accessInfoMap);
    } catch (error) {
      console.error('Erro ao buscar informações de acesso:', error);
      toast.error('Erro ao carregar informações de acesso dos usuários');
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
      setSubmitting(true);
      
      if (!editingUsuario) {
        // Criar novo usuário usando Edge Function
        const { data: result, error } = await supabase.functions.invoke('create-user', {
          body: {
            nome: data.nome,
            email: data.email,
            role: data.role,
            empresa_id: data.empresa_id || null,
          }
        });

        if (error) {
          console.error('Erro ao criar usuário:', error);
          throw new Error(error.message || 'Erro ao criar usuário');
        }

        // Usar a mensagem retornada pela API
        const message = result?.message || 'Usuário criado com sucesso!';
        const emailSent = result?.emailSent || false;
        
        if (emailSent) {
          toast.success(message);
        } else {
          toast.warning(message + ' Você pode reenviar o e-mail de acesso manualmente.');
        }
      } else {
        // Para edição de usuário (mantém a lógica existente)
        const { error } = await supabase
          .from('profiles')
          .update({
            nome: data.nome,
            role: data.role,
            empresa_id: data.empresa_id || null,
          })
          .eq('id', editingUsuario.id);

        if (error) throw error;
        toast.success('Usuário atualizado com sucesso');
      }

      setDialogOpen(false);
      setEditingUsuario(null);
      form.reset();
      fetchUsuarios();
    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error);
      toast.error(error.message || 'Erro ao salvar usuário');
    } finally {
      setSubmitting(false);
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
      setActionLoading(prev => ({ ...prev, [`toggle-${usuario.id}`]: true }));
      const { error } = await supabase
        .from('profiles')
        .update({ ativo: !usuario.ativo })
        .eq('id', usuario.id);

      if (error) throw error;
      toast.success(`Usuário ${!usuario.ativo ? 'ativado' : 'desativado'} com sucesso`);
      await fetchUsuarios();
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
      toast.error('Erro ao alterar status do usuário');
    } finally {
      setActionLoading(prev => ({ ...prev, [`toggle-${usuario.id}`]: false }));
    }
  };

  const openDeleteDialog = (usuario: Usuario) => {
    setUsuarioToDelete(usuario);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!usuarioToDelete) return;
    
    console.log('Iniciando exclusão do usuário:', usuarioToDelete);
    
    try {
      setActionLoading(prev => ({ ...prev, [`delete-${usuarioToDelete.id}`]: true }));
      
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', usuarioToDelete.id);

      if (error) {
        console.error('Erro detalhado ao excluir usuário:', error);
        throw new Error(error.message || 'Erro ao excluir usuário');
      }
      
      console.log('Usuário excluído com sucesso');
      toast.success('Usuário excluído com sucesso');
      await fetchUsuarios();
      setDeleteDialogOpen(false);
      setUsuarioToDelete(null);
    } catch (error: any) {
      console.error('Erro completo ao excluir usuário:', error);
      toast.error(error.message || 'Erro ao excluir usuário');
    } finally {
      setActionLoading(prev => ({ ...prev, [`delete-${usuarioToDelete.id}`]: false }));
    }
  };

  const resetPassword = async (usuario: Usuario) => {
    try {
      setActionLoading(prev => ({ ...prev, [`reset-${usuario.id}`]: true }));
      
      const { error } = await supabase.functions.invoke('send-password-reset', {
        body: {
          userId: usuario.user_id,
        }
      });

      if (error) throw error;

      toast.success('Nova senha temporária enviada por e-mail.');
    } catch (error: any) {
      console.error('Erro ao resetar senha:', error);
      toast.error(error.message || 'Erro ao resetar senha');
    } finally {
      setActionLoading(prev => ({ ...prev, [`reset-${usuario.id}`]: false }));
    }
  };

  const resendWelcomeEmail = async (usuario: Usuario) => {
    try {
      setActionLoading(prev => ({ ...prev, [`resend-${usuario.id}`]: true }));
      
      const { error } = await supabase.functions.invoke('resend-welcome-email', {
        body: {
          userId: usuario.user_id,
        }
      });

      if (error) throw error;

      toast.success('E-mail de acesso reenviado com sucesso.');
      // Atualizar informações de acesso após reenviar
      await fetchUsersAccessInfo([usuario.user_id]);
    } catch (error: any) {
      console.error('Erro ao reenviar e-mail de acesso:', error);
      toast.error(error.message || 'Erro ao reenviar e-mail de acesso');
    } finally {
      setActionLoading(prev => ({ ...prev, [`resend-${usuario.id}`]: false }));
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

  const getAccessStatusBadge = (userId: string) => {
    const accessInfo = usersAccessInfo.get(userId);
    
    if (!accessInfo) {
      return (
        <Badge variant="outline" className="bg-gray-100">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Carregando...
          </span>
        </Badge>
      );
    }
    
    if (accessInfo.first_access_pending) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-300">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Pendente primeiro acesso
                </span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Senha temporária enviada em {formatDate(accessInfo.temp_password_created_at)}</p>
              <p>Expira em {formatDate(accessInfo.temp_password_expires_at)}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    if (accessInfo.last_sign_in_at) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                <span className="flex items-center gap-1">
                  <UserCheck className="h-3 w-3" />
                  Último acesso
                </span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              {formatDate(accessInfo.last_sign_in_at)}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    return (
      <Badge variant="outline" className="bg-gray-100">
        <span className="flex items-center gap-1">
          <UserX className="h-3 w-3" />
          Nunca acessou
        </span>
      </Badge>
    );
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
    } catch (e) {
      return dateString;
    }
  };

  const shouldShowResendButton = (userId: string) => {
    const accessInfo = usersAccessInfo.get(userId);
    return accessInfo?.first_access_pending || !accessInfo?.last_sign_in_at;
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
                        <Input placeholder="email@exemplo.com" {...field} disabled={!!editingUsuario} />
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
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {editingUsuario ? 'Atualizando...' : 'Criando...'}
                      </div>
                    ) : (
                      editingUsuario ? 'Atualizar' : 'Criar'
                    )}
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
              <TableHead>Status de Acesso</TableHead>
              <TableHead className="text-right">Ações</TableHead>
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
                  {accessInfoLoading ? (
                    <div className="animate-pulse h-5 w-24 bg-gray-200 rounded"></div>
                  ) : (
                    getAccessStatusBadge(usuario.user_id)
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(usuario)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Editar</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleUserStatus(usuario)}
                            disabled={actionLoading[`toggle-${usuario.id}`]}
                          >
                            {actionLoading[`toggle-${usuario.id}`] ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                            ) : usuario.ativo ? (
                              <UserX className="h-4 w-4" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{usuario.ativo ? 'Desativar' : 'Ativar'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => resetPassword(usuario)}
                            disabled={actionLoading[`reset-${usuario.id}`]}
                          >
                            {actionLoading[`reset-${usuario.id}`] ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                            ) : (
                              <Key className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Resetar senha</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    {shouldShowResendButton(usuario.user_id) && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => resendWelcomeEmail(usuario)}
                              disabled={actionLoading[`resend-${usuario.id}`]}
                            >
                              {actionLoading[`resend-${usuario.id}`] ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Reenviar e-mail de primeiro acesso</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(usuario)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Excluir</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
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
        loading={usuarioToDelete ? actionLoading[`delete-${usuarioToDelete.id}`] : false}
      />
    </div>
  );
};

export default GerenciamentoUsuarios;
