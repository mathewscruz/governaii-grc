import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { useAuth } from '@/components/AuthProvider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Users, Building2, Settings, Shield, Plug, MessageSquare, CreditCard, Sparkles, Landmark } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import GerenciamentoEmpresas from '@/components/configuracoes/GerenciamentoEmpresas';
import GerenciamentoUsuariosEnhanced from '@/components/configuracoes/GerenciamentoUsuariosEnhanced';
import { PermissionMatrix } from '@/components/configuracoes/PermissionMatrix';
import ConfiguracoesGerais from '@/components/configuracoes/ConfiguracoesGerais';
import { ReminderSettings } from '@/components/configuracoes/ReminderSettings';
import { IntegrationHub } from '@/components/configuracoes/IntegrationHub';
import { ConfiguracoesDenuncia } from '@/components/denuncia/ConfiguracoesDenuncia';
import { CategoriasDenuncia } from '@/components/denuncia/CategoriasDenuncia';
import { AssinaturaTab } from '@/components/configuracoes/AssinaturaTab';
import { CreditosIAManager } from '@/components/configuracoes/CreditosIAManager';
import { CompanyContextSettings } from '@/components/configuracoes/CompanyContextSettings';

const Configuracoes = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [userRole, setUserRole] = useState<string>('user');
  const [loading, setLoading] = useState(true);
  const defaultTab = searchParams.get('tab') || 'usuarios';

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
        logger.error('Erro ao buscar perfil do usuário', { module: 'Configuracoes', error: String(error) });
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

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="flex flex-wrap w-full gap-0 overflow-x-auto">
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
          {isAdmin && (
            <TabsTrigger value="denuncia" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Denúncia</span>
            </TabsTrigger>
          )}
          {isSuperAdmin && (
            <TabsTrigger value="creditos-ia" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Créditos IA</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="assinatura" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Assinatura</span>
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="organizacao" className="flex items-center gap-2">
              <Landmark className="h-4 w-4" />
              <span className="hidden sm:inline">Organização</span>
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

        {isAdmin && (
          <TabsContent value="denuncia">
            <div className="space-y-6">
              <ConfiguracoesDenuncia />
              <CategoriasDenuncia />
            </div>
          </TabsContent>
        )}

        {isSuperAdmin && (
          <TabsContent value="creditos-ia">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Gestão de Créditos IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CreditosIAManager />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="assinatura">
          <AssinaturaTab />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="organizacao">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Landmark className="h-5 w-5" />
                  Contexto da Organização
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CompanyContextSettings />
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