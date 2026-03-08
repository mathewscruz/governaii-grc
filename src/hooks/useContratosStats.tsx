import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

interface ContratosStats {
  total: number;
  ativos: number;
  vencidos: number;
  vencendo30Dias: number;
  valorTotal: number;
  renovacaoAutomatica: number;
  fornecedoresAtivos: number;
}

export const useContratosStats = () => {
  const { empresaId } = useEmpresaId();

  return useQuery({
    queryKey: ['contratos-stats', empresaId],
    staleTime: 5 * 60 * 1000,
    enabled: !!empresaId,
    queryFn: async (): Promise<ContratosStats> => {
      const { data: contratos, error } = await supabase
        .from('contratos')
        .select('status, valor, data_fim, renovacao_automatica, fornecedor_id')
        .eq('empresa_id', empresaId!);

      if (error) throw error;

      const { data: fornecedores } = await supabase
        .from('fornecedores')
        .select('id')
        .eq('status', 'ativo')
        .eq('empresa_id', empresaId!);

      const total = contratos?.length || 0;
      const ativos = contratos?.filter(c => c.status === 'ativo').length || 0;
      
      const hoje = new Date();
      const em30Dias = new Date(hoje.getTime() + (30 * 24 * 60 * 60 * 1000));
      
      const vencidos = contratos?.filter(c => {
        if (!c.data_fim) return false;
        return new Date(c.data_fim) < hoje;
      }).length || 0;
      
      const vencendo30Dias = contratos?.filter(c => {
        if (!c.data_fim) return false;
        const dataFim = new Date(c.data_fim);
        return dataFim >= hoje && dataFim <= em30Dias;
      }).length || 0;
      
      const valorTotal = contratos?.filter(c => c.status === 'ativo').reduce((sum, c) => sum + (c.valor || 0), 0) || 0;
      const renovacaoAutomatica = contratos?.filter(c => c.renovacao_automatica).length || 0;
      const fornecedoresAtivos = fornecedores?.length || 0;

      return {
        total,
        ativos,
        vencidos,
        vencendo30Dias,
        valorTotal,
        renovacaoAutomatica,
        fornecedoresAtivos
      };
    },
  });
};
