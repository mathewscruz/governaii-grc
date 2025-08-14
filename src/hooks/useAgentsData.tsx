import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Agent {
  id: string;
  empresa_id: string;
  agent_token: string;
  hostname: string;
  ip_address: string | null;
  mac_address: string | null;
  operating_system: string | null;
  os_version: string | null;
  last_heartbeat: string | null;
  status: 'online' | 'offline' | 'error';
  installed_at: string;
  created_at: string;
  updated_at: string;
}

export const useAgentsData = () => {
  return useQuery({
    queryKey: ['agents'],
    queryFn: async (): Promise<Agent[]> => {
      const { data, error } = await supabase
        .from('asset_agents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Agent[];
    },
  });
};

export const useAgentStats = () => {
  return useQuery({
    queryKey: ['agent-stats'],
    queryFn: async () => {
      const { data: agents, error } = await supabase
        .from('asset_agents')
        .select('status, last_heartbeat')
        .neq('hostname', 'pending-install'); // Excluir agentes que ainda não foram instalados

      if (error) throw error;

      // Considerar agentes como online apenas se enviaram heartbeat nos últimos 10 minutos
      const now = new Date();
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

      const activeAgents = agents?.filter(agent => {
        if (!agent.last_heartbeat) return false;
        const lastHeartbeat = new Date(agent.last_heartbeat);
        return lastHeartbeat > tenMinutesAgo;
      }) || [];

      const total = activeAgents.length;
      const online = activeAgents.filter(a => a.status === 'online').length;
      const offline = agents?.length - online || 0;
      const error_count = agents?.filter(a => a.status === 'error').length || 0;

      return {
        total,
        online,
        offline,
        error: error_count,
        onlinePercentage: total > 0 ? Math.round((online / total) * 100) : 0
      };
    },
  });
};