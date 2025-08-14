-- Remove funcionalidade de agentes externos
-- Remover campos relacionados aos agentes da tabela ativos
ALTER TABLE public.ativos DROP COLUMN IF EXISTS origem;
ALTER TABLE public.ativos DROP COLUMN IF EXISTS agent_id;
ALTER TABLE public.ativos DROP COLUMN IF EXISTS ip_address;
ALTER TABLE public.ativos DROP COLUMN IF EXISTS hostname;
ALTER TABLE public.ativos DROP COLUMN IF EXISTS sistema_operacional;
ALTER TABLE public.ativos DROP COLUMN IF EXISTS versao_so;
ALTER TABLE public.ativos DROP COLUMN IF EXISTS last_sync;
ALTER TABLE public.ativos DROP COLUMN IF EXISTS agent_status;

-- Remover tabela asset_agents
DROP TABLE IF EXISTS public.asset_agents CASCADE;

-- Remover função relacionada aos agentes
DROP FUNCTION IF EXISTS public.agent_pertence_empresa(uuid);

-- Remover trigger relacionado aos agentes (se existir)
DROP TRIGGER IF EXISTS update_asset_agents_updated_at ON public.asset_agents;