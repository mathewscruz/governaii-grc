import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckSquare, Square, BookOpen } from 'lucide-react';

interface Module {
  id: string;
  name: string;
  display_name: string;
}

interface ModulePermission {
  module_id: string;
  can_access: boolean;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
}

interface Profile {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  empresa_id: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile?: Profile | null;
  empresaId: string;
  onSaved: () => void;
}

const PERM_LABELS = [
  { key: 'can_access' as const, label: 'Acessar' },
  { key: 'can_create' as const, label: 'Criar' },
  { key: 'can_read' as const, label: 'Ler' },
  { key: 'can_update' as const, label: 'Editar' },
  { key: 'can_delete' as const, label: 'Excluir' },
];

export const PermissionProfileDialog: React.FC<Props> = ({
  open, onOpenChange, profile, empresaId, onSaved
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [propagate, setPropagate] = useState(false);

  useEffect(() => {
    if (open) {
      fetchModules();
      if (profile) {
        setName(profile.name);
        setDescription(profile.description || '');
        setIsDefault(profile.is_default);
        fetchProfilePermissions(profile.id);
      } else {
        setName('');
        setDescription('');
        setIsDefault(false);
        setPermissions([]);
        setPropagate(false);
      }
    }
  }, [open, profile]);

  const fetchModules = async () => {
    const { data } = await supabase
      .from('system_modules')
      .select('id, name, display_name')
      .eq('is_active', true)
      .order('order_index');
    setModules(data || []);

    if (!profile) {
      setPermissions((data || []).map(m => ({
        module_id: m.id,
        can_access: false, can_create: false, can_read: false, can_update: false, can_delete: false,
      })));
    }
  };

  const fetchProfilePermissions = async (profileId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('permission_profile_modules')
      .select('*')
      .eq('profile_id', profileId);

    if (data) {
      setPermissions(data.map(d => ({
        module_id: d.module_id,
        can_access: d.can_access, can_create: d.can_create, can_read: d.can_read,
        can_update: d.can_update, can_delete: d.can_delete,
      })));
    }
    setLoading(false);
  };

  const getPermission = (moduleId: string): ModulePermission => {
    return permissions.find(p => p.module_id === moduleId) || {
      module_id: moduleId, can_access: false, can_create: false, can_read: false, can_update: false, can_delete: false,
    };
  };

  const updatePermission = (moduleId: string, key: keyof ModulePermission, value: boolean) => {
    setPermissions(prev => {
      const existing = prev.find(p => p.module_id === moduleId);
      if (existing) {
        return prev.map(p => p.module_id === moduleId ? { ...p, [key]: value } : p);
      }
      return [...prev, { module_id: moduleId, can_access: false, can_create: false, can_read: false, can_update: false, can_delete: false, [key]: value }];
    });
  };

  const setAllPermissions = (value: boolean) => {
    setPermissions(modules.map(m => ({
      module_id: m.id,
      can_access: value, can_create: value, can_read: value, can_update: value, can_delete: value,
    })));
  };

  const setReadOnly = () => {
    setPermissions(modules.map(m => ({
      module_id: m.id,
      can_access: true, can_create: false, can_read: true, can_update: false, can_delete: false,
    })));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    setSaving(true);
    try {
      let profileId: string;

      if (profile) {
        const { error } = await supabase
          .from('permission_profiles')
          .update({ name, description, is_default: isDefault, updated_at: new Date().toISOString() })
          .eq('id', profile.id);
        if (error) throw error;
        profileId = profile.id;

        // Delete existing module permissions
        await supabase.from('permission_profile_modules').delete().eq('profile_id', profileId);
      } else {
        const { data, error } = await supabase
          .from('permission_profiles')
          .insert({ name, description, is_default: isDefault, empresa_id: empresaId, created_by: (await supabase.auth.getUser()).data.user?.id })
          .select('id')
          .single();
        if (error) throw error;
        profileId = data.id;
      }

      // Insert module permissions
      const modulePerms = permissions
        .filter(p => p.can_access || p.can_create || p.can_read || p.can_update || p.can_delete)
        .map(p => ({ profile_id: profileId, module_id: p.module_id, ...p }));

      if (modulePerms.length > 0) {
        const toInsert = modulePerms.map(({ module_id, can_access, can_create, can_read, can_update, can_delete }) => ({
          profile_id: profileId, module_id, can_access, can_create, can_read, can_update, can_delete,
        }));
        const { error } = await supabase.from('permission_profile_modules').insert(toInsert);
        if (error) throw error;
      }

      // Propagate to all users with this profile
      if (profile && propagate) {
        const { data: usersWithProfile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('permission_profile_id', profileId);

        if (usersWithProfile) {
          for (const user of usersWithProfile) {
            await supabase.rpc('apply_permission_profile', {
              _user_id: user.user_id,
              _profile_id: profileId,
            });
          }
          toast.success(`Permissões propagadas para ${usersWithProfile.length} usuário(s)`);
        }
      }

      toast.success(profile ? 'Perfil atualizado' : 'Perfil criado');
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error(error.message || 'Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{profile ? 'Editar Perfil de Permissão' : 'Novo Perfil de Permissão'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Nome</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Auditor Interno" />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex items-center gap-2">
                <Switch checked={isDefault} onCheckedChange={setIsDefault} />
                <Label>Perfil padrão</Label>
              </div>
            </div>
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descreva o perfil..." rows={2} />
          </div>

          <Separator />

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setAllPermissions(true)}>
              <CheckSquare className="h-3.5 w-3.5 mr-1" />
              Marcar Todos
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={setReadOnly}>
              <BookOpen className="h-3.5 w-3.5 mr-1" />
              Somente Leitura
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setAllPermissions(false)}>
              <Square className="h-3.5 w-3.5 mr-1" />
              Desmarcar Todos
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-3 py-2 font-medium">Módulo</th>
                    {PERM_LABELS.map(p => (
                      <th key={p.key} className="text-center px-2 py-2 font-medium">{p.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modules.map(module => {
                    const perm = getPermission(module.id);
                    return (
                      <tr key={module.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-3 py-2 font-medium">{module.display_name}</td>
                        {PERM_LABELS.map(({ key }) => (
                          <td key={key} className="text-center px-2 py-2">
                            <Switch
                              checked={perm[key] as boolean}
                              onCheckedChange={v => updatePermission(module.id, key, v)}
                              className="scale-75"
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {profile && (
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Switch checked={propagate} onCheckedChange={setPropagate} />
              <Label className="text-sm">Aplicar alterações a todos os usuários deste perfil</Label>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {profile ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
