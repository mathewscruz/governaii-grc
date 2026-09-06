import { useEffect, useMemo, useState } from 'react';
import { IconArrowRight, IconCalendarClock, IconUsers } from '@/components/icons';
import { ExecutivePanel } from '@/components/ui/executive-summary';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDateOnly, parseDataLocal } from '@/lib/date-utils';
import { cn } from '@/lib/utils';

export interface RoadmapItem {
  id: string;
  title: string;
  context?: string | null;
  owner?: string | null;
  deadline?: string | null;
  priority: string;
  status: string;
  done?: boolean;
  onOpen: () => void;
}

function dateOrder(date?: string | null) {
  const time = date ? parseDataLocal(date).getTime() : NaN;
  return Number.isFinite(time) ? time : Infinity;
}
/** Only recorded dates determine the roadmap. No generated deadlines or risk estimates. */
export function orderRoadmap(items: RoadmapItem[]) {
  return [...items].sort((a, b) => Number(!!a.done) - Number(!!b.done)
    || (dateOrder(a.deadline) === dateOrder(b.deadline) ? 0 : dateOrder(a.deadline) < dateOrder(b.deadline) ? -1 : 1)
    || a.title.localeCompare(b.title) || a.id.localeCompare(b.id));
}

export function ActionRoadmap({ items }: { items: RoadmapItem[] }) {
  const { t } = useLanguage();
  const [page, setPage] = useState(0);
  const ordered = useMemo(() => orderRoadmap(items), [items]);
  const signature = ordered.map(item => item.id).join('|');
  useEffect(() => setPage(0), [signature]);
  const size = 10;
  const pages = Math.max(1, Math.ceil(ordered.length / size));
  const current = Math.min(page, pages - 1);
  const today = new Date(); today.setHours(0, 0, 0, 0);

  return <ExecutivePanel aria-label={t('executive.roadmap')}>
    <header className="executive-tint border-b border-border/60 p-4">
      <h3 className="text-base font-semibold">{t('executive.roadmap')}</h3>
      <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">{t('executive.roadmapHint')}</p>
    </header>
    {ordered.length === 0 ? <p className="p-6 text-sm text-muted-foreground">{t('executive.emptyRoadmap')}</p> : <>
      <div aria-hidden="true" className="hidden grid-cols-[2rem_minmax(0,1fr)_8rem_13rem_1rem] gap-4 border-b border-border/60 px-4 py-2 text-xs text-muted-foreground lg:grid">
        <span>#</span><span>{t('executive.context')}</span><span>{t('planosAcao.columnStatus')}</span><span>{t('executive.ownerDeadline')}</span>
      </div>
      <ol start={current * size + 1} className="divide-y divide-border/60">
        {ordered.slice(current * size, (current + 1) * size).map((item, index) => {
          const validDate = Number.isFinite(dateOrder(item.deadline));
          const overdue = !item.done && validDate && dateOrder(item.deadline) < today.getTime();
          return <li key={item.id}>
            <button type="button" onClick={item.onOpen} aria-label={`${t('executive.openPlan')}: ${item.title}`}
              className="executive-row group grid w-full grid-cols-[2rem_minmax(0,1fr)_1rem] items-start gap-x-3 gap-y-2 p-4 text-left lg:grid-cols-[2rem_minmax(0,1fr)_8rem_13rem_1rem] lg:gap-x-4">
              <span className={cn('flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold tabular-nums', overdue ? 'border-destructive/25 bg-destructive/5 text-destructive' : 'border-primary/20 bg-primary/5 text-primary')}>
                {String(current * size + index + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-5 group-hover:text-primary">{item.title}</span>
                {item.context && <span className="mt-1 block text-xs leading-5 text-muted-foreground">{item.context}</span>}
              </span>
              <span className="col-start-2 min-w-0 text-xs leading-5 lg:col-start-auto">
                <span className="block font-medium">{item.status}</span>
                <span className="text-muted-foreground">{t('planosAcao.columnPriority')}: {item.priority}</span>
              </span>
              <span className="col-start-2 min-w-0 text-xs leading-5 lg:col-start-auto">
                <span className="flex items-center gap-1.5 text-muted-foreground"><IconUsers className="h-3.5 w-3.5 shrink-0" />{item.owner || t('executive.noOwner')}</span>
                <span className={cn('mt-1 flex items-center gap-1.5 tabular-nums', overdue ? 'font-medium text-destructive' : 'text-muted-foreground')}>
                  <IconCalendarClock className="h-3.5 w-3.5 shrink-0" />
                  {validDate ? formatDateOnly(item.deadline!) : t('executive.noDeadline')}
                  {overdue && item.status !== t('planosAcao.statusAtrasado') && <> · {t('planosAcao.statusAtrasado')}</>}
                </span>
              </span>
              <IconArrowRight className="col-start-3 row-start-1 mt-1 h-4 w-4 text-muted-foreground group-hover:text-primary lg:col-start-auto lg:row-start-auto" aria-hidden="true" />
            </button>
          </li>;
        })}
      </ol>
      {pages > 1 && <nav aria-label={t('executive.roadmap')} className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 px-4 py-2">
        <p className="text-xs text-muted-foreground">{t('executive.roadmapCount', { shown: Math.min((current + 1) * size, ordered.length), total: ordered.length })}</p>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" disabled={current === 0} onClick={() => setPage(current - 1)}>{t('executive.previous')}</Button>
          <Button size="sm" variant="ghost" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>{t('executive.next')}</Button>
        </div>
      </nav>}
    </>}
  </ExecutivePanel>;
}
