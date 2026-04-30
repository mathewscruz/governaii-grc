import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ExternalLink } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/icons/Icon';
import {
  AtivosIcon,
  RiscosIcon,
  IncidentesIcon,
  DocumentosIcon,
  DueDiligenceIcon,
  DenunciasIcon,
  ControlesIcon,
} from '@/components/icons';
import { Scale, ListChecks, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { logger } from '@/lib/logger';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type DrillDownKey =
  | 'ativos'
  | 'riscos'
  | 'incidentes'
  | 'planos'
  | 'contratos'
  | 'documentos'
  | 'due_diligence'
  | 'denuncias'
  | 'controles';

interface DrillItem {
  id: string;
  title: string;
  subtitle?: string;
  status?: string;
  tone?: 'destructive' | 'warning' | 'success' | 'info' | 'neutral' | 'primary';
  date?: string;
}

interface DrillConfig {
  title: string;
  description: string;
  icon: React.ElementType;
  route: string;
  fetcher: (empresaId: string) => Promise<DrillItem[]>;
}

const fmtDate = (iso?: string | null) => {
  if (!iso) return undefined;
  try {
    return format(parseISO(iso), "dd 'de' MMM", { locale: ptBR });
  } catch {
    return undefined;
  }
};

const buildConfig = (key: DrillDownKey): DrillConfig => {
  switch (key) {
    case 'riscos':
      return {
        title: 'Riscos prioritários',
        description: 'Top 5 riscos ativos por severidade.',
        icon: RiscosIcon,
        route: '/riscos',
        fetcher: async (empresaId) => {
          const { data, error } = await supabase
            .from('riscos')
            .select('id, titulo, severidade, status, updated_at')
            .eq('empresa_id', empresaId)
            .neq('status', 'aceito')
            .order('severidade', { ascending: false })
            .limit(5);
          if (error) throw error;
          return (data || []).map((r: any) => ({
            id: r.id,
            title: r.titulo,
            subtitle: r.status,
            status: r.severidade,
            variant: r.severidade === 'critico' ? 'destructive' : r.severidade === 'alto' ? 'warning' : 'neutral',
            date: fmtDate(r.updated_at),
          }));
        },
      };
    case 'incidentes':
      return {
        title: 'Incidentes ativos',
        description: 'Incidentes em aberto ou investigação.',
        icon: IncidentesIcon,
        route: '/incidentes',
        fetcher: async (empresaId) => {
          const { data, error } = await supabase
            .from('incidentes')
            .select('id, titulo, status, severidade, created_at')
            .eq('empresa_id', empresaId)
            .in('status', ['aberto', 'investigacao'])
            .order('created_at', { ascending: false })
            .limit(5);
          if (error) throw error;
          return (data || []).map((i: any) => ({
            id: i.id,
            title: i.titulo,
            subtitle: i.status,
            status: i.severidade,
            variant: i.severidade === 'critico' ? 'destructive' : 'warning',
            date: fmtDate(i.created_at),
          }));
        },
      };
    case 'planos':
      return {
        title: 'Planos de ação pendentes',
        description: 'Itens em aberto, priorizando atrasados.',
        icon: ListChecks,
        route: '/planos-acao',
        fetcher: async (empresaId) => {
          const { data, error } = await supabase
            .from('planos_acao')
            .select('id, titulo, status, prazo, created_at')
            .eq('empresa_id', empresaId)
            .neq('status', 'concluido')
            .order('prazo', { ascending: true, nullsFirst: false })
            .limit(5);
          if (error) throw error;
          const today = new Date().toISOString().slice(0, 10);
          return (data || []).map((p: any) => {
            const overdue = p.prazo && p.prazo < today;
            return {
              id: p.id,
              title: p.titulo,
              subtitle: p.status,
              status: overdue ? 'atrasado' : p.status,
              tone: (overdue ? 'destructive' : 'info') as DrillItem['variant'],
              date: fmtDate(p.prazo),
            };
          });
        },
      };
    case 'ativos':
      return {
        title: 'Ativos recentes',
        description: 'Ativos atualizados recentemente.',
        icon: AtivosIcon,
        route: '/ativos',
        fetcher: async (empresaId) => {
          const { data, error } = await supabase
            .from('ativos')
            .select('id, nome, tipo, criticidade, updated_at')
            .eq('empresa_id', empresaId)
            .order('updated_at', { ascending: false })
            .limit(5);
          if (error) throw error;
          return (data || []).map((a: any) => ({
            id: a.id,
            title: a.nome,
            subtitle: a.tipo,
            status: a.criticidade,
            variant: a.criticidade === 'alta' ? 'warning' : 'default',
            date: fmtDate(a.updated_at),
          }));
        },
      };
    case 'contratos':
      return {
        title: 'Contratos vencendo',
        description: 'Contratos com vencimento próximo ou expirados.',
        icon: Scale,
        route: '/contratos',
        fetcher: async (empresaId) => {
          const { data, error } = await supabase
            .from('contratos')
            .select('id, titulo, status, data_fim')
            .eq('empresa_id', empresaId)
            .order('data_fim', { ascending: true, nullsFirst: false })
            .limit(5);
          if (error) throw error;
          const today = new Date().toISOString().slice(0, 10);
          return (data || []).map((c: any) => {
            const expired = c.data_fim && c.data_fim < today;
            return {
              id: c.id,
              title: c.titulo,
              subtitle: c.status,
              status: expired ? 'vencido' : c.status,
              tone: (expired ? 'destructive' : 'info') as DrillItem['variant'],
              date: fmtDate(c.data_fim),
            };
          });
        },
      };
    case 'documentos':
      return {
        title: 'Documentos relevantes',
        description: 'Pendentes de aprovação ou vencendo.',
        icon: DocumentosIcon,
        route: '/documentos',
        fetcher: async (empresaId) => {
          const { data, error } = await supabase
            .from('documentos')
            .select('id, titulo, status, data_revisao')
            .eq('empresa_id', empresaId)
            .order('data_revisao', { ascending: true, nullsFirst: false })
            .limit(5);
          if (error) throw error;
          return (data || []).map((d: any) => ({
            id: d.id,
            title: d.titulo,
            subtitle: d.status,
            status: d.status,
            tone: (d.status === 'pendente_aprovacao' ? 'warning' : 'info') as DrillItem['variant'],
            date: fmtDate(d.data_revisao),
          }));
        },
      };
    case 'due_diligence':
      return {
        title: 'Due Diligence',
        description: 'Avaliações ativas e expiradas.',
        icon: DueDiligenceIcon,
        route: '/due-diligence',
        fetcher: async (empresaId) => {
          const { data, error } = await supabase
            .from('due_diligence_assessments')
            .select('id, terceiro_nome, status, score, updated_at')
            .eq('empresa_id', empresaId)
            .order('updated_at', { ascending: false })
            .limit(5);
          if (error) throw error;
          return (data || []).map((d: any) => ({
            id: d.id,
            title: d.terceiro_nome,
            subtitle: d.status,
            status: typeof d.score === 'number' ? `Score ${d.score}` : undefined,
            tone: (d.score < 50 ? 'destructive' : d.score < 70 ? 'warning' : 'success') as DrillItem['variant'],
            date: fmtDate(d.updated_at),
          }));
        },
      };
    case 'denuncias':
      return {
        title: 'Denúncias abertas',
        description: 'Casos novos ou em andamento.',
        icon: DenunciasIcon,
        route: '/denuncia',
        fetcher: async (empresaId) => {
          const { data, error } = await supabase
            .from('denuncias')
            .select('id, protocolo, categoria, status, created_at')
            .eq('empresa_id', empresaId)
            .in('status', ['novas', 'em_andamento'])
            .order('created_at', { ascending: false })
            .limit(5);
          if (error) throw error;
          return (data || []).map((d: any) => ({
            id: d.id,
            title: d.protocolo || d.categoria || 'Denúncia',
            subtitle: d.categoria,
            status: d.status,
            variant: 'warning' as DrillItem['variant'],
            date: fmtDate(d.created_at),
          }));
        },
      };
    case 'controles':
      return {
        title: 'Controles',
        description: 'Controles ativos.',
        icon: ControlesIcon,
        route: '/sistemas',
        fetcher: async () => [],
      };
    default:
      return {
        title: 'Detalhes',
        description: '',
        icon: AlertCircle,
        route: '/dashboard',
        fetcher: async () => [],
      };
  }
};

interface KpiDrillDownDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kpiKey: DrillDownKey | null;
}

export const KpiDrillDownDrawer: React.FC<KpiDrillDownDrawerProps> = ({ open, onOpenChange, kpiKey }) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const empresaId = profile?.empresa_id;

  const config = React.useMemo(() => (kpiKey ? buildConfig(kpiKey) : null), [kpiKey]);

  const { data: items, isLoading, isError } = useQuery({
    queryKey: ['drill-down', kpiKey, empresaId],
    queryFn: async () => {
      if (!config || !empresaId) return [];
      try {
        return await config.fetcher(empresaId);
      } catch (e) {
        logger.error('drill-down fetch failed', e);
        throw e;
      }
    },
    enabled: open && !!config && !!empresaId,
    staleTime: 30_000,
  });

  if (!config) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon as={config.icon} size="md" className="text-primary" />
            </div>
            <div className="min-w-0">
              <SheetTitle className="truncate">{config.title}</SheetTitle>
              <SheetDescription className="text-xs">{config.description}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6 py-4 space-y-2">
          {isLoading && (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </>
          )}
          {isError && (
            <EmptyState
              title="Não foi possível carregar"
              description="Tente novamente em instantes."
              icon={AlertCircle}
            />
          )}
          {!isLoading && !isError && (items?.length ?? 0) === 0 && (
            <EmptyState
              title="Nada por aqui"
              description="Não há itens prioritários para exibir agora."
              icon={config.icon as any}
              variant="illustrated"
            />
          )}
          {!isLoading &&
            !isError &&
            items?.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onOpenChange(false);
                  navigate(`${config.route}?focus=${item.id}`);
                }}
                className="w-full text-left p-3 rounded-lg border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all flex items-start justify-between gap-3 group"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-foreground truncate">{item.title}</div>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    {item.status && (
                      <StatusBadge label={item.status} variant={item.variant ?? 'default'} size="sm" />
                    )}
                    {item.date && (
                      <span className="text-[11px] text-muted-foreground tabular-nums">{item.date}</span>
                    )}
                  </div>
                </div>
                <Icon
                  as={ExternalLink}
                  size="sm"
                  className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5"
                />
              </button>
            ))}
        </div>

        <SheetFooter>
          <Button
            variant="default"
            className="w-full"
            onClick={() => {
              onOpenChange(false);
              navigate(config.route);
            }}
          >
            Ver todos
            <Icon as={ArrowRight} size="sm" className="ml-2" />
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default KpiDrillDownDrawer;
