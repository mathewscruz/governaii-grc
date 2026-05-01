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
import { AkurisPulse } from '@/components/ui/AkurisPulse';
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
import { Scale, ListChecks, AlertCircle, KeyRound, FileKey, ShieldCheck, Activity, Lock, Server, Eye, FileBarChart, ClipboardCheck, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { logger } from '@/lib/logger';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatStatus } from '@/lib/text-utils';

export type DrillDownKey =
  | 'ativos'
  | 'riscos'
  | 'incidentes'
  | 'planos'
  | 'contratos'
  | 'documentos'
  | 'due_diligence'
  | 'denuncias'
  | 'controles'
  | 'ativos_chaves'
  | 'ativos_licencas'
  | 'auditorias'
  | 'continuidade'
  | 'gap_analysis'
  | 'revisao_acessos'
  | 'privacidade'
  | 'riscos_aceite'
  | 'sistemas'
  | 'contas_privilegiadas';

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

const todayIso = () => new Date().toISOString().slice(0, 10);

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
            .select('id, nome, nivel_risco_residual, nivel_risco_inicial, status, updated_at')
            .eq('empresa_id', empresaId)
            .eq('aceito', false)
            .order('updated_at', { ascending: false })
            .limit(20);
          if (error) throw error;
          const rank = (n?: string) => {
            const v = (n || '').toLowerCase();
            if (v.includes('crit')) return 4;
            if (v.includes('alt')) return 3;
            if (v.includes('med') || v.includes('méd')) return 2;
            if (v.includes('baix')) return 1;
            return 0;
          };
          return (data || [])
            .map((r: any) => ({ ...r, _nivel: r.nivel_risco_residual || r.nivel_risco_inicial }))
            .sort((a: any, b: any) => rank(b._nivel) - rank(a._nivel))
            .slice(0, 5)
            .map((r: any) => {
              const nivel = (r._nivel || '').toLowerCase();
              return {
                id: r.id,
                title: r.nome,
                subtitle: r.status,
                status: r._nivel || 'sem nível',
                tone: (nivel.includes('crit') ? 'destructive' : nivel.includes('alt') ? 'warning' : nivel.includes('med') ? 'info' : 'neutral') as DrillItem['tone'],
                date: fmtDate(r.updated_at),
              };
            });
        },
      };
    case 'incidentes':
      return {
        title: 'Incidentes ativos',
        description: 'Incidentes em aberto ou em tratamento.',
        icon: IncidentesIcon,
        route: '/incidentes',
        fetcher: async (empresaId) => {
          const { data, error } = await supabase
            .from('incidentes')
            .select('id, titulo, status, criticidade, created_at')
            .eq('empresa_id', empresaId)
            .in('status', ['aberto', 'em_analise', 'em_tratamento', 'investigacao'])
            .order('created_at', { ascending: false })
            .limit(5);
          if (error) throw error;
          return (data || []).map((i: any) => {
            const c = (i.criticidade || '').toLowerCase();
            return {
              id: i.id,
              title: i.titulo,
              subtitle: i.status,
              status: i.criticidade,
              tone: (c.includes('crit') ? 'destructive' : c.includes('alt') ? 'warning' : 'info') as DrillItem['tone'],
              date: fmtDate(i.created_at),
            };
          });
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
          const today = todayIso();
          return (data || []).map((p: any) => {
            const overdue = p.prazo && p.prazo < today;
            return {
              id: p.id,
              title: p.titulo,
              subtitle: p.status,
              status: overdue ? 'atrasado' : p.status,
              tone: (overdue ? 'destructive' : 'info') as DrillItem['tone'],
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
            tone: a.criticidade === 'alta' ? 'warning' : 'neutral',
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
            .select('id, nome, numero_contrato, status, data_fim')
            .eq('empresa_id', empresaId)
            .order('data_fim', { ascending: true, nullsFirst: false })
            .limit(5);
          if (error) throw error;
          const today = todayIso();
          return (data || []).map((c: any) => {
            const expired = c.data_fim && c.data_fim < today;
            return {
              id: c.id,
              title: c.nome || c.numero_contrato || 'Contrato',
              subtitle: c.numero_contrato || c.status,
              status: expired ? 'vencido' : c.status,
              tone: (expired ? 'destructive' : 'info') as DrillItem['tone'],
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
            .select('id, nome, status, data_vencimento')
            .eq('empresa_id', empresaId)
            .order('data_vencimento', { ascending: true, nullsFirst: false })
            .limit(5);
          if (error) throw error;
          return (data || []).map((d: any) => ({
            id: d.id,
            title: d.nome,
            subtitle: d.status,
            status: d.status,
            tone: (d.status === 'pendente' || d.status === 'pendente_aprovacao' ? 'warning' : 'info') as DrillItem['tone'],
            date: fmtDate(d.data_vencimento),
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
            .select('id, fornecedor_nome, status, score_final, updated_at')
            .eq('empresa_id', empresaId)
            .order('updated_at', { ascending: false })
            .limit(5);
          if (error) throw error;
          return (data || []).map((d: any) => {
            const score = d.score_final;
            return {
              id: d.id,
              title: d.fornecedor_nome,
              subtitle: d.status,
              status: typeof score === 'number' ? `Score ${score}` : undefined,
              tone: (typeof score !== 'number' ? 'neutral' : score < 50 ? 'destructive' : score < 70 ? 'warning' : 'success') as DrillItem['tone'],
              date: fmtDate(d.updated_at),
            };
          });
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
            .select('id, protocolo, titulo, gravidade, status, created_at')
            .eq('empresa_id', empresaId)
            .in('status', ['nova', 'novas', 'em_investigacao', 'em_andamento'])
            .order('created_at', { ascending: false })
            .limit(5);
          if (error) throw error;
          return (data || []).map((d: any) => {
            const g = (d.gravidade || '').toLowerCase();
            return {
              id: d.id,
              title: d.titulo || d.protocolo || 'Denúncia',
              subtitle: d.protocolo,
              status: d.gravidade || d.status,
              tone: (g.includes('crit') || g.includes('alt') ? 'destructive' : 'warning') as DrillItem['tone'],
              date: fmtDate(d.created_at),
            };
          });
        },
      };
    case 'controles':
      return {
        title: 'Controles internos',
        description: 'Controles ativos por criticidade.',
        icon: ControlesIcon,
        route: '/controles',
        fetcher: async (empresaId) => {
          const { data, error } = await supabase
            .from('controles')
            .select('id, nome, codigo, status, criticidade, proxima_avaliacao')
            .eq('empresa_id', empresaId)
            .order('criticidade', { ascending: false })
            .limit(5);
          if (error) throw error;
          return (data || []).map((c: any) => {
            const cr = (c.criticidade || '').toLowerCase();
            return {
              id: c.id,
              title: c.nome,
              subtitle: c.codigo || c.status,
              status: c.criticidade || c.status,
              tone: (cr.includes('alt') || cr.includes('crit') ? 'warning' : 'info') as DrillItem['tone'],
              date: fmtDate(c.proxima_avaliacao),
            };
          });
        },
      };

    // ── Novos módulos ──────────────────────────────────────────────────────
    case 'ativos_chaves':
      return {
        title: 'Chaves criptográficas',
        description: 'Chaves vencidas ou próximas da rotação.',
        icon: KeyRound,
        route: '/ativos/chaves',
        fetcher: async (empresaId) => {
          const { data, error } = await supabase
            .from('ativos_chaves_criptograficas')
            .select('id, nome, tipo_chave, criticidade, data_proxima_rotacao')
            .eq('empresa_id', empresaId)
            .order('data_proxima_rotacao', { ascending: true, nullsFirst: false })
            .limit(5);
          if (error) throw error;
          const today = todayIso();
          return (data || []).map((c: any) => {
            const overdue = c.data_proxima_rotacao && c.data_proxima_rotacao < today;
            return {
              id: c.id,
              title: c.nome,
              subtitle: c.tipo_chave,
              status: overdue ? 'rotação atrasada' : c.criticidade,
              tone: (overdue ? 'destructive' : c.criticidade === 'alta' ? 'warning' : 'neutral') as DrillItem['tone'],
              date: fmtDate(c.data_proxima_rotacao),
            };
          });
        },
      };
    case 'ativos_licencas':
      return {
        title: 'Licenças de software',
        description: 'Licenças vencidas ou próximas do vencimento.',
        icon: FileKey,
        route: '/ativos/licencas',
        fetcher: async (empresaId) => {
          const { data, error } = await supabase
            .from('ativos_licencas')
            .select('id, nome, tipo_licenca, criticidade, data_vencimento')
            .eq('empresa_id', empresaId)
            .order('data_vencimento', { ascending: true, nullsFirst: false })
            .limit(5);
          if (error) throw error;
          const today = todayIso();
          return (data || []).map((l: any) => {
            const expired = l.data_vencimento && l.data_vencimento < today;
            return {
              id: l.id,
              title: l.nome,
              subtitle: l.tipo_licenca,
              status: expired ? 'vencida' : l.criticidade,
              tone: (expired ? 'destructive' : l.criticidade === 'alta' ? 'warning' : 'info') as DrillItem['tone'],
              date: fmtDate(l.data_vencimento),
            };
          });
        },
      };
    case 'auditorias':
      return {
        title: 'Trabalhos de auditoria',
        description: 'Auditorias em andamento ou planejadas.',
        icon: ClipboardCheck,
        route: '/governanca?tab=auditorias',
        fetcher: async (empresaId) => {
          // Junta auditorias da empresa via auditoria_id → auditorias.empresa_id
          const { data, error } = await supabase
            .from('auditoria_trabalhos')
            .select('id, nome, tipo, status, data_inicio, auditorias!inner(empresa_id)')
            .eq('auditorias.empresa_id', empresaId)
            .neq('status', 'concluido')
            .order('data_inicio', { ascending: true, nullsFirst: false })
            .limit(5);
          if (error) throw error;
          return (data || []).map((a: any) => ({
            id: a.id,
            title: a.nome,
            subtitle: a.tipo,
            status: a.status,
            tone: (a.status === 'em_andamento' ? 'info' : 'warning') as DrillItem['tone'],
            date: fmtDate(a.data_inicio),
          }));
        },
      };
    case 'continuidade':
      return {
        title: 'Planos de continuidade',
        description: 'Planos com revisão pendente ou vencida.',
        icon: ShieldCheck,
        route: '/continuidade',
        fetcher: async (empresaId) => {
          const { data, error } = await supabase
            .from('continuidade_planos')
            .select('id, nome, tipo, status, proxima_revisao')
            .eq('empresa_id', empresaId)
            .order('proxima_revisao', { ascending: true, nullsFirst: false })
            .limit(5);
          if (error) throw error;
          const today = todayIso();
          return (data || []).map((p: any) => {
            const overdue = p.proxima_revisao && p.proxima_revisao < today;
            return {
              id: p.id,
              title: p.nome,
              subtitle: p.tipo,
              status: overdue ? 'revisão atrasada' : p.status,
              tone: (overdue ? 'destructive' : 'info') as DrillItem['tone'],
              date: fmtDate(p.proxima_revisao),
            };
          });
        },
      };
    case 'gap_analysis':
      return {
        title: 'Frameworks ativos',
        description: 'Frameworks de Gap Analysis em uso.',
        icon: FileBarChart,
        route: '/gap-analysis/frameworks',
        fetcher: async (empresaId) => {
          // Lista os 5 frameworks com mais avaliações da empresa
          const { data, error } = await supabase
            .from('gap_analysis_evaluations')
            .select('framework_id, gap_analysis_frameworks!inner(id, nome, versao, tipo_framework)')
            .eq('empresa_id', empresaId)
            .limit(50);
          if (error) throw error;
          const counts = new Map<string, { fw: any; n: number }>();
          (data || []).forEach((row: any) => {
            const fw = row.gap_analysis_frameworks;
            if (!fw) return;
            const cur = counts.get(fw.id) || { fw, n: 0 };
            cur.n += 1;
            counts.set(fw.id, cur);
          });
          return Array.from(counts.values())
            .sort((a, b) => b.n - a.n)
            .slice(0, 5)
            .map(({ fw, n }) => ({
              id: fw.id,
              title: `${fw.nome} ${fw.versao || ''}`.trim(),
              subtitle: fw.tipo_framework,
              status: `${n} avaliações`,
              tone: 'info' as DrillItem['tone'],
            }));
        },
      };
    case 'revisao_acessos':
      return {
        title: 'Revisões de acesso',
        description: 'Revisões pendentes ou atrasadas.',
        icon: UserCheck,
        route: '/revisao-acessos',
        fetcher: async (empresaId) => {
          const { data, error } = await supabase
            .from('access_reviews')
            .select('id, nome_revisao, status, data_limite, total_contas')
            .eq('empresa_id', empresaId)
            .neq('status', 'concluida')
            .order('data_limite', { ascending: true, nullsFirst: false })
            .limit(5);
          if (error) throw error;
          const today = todayIso();
          return (data || []).map((r: any) => {
            const overdue = r.data_limite && r.data_limite < today;
            return {
              id: r.id,
              title: r.nome_revisao,
              subtitle: `${r.total_contas || 0} contas`,
              status: overdue ? 'atrasada' : r.status,
              tone: (overdue ? 'destructive' : 'warning') as DrillItem['tone'],
              date: fmtDate(r.data_limite),
            };
          });
        },
      };
    case 'privacidade':
      return {
        title: 'Solicitações de titular',
        description: 'Solicitações LGPD pendentes.',
        icon: Eye,
        route: '/privacidade',
        fetcher: async (empresaId) => {
          const { data, error } = await supabase
            .from('dados_solicitacoes_titular')
            .select('id, tipo_solicitacao, status, prazo_resposta')
            .eq('empresa_id', empresaId)
            .neq('status', 'concluida')
            .order('prazo_resposta', { ascending: true, nullsFirst: false })
            .limit(5);
          if (error) throw error;
          const today = todayIso();
          return (data || []).map((s: any) => {
            const overdue = s.prazo_resposta && s.prazo_resposta < today;
            return {
              id: s.id,
              title: s.tipo_solicitacao,
              subtitle: s.status,
              status: overdue ? 'prazo expirado' : s.status,
              tone: (overdue ? 'destructive' : 'warning') as DrillItem['tone'],
              date: fmtDate(s.prazo_resposta),
            };
          });
        },
      };
    case 'riscos_aceite':
      return {
        title: 'Riscos aceitos',
        description: 'Aceites com revisão próxima ou vencida.',
        icon: Activity,
        route: '/riscos/aceite',
        fetcher: async (empresaId) => {
          const { data, error } = await supabase
            .from('riscos')
            .select('id, nome, nivel_risco_residual, nivel_risco_inicial, data_proxima_revisao')
            .eq('empresa_id', empresaId)
            .eq('aceito', true)
            .order('data_proxima_revisao', { ascending: true, nullsFirst: false })
            .limit(5);
          if (error) throw error;
          const today = todayIso();
          return (data || []).map((r: any) => {
            const overdue = r.data_proxima_revisao && r.data_proxima_revisao < today;
            return {
              id: r.id,
              title: r.nome,
              subtitle: r.nivel_risco_residual || r.nivel_risco_inicial,
              status: overdue ? 'revisão vencida' : 'aceite ativo',
              tone: (overdue ? 'destructive' : 'info') as DrillItem['tone'],
              date: fmtDate(r.data_proxima_revisao),
            };
          });
        },
      };
    case 'sistemas':
      return {
        title: 'Sistemas privilegiados',
        description: 'Sistemas com criticidade alta.',
        icon: Server,
        route: '/sistemas',
        fetcher: async (empresaId) => {
          const { data, error } = await (supabase
            .from('sistemas_privilegiados' as any)
            .select('id, nome_sistema, tipo_sistema, criticidade, ativo, updated_at') as any)
            .eq('empresa_id', empresaId)
            .order('criticidade', { ascending: false })
            .limit(5);
          if (error) throw error;
          return (data || []).map((s: any) => ({
            id: s.id,
            title: s.nome_sistema,
            subtitle: s.tipo_sistema,
            status: s.criticidade,
            tone: (s.criticidade === 'alta' ? 'warning' : 'info') as DrillItem['tone'],
            date: fmtDate(s.updated_at),
          }));
        },
      };
    case 'contas_privilegiadas':
      return {
        title: 'Contas privilegiadas',
        description: 'Acessos próximos da expiração.',
        icon: Lock,
        route: '/contas-privilegiadas',
        fetcher: async (empresaId) => {
          const { data, error } = await (supabase
            .from('contas_privilegiadas' as any)
            .select('id, usuario_beneficiario, nivel_privilegio, status, data_expiracao') as any)
            .eq('empresa_id', empresaId)
            .order('data_expiracao', { ascending: true, nullsFirst: false })
            .limit(5);
          if (error) throw error;
          const today = todayIso();
          return (data || []).map((c: any) => {
            const expired = c.data_expiracao && c.data_expiracao < today;
            return {
              id: c.id,
              title: c.usuario_beneficiario,
              subtitle: c.nivel_privilegio,
              status: expired ? 'expirado' : c.status,
              tone: (expired ? 'destructive' : 'warning') as DrillItem['tone'],
              date: fmtDate(c.data_expiracao),
            };
          });
        },
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
              <Icon as={config.icon as any} size="md" className="text-primary" />
            </div>
            <div className="min-w-0">
              <SheetTitle className="truncate">{config.title}</SheetTitle>
              <SheetDescription className="text-xs">{config.description}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6 py-4 space-y-2">
          {isLoading && (
            <div className="min-h-[200px] flex flex-col items-center justify-center gap-2">
              <AkurisPulse size={48} />
              <p className="text-xs text-muted-foreground">Carregando itens...</p>
            </div>
          )}
          {isError && (
            <EmptyState
              title="Não foi possível carregar"
              description="Tente novamente em instantes."
              icon={<Icon as={AlertCircle} size="lg" />}
            />
          )}
          {!isLoading && !isError && (items?.length ?? 0) === 0 && (
            <EmptyState
              title="Nada por aqui"
              description="Não há itens prioritários para exibir agora."
              icon={<Icon as={config.icon as any} size="lg" />}
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
                      <StatusBadge tone={item.tone ?? 'neutral'} variant="soft">
                        {formatStatus(item.status)}
                      </StatusBadge>
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
