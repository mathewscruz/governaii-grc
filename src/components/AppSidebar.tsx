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
  BarChart3
} from 'lucide-react';
import logoMini from '@/assets/governaii-logo-mini.png';
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

const menuItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
    moduleName: 'dashboard',
  },
  {
    title: 'Gestão de Ativos',
    url: '/ativos',
    icon: Database,
    moduleName: 'ativos',
  },
  {
    title: 'Gestão de Riscos',
    url: '/riscos',
    icon: AlertTriangle,
    moduleName: 'riscos',
  },
  {
    title: 'Gap Analysis',
    url: '/gap-analysis',
    icon: BarChart3,
    moduleName: 'gap-analysis',
  },
  {
    title: 'Controles Internos',
    icon: FileCheck,
    subItems: [
      { title: 'Controles', url: '/controles', icon: Shield, moduleName: 'controles' },
      { title: 'Auditorias', url: '/auditorias', icon: Search, moduleName: 'auditorias' },
      { title: 'Contratos', url: '/contratos', icon: Handshake, moduleName: 'contratos' },
      { title: 'Documentos', url: '/documentos', icon: FileText, moduleName: 'documentos' },
    ],
  },
  {
    title: 'Segurança e Privacidade',
    icon: Lock,
    subItems: [
      { title: 'Contas Privilegiadas', url: '/contas-privilegiadas', icon: Users, moduleName: 'contas-privilegiadas' },
      { title: 'Incidentes', url: '/incidentes', icon: AlertCircle, moduleName: 'incidentes' },
      { title: 'Dados', url: '/dados', icon: HardDrive, moduleName: 'dados' },
    ],
  },
  {
    title: 'Compliance',
    icon: CheckSquare,
    subItems: [
      { title: 'Due Diligence', url: '/due-diligence', icon: BookOpen, moduleName: 'due-diligence' },
      { title: 'Canal de Denúncia', url: '/denuncia', icon: MessageSquare, moduleName: 'denuncia' },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { signOut, company, logoUpdateKey } = useAuth();
  const { canAccess } = usePermissions();
  const location = useLocation();
  const currentPath = location.pathname;
  
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
      setOpenGroups(prev => [...prev, activeGroup]);
    }
  }, [currentPath]);

  const toggleGroup = (groupTitle: string) => {
    setOpenGroups(prev => 
      prev.includes(groupTitle) 
        ? prev.filter(title => title !== groupTitle)
        : [...prev, groupTitle]
    );
  };

  const isActive = (path: string) => currentPath === path;
  
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-primary/10 text-primary border-l-2 border-primary font-medium' : 'hover:bg-sidebar-accent/50';

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
    return isCollapsed ? logoMini : "https://lnlkahtugwmkznasapfd.supabase.co/storage/v1/object/sign/logotipo/Governiaa%20(500%20x%20200%20px)%20(15).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82NTdhMjYzYS1jZjc1LTQ3OGYtYjNkMy01NWM2ODViMTQ0MTEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJsb2dvdGlwby9Hb3Zlcm5pYWEgKDUwMCB4IDIwMCBweCkgKDE1KS5wbmciLCJpYXQiOjE3NTMyMDEzODIsImV4cCI6MTc4NDczNzM4Mn0.AjG5UVNIcJcoMc_MVu3tIGUbLQGe77VhUeeSlEa5-1o";
  };

  const getLogoAlt = () => {
    return company?.nome || "GovernAII";
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
              isCollapsed ? 'h-12 w-12' : 'h-12 w-auto max-w-[200px]'
            }`}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = isCollapsed ? logoMini : "https://lnlkahtugwmkznasapfd.supabase.co/storage/v1/object/sign/logotipo/Governiaa%20(500%20x%20200%20px)%20(15).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82NTdhMjYzYS1jZjc1LTQ3OGYtYjNkMy01NWM2ODViMTQ0MTEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJsb2dvdGlwby9Hb3Zlcm5pYWEgKDUwMCB4IDIwMCBweCkgKDE1KS5wbmciLCJpYXQiOjE3NTMyMDEzODIsImV4cCI6MTc4NDczNzM4Mn0.AjG5UVNIcJcoMc_MVu3tIGUbLQGe77VhUeeSlEa5-1o";
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
                        <SidebarMenuButton className="w-full justify-between hover:bg-sidebar-accent/50 transition-all duration-300 ease-out h-9 px-3 group hover:scale-105 hover:shadow-sm">
                          <div className="flex items-center min-w-0">
                            <item.icon className={`h-4 w-4 mr-3 flex-shrink-0 transition-all duration-300 ease-out ${
                              openGroups.includes(item.title) ? 'text-primary scale-110 rotate-3' : 'group-hover:scale-110'
                            }`} />
                            {!isCollapsed && (
                              <span className={`text-sm font-medium transition-all duration-300 ease-out truncate ${
                                openGroups.includes(item.title) ? 'text-primary' : ''
                              }`}>
                                {item.title}
                              </span>
                            )}
                          </div>
                          {!isCollapsed && (
                             <ChevronDown 
                               className={`h-4 w-4 transition-all duration-300 ease-out flex-shrink-0 ${
                                 openGroups.includes(item.title) 
                                   ? 'transform rotate-180 text-primary scale-110' 
                                   : 'group-hover:scale-110 group-hover:rotate-12'
                               }`} 
                             />
                          )}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      {!isCollapsed && (
                        <CollapsibleContent className="transition-all duration-300 ease-out overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                          <div className="space-y-1 mt-2 ml-6 pl-2 border-l-2 border-sidebar-border/30 animate-fade-in">
                            {item.subItems.map((subItem, index) => (
                              <SidebarMenuButton 
                                key={subItem.title} 
                                asChild
                                className="transform transition-all duration-300 ease-out hover:translate-x-2 hover:scale-105 hover:shadow-sm h-9"
                                style={{ 
                                  animationDelay: openGroups.includes(item.title) ? `${index * 75}ms` : '0ms'
                                }}
                              >
                                 <NavLink 
                                   to={subItem.url} 
                                   className={({ isActive }) => getNavCls({ isActive })}
                                 >
                                   <subItem.icon className="h-4 w-4 mr-3 flex-shrink-0 transition-all duration-300 ease-out" />
                                   <span className="text-sm transition-all duration-300 ease-out truncate">{subItem.title}</span>
                                 </NavLink>
                              </SidebarMenuButton>
                            ))}
                          </div>
                        </CollapsibleContent>
                      )}
                    </Collapsible>
                  ) : (
                    <SidebarMenuButton asChild className="transition-all duration-300 ease-out hover:scale-105 hover:shadow-sm h-9">
                      <NavLink to={item.url} className={({ isActive }) => getNavCls({ isActive })}>
                        <item.icon className="h-4 w-4 mr-3 flex-shrink-0 transition-all duration-300 ease-out" />
                        {!isCollapsed && (
                          <span className="text-sm font-medium transition-all duration-300 ease-out truncate">
                            {item.title}
                          </span>
                        )}
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
                  <SidebarMenuButton asChild className="transition-all duration-300 ease-out hover:scale-105 hover:shadow-sm h-9">
                    <NavLink to="/configuracoes" className={({ isActive }) => getNavCls({ isActive })}>
                      <Settings className="h-4 w-4 mr-3 flex-shrink-0 transition-all duration-300 ease-out" />
                      {!isCollapsed && (
                        <span className="text-sm font-medium transition-all duration-300 ease-out truncate">
                          Configurações
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

      <SidebarFooter className="border-t border-sidebar-border p-3 transition-all duration-300 ease-out">
        <div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSignOut}
            className={`w-full text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-300 ease-out hover:scale-105 hover:shadow-sm h-9 px-3 ${
              isCollapsed ? 'justify-center' : 'justify-start'
            }`}
          >
            <LogOut className={`h-4 w-4 flex-shrink-0 transition-all duration-300 ease-out ${!isCollapsed ? 'mr-3' : ''}`} />
            {!isCollapsed && (
              <span className="text-sm font-medium transition-all duration-300 ease-out truncate">
                Sair
              </span>
            )}
          </Button>
        </div>
      </SidebarFooter>

      <ConfirmDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        title="Confirmar saída"
        description="Tem certeza que deseja sair do sistema?"
        confirmText="Sair"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={confirmSignOut}
      />
    </Sidebar>
  );
}
