import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

interface MaturityTrend {
  /** Delta in percentage points (current - previous). null when no baseline. */
  delta: number | null;
}

/**
 * Trend proxy for the GRC maturity score: compares the latest gap_analysis
 * score snapshot for the company with the latest snapshot from ~30 days ago.
 * Returns null delta when there isn't enough history.
 */
export function useMaturityTrend(currentScore: number) {
  const { profile } = useAuth();
  const empresaId = profile?.empresa_id;

  return useQuery<MaturityTrend>({
    queryKey: ['maturity-trend', empresaId, currentScore],
    enabled: !!empresaId,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);

      const { data, error } = await supabase
        .from('gap_analysis_score_history')
        .select('score, recorded_at')
        .eq('empresa_id', empresaId!)
        .lte('recorded_at', cutoff.toISOString())
        .order('recorded_at', { ascending: false })
        .limit(20);

      if (error || !data || data.length === 0) {
        return { delta: null };
      }

      const baseline =
        data.reduce((sum, r) => sum + Number(r.score || 0), 0) / data.length;
      return { delta: Math.round(currentScore - baseline) };
    },
  });
}
