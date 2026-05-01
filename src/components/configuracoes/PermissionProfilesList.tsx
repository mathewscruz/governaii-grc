import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Users, Shield, Star } from 'lucide-react';
import { PermissionProfileDialog } from './PermissionProfileDialog';
import ConfirmDialog from '@/components/ConfirmDialog';

import { AkurisPulse } from '@/components/ui/AkurisPulse';
interface Profile {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  empresa_id: string;
  user_count: number;
}

interface Props {
  empresaId: string;
}

export const PermissionProfilesList: React.FC<Props> = ({ empresaId }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<Profile | null>(null);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const { data: profilesData, error } = await supabase
        .from('permission_profiles')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('name');

      if (error) throw error;

      // Count users per profile
      const { data: usersData } = await supabase
        .from('profiles')
        .select('permission_profile_id')
        .eq('empresa_id', empresaId)
        .not('permission_profile_id', 'is', null);

      const countMap = new Map<string, number>();
      usersData?.forEach(u => {
        const pid = u.permission_profile_id;
        if (pid) countMap.set(pid, (countMap.get(pid) || 0) + 1);
      });

      setProfiles((profilesData || []).map(p => ({
        ...p,
        user_count: countMap.get(p.id) || 0,
      })));
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast.error('Erro ao carregar perfis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (empresaId) fetchProfiles();
  }, [empresaId]);

  const handleEdit = (profile: Profile) => {
    setEditingProfile(profile);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!profileToDelete) return;
    try {
      // Clear profile reference from users first
      await supabase
        .from('profiles')
        .update({ permission_profile_id: null })
        .eq('permission_profile_id', profileToDelete.id);

      const { error } = await supabase
        .from('permission_profiles')
        .delete()
        .eq('id', profileToDelete.id);
      if (error) throw error;

      toast.success('Perfil excluído');
      fetchProfiles();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir perfil');
    } finally {
      setDeleteDialogOpen(false);
      setProfileToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <AkurisPulse size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => { setEditingProfile(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Perfil
        </Button>
      </div>

      {profiles.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">Nenhum perfil criado</p>
          <p className="text-sm">Crie perfis para simplificar a gestão de permissões</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {profiles.map(profile => (
            <Card key={profile.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">{profile.name}</h3>
                  </div>
                  <div className="flex gap-1">
                    {profile.is_default && (
                      <Badge variant="secondary" className="text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        Padrão
                      </Badge>
                    )}
                  </div>
                </div>

                {profile.description && (
                  <p className="text-sm text-muted-foreground mb-3">{profile.description}</p>
                )}

                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    {profile.user_count} usuário(s)
                  </Badge>

                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(profile)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setProfileToDelete(profile); setDeleteDialogOpen(true); }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PermissionProfileDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        profile={editingProfile}
        empresaId={empresaId}
        onSaved={fetchProfiles}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir Perfil"
        description={`Tem certeza que deseja excluir o perfil "${profileToDelete?.name}"? Usuários vinculados perderão a associação, mas manterão suas permissões individuais.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
};
