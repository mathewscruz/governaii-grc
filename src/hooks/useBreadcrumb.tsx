import { useLocation } from 'react-router-dom';
import { useMemo, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BreadcrumbItem {
  title: string;
  path: string;
}

const routeMap: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/ativos': 'Gestão de Ativos',
  '/riscos': 'Gestão de Riscos',
  '/gap-analysis': 'Gap Analysis',
  '/gap-analysis/frameworks': 'Frameworks',
  '/gap-analysis/avaliacao-aderencia': 'Avaliação de Aderência',
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
  const [frameworkName, setFrameworkName] = useState<string | null>(null);

  // Detect if we're on a framework detail page
  const frameworkMatch = location.pathname.match(/\/gap-analysis\/framework\/([a-f0-9-]+)/);
  const frameworkId = frameworkMatch?.[1];

  useEffect(() => {
    if (frameworkId) {
      supabase
        .from('gap_analysis_frameworks')
        .select('nome')
        .eq('id', frameworkId)
        .single()
        .then(({ data }) => {
          if (data) {
            setFrameworkName(data.nome);
          }
        });
    } else {
      setFrameworkName(null);
    }
  }, [frameworkId]);

  const breadcrumbs = useMemo(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const items: BreadcrumbItem[] = [];

    // Always add Dashboard as first item if not on dashboard
    if (location.pathname !== '/dashboard') {
      items.push({ title: 'Dashboard', path: '/dashboard' });
    }

    // Build breadcrumbs from path segments
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Special handling for framework detail page
      if (segment === 'framework' && pathSegments[index + 1]) {
        items.push({ 
          title: frameworkName || 'Framework', 
          path: currentPath + `/${pathSegments[index + 1]}` 
        });
        return; // Skip the next segment (the ID)
      }
      
      // Skip the framework ID segment
      if (pathSegments[index - 1] === 'framework' && segment.match(/^[a-f0-9-]+$/)) {
        return;
      }
      
      const title = routeMap[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1);
      items.push({ title, path: currentPath });
    });

    return items;
  }, [location.pathname, frameworkName]);

  return breadcrumbs;
};