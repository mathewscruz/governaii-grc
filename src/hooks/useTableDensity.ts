import * as React from 'react';

export type TableDensity = 'compact' | 'comfortable';

const STORAGE_KEY = 'akuris.tableDensity';

const getInitialDensity = (): TableDensity => {
  if (typeof window === 'undefined') return 'comfortable';
  const stored = window.localStorage.getItem(STORAGE_KEY) as TableDensity | null;
  return stored === 'compact' || stored === 'comfortable' ? stored : 'comfortable';
};

/**
 * Densidade global de tabelas — persistida em localStorage.
 * Use em conjunto com `<DensityToggle />` para usuários alternarem por tela
 * sem perder a preferência.
 */
export function useTableDensity(): [TableDensity, (d: TableDensity) => void, () => void] {
  const [density, setDensityState] = React.useState<TableDensity>(getInitialDensity);

  // Sincroniza entre tabs/components
  React.useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === 'compact' || e.newValue === 'comfortable')) {
        setDensityState(e.newValue);
      }
    };
    window.addEventListener('storage', handler);

    // Custom event para mudanças no mesmo tab
    const localHandler = (e: Event) => {
      const detail = (e as CustomEvent<TableDensity>).detail;
      if (detail === 'compact' || detail === 'comfortable') setDensityState(detail);
    };
    window.addEventListener('akuris:density-change', localHandler);

    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('akuris:density-change', localHandler);
    };
  }, []);

  const setDensity = React.useCallback((d: TableDensity) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, d);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent('akuris:density-change', { detail: d }));
    setDensityState(d);
  }, []);

  const toggle = React.useCallback(() => {
    setDensity(density === 'compact' ? 'comfortable' : 'compact');
  }, [density, setDensity]);

  return [density, setDensity, toggle];
}
