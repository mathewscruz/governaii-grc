
-- =============================================
-- API Keys para API Pública
-- =============================================
CREATE TABLE public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE,
  prefixo TEXT NOT NULL,
  permissoes TEXT[] DEFAULT '{}',
  rate_limit_por_minuto INTEGER DEFAULT 60,
  ativo BOOLEAN DEFAULT true,
  ultimo_uso TIMESTAMPTZ,
  total_requisicoes BIGINT DEFAULT 0,
  ip_whitelist TEXT[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresa pode gerenciar suas API Keys"
  ON public.api_keys FOR ALL
  USING (empresa_id IN (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE INDEX idx_api_keys_empresa ON public.api_keys(empresa_id);
CREATE INDEX idx_api_keys_key ON public.api_keys(api_key);

-- =============================================
-- Logs de uso da API
-- =============================================
CREATE TABLE public.api_request_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
  metodo TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  status_code INTEGER,
  ip_address INET,
  user_agent TEXT,
  request_body JSONB,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.api_request_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresa pode ver seus logs de API"
  ON public.api_request_logs FOR SELECT
  USING (empresa_id IN (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE INDEX idx_api_logs_empresa ON public.api_request_logs(empresa_id);
CREATE INDEX idx_api_logs_created ON public.api_request_logs(created_at DESC);

-- =============================================
-- Webhooks de entrada (inbound)
-- =============================================
CREATE TABLE public.api_inbound_webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  webhook_token TEXT NOT NULL UNIQUE,
  tipo_evento TEXT NOT NULL,
  modulo_destino TEXT NOT NULL,
  mapeamento_campos JSONB DEFAULT '{}',
  ativo BOOLEAN DEFAULT true,
  ultimo_recebimento TIMESTAMPTZ,
  total_recebidos BIGINT DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.api_inbound_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresa pode gerenciar seus webhooks de entrada"
  ON public.api_inbound_webhooks FOR ALL
  USING (empresa_id IN (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE INDEX idx_inbound_webhooks_empresa ON public.api_inbound_webhooks(empresa_id);
CREATE INDEX idx_inbound_webhooks_token ON public.api_inbound_webhooks(webhook_token);

-- Triggers de updated_at
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inbound_webhooks_updated_at BEFORE UPDATE ON public.api_inbound_webhooks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
