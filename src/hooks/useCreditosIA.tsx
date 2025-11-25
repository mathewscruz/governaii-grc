import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

interface CreditStats {
  consumidos: number;
  franquia: number;
  percentual: number;
  planName: string;
  hasCredits: boolean;
}

export function useCreditosIA() {
  const { company } = useAuth();
  const [stats, setStats] = useState<CreditStats>({
    consumidos: 0,
    franquia: 0,
    percentual: 0,
    planName: '',
    hasCredits: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (company?.id) {
      fetchStats();
    }
  }, [company?.id]);

  const fetchStats = async () => {
    if (!company?.id) return;

    try {
      const { data: empresaData, error } = await supabase
        .from('empresas')
        .select(`
          creditos_consumidos,
          plano:planos (
            nome,
            creditos_franquia
          )
        `)
        .eq('id', company.id)
        .single();

      if (error) throw error;

      const consumidos = empresaData?.creditos_consumidos || 0;
      const franquia = empresaData?.plano?.creditos_franquia || 0;
      const percentual = franquia > 0 ? (consumidos / franquia) * 100 : 0;

      setStats({
        consumidos,
        franquia,
        percentual,
        planName: empresaData?.plano?.nome || 'Sem plano',
        hasCredits: consumidos < franquia
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas de créditos:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkCredits = async (): Promise<{ available: boolean; remaining: number }> => {
    if (!company?.id) {
      return { available: false, remaining: 0 };
    }

    await fetchStats();
    
    return {
      available: stats.hasCredits,
      remaining: stats.franquia - stats.consumidos
    };
  };

  return {
    stats,
    loading,
    checkCredits,
    refetch: fetchStats
  };
}
