import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, Save, RotateCcw, Shield, Eye, Plus, Edit, Trash2, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Module {
  id: string;
  name: string;
  display_name: string;
  description: string;
  icon: string;
}

interface UserPermission {
  user_id: string;
  module_id: string;
  can_access: boolean;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
}

interface User {
  id: string;
  nome: string;
  email: string;
  role: string;
}

interface PermissionMatrixProps {
  selectedUserId?: string;
}

export const PermissionMatrix: React.FC<PermissionMatrixProps> = ({ selectedUserId }) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [applyingToAll, setApplyingToAll] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Buscar módulos
      const { data: modulesData, error: modulesError } = await supabase
        .from('system_modules')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (modulesError) throw modulesError;

      // Buscar usuários
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('user_id, nome, email, role')
        .eq('ativo', true)
        .order('nome');

      if (usersError) throw usersError;

      // Buscar permissões existentes
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('user_module_permissions')
        .select('*');

      if (permissionsError) throw permissionsError;

      setModules(modulesData || []);
      setUsers(usersData?.map(u => ({ id: u.user_id, nome: u.nome, email: u.email, role: u.role })) || []);
      setPermissions(permissionsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const getPermission = (userId: string, moduleId: string): UserPermission => {
    return permissions.find(p => p.user_id === userId && p.module_id === moduleId) || {
      user_id: userId,
      module_id: moduleId,
      can_access: false,
      can_create: false,
      can_read: false,
      can_update: false,
      can_delete: false,
    };
  };

  const updatePermission = (userId: string, moduleId: string, field: keyof UserPermission, value: boolean) => {
    setPermissions(prev => {
      const existing = prev.find(p => p.user_id === userId && p.module_id === moduleId);
      
      if (existing) {
        return prev.map(p => 
          p.user_id === userId && p.module_id === moduleId
            ? { ...p, [field]: value }
            : p
        );
      } else {
        return [...prev, {
          user_id: userId,
          module_id: moduleId,
          can_access: field === 'can_access' ? value : false,
          can_create: field === 'can_create' ? value : false,
          can_read: field === 'can_read' ? value : false,
          can_update: field === 'can_update' ? value : false,
          can_delete: field === 'can_delete' ? value : false,
        }];
      }
    });
  };

  const savePermissions = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;
      
      // PROTEÇÃO CRÍTICA: Verificar se o usuário atual está perdendo permissões de configuração
      const configuracaoModule = modules.find(m => m.name === 'configuracoes');
      if (configuracaoModule && currentUserId) {
        const currentUserConfigPermission = permissions.find(p => 
          p.user_id === currentUserId && p.module_id === configuracaoModule.id
        );
        
        if (currentUserConfigPermission && !currentUserConfigPermission.can_access) {
          toast.error("⚠️ BLOQUEADO: Você não pode remover seu próprio acesso ao módulo de configurações!");
          setSaving(false);
          return;
        }
      }

      // Filtrar apenas permissões válidas (com pelo menos uma flag true)
      const validPermissions = permissions.filter(p => 
        p.can_access || p.can_create || p.can_read || p.can_update || p.can_delete
      );

      // Buscar permissões existentes para comparação
      const { data: existingPermissions } = await supabase
        .from('user_module_permissions')
        .select('*');

      const existingMap = new Map();
      existingPermissions?.forEach(p => {
        existingMap.set(`${p.user_id}-${p.module_id}`, p);
      });

      // Processar mudanças de forma incremental
      const toInsert = [];
      const toUpdate = [];
      const toDelete = [];

      // Identificar mudanças
      validPermissions.forEach(permission => {
        const key = `${permission.user_id}-${permission.module_id}`;
        const existing = existingMap.get(key);
        
        if (existing) {
          // Verificar se houve mudança
          const hasChanged = 
            existing.can_access !== permission.can_access ||
            existing.can_create !== permission.can_create ||
            existing.can_read !== permission.can_read ||
            existing.can_update !== permission.can_update ||
            existing.can_delete !== permission.can_delete;
            
          if (hasChanged) {
            toUpdate.push({
              ...permission,
              granted_by: currentUserId,
              granted_at: new Date().toISOString()
            });
          }
        } else {
          toInsert.push({
            ...permission,
            granted_by: currentUserId,
            granted_at: new Date().toISOString()
          });
        }
      });

      // Identificar permissões a serem removidas (existem mas não estão mais na lista válida)
      existingPermissions?.forEach(existing => {
        const found = validPermissions.find(p => 
          p.user_id === existing.user_id && p.module_id === existing.module_id
        );
        if (!found) {
          toDelete.push(existing);
        }
      });

      // Executar mudanças atomicamente
      if (toInsert.length > 0) {
        const { error } = await supabase
          .from('user_module_permissions')
          .insert(toInsert);
        if (error) throw error;
      }

      if (toUpdate.length > 0) {
        for (const permission of toUpdate) {
          const { error } = await supabase
            .from('user_module_permissions')
            .update(permission)
            .eq('user_id', permission.user_id)
            .eq('module_id', permission.module_id);
          if (error) throw error;
        }
      }

      if (toDelete.length > 0) {
        for (const permission of toDelete) {
          // PROTEÇÃO: Não deletar permissões do usuário atual para configurações
          if (permission.user_id === currentUserId && 
              configuracaoModule && 
              permission.module_id === configuracaoModule.id) {
            continue;
          }
          
          const { error } = await supabase
            .from('user_module_permissions')
            .delete()
            .eq('user_id', permission.user_id)
            .eq('module_id', permission.module_id);
          if (error) throw error;
        }
      }

      toast.success(`✅ Permissões salvas com sucesso! ${toInsert.length} inseridas, ${toUpdate.length} atualizadas, ${toDelete.length} removidas.`);
      
      // Recarregar dados para garantir consistência
      await fetchData();
    } catch (error: any) {
      console.error('Error saving permissions:', error);
      toast.error(`❌ Erro ao salvar permissões: ${error.message}`);
      
      // Recarregar dados em caso de erro para garantir consistência
      await fetchData();
    } finally {
      setSaving(false);
    }
  };

  const applyDefaultPermissions = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('apply_default_permissions_for_user', {
        user_id_param: userId
      });

      if (error) throw error;

      await fetchData();
      toast.success('Permissões padrão aplicadas');
    } catch (error) {
      console.error('Error applying default permissions:', error);
      toast.error('Erro ao aplicar permissões padrão');
    }
  };

  const applyDefaultPermissionsToAll = async () => {
    try {
      setApplyingToAll(true);
      
      const { data, error } = await supabase.functions.invoke('apply-default-permissions-all-users');

      if (error) throw error;

      if (data?.successful > 0) {
        toast.success(`Permissões aplicadas para ${data.successful} usuários`);
        if (data?.failed > 0) {
          toast.warning(`${data.failed} usuários falharam na aplicação`);
        }
        await fetchData();
      } else {
        toast.error('Nenhuma permissão foi aplicada');
      }
    } catch (error) {
      console.error('Error applying default permissions to all users:', error);
      toast.error('Erro ao aplicar permissões padrão para todos os usuários');
    } finally {
      setApplyingToAll(false);
    }
  };

  const filteredUsers = users.filter(user => 
    selectedUserId ? user.id === selectedUserId : 
    user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin': return 'default';
      case 'admin': return 'secondary';
      case 'user': return 'outline';
      case 'readonly': return 'destructive';
      default: return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'user': return 'Usuário';
      case 'readonly': return 'Somente Leitura';
      default: return role;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Matriz de Permissões
          </CardTitle>
          <CardDescription>
            Configure as permissões específicas por usuário e módulo. Use as permissões padrão baseadas na role ou customize individualmente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedUserId && (
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Buscar usuários</Label>
                <Input
                  id="search"
                  placeholder="Digite o nome ou email do usuário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button onClick={fetchData} variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <Button onClick={savePermissions} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar Alterações
            </Button>
            
            <Button 
              onClick={applyDefaultPermissionsToAll}
              disabled={applyingToAll}
              variant="outline"
            >
              {applyingToAll ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Users className="h-4 w-4 mr-2" />}
              Aplicar Padrão p/ Todos
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium min-w-[200px]">Usuário</th>
                    <th className="text-left p-3 font-medium min-w-[100px]">Role</th>
                    {modules.map(module => (
                      <th key={module.id} className="text-center p-3 font-medium min-w-[120px]">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs">{module.display_name}</span>
                          <div className="flex gap-1 text-xs text-muted-foreground">
                            <span title="Acessar">A</span>
                            <span title="Criar">C</span>
                            <span title="Ler">L</span>
                            <span title="Editar">E</span>
                            <span title="Deletar">D</span>
                          </div>
                        </div>
                      </th>
                    ))}
                    <th className="text-center p-3 font-medium min-w-[100px]">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="border-t hover:bg-muted/25">
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{user.nome}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                          {getRoleLabel(user.role)}
                        </Badge>
                      </td>
                      {modules.map(module => {
                        const permission = getPermission(user.id, module.id);
                        return (
                          <td key={module.id} className="p-3">
                            <div className="flex gap-1 justify-center">
                              <Checkbox
                                checked={permission.can_access}
                                onCheckedChange={(checked) => 
                                  updatePermission(user.id, module.id, 'can_access', !!checked)
                                }
                                title="Acessar"
                                className="h-3 w-3"
                              />
                              <Checkbox
                                checked={permission.can_create}
                                onCheckedChange={(checked) => 
                                  updatePermission(user.id, module.id, 'can_create', !!checked)
                                }
                                title="Criar"
                                className="h-3 w-3"
                              />
                              <Checkbox
                                checked={permission.can_read}
                                onCheckedChange={(checked) => 
                                  updatePermission(user.id, module.id, 'can_read', !!checked)
                                }
                                title="Ler"
                                className="h-3 w-3"
                              />
                              <Checkbox
                                checked={permission.can_update}
                                onCheckedChange={(checked) => 
                                  updatePermission(user.id, module.id, 'can_update', !!checked)
                                }
                                title="Editar"
                                className="h-3 w-3"
                              />
                              <Checkbox
                                checked={permission.can_delete}
                                onCheckedChange={(checked) => 
                                  updatePermission(user.id, module.id, 'can_delete', !!checked)
                                }
                                title="Deletar"
                                className="h-3 w-3"
                              />
                            </div>
                          </td>
                        );
                      })}
                      <td className="p-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => applyDefaultPermissions(user.id)}
                          className="text-xs"
                        >
                          Padrão
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum usuário encontrado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};