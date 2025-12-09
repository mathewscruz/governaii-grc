-- Tabela para armazenar configurações de integrações por empresa
CREATE TABLE public.integracoes_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo_integracao TEXT NOT NULL,
  nome_exibicao TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'desconectado',
  credenciais_encrypted TEXT,
  configuracoes JSONB DEFAULT '{}'::jsonb,
  webhook_url TEXT,
  ultima_sincronizacao TIMESTAMP WITH TIME ZONE,
  erro_ultima_sincronizacao TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, tipo_integracao)
);

-- Habilitar RLS
ALTER TABLE public.integracoes_config ENABLE ROW LEVEL SECURITY;

-- Policies de RLS para isolamento por empresa
CREATE POLICY "Users can view integrations from their empresa"
ON public.integracoes_config FOR SELECT
USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Admins can insert integrations in their empresa"
ON public.integracoes_config FOR INSERT
WITH CHECK (empresa_id = get_user_empresa_id() AND is_admin_or_super_admin());

CREATE POLICY "Admins can update integrations from their empresa"
ON public.integracoes_config FOR UPDATE
USING (empresa_id = get_user_empresa_id() AND is_admin_or_super_admin());

CREATE POLICY "Admins can delete integrations from their empresa"
ON public.integracoes_config FOR DELETE
USING (empresa_id = get_user_empresa_id() AND is_admin_or_super_admin());

-- Trigger para updated_at
CREATE TRIGGER update_integracoes_config_updated_at
BEFORE UPDATE ON public.integracoes_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela para logs de webhooks enviados
CREATE TABLE public.integracoes_webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  integracao_id UUID REFERENCES public.integracoes_config(id) ON DELETE SET NULL,
  evento TEXT NOT NULL,
  payload JSONB,
  status_code INTEGER,
  resposta TEXT,
  sucesso BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.integracoes_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Policies de RLS
CREATE POLICY "Users can view webhook logs from their empresa"
ON public.integracoes_webhook_logs FOR SELECT
USING (empresa_id = get_user_empresa_id());

CREATE POLICY "System can insert webhook logs"
ON public.integracoes_webhook_logs FOR INSERT
WITH CHECK (empresa_id = get_user_empresa_id());

-- Índices para performance
CREATE INDEX idx_integracoes_config_empresa ON public.integracoes_config(empresa_id);
CREATE INDEX idx_integracoes_config_tipo ON public.integracoes_config(tipo_integracao);
CREATE INDEX idx_integracoes_webhook_logs_empresa ON public.integracoes_webhook_logs(empresa_id);
CREATE INDEX idx_integracoes_webhook_logs_integracao ON public.integracoes_webhook_logs(integracao_id);