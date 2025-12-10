import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Users, Building2, Settings, Shield, Plug } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import GerenciamentoEmpresas from '@/components/configuracoes/GerenciamentoEmpresas';
import GerenciamentoUsuariosEnhanced from '@/components/configuracoes/GerenciamentoUsuariosEnhanced';
import { PermissionMatrix } from '@/components/configuracoes/PermissionMatrix';
import ConfiguracoesGerais from '@/components/configuracoes/ConfiguracoesGerais';
import { ReminderSettings } from '@/components/configuracoes/ReminderSettings';
import { IntegrationHub } from '@/components/configuracoes/IntegrationHub';

const Configuracoes = () => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string>('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        if (data) setUserRole(data.role);
      } catch (error) {
        console.error('Erro ao buscar perfil do usuário:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  const isSuperAdmin = userRole === 'super_admin';
  const isAdmin = userRole === 'admin' || isSuperAdmin;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Gerencie empresas, usuários e configurações do sistema"
      />

      <Tabs defaultValue="usuarios" className="space-y-6">
        <TabsList className={`grid w-full ${isSuperAdmin ? 'grid-cols-5' : isAdmin ? 'grid-cols-4' : 'grid-cols-2'}`}>
          {isSuperAdmin && (
            <TabsTrigger value="empresas" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Empresas</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="usuarios" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Usuários</span>
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="permissoes" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Permissões</span>
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="integracoes" className="flex items-center gap-2">
              <Plug className="h-4 w-4" />
              <span className="hidden sm:inline">Integrações</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="geral" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Geral</span>
          </TabsTrigger>
        </TabsList>

        {isSuperAdmin && (
          <TabsContent value="empresas">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Gerenciamento de Empresas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <GerenciamentoEmpresas />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="usuarios">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gerenciamento de Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GerenciamentoUsuariosEnhanced userRole={userRole} />
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="permissoes">
            <PermissionMatrix />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="integracoes">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plug className="h-5 w-5" />
                  Integrações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <IntegrationHub />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="geral">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configurações Gerais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ConfiguracoesGerais userRole={userRole} />
              </CardContent>
            </Card>

            <ReminderSettings />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Configuracoes;