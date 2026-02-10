import React from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useAuth } from '@/components/AuthProvider';
import { useBreadcrumb } from '@/hooks/useBreadcrumb';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import UserProfile from '@/components/UserProfile';
import NotificationCenter from '@/components/NotificationCenter';
import PasswordChangeRequired from '@/components/PasswordChangeRequired';
import { CommandPalette, CommandPaletteButton } from '@/components/CommandPalette';
import { ChangelogPopover } from '@/components/ChangelogPopover';
import PageTransition from '@/components/PageTransition';
import TrialBanner from '@/components/TrialBanner';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout';
import { useIsMobile } from '@/hooks/use-mobile';
import { differenceInDays, parseISO } from 'date-fns';
import { AlertTriangle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, loading, hasTemporaryPassword, checkTemporaryPassword, company, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const breadcrumbs = useBreadcrumb();
  const isMobile = useIsMobile();
  
  // Timeout de sessão por inatividade
  useInactivityTimeout();

  // Verificar se a empresa está inativa
  const isCompanyInactive = company && company.ativo === false;

  // Verificar se o trial expirou
  const isTrialExpired = React.useMemo(() => {
    if (!company) return false;
    if (company.status_licenca !== 'trial') return false;
    if (!company.data_inicio_trial) return false;
    
    const trialStartDate = parseISO(company.data_inicio_trial);
    const diasDecorridos = differenceInDays(new Date(), trialStartDate);
    return diasDecorridos >= 14;
  }, [company]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Tela de bloqueio para empresa inativa
  if (isCompanyInactive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(200,25%,8%)] via-[hsl(200,22%,11%)] to-[hsl(200,25%,8%)] p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <Lock className="h-8 w-8 text-red-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Acesso Bloqueado</h1>
            <p className="text-muted-foreground">
              Sua empresa está temporariamente desativada. Entre em contato com o suporte para mais informações.
            </p>
          </div>
          <div className="space-y-3">
            <a 
              href="mailto:contato@governaii.com.br" 
              className="block w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-lg font-medium transition-colors"
            >
              Entrar em Contato
            </a>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => signOut()}
            >
              Sair
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Tela de bloqueio para trial expirado
  if (isTrialExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(200,25%,8%)] via-[hsl(200,22%,11%)] to-[hsl(200,25%,8%)] p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Período de Teste Expirado</h1>
            <p className="text-muted-foreground">
              Seu período de teste de 14 dias chegou ao fim. Entre em contato para ativar sua licença e continuar usando o GovernAII.
            </p>
          </div>
          <div className="space-y-3">
            <a 
              href="mailto:comercial@governaii.com.br" 
              className="block w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-lg font-medium transition-colors"
            >
              Ativar Licença
            </a>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => signOut()}
            >
              Sair
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        {/* Dialog modal obrigatório de troca de senha */}
        <PasswordChangeRequired 
          open={hasTemporaryPassword}
          onPasswordChanged={() => {
            checkTemporaryPassword();
          }}
        />
        
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Banner de Trial */}
          <TrialBanner />
          
          <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-card flex-shrink-0">
            <div className="flex items-center gap-4 min-w-0">
              <SidebarTrigger />
              
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.map((breadcrumb, index) => (
                    <div key={breadcrumb.path} className="flex items-center">
                      <BreadcrumbItem>
                        {index === breadcrumbs.length - 1 ? (
                          <BreadcrumbPage className="font-semibold">
                            {breadcrumb.title}
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink 
                            className="cursor-pointer hover:text-primary"
                            onClick={() => navigate(breadcrumb.path)}
                          >
                            {breadcrumb.title}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                    </div>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <CommandPaletteButton />
              <LanguageSelector />
              <ChangelogPopover />
              <NotificationCenter />
              <UserProfile />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto overflow-x-hidden w-full max-w-full pb-20 md:pb-6">
            <PageTransition routeKey={location.pathname}>
              {children}
            </PageTransition>
          </main>
        </div>
        
        {/* Onboarding Wizard */}
        <OnboardingWizard />
        
        {/* Command Palette (Cmd+K) */}
        <CommandPalette />
        
        {/* Bottom Navigation Mobile */}
        {isMobile && <MobileBottomNav />}
      </div>
    </SidebarProvider>
  );
};

export default Layout;
