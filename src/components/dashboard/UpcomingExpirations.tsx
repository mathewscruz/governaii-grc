import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Calendar, FileKey, KeyRound, Handshake, Shield, Loader2 } from 'lucide-react';
import { formatDateOnly } from '@/lib/date-utils';
import { differenceInDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface ExpirationItem {
  id: string;
  name: string;
  date: string;
  type: 'contrato' | 'licenca' | 'chave' | 'controle';
  daysLeft: number;
}

export function UpcomingExpirations() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const { data: items, isLoading } = useQuery({
    queryKey: ['upcoming-expirations', profile?.empresa_id],
    queryFn: async (): Promise<ExpirationItem[]> => {
      if (!profile?.empresa_id) return [];
      const now = new Date();
      const limit60 = new Date();
      limit60.setDate(limit60.getDate() + 60);
      const results: ExpirationItem[] = [];

      const [contratos, licencas, chaves, controles] = await Promise.all([
        supabase.from('contratos').select('id, nome, data_fim')
          .eq('empresa_id', profile.empresa_id)
          .gte('data_fim', now.toISOString())
          .lte('data_fim', limit60.toISOString())
          .order('data_fim').limit(5),
        supabase.from('ativos_licencas').select('id, nome, data_vencimento')
          .eq('empresa_id', profile.empresa_id)
          .gte('data_vencimento', now.toISOString())
          .lte('data_vencimento', limit60.toISOString())
          .order('data_vencimento').limit(5),
        supabase.from('ativos_chaves_criptograficas').select('id, nome, data_proxima_rotacao')
          .eq('empresa_id', profile.empresa_id)
          .gte('data_proxima_rotacao', now.toISOString())
          .lte('data_proxima_rotacao', limit60.toISOString())
          .order('data_proxima_rotacao').limit(5),
        supabase.from('controles').select('id, nome, proxima_avaliacao')
          .eq('empresa_id', profile.empresa_id)
          .not('proxima_avaliacao', 'is', null)
          .gte('proxima_avaliacao', now.toISOString())
          .lte('proxima_avaliacao', limit60.toISOString())
          .order('proxima_avaliacao').limit(5),
      ]);

      contratos.data?.forEach(c => results.push({
        id: c.id, name: c.nome, date: c.data_fim, type: 'contrato',
        daysLeft: differenceInDays(new Date(c.data_fim), now)
      }));
      licencas.data?.forEach(l => results.push({
        id: l.id, name: l.nome, date: l.data_vencimento, type: 'licenca',
        daysLeft: differenceInDays(new Date(l.data_vencimento), now)
      }));
      chaves.data?.forEach(ch => results.push({
        id: ch.id, name: ch.nome, date: ch.data_proxima_rotacao, type: 'chave',
        daysLeft: differenceInDays(new Date(ch.data_proxima_rotacao), now)
      }));
      controles.data?.forEach(ct => results.push({
        id: ct.id, name: ct.nome, date: ct.proxima_avaliacao!, type: 'controle',
        daysLeft: differenceInDays(new Date(ct.proxima_avaliacao!), now)
      }));

      return results.sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 8);
    },
    enabled: !!profile?.empresa_id,
    staleTime: 5 * 60 * 1000,
  });

  const typeConfig = {
    contrato: { icon: Handshake, label: t('expirations.contract'), route: '/contratos' },
    licenca: { icon: FileKey, label: t('expirations.license'), route: '/ativos/licencas' },
    chave: { icon: KeyRound, label: t('expirations.key'), route: '/ativos/chaves' },
    controle: { icon: Shield, label: t('expirations.control'), route: '/governanca?tab=controles' },
  };

  const getDaysVariant = (days: number) => {
    if (days <= 7) return 'destructive' as const;
    if (days <= 15) return 'warning' as const;
    return 'info' as const;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4" /> {t('dashboard.upcomingExpirations')}</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center h-48"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4 text-warning" /> {t('dashboard.upcomingExpirations')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!items || items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">{t('dashboard.noExpirations')}</p>
        ) : (
          <div className="space-y-3">
            {items.map(item => {
              const config = typeConfig[item.type];
              const Icon = config.icon;
              return (
                <div 
                  key={`${item.type}-${item.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-lg border bg-card/50 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => navigate(config.route)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(config.route)}
                >
                  <div className="p-1.5 rounded bg-muted">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{config.label} • {formatDateOnly(item.date)}</p>
                  </div>
                  <Badge variant={getDaysVariant(item.daysLeft)} size="sm">
                    {item.daysLeft}d
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
