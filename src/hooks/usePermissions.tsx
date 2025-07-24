import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

interface ModulePermission {
  module_id: string;
  module_name: string;
  can_access: boolean;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
}

interface UsePermissionsReturn {
  permissions: ModulePermission[];
  loading: boolean;
  canAccess: (moduleName: string) => boolean;
  canCreate: (moduleName: string) => boolean;
  canRead: (moduleName: string) => boolean;
  canUpdate: (moduleName: string) => boolean;
  canDelete: (moduleName: string) => boolean;
  refetchPermissions: () => Promise<void>;
}

export const usePermissions = (): UsePermissionsReturn => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    if (!user) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_module_permissions')
        .select(`
          module_id,
          can_access,
          can_create,
          can_read,
          can_update,
          can_delete,
          system_modules:module_id (
            name
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const formattedPermissions: ModulePermission[] = data.map((perm: any) => ({
        module_id: perm.module_id,
        module_name: perm.system_modules?.name || '',
        can_access: perm.can_access,
        can_create: perm.can_create,
        can_read: perm.can_read,
        can_update: perm.can_update,
        can_delete: perm.can_delete,
      }));

      setPermissions(formattedPermissions);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const getPermissionForModule = useCallback((moduleName: string) => {
    return permissions.find(p => p.module_name === moduleName);
  }, [permissions]);

  const canAccess = useCallback((moduleName: string) => {
    const permission = getPermissionForModule(moduleName);
    return permission?.can_access || false;
  }, [getPermissionForModule]);

  const canCreate = useCallback((moduleName: string) => {
    const permission = getPermissionForModule(moduleName);
    return permission?.can_create || false;
  }, [getPermissionForModule]);

  const canRead = useCallback((moduleName: string) => {
    const permission = getPermissionForModule(moduleName);
    return permission?.can_read || false;
  }, [getPermissionForModule]);

  const canUpdate = useCallback((moduleName: string) => {
    const permission = getPermissionForModule(moduleName);
    return permission?.can_update || false;
  }, [getPermissionForModule]);

  const canDelete = useCallback((moduleName: string) => {
    const permission = getPermissionForModule(moduleName);
    return permission?.can_delete || false;
  }, [getPermissionForModule]);

  const refetchPermissions = useCallback(async () => {
    setLoading(true);
    await fetchPermissions();
  }, [fetchPermissions]);

  return {
    permissions,
    loading,
    canAccess,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    refetchPermissions,
  };
};