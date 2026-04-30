import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { logger } from '@/lib/logger';

export interface PlanosAcaoStats {
  total: number;
  pendentes: number;
  atrasados: number;
  concluidos: number;
}

const CONCLUIDO_STATUSES = new Set(['concluido', 'concluído', 'finalizado', 'cancelado']);

export const usePlanosAcaoStats = () => {
  const { profile } = useAuth();
  const empresaId = profile?.empresa_id;

  return useQuery({
    queryKey: ['planos-acao-stats', empresaId],
    enabled: !!empresaId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<PlanosAcaoStats> => {
      try {
        const { data, error } = await supabase
          .from('planos_acao')
          .select('id, status, prazo, data_conclusao')
          .eq('empresa_id', empresaId!);

        if (error) throw error;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const total = data?.length ?? 0;
        const pendentes =
          data?.filter((p) => !CONCLUIDO_STATUSES.has((p.status || '').toLowerCase())).length ?? 0;
        const atrasados =
          data?.filter((p) => {
            const isOpen = !CONCLUIDO_STATUSES.has((p.status || '').toLowerCase());
            const past = p.prazo ? new Date(p.prazo) < today : false;
            return isOpen && past;
          }).length ?? 0;
        const concluidos = total - pendentes;

        return { total, pendentes, atrasados, concluidos };
      } catch (err) {
        logger.error('Erro ao carregar estatísticas de planos de ação', err);
        throw err;
      }
    },
  });
};
