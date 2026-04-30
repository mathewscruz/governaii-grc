import { useAuth } from '@/components/AuthProvider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Users, Building2, Plug, MessageSquare, CreditCard, Sparkles, Landmark, DollarSign, Package, Newspaper } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import GerenciamentoEmpresas from '@/components/configuracoes/GerenciamentoEmpresas';
import { IntegrationHub } from '@/components/configuracoes/IntegrationHub';
import { ConfiguracoesDenuncia } from '@/components/denuncia/ConfiguracoesDenuncia';
import { CategoriasDenuncia } from '@/components/denuncia/CategoriasDenuncia';
import { AssinaturaTab } from '@/components/configuracoes/AssinaturaTab';
import { CreditosIAManager } from '@/components/configuracoes/CreditosIAManager';
import { UsersAccessTab } from '@/components/configuracoes/UsersAccessTab';
import { OrganizacaoTab } from '@/components/configuracoes/OrganizacaoTab';
import { FinanceiroIATab } from '@/components/configuracoes/FinanceiroIATab';
import { GerenciamentoPlanos } from '@/components/configuracoes/GerenciamentoPlanos';
import GerenciamentoChangelog from '@/components/configuracoes/GerenciamentoChangelog';
import NoticiasTab from '@/components/configuracoes/NoticiasTab';

const Configuracoes = () => {
  const { profile, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'usuarios';
  const selectedUserId = searchParams.get('userId') || undefined;

  const userRole = profile?.role || 'user';

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
        <TabsList className="xl:flex-nowrap">
          {isSuperAdmin && (
            <TabsTrigger value="empresas" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden md:inline">Empresas</span>
            </TabsTrigger>
          )}
          {isSuperAdmin && (
            <TabsTrigger value="planos" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden md:inline">Planos</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="usuarios" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden md:inline">Usuários & Acessos</span>
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="organizacao" className="flex items-center gap-2">
              <Landmark className="h-4 w-4" />
              <span className="hidden md:inline">Organização</span>
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="integracoes" className="flex items-center gap-2">
              <Plug className="h-4 w-4" />
              <span className="hidden md:inline">Integrações</span>
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="denuncia" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden md:inline">Denúncia</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="assinatura" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden md:inline">Assinatura</span>
          </TabsTrigger>
          {isSuperAdmin && (
            <TabsTrigger value="financeiro-ia" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden md:inline">Financeiro IA</span>
            </TabsTrigger>
          )}
          {isSuperAdmin && (
            <TabsTrigger value="novidades" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden md:inline">Novidades</span>
            </TabsTrigger>
          )}
          {isSuperAdmin && (
            <TabsTrigger value="noticias" className="flex items-center gap-2">
              <Newspaper className="h-4 w-4" />
              <span className="hidden md:inline">Notícias</span>
            </TabsTrigger>
          )}
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

        {isSuperAdmin && (
          <TabsContent value="planos">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Gerenciamento de Planos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <GerenciamentoPlanos />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="usuarios">
          <UsersAccessTab 
            userRole={userRole} 
            isAdmin={isAdmin} 
            selectedUserId={selectedUserId} 
          />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="organizacao">
            <OrganizacaoTab />
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

        <TabsContent value="assinatura">
          <div className="space-y-6">
            <AssinaturaTab />
            {isSuperAdmin && (
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
            )}
          </div>
        </TabsContent>
        {isSuperAdmin && (
          <TabsContent value="financeiro-ia">
            <FinanceiroIATab />
          </TabsContent>
        )}
        {isSuperAdmin && (
          <TabsContent value="novidades">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Novidades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <GerenciamentoChangelog />
              </CardContent>
            </Card>
          </TabsContent>
        )}
        {isSuperAdmin && (
          <TabsContent value="noticias">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Newspaper className="h-5 w-5" />
                  Notícias & Comunicados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <NoticiasTab />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Configuracoes;