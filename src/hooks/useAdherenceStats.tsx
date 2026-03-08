import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

export const useAdherenceStats = () => {
  const { profile } = useAuth();
  const empresaId = profile?.empresa_id;

  const query = useQuery({
    queryKey: ['adherence-stats', empresaId],
    enabled: !!empresaId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!empresaId) return { totalAvaliacoes: 0, avaliacoesConformes: 0, avaliacoesNaoConformes: 0, avaliacoesParciais: 0, mediaConformidade: 0 };

      const { count: totalAvaliacoes } = await supabase
        .from('gap_analysis_adherence_assessments')
        .select('*', { count: 'exact', head: true })
        .eq('empresa_id', empresaId);

      const { data: avaliacoes } = await supabase
        .from('gap_analysis_adherence_assessments')
        .select('resultado_geral, percentual_conformidade')
        .eq('status', 'concluido')
        .eq('empresa_id', empresaId);

      const conformes = avaliacoes?.filter(a => a.resultado_geral === 'conforme').length || 0;
      const naoConformes = avaliacoes?.filter(a => a.resultado_geral === 'nao_conforme').length || 0;
      const parciais = avaliacoes?.filter(a => a.resultado_geral === 'parcial').length || 0;

      const mediaConformidade = avaliacoes && avaliacoes.length > 0
        ? Math.round(avaliacoes.reduce((acc, a) => acc + (a.percentual_conformidade || 0), 0) / avaliacoes.length)
        : 0;

      return {
        totalAvaliacoes: totalAvaliacoes || 0,
        avaliacoesConformes: conformes,
        avaliacoesNaoConformes: naoConformes,
        avaliacoesParciais: parciais,
        mediaConformidade
      };
    },
  });

  return {
    data: query.data ? { data: query.data, error: null } : { data: { totalAvaliacoes: 0, avaliacoesConformes: 0, avaliacoesNaoConformes: 0, avaliacoesParciais: 0, mediaConformidade: 0 }, error: null },
    loading: query.isLoading,
  };
};
