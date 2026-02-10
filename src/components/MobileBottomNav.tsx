import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, AlertTriangle, Shield, FileText, Settings, MoreHorizontal } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { 
  Database, BarChart3, Lock, CheckSquare, HardDrive, 
  FileBarChart, GraduationCap, MessageSquare, BookOpen, ListTodo
} from 'lucide-react';

const mainNavItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Riscos', url: '/riscos', icon: AlertTriangle },
  { title: 'Controles', url: '/governanca', icon: Shield },
  { title: 'Docs', url: '/documentos', icon: FileText },
];

const moreNavItems = [
  { title: 'Planos de Ação', url: '/planos-acao', icon: ListTodo },
  { title: 'Ativos', url: '/ativos', icon: Database },
  { title: 'Gap Analysis', url: '/gap-analysis/frameworks', icon: BarChart3 },
  { title: 'Segurança', url: '/contas-privilegiadas', icon: Lock },
  { title: 'Incidentes', url: '/incidentes', icon: HardDrive },
  { title: 'Privacidade', url: '/privacidade', icon: Shield },
  { title: 'Due Diligence', url: '/due-diligence', icon: BookOpen },
  { title: 'Compliance', url: '/denuncia', icon: CheckSquare },
  { title: 'Políticas', url: '/politicas', icon: GraduationCap },
  { title: 'Relatórios', url: '/relatorios', icon: FileBarChart },
  { title: 'Configurações', url: '/configuracoes', icon: Settings },
];

export function MobileBottomNav() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  if (!isMobile) return null;

  const isActive = (url: string) => location.pathname === url || location.pathname.startsWith(url + '/');

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around h-14 px-1">
          {mainNavItems.map(item => (
            <NavLink
              key={item.url}
              to={item.url}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full"
            >
              <item.icon className={`h-5 w-5 transition-colors ${isActive(item.url) ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-[10px] font-medium ${isActive(item.url) ? 'text-primary' : 'text-muted-foreground'}`}>
                {item.title}
              </span>
            </NavLink>
          ))}
          
          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full">
                <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground">Mais</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="pb-safe">
              <SheetHeader>
                <SheetTitle>Mais módulos</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-3 gap-3 mt-4 pb-4">
                {moreNavItems.map(item => (
                  <NavLink
                    key={item.url}
                    to={item.url}
                    onClick={() => setMoreOpen(false)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-colors ${
                      isActive(item.url) ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <item.icon className="h-6 w-6" />
                    <span className="text-xs font-medium text-center">{item.title}</span>
                  </NavLink>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
      {/* Spacer to prevent content from being hidden behind bottom nav */}
      <div className="h-14 md:hidden" />
    </>
  );
}
