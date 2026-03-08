import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import type { IntegrationEventType } from '@/lib/integration-events';

// Re-export for backward compatibility
export type { IntegrationEventType };

interface NotifyOptions {
  titulo: string;
  descricao?: string;
  link?: string;
  dados?: Record<string, unknown>;
  gravidade?: 'baixa' | 'media' | 'alta' | 'critica';
}

export function useIntegrationNotify() {
  const { user, profile } = useAuth();

  const notify = useCallback(async (
    evento: IntegrationEventType,
    options: NotifyOptions
  ) => {
    if (!user?.id || !profile?.empresa_id) return;

    try {
      const { error } = await supabase.functions.invoke('integration-webhook-dispatcher', {
        body: {
          empresa_id: profile.empresa_id,
          evento,
          titulo: options.titulo,
          descricao: options.descricao,
          link: options.link,
          dados: options.dados,
          gravidade: options.gravidade,
          triggered_by: user.id,
          timestamp: new Date().toISOString()
        }
      });

      if (error) {
        console.error('Erro ao enviar notificação de integração:', error);
      }
    } catch (error) {
      console.error('Erro ao notificar integrações:', error);
    }
  }, [user, profile]);

  return { notify };
}
