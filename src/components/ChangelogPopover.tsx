import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap, Shield } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface ChangelogItem {
  type: 'feature' | 'improvement' | 'fix';
  text: string;
}

interface ChangelogEntry {
  id: string;
  version: string;
  release_date: string;
  items: ChangelogItem[];
  created_at: string;
}

const typeConfig = {
  feature: { label: 'Novo', variant: 'default' as const },
  improvement: { label: 'Melhoria', variant: 'secondary' as const },
  fix: { label: 'Correção', variant: 'outline' as const },
};

const SEEN_KEY = 'changelog_last_seen_version';

export function ChangelogPopover() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasNew, setHasNew] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('changelog_entries')
          .select('*')
          .order('release_date', { ascending: false })
          .limit(10);

        if (error) {
          console.warn('Changelog not available:', error.message);
          setEntries([]);
        } else {
          const parsed = (data || []).map((d: any) => ({
            ...d,
            items: Array.isArray(d.items) ? d.items : [],
          }));
          setEntries(parsed);

          const lastSeen = localStorage.getItem(SEEN_KEY);
          if (parsed.length > 0 && parsed[0].version !== lastSeen) {
            setHasNew(true);
          }
        }
      } catch {
        setEntries([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleOpen = (open: boolean) => {
    if (open && entries.length > 0) {
      localStorage.setItem(SEEN_KEY, entries[0].version);
      setHasNew(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <Popover onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Sparkles className="h-4 w-4" />
          {hasNew && (
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <h4 className="font-semibold text-sm">Novidades</h4>
          <p className="text-xs text-muted-foreground">Últimas atualizações da plataforma</p>
        </div>
        <ScrollArea className="h-80">
          <div className="p-4 space-y-6">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ) : entries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma atualização disponível</p>
            ) : (
              entries.map((entry) => (
                <div key={entry.id} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-mono">{entry.version}</Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(entry.release_date)}</span>
                  </div>
                  <ul className="space-y-2">
                    {entry.items.map((item, i) => {
                      const config = typeConfig[item.type] || typeConfig.improvement;
                      return (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Badge variant={config.variant} className="text-[10px] px-1.5 py-0 shrink-0 mt-0.5">
                            {config.label}
                          </Badge>
                          <span className="text-muted-foreground">{item.text}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
