-- enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 1) endpoint_enrollment_tokens
CREATE TABLE public.endpoint_enrollment_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  descricao TEXT,
  criado_por UUID,
  expira_em TIMESTAMPTZ,
  max_usos INTEGER,
  usos INTEGER NOT NULL DEFAULT 0,
  revogado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_endpoint_enrollment_tokens_empresa ON public.endpoint_enrollment_tokens(empresa_id);

ALTER TABLE public.endpoint_enrollment_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresa pode ver seus tokens enrollment"
  ON public.endpoint_enrollment_tokens FOR SELECT
  USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Admin pode criar tokens enrollment"
  ON public.endpoint_enrollment_tokens FOR INSERT
  WITH CHECK (empresa_id = public.get_user_empresa_id() AND public.is_admin());

CREATE POLICY "Admin pode atualizar tokens enrollment"
  ON public.endpoint_enrollment_tokens FOR UPDATE
  USING (empresa_id = public.get_user_empresa_id() AND public.is_admin());

CREATE POLICY "Admin pode remover tokens enrollment"
  ON public.endpoint_enrollment_tokens FOR DELETE
  USING (empresa_id = public.get_user_empresa_id() AND public.is_admin());

-- 2) endpoint_agents
CREATE TABLE public.endpoint_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  ativo_id UUID REFERENCES public.ativos(id) ON DELETE SET NULL,
  agent_token_hash TEXT NOT NULL UNIQUE,
  hostname TEXT NOT NULL,
  so TEXT,
  so_versao TEXT,
  versao_agente TEXT,
  ip_publico TEXT,
  mac_addresses TEXT[],
  status TEXT NOT NULL DEFAULT 'online',
  ultimo_checkin TIMESTAMPTZ,
  postura_resumo JSONB DEFAULT '{}'::jsonb,
  revogado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_endpoint_agents_empresa ON public.endpoint_agents(empresa_id);
CREATE INDEX idx_endpoint_agents_status ON public.endpoint_agents(status);
CREATE INDEX idx_endpoint_agents_ultimo_checkin ON public.endpoint_agents(ultimo_checkin);

ALTER TABLE public.endpoint_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresa pode ver seus agentes"
  ON public.endpoint_agents FOR SELECT
  USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Admin pode atualizar agentes"
  ON public.endpoint_agents FOR UPDATE
  USING (empresa_id = public.get_user_empresa_id() AND public.is_admin());

CREATE POLICY "Admin pode remover agentes"
  ON public.endpoint_agents FOR DELETE
  USING (empresa_id = public.get_user_empresa_id() AND public.is_admin());

-- 3) endpoint_inventory_snapshots
CREATE TABLE public.endpoint_inventory_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.endpoint_agents(id) ON DELETE CASCADE,
  coletado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB NOT NULL,
  hash_payload TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_endpoint_snapshots_empresa ON public.endpoint_inventory_snapshots(empresa_id);
CREATE INDEX idx_endpoint_snapshots_agent ON public.endpoint_inventory_snapshots(agent_id, coletado_em DESC);

ALTER TABLE public.endpoint_inventory_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresa pode ver snapshots"
  ON public.endpoint_inventory_snapshots FOR SELECT
  USING (empresa_id = public.get_user_empresa_id());

-- triggers updated_at
CREATE TRIGGER trg_endpoint_enrollment_tokens_updated
  BEFORE UPDATE ON public.endpoint_enrollment_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_endpoint_agents_updated
  BEFORE UPDATE ON public.endpoint_agents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) função para marcar offline
CREATE OR REPLACE FUNCTION public.mark_offline_endpoints()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.endpoint_agents
     SET status = 'offline'
   WHERE status <> 'offline'
     AND revogado = false
     AND (ultimo_checkin IS NULL OR ultimo_checkin < now() - interval '2 hours');
END;
$$;

-- 5) cron a cada 15 min
SELECT cron.schedule(
  'mark-offline-endpoints',
  '*/15 * * * *',
  $$ SELECT public.mark_offline_endpoints(); $$
);