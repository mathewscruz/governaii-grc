import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  lida: boolean;
  data_leitura?: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export const useNotifications = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async (): Promise<Notification[]> => {
      // Por enquanto retornamos array vazio até que a tabela seja criada
      // Isso evita erros de build enquanto não temos a estrutura completa
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('id, titulo, mensagem, tipo, lida, data_leitura, metadata, created_at, updated_at')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) {
          console.warn('Notifications table not ready yet:', error.message);
          return [];
        }
        return data || [];
      } catch (error) {
        console.warn('Notifications not available yet:', error);
        return [];
      }
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          lida: true, 
          data_leitura: new Date().toISOString() 
        })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao marcar notificação",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          lida: true, 
          data_leitura: new Date().toISOString() 
        })
        .eq('lida', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({
        title: "Notificações marcadas",
        description: "Todas as notificações foram marcadas como lidas.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao marcar notificações",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    },
  });

  const unreadCount = notifications.filter(n => !n.lida).length;

  return {
    notifications,
    isLoading,
    unreadCount,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
  };
};