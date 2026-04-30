import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, AlertTriangle, FileCheck, FileText, Settings, MoreHorizontal } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Database, BarChart3, Lock, CheckSquare, AlertCircle, 
  FileBarChart, GraduationCap, BookOpen, ListTodo, Handshake, Eye
} from 'lucide-react';

export function MobileBottomNav() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const { t } = useLanguage();

  if (!isMobile) return null;

  const isActive = (url: string) => location.pathname === url || location.pathname.startsWith(url + '/');

  const mainNavItems = [
    { title: t('sidebar.dashboard'), url: '/dashboard', icon: LayoutDashboard },
    { title: t('sidebar.risks'), url: '/riscos', icon: AlertTriangle },
    { title: t('sidebar.internalControls'), url: '/governanca', icon: FileCheck },
    { title: t('sidebar.documents'), url: '/documentos', icon: FileText },
  ];

  const moreNavItems = [
    { title: t('sidebar.actionPlans'), url: '/planos-acao', icon: ListTodo },
    { title: t('sidebar.contracts'), url: '/contratos', icon: Handshake },
    { title: t('sidebar.assets'), url: '/ativos', icon: Database },
    { title: t('sidebar.gapAnalysis'), url: '/gap-analysis/frameworks', icon: BarChart3 },
    { title: t('sidebar.security'), url: '/contas-privilegiadas', icon: Lock },
    { title: t('sidebar.incidents'), url: '/incidentes', icon: AlertCircle },
    { title: t('sidebar.privacy'), url: '/privacidade', icon: Eye },
    { title: t('sidebar.dueDiligence'), url: '/due-diligence', icon: BookOpen },
    { title: t('sidebar.compliance'), url: '/denuncia', icon: CheckSquare },
    
    { title: t('sidebar.reports'), url: '/relatorios', icon: FileBarChart },
    { title: t('sidebar.settings'), url: '/configuracoes', icon: Settings },
  ];

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
                <span className="text-[10px] font-medium text-muted-foreground">{t('notifications.more')}</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="pb-safe">
              <SheetHeader>
                <SheetTitle>{t('notifications.moreModules')}</SheetTitle>
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
      <div className="h-14 md:hidden" />
    </>
  );
}
