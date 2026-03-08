import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

interface DocumentosStats {
  total: number;
  ativos: number;
  vencidos: number;
  vencendo30Dias: number;
  confidenciais: number;
  aprovados: number;
  pendentesAprovacao: number;
}

export const useDocumentosStats = () => {
  const { profile } = useAuth();
  const empresaId = profile?.empresa_id;

  return useQuery({
    queryKey: ['documentos-stats', empresaId],
    enabled: !!empresaId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<DocumentosStats> => {
      const { data: documentos, error } = await supabase
        .from('documentos')
        .select('status, data_vencimento, classificacao, data_aprovacao')
        .eq('empresa_id', empresaId!);

      if (error) throw error;

      const total = documentos?.length || 0;
      const ativos = documentos?.filter(d => d.status === 'ativo').length || 0;
      const confidenciais = documentos?.filter(d => d.classificacao === 'confidencial').length || 0;
      const aprovados = documentos?.filter(d => d.data_aprovacao).length || 0;
      const pendentesAprovacao = documentos?.filter(d => d.status === 'pendente_aprovacao').length || 0;
      
      const hoje = new Date();
      const em30Dias = new Date(hoje.getTime() + (30 * 24 * 60 * 60 * 1000));
      
      const vencidos = documentos?.filter(d => {
        if (!d.data_vencimento) return false;
        return new Date(d.data_vencimento) < hoje;
      }).length || 0;
      
      const vencendo30Dias = documentos?.filter(d => {
        if (!d.data_vencimento) return false;
        const dataVencimento = new Date(d.data_vencimento);
        return dataVencimento >= hoje && dataVencimento <= em30Dias;
      }).length || 0;

      return {
        total,
        ativos,
        vencidos,
        vencendo30Dias,
        confidenciais,
        aprovados,
        pendentesAprovacao
      };
    },
  });
};
