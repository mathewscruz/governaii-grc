import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays } from "date-fns";

interface ChavesStats {
  total: number;
  ativas: number;
  expiradas: number;
  rotacao30dias: number;
  criticas: number;
  porTipo: Record<string, number>;
  porAmbiente: Record<string, number>;
}

export const useChavesStats = () => {
  return useQuery({
    queryKey: ['chaves-stats'],
    queryFn: async (): Promise<ChavesStats> => {
      const { data: chaves, error } = await supabase
        .from('ativos_chaves_criptograficas')
        .select('*');

      if (error) throw error;

      const hoje = new Date();
      const total = chaves?.length || 0;
      const ativas = chaves?.filter(c => c.status === 'ativa').length || 0;
      
      const expiradas = chaves?.filter(c => {
        if (!c.data_proxima_rotacao) return false;
        return differenceInDays(new Date(c.data_proxima_rotacao), hoje) < 0;
      }).length || 0;

      const rotacao30dias = chaves?.filter(c => {
        if (!c.data_proxima_rotacao) return false;
        const dias = differenceInDays(new Date(c.data_proxima_rotacao), hoje);
        return dias >= 0 && dias <= 30;
      }).length || 0;

      const criticas = chaves?.filter(c => c.criticidade === 'critica' && c.status === 'ativa').length || 0;

      const porTipo: Record<string, number> = {};
      const porAmbiente: Record<string, number> = {};

      chaves?.forEach(c => {
        porTipo[c.tipo_chave] = (porTipo[c.tipo_chave] || 0) + 1;
        porAmbiente[c.ambiente] = (porAmbiente[c.ambiente] || 0) + 1;
      });

      return {
        total,
        ativas,
        expiradas,
        rotacao30dias,
        criticas,
        porTipo,
        porAmbiente
      };
    },
  });
};
