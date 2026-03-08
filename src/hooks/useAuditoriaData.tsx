
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

export const useAuditoriaData = (auditoriaId?: string) => {
  const { data: trabalhos } = useQuery({
    queryKey: ['auditoria-trabalhos-count', auditoriaId],
    queryFn: async () => {
      if (!auditoriaId) return 0;
      
      const { count, error } = await supabase
        .from('auditoria_trabalhos')
        .select('*', { count: 'exact', head: true })
        .eq('auditoria_id', auditoriaId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!auditoriaId
  });

  const { data: achados } = useQuery({
    queryKey: ['auditoria-achados-count', auditoriaId],
    queryFn: async () => {
      if (!auditoriaId) return 0;
      
      const { count, error } = await supabase
        .from('auditoria_achados')
        .select('*', { count: 'exact', head: true })
        .eq('auditoria_id', auditoriaId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!auditoriaId
  });

  const { data: recomendacoes } = useQuery({
    queryKey: ['auditoria-recomendacoes-count', auditoriaId],
    queryFn: async () => {
      if (!auditoriaId) return 0;
      
      const { count, error } = await supabase
        .from('auditoria_recomendacoes')
        .select('*, auditoria_achados!inner(auditoria_id)', { count: 'exact', head: true })
        .eq('auditoria_achados.auditoria_id', auditoriaId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!auditoriaId
  });

  return {
    trabalhoCount: trabalhos || 0,
    achadoCount: achados || 0,
    recomendacaoCount: recomendacoes || 0
  };
};

export const useUsuariosEmpresa = () => {
  const { empresaId } = useEmpresaId();

  return useQuery({
    queryKey: ['usuarios-empresa', empresaId],
    enabled: !!empresaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, nome, email, role')
        .eq('ativo', true)
        .eq('empresa_id', empresaId!)
        .order('nome');

      if (error) throw error;
      return data || [];
    },
  });
};
