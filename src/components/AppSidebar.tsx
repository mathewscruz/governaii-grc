import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Shield, 
  AlertTriangle, 
  FileCheck, 
  Lock, 
  CheckSquare, 
  Settings,
  ChevronDown,
  Database,
  FileText,
  Handshake,
  BookOpen,
  Users,
  AlertCircle,
  HardDrive,
  MessageSquare,
  Search,
  LogOut,
  LayoutDashboard,
  BarChart3,
  Server,
  FileKey,
  KeyRound,
  ListTodo,
  FileBarChart,
  GraduationCap
} from 'lucide-react';
import logoMini from '@/assets/akuris-logo.png';
import ConfirmDialog from '@/components/ConfirmDialog';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/AuthProvider';
import { usePermissions } from '@/hooks/usePermissions';
import { useLanguage } from '@/contexts/LanguageContext';

const getMenuItems = (t: (key: string) => string) => [
  {
    title: t('sidebar.dashboard'),
    url: '/dashboard',
    icon: LayoutDashboard,
    moduleName: 'dashboard',
  },
  {
    title: t('sidebar.actionPlans'),
    url: '/planos-acao',
    icon: ListTodo,
    moduleName: 'planos-acao',
  },
  {
    title: t('sidebar.assetManagement'),
    icon: Database,
    subItems: [
      { title: t('sidebar.assets'), url: '/ativos', icon: Server, moduleName: 'ativos' },
      { title: t('sidebar.licenses'), url: '/ativos/licencas', icon: FileKey, moduleName: 'ativos' },
      { title: t('sidebar.keys'), url: '/ativos/chaves', icon: KeyRound, moduleName: 'ativos' },
    ],
  },
  {
    title: t('sidebar.riskManagement'),
    url: '/riscos',
    icon: AlertTriangle,
    moduleName: 'riscos',
  },
  {
    title: t('sidebar.gapAnalysis'),
    icon: BarChart3,
    subItems: [
      { title: t('sidebar.frameworks'), url: '/gap-analysis/frameworks', icon: FileText, moduleName: 'gap-analysis' },
      { title: t('sidebar.adherenceAssessment'), url: '/gap-analysis/avaliacao-aderencia', icon: Search, moduleName: 'gap-analysis' },
    ],
  },
  {
    title: t('sidebar.governance'),
    icon: FileCheck,
    subItems: [
      { title: t('sidebar.internalControls'), url: '/governanca', icon: Shield, moduleName: 'controles' },
      { title: t('sidebar.systems'), url: '/sistemas', icon: Server, moduleName: 'controles' },
    ],
  },
  {
    title: t('sidebar.contracts'),
    url: '/contratos',
    icon: Handshake,
    moduleName: 'contratos',
  },
  {
    title: t('sidebar.documents'),
    url: '/documentos',
    icon: FileText,
    moduleName: 'documentos',
  },
  {
    title: t('sidebar.security'),
    icon: Lock,
    subItems: [
      { title: t('sidebar.privilegedAccounts'), url: '/contas-privilegiadas', icon: Users, moduleName: 'contas-privilegiadas' },
      { title: t('sidebar.accessReview'), url: '/revisao-acessos', icon: CheckSquare, moduleName: 'contas-privilegiadas' },
      { title: t('sidebar.incidents'), url: '/incidentes', icon: AlertCircle, moduleName: 'incidentes' },
    ],
  },
  {
    title: t('sidebar.privacy'),
    url: '/privacidade',
    icon: Shield,
    moduleName: 'dados',
  },
  {
    title: t('sidebar.compliance'),
    icon: CheckSquare,
    subItems: [
      { title: t('sidebar.dueDiligence'), url: '/due-diligence', icon: BookOpen, moduleName: 'due-diligence' },
      { title: t('sidebar.whistleblowing'), url: '/denuncia', icon: MessageSquare, moduleName: 'denuncia' },
      { title: t('sidebar.policies'), url: '/politicas', icon: GraduationCap, moduleName: 'politicas' },
    ],
  },
  {
    title: t('sidebar.reports'),
    url: '/relatorios',
    icon: FileBarChart,
    moduleName: 'relatorios',
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { signOut, company, logoUpdateKey } = useAuth();
  const { canAccess } = usePermissions();
  const { t } = useLanguage();
  const location = useLocation();
  const currentPath = location.pathname;
  const menuItems = getMenuItems(t);
  
  // Function to get which group contains the active route
  const getActiveGroup = () => {
    for (const item of menuItems) {
      if (item.subItems) {
        const hasActiveSubItem = item.subItems.some(subItem => currentPath === subItem.url);
        if (hasActiveSubItem) {
          return item.title;
        }
      }
    }
    return null;
  };

  // Start with groups that contain active routes open
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const isCollapsed = state === 'collapsed';

  // Open group automatically when it contains the active route
  useEffect(() => {
    const activeGroup = getActiveGroup();
    if (activeGroup && !openGroups.includes(activeGroup)) {
      setOpenGroups([activeGroup]);
    }
  }, [currentPath]);

  const toggleGroup = (groupTitle: string) => {
    setOpenGroups(prev => {
      if (prev.includes(groupTitle)) {
        return prev.filter(title => title !== groupTitle);
      }
      return [groupTitle];
    });
  };

  const isActive = (path: string) => currentPath === path;
  
  const hasActiveSubItem = (subItems: any[]) => {
    return subItems.some(subItem => currentPath === subItem.url);
  };

  // Função para fechar grupos ao navegar para item sem submenu
  const handleNavClick = () => {
    setOpenGroups([]);
  };
  
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? 'bg-primary/15 text-primary border-l-4 border-primary font-semibold shadow-sm' 
      : 'hover:bg-sidebar-accent/50 text-sidebar-foreground';

  const handleSignOut = () => {
    setShowLogoutConfirm(true);
  };

  const confirmSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Determina qual logo usar com cache busting melhorado
  const getLogoSrc = () => {
    if (company?.logo_url) {
      // Se o logo já tem timestamp, usar como está; senão, adicionar timestamp
      const hasTimestamp = company.logo_url.includes('?t=');
      return hasTimestamp ? company.logo_url : `${company.logo_url}?t=${Date.now()}`;
    }
    return logoMini;
  };

  const getLogoAlt = () => {
    return company?.nome || "Akuris";
  };

  // Função para verificar se um item tem acesso
  const hasAccess = (item: any) => {
    if (!item.moduleName) return true; // Se não tem moduleName, mostra por padrão
    return canAccess(item.moduleName);
  };

  // Filtrar itens do menu baseado nas permissões
  const getVisibleMenuItems = () => {
    return menuItems.filter(item => {
      if (item.subItems) {
        // Para grupos, mostrar se pelo menos um subitem tem acesso
        const visibleSubItems = item.subItems.filter(hasAccess);
        return visibleSubItems.length > 0;
      }
      return hasAccess(item);
    }).map(item => {
      if (item.subItems) {
        // Filtrar subitems por permissão
        return {
          ...item,
          subItems: item.subItems.filter(hasAccess)
        };
      }
      return item;
    });
  };

  return (
    <Sidebar
      className={`transition-all duration-300 ease-out ${isCollapsed ? 'w-14' : 'w-60'}`}
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-sidebar-border h-14 overflow-hidden">
        <div className="flex items-center justify-center px-1 py-2 h-full">
          <img 
            key={`sidebar-logo-${logoUpdateKey}-${Date.now()}`}
            src={getLogoSrc()} 
            alt={getLogoAlt()} 
            className={`object-contain transition-all duration-300 ease-out ${
              isCollapsed ? 'h-10 w-10' : 'h-[52px] w-auto max-w-full'
            }`}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = logoMini;
            }}
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="py-2 transition-all duration-300 ease-out">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {getVisibleMenuItems().map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.subItems ? (
                    <Collapsible
                      open={openGroups.includes(item.title)}
                      onOpenChange={() => toggleGroup(item.title)}
                    >
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton 
                        className={`w-full justify-between transition-colors duration-200 h-9 px-3 group ${
                            hasActiveSubItem(item.subItems) 
                              ? 'bg-primary/10 border-l-2 border-primary' 
                              : 'hover:bg-sidebar-accent/50'
                          }`}
                        >
                          <div className="flex items-center min-w-0">
                            <item.icon className={`h-4 w-4 mr-3 flex-shrink-0 transition-colors duration-200 ${
                              hasActiveSubItem(item.subItems) || openGroups.includes(item.title) 
                                ? 'text-primary' 
                                : ''
                            }`} />
                            {!isCollapsed && (
                              <span className={`text-sm font-medium transition-colors duration-200 truncate ${
                                hasActiveSubItem(item.subItems) 
                                  ? 'text-primary font-semibold' 
                                  : openGroups.includes(item.title) ? 'text-primary' : ''
                              }`}>
                                {item.title}
                              </span>
                            )}
                          </div>
                          {!isCollapsed && (
                             <ChevronDown 
                               className={`h-4 w-4 transition-transform duration-200 flex-shrink-0 ${
                                 openGroups.includes(item.title) 
                                   ? 'rotate-180 text-primary' 
                                   : ''
                               }`} 
                             />
                          )}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      {!isCollapsed && (
                         <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                          <div className="space-y-1 mt-2 ml-6 pl-2 border-l-2 border-sidebar-border/30">
                            {item.subItems.map((subItem) => (
                              <SidebarMenuButton 
                                key={subItem.title} 
                                asChild
                                className="transition-colors duration-200 h-9"
                              >
                                 <NavLink 
                                   to={subItem.url} 
                                   className={({ isActive }) => getNavCls({ isActive })}
                                 >
                                   <subItem.icon className={`h-4 w-4 mr-3 flex-shrink-0 transition-colors duration-200 ${
                                     isActive(subItem.url) ? 'text-primary' : ''
                                   }`} />
                                   <span className={`text-sm transition-colors duration-200 truncate ${
                                     isActive(subItem.url) ? 'text-primary font-semibold' : ''
                                   }`}>
                                     {subItem.title}
                                   </span>
                                 </NavLink>
                              </SidebarMenuButton>
                            ))}
                          </div>
                        </CollapsibleContent>
                      )}
                    </Collapsible>
                  ) : (
                    <SidebarMenuButton asChild className="transition-colors duration-200 h-9 min-w-0 px-3">
                      <NavLink 
                        to={item.url} 
                        onClick={handleNavClick}
                        className={({ isActive }) => `flex items-center w-full min-w-0 ${getNavCls({ isActive })}`}
                      >
                        <div className="flex items-center min-w-0">
                          <item.icon className={`h-4 w-4 mr-3 flex-shrink-0 transition-colors duration-200 ${
                            isActive(item.url) ? 'text-primary' : ''
                          }`} />
                          {!isCollapsed && (
                            <span className={`text-sm font-medium transition-colors duration-200 truncate ${
                              isActive(item.url) ? 'text-primary font-semibold' : ''
                            }`}>
                              {item.title}
                            </span>
                          )}
                        </div>
                      </NavLink>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {canAccess('configuracoes') && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="transition-colors duration-200 h-9">
                    <NavLink 
                      to="/configuracoes" 
                      onClick={handleNavClick}
                      className={({ isActive }) => getNavCls({ isActive })}
                    >
                      <Settings className={`h-4 w-4 mr-3 flex-shrink-0 transition-colors duration-200 ${
                        isActive('/configuracoes') ? 'text-primary' : ''
                      }`} />
                      {!isCollapsed && (
                         <span className={`text-sm font-medium transition-colors duration-200 truncate ${
                           isActive('/configuracoes') ? 'text-primary font-semibold' : ''
                         }`}>
                           {t('sidebar.settings')}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSignOut}
            className={`w-full text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors duration-200 h-9 px-3 ${
              isCollapsed ? 'justify-center' : 'justify-start'
            }`}
          >
            <LogOut className={`h-4 w-4 flex-shrink-0 ${!isCollapsed ? 'mr-3' : ''}`} />
            {!isCollapsed && (
              <span className="text-sm font-medium truncate">
                {t('sidebar.logout')}
              </span>
            )}
          </Button>
        </div>
      </SidebarFooter>

      <ConfirmDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        title={t('sidebar.confirmLogout')}
        description={t('sidebar.confirmLogoutDesc')}
        confirmText={t('sidebar.logout')}
        cancelText={t('common.cancel')}
        variant="destructive"
        onConfirm={confirmSignOut}
      />
    </Sidebar>
  );
}
