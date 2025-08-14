-- Adicionar campos para agentes na tabela ativos existente
ALTER TABLE public.ativos ADD COLUMN IF NOT EXISTS origem TEXT DEFAULT 'manual' CHECK (origem IN ('manual', 'agente'));
ALTER TABLE public.ativos ADD COLUMN IF NOT EXISTS agent_id UUID;
ALTER TABLE public.ativos ADD COLUMN IF NOT EXISTS ip_address INET;
ALTER TABLE public.ativos ADD COLUMN IF NOT EXISTS hostname TEXT;
ALTER TABLE public.ativos ADD COLUMN IF NOT EXISTS sistema_operacional TEXT;
ALTER TABLE public.ativos ADD COLUMN IF NOT EXISTS versao_so TEXT;
ALTER TABLE public.ativos ADD COLUMN IF NOT EXISTS last_sync TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.ativos ADD COLUMN IF NOT EXISTS agent_status TEXT DEFAULT 'offline' CHECK (agent_status IN ('online', 'offline', 'error'));

-- Criar tabela para gerenciar agentes instalados
CREATE TABLE IF NOT EXISTS public.asset_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  agent_token TEXT UNIQUE NOT NULL,
  hostname TEXT NOT NULL,
  ip_address INET,
  mac_address TEXT,
  operating_system TEXT,
  os_version TEXT,
  last_heartbeat TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'error')),
  installed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS na nova tabela
ALTER TABLE public.asset_agents ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para asset_agents
CREATE POLICY "Users can view agents from their empresa" ON public.asset_agents
  FOR SELECT USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can insert agents in their empresa" ON public.asset_agents
  FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can update agents from their empresa" ON public.asset_agents
  FOR UPDATE USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can delete agents from their empresa" ON public.asset_agents
  FOR DELETE USING (empresa_id = get_user_empresa_id());

-- Criar função para verificar se agente pertence à empresa
CREATE OR REPLACE FUNCTION public.agent_pertence_empresa(agent_id_param UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.asset_agents 
    WHERE id = agent_id_param AND empresa_id = public.get_user_empresa_id()
  );
$$;

-- Adicionar trigger para update_updated_at na tabela asset_agents
CREATE TRIGGER update_asset_agents_updated_at
BEFORE UPDATE ON public.asset_agents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_ativos_origem ON public.ativos(origem);
CREATE INDEX IF NOT EXISTS idx_ativos_agent_id ON public.ativos(agent_id);
CREATE INDEX IF NOT EXISTS idx_ativos_agent_status ON public.ativos(agent_status);
CREATE INDEX IF NOT EXISTS idx_asset_agents_empresa_id ON public.asset_agents(empresa_id);
CREATE INDEX IF NOT EXISTS idx_asset_agents_status ON public.asset_agents(status);
CREATE INDEX IF NOT EXISTS idx_asset_agents_token ON public.asset_agents(agent_token);