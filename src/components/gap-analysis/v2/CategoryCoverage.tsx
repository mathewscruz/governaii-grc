import { useState } from 'react';
import { ExecutiveBar, ExecutivePanel } from '@/components/ui/executive-summary';
import { useLanguage } from '@/contexts/LanguageContext';

interface Category { categoria: string; filterCategory?: string; score: number; conforme: number; parcial: number; nao_conforme: number; nao_aplicavel: number; total: number }
export function CategoryCoverage({ categories, onSelect }: { categories: Category[]; onSelect: (category: string) => void }) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const applicable = categories.filter(c => c.total > c.nao_aplicavel).sort((a, b) => Number(b.conforme + b.parcial + b.nao_conforme > 0) - Number(a.conforme + a.parcial + a.nao_conforme > 0) || a.score - b.score || a.categoria.localeCompare(b.categoria));
  if (applicable.length === 0) return null;
  return <ExecutivePanel>
    <header className="px-4 pt-4">
      <h2 className="text-sm font-semibold">{t('executive.categories')}</h2>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{t('executive.categoriesHint')}</p>
    </header>
    <div className="p-2">
      {(expanded ? applicable : applicable.slice(0, 3)).map(c => {
        const assessed = c.conforme + c.parcial + c.nao_conforme;
        return <button type="button" key={c.categoria} onClick={() => onSelect(c.filterCategory ?? c.categoria)} className="executive-row block w-full rounded-lg p-2 text-left">
          <span className="mb-2 flex items-baseline justify-between gap-3 text-xs">
            <span className="font-medium">{c.categoria}</span><span className="shrink-0 font-semibold tabular-nums">{assessed ? `${c.score}%` : '—'}</span>
          </span>
          <ExecutiveBar value={assessed ? c.score : null} label={c.categoria} />
          <span className="mt-1 block text-xs text-muted-foreground">{t('executive.categoryCoverage', { done: assessed, total: c.total - c.nao_aplicavel })}</span>
        </button>;
      })}
    </div>
    {applicable.length > 3 && <button type="button" aria-expanded={expanded} onClick={() => setExpanded(v => !v)} className="executive-row min-h-10 w-full border-t border-border/60 px-4 text-left text-xs font-medium text-primary">
      {expanded ? t('executive.showLess') : t('executive.showMore', { count: applicable.length - 3 })}
    </button>}
  </ExecutivePanel>;
}
