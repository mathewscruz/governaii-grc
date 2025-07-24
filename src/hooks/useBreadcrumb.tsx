import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';

interface BreadcrumbItem {
  title: string;
  path: string;
}

const routeMap: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/ativos': 'Gestão de Ativos',
  '/riscos': 'Gestão de Riscos',
  '/gap-analysis': 'Gap Analysis',
  '/controles': 'Controles Internos',
  '/auditorias': 'Auditorias',
  '/contratos': 'Contratos',
  '/documentos': 'Documentos',
  '/contas-privilegiadas': 'Contas Privilegiadas',
  '/incidentes': 'Incidentes',
  '/dados': 'Proteção de Dados',
  '/configuracoes': 'Configurações',
  '/due-diligence': 'Due Diligence',
  '/denuncia': 'Canal de Denúncia'
};

export const useBreadcrumb = () => {
  const location = useLocation();

  const breadcrumbs = useMemo(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const items: BreadcrumbItem[] = [];

    // Always add Dashboard as first item if not on dashboard
    if (location.pathname !== '/dashboard') {
      items.push({ title: 'Dashboard', path: '/dashboard' });
    }

    // Build breadcrumbs from path segments
    let currentPath = '';
    pathSegments.forEach((segment) => {
      currentPath += `/${segment}`;
      const title = routeMap[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1);
      items.push({ title, path: currentPath });
    });

    return items;
  }, [location.pathname]);

  return breadcrumbs;
};