import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import type { ModuloKey } from '@/lib/planos-utils';

/**
 * Hook to check whether the current company's plan includes access to a given module.
 * Returns { allowed, loading, planName, requestUpgrade }.
 *
 * If no plan is associated, defaults to allow=true to avoid breaking older companies.
 */
export function useModuleAccess(moduleKey: ModuloKey) {
  const { profile } = useAuth();
  const empresaId = profile?.empresa_id;
  const [allowed, setAllowed] = useState(true);
  const [loading, setLoading] = useState(true);
  const [planName, setPlanName] = useState<string | null>(null);

  useEffect(() => {
    if (!empresaId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('empresas')
        .select('plano:planos(nome, modulos_habilitados)')
        .eq('id', empresaId)
        .maybeSingle();

      if (cancelled) return;

      const plano = data?.plano as any;
      if (!plano) {
        setAllowed(true);
        setLoading(false);
        return;
      }

      const modulos: string[] = Array.isArray(plano.modulos_habilitados) ? plano.modulos_habilitados : [];
      setPlanName(plano.nome || null);
      setAllowed(modulos.length === 0 ? true : modulos.includes(moduleKey));
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [empresaId, moduleKey]);

  return { allowed, loading, planName };
}
