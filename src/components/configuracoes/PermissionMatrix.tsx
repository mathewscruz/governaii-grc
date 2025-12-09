import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { Loader2, Save, RotateCcw, Shield, Users, AlertTriangle, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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

type PermissionKey = 'can_access' | 'can_create' | 'can_read' | 'can_update' | 'can_delete';

const PERMISSION_LEGEND: { key: PermissionKey; label: string; shortLabel: string; description: string }[] = [
  { key: 'can_access', label: 'Acessar', shortLabel: 'A', description: 'Pode ver o módulo no menu' },
  { key: 'can_create', label: 'Criar', shortLabel: 'C', description: 'Pode criar novos registros' },
  { key: 'can_read', label: 'Ler', shortLabel: 'L', description: 'Pode visualizar registros' },
  { key: 'can_update', label: 'Editar', shortLabel: 'E', description: 'Pode editar registros existentes' },
  { key: 'can_delete', label: 'Excluir', shortLabel: 'D', description: 'Pode excluir registros' },
];

export const PermissionMatrix: React.FC<PermissionMatrixProps> = ({ selectedUserId }) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [originalPermissions, setOriginalPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [applyingToAll, setApplyingToAll] = useState(false);

  // Track unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(permissions) !== JSON.stringify(originalPermissions);
  }, [permissions, originalPermissions]);

  // Track modified users
  const modifiedUsers = useMemo(() => {
    const modified = new Set<string>();
    permissions.forEach(p => {
      const original = originalPermissions.find(
        op => op.user_id === p.user_id && op.module_id === p.module_id
      );
      if (!original || JSON.stringify(p) !== JSON.stringify(original)) {
        modified.add(p.user_id);
      }
    });
    return modified;
  }, [permissions, originalPermissions]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data: modulesData, error: modulesError } = await supabase
        .from('system_modules')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (modulesError) throw modulesError;

      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('user_id, nome, email, role')
        .eq('ativo', true)
        .order('nome');

      if (usersError) throw usersError;

      const { data: permissionsData, error: permissionsError } = await supabase
        .from('user_module_permissions')
        .select('*');

      if (permissionsError) throw permissionsError;

      setModules(modulesData || []);
      setUsers(usersData?.map(u => ({ id: u.user_id, nome: u.nome, email: u.email, role: u.role })) || []);
      setPermissions(permissionsData || []);
      setOriginalPermissions(permissionsData || []);
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

  const updatePermission = (userId: string, moduleId: string, field: PermissionKey, value: boolean) => {
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
      
      const configuracaoModule = modules.find(m => m.name === 'configuracoes');
      if (configuracaoModule && currentUserId) {
        const currentUserConfigPermission = permissions.find(p => 
          p.user_id === currentUserId && p.module_id === configuracaoModule.id
        );
        
        if (currentUserConfigPermission && !currentUserConfigPermission.can_access) {
          toast.error("Você não pode remover seu próprio acesso às Configurações!");
          setSaving(false);
          return;
        }
      }

      const validPermissions = permissions.filter(p => 
        p.can_access || p.can_create || p.can_read || p.can_update || p.can_delete
      );

      const { data: existingPermissions } = await supabase
        .from('user_module_permissions')
        .select('*');

      const existingMap = new Map();
      existingPermissions?.forEach(p => {
        existingMap.set(`${p.user_id}-${p.module_id}`, p);
      });

      const toInsert = [];
      const toUpdate = [];
      const toDelete = [];

      validPermissions.forEach(permission => {
        const key = `${permission.user_id}-${permission.module_id}`;
        const existing = existingMap.get(key);
        
        if (existing) {
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

      existingPermissions?.forEach(existing => {
        const found = validPermissions.find(p => 
          p.user_id === existing.user_id && p.module_id === existing.module_id
        );
        if (!found) {
          toDelete.push(existing);
        }
      });

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

      setOriginalPermissions([...permissions]);
      toast.success(`Permissões salvas! ${toInsert.length} inseridas, ${toUpdate.length} atualizadas, ${toDelete.length} removidas.`);
      
      await fetchData();
    } catch (error: any) {
      console.error('Error saving permissions:', error);
      toast.error(`Erro ao salvar permissões: ${error.message}`);
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Matriz de Permissões
                {hasUnsavedChanges && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Alterações não salvas
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Configure as permissões específicas por usuário e módulo
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchData} variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Info className="h-4 w-4" />
              Legenda:
            </div>
            {PERMISSION_LEGEND.map(({ key, label, shortLabel, description }) => (
              <TooltipProvider key={key}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="cursor-help">
                      {shortLabel} = {label}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>{description}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>

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
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <Button onClick={savePermissions} disabled={saving || !hasUnsavedChanges}>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px] sticky left-0 bg-background z-10">Usuário</TableHead>
                    <TableHead className="min-w-[100px]">Perfil</TableHead>
                    {modules.map(module => (
                      <TableHead key={module.id} className="text-center min-w-[140px]">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex flex-col items-center gap-1 cursor-help">
                                <span className="text-xs font-medium">{module.display_name}</span>
                                <div className="flex gap-1 text-xs text-muted-foreground">
                                  {PERMISSION_LEGEND.map(p => (
                                    <span key={p.key} title={p.label}>{p.shortLabel}</span>
                                  ))}
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>{module.description || module.name}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableHead>
                    ))}
                    <TableHead className="text-center min-w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={modules.length + 3} className="text-center text-muted-foreground py-8">
                        Nenhum usuário encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map(user => {
                      const isModified = modifiedUsers.has(user.id);
                      return (
                        <TableRow 
                          key={user.id} 
                          className={isModified ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}
                        >
                          <TableCell className="font-medium sticky left-0 bg-background z-10">
                            <div>
                              <div className="font-medium">{user.nome}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs whitespace-nowrap">
                              {getRoleLabel(user.role)}
                            </Badge>
                          </TableCell>
                          {modules.map(module => {
                            const permission = getPermission(user.id, module.id);
                            return (
                              <TableCell key={module.id} className="text-center">
                                <div className="flex gap-1 justify-center">
                                  {PERMISSION_LEGEND.map(({ key, label }) => (
                                    <TooltipProvider key={key}>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="flex items-center justify-center">
                                            <Checkbox
                                              checked={permission[key]}
                                              onCheckedChange={(checked) => 
                                                updatePermission(user.id, module.id, key, !!checked)
                                              }
                                              className="h-4 w-4"
                                            />
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          {label} - {module.display_name}
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  ))}
                                </div>
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-center">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => applyDefaultPermissions(user.id)}
                                    className="text-xs"
                                  >
                                    Padrão
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Aplicar permissões padrão para este usuário</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PermissionMatrix;
