
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
  const { signOut } = useAuth();
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

  return (
    <Sidebar
      className={isCollapsed ? 'w-14' : 'w-60'}
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-sidebar-border h-14">
        <div className="flex items-center justify-center px-1 py-2 h-full">
          <img 
            src={isCollapsed ? logoMini : "https://lnlkahtugwmkznasapfd.supabase.co/storage/v1/object/sign/logotipo/Governiaa%20(500%20x%20200%20px)%20(15).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82NTdhMjYzYS1jZjc1LTQ3OGYtYjNkMy01NWM2ODViMTQ0MTEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJsb2dvdGlwby9Hb3Zlcm5pYWEgKDUwMCB4IDIwMCBweCkgKDE1KS5wbmciLCJpYXQiOjE3NTMyMDEzODIsImV4cCI6MTc4NDczNzM4Mn0.AjG5UVNIcJcoMc_MVu3tIGUbLQGe77VhUeeSlEa5-1o"} 
            alt="GovernAII" 
            className={`object-contain transition-all duration-300 ${
              isCollapsed ? 'h-12 w-12' : 'h-12 w-auto max-w-[200px]'
            }`}
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="py-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.subItems ? (
                    <Collapsible
                      open={openGroups.includes(item.title)}
                      onOpenChange={() => toggleGroup(item.title)}
                    >
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className="w-full justify-between hover:bg-sidebar-accent/50 transition-all duration-200 h-10 px-3 group">
                          <div className="flex items-center">
                            <item.icon className={`h-4 w-4 mr-3 flex-shrink-0 transition-all duration-300 ${
                              openGroups.includes(item.title) ? 'text-primary scale-110' : ''
                            }`} />
                            {!isCollapsed && <span className="text-sm font-medium transition-colors duration-200">{item.title}</span>}
                          </div>
                          {!isCollapsed && (
                            <ChevronDown 
                              className={`h-4 w-4 transition-all duration-500 ease-out flex-shrink-0 ${
                                openGroups.includes(item.title) 
                                  ? 'transform rotate-180 text-primary scale-110' 
                                  : 'group-hover:scale-105'
                              }`} 
                            />
                          )}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      {!isCollapsed && (
                        <CollapsibleContent className="transition-all duration-500 ease-out overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                          <div className="space-y-1 mt-1 ml-4 animate-fade-in">
                            {item.subItems.map((subItem, index) => (
                              <SidebarMenuButton 
                                key={subItem.title} 
                                asChild
                                className="transform transition-all duration-200 hover:translate-x-1 hover:scale-105"
                                style={{ 
                                  animationDelay: openGroups.includes(item.title) ? `${index * 50}ms` : '0ms'
                                }}
                              >
                                <NavLink to={subItem.url} className={getNavCls}>
                                  <subItem.icon className="h-4 w-4 mr-3 flex-shrink-0 transition-colors duration-200" />
                                  <span className="text-sm transition-colors duration-200">{subItem.title}</span>
                                </NavLink>
                              </SidebarMenuButton>
                            ))}
                          </div>
                        </CollapsibleContent>
                      )}
                    </Collapsible>
                  ) : (
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavCls}>
                        <item.icon className="h-4 w-4 mr-3 flex-shrink-0" />
                        {!isCollapsed && <span className="text-sm font-medium">{item.title}</span>}
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
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/configuracoes" className={getNavCls}>
                    <Settings className="h-4 w-4 mr-3 flex-shrink-0" />
                    {!isCollapsed && <span className="text-sm font-medium">Configurações</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
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
            className={`w-full text-sidebar-foreground hover:bg-sidebar-accent/50 h-10 px-3 ${
              isCollapsed ? 'justify-center' : 'justify-start'
            }`}
          >
            <LogOut className={`h-4 w-4 flex-shrink-0 ${!isCollapsed ? 'mr-3' : ''}`} />
            {!isCollapsed && <span className="text-sm font-medium">Sair</span>}
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
