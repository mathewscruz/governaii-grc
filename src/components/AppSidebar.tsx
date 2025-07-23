import React, { useState } from 'react';
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
  LayoutDashboard
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

const menuItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Gestão de Ativos',
    url: '/ativos',
    icon: Database,
  },
  {
    title: 'Gestão de Riscos',
    url: '/riscos',
    icon: AlertTriangle,
  },
  {
    title: 'Controles Internos',
    icon: FileCheck,
    subItems: [
      { title: 'Controles', url: '/controles', icon: Shield },
      { title: 'Auditorias', url: '/auditorias', icon: Search },
      { title: 'Contratos', url: '/contratos', icon: Handshake },
      { title: 'Documentos', url: '/documentos', icon: FileText },
    ],
  },
  {
    title: 'Segurança e Privacidade',
    icon: Lock,
    subItems: [
      { title: 'Contas Privilegiadas', url: '/contas-privilegiadas', icon: Users },
      { title: 'Incidentes', url: '/incidentes', icon: AlertCircle },
      { title: 'Dados', url: '/dados', icon: HardDrive },
    ],
  },
  {
    title: 'Compliance',
    icon: CheckSquare,
    subItems: [
      { title: 'Due Diligence', url: '/due-diligence', icon: BookOpen },
      { title: 'Canal de Denúncia', url: '/denuncia', icon: MessageSquare },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { signOut, company, logoUpdateKey } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Start with all groups collapsed
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const isCollapsed = state === 'collapsed';

  const toggleGroup = (groupTitle: string) => {
    setOpenGroups(prev => 
      prev.includes(groupTitle) 
        ? prev.filter(title => title !== groupTitle)
        : [...prev, groupTitle]
    );
  };

  const isActive = (path: string) => currentPath === path;
  
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent/50';

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
              {menuItems.map((item) => (
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
                              className={`h-4 w-4 transition-all duration-500 ease-out flex-shrink-0 ${
                                openGroups.includes(item.title) 
                                  ? 'transform rotate-180 text-primary scale-110' 
                                  : 'group-hover:scale-110 group-hover:rotate-12'
                              }`} 
                            />
                          )}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      {!isCollapsed && (
                        <CollapsibleContent className="transition-all duration-500 ease-out overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
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
                                <NavLink to={subItem.url} className={getNavCls}>
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
                      <NavLink to={item.url} className={getNavCls}>
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
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="transition-all duration-300 ease-out hover:scale-105 hover:shadow-sm h-9">
                  <NavLink to="/configuracoes" className={getNavCls}>
                    <Settings className="h-4 w-4 mr-3 flex-shrink-0 transition-all duration-300 ease-out" />
                    {!isCollapsed && (
                      <span className="text-sm font-medium transition-all duration-300 ease-out truncate">
                        Configurações
                      </span>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
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
