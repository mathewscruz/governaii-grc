
-- 1. Criar tabela riscos_historico_avaliacoes
CREATE TABLE public.riscos_historico_avaliacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  risco_id UUID NOT NULL REFERENCES public.riscos(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  probabilidade TEXT NOT NULL,
  impacto TEXT NOT NULL,
  nivel_risco TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'inicial',
  avaliado_por UUID,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.riscos_historico_avaliacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios podem ver historico da sua empresa"
ON public.riscos_historico_avaliacoes FOR SELECT
USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "Usuarios podem inserir historico da sua empresa"
ON public.riscos_historico_avaliacoes FOR INSERT
WITH CHECK (empresa_id = public.get_user_empresa_id());

CREATE INDEX idx_riscos_historico_risco_id ON public.riscos_historico_avaliacoes(risco_id);
CREATE INDEX idx_riscos_historico_empresa_id ON public.riscos_historico_avaliacoes(empresa_id);

-- 2. Adicionar coluna data_proxima_revisao na tabela riscos
ALTER TABLE public.riscos ADD COLUMN IF NOT EXISTS data_proxima_revisao DATE;

-- 3. Criar trigger de auditoria para riscos
CREATE OR REPLACE FUNCTION public.audit_riscos_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_values jsonb;
  v_new_values jsonb;
  v_changed_fields text[];
  v_empresa_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_old_values := to_jsonb(OLD);
    v_empresa_id := OLD.empresa_id;
    INSERT INTO public.audit_logs (empresa_id, table_name, record_id, action, old_values, user_id)
    VALUES (v_empresa_id, 'riscos', OLD.id::text, 'DELETE', v_old_values, auth.uid());
    RETURN OLD;
  ELSIF TG_OP = 'INSERT' THEN
    v_new_values := to_jsonb(NEW);
    v_empresa_id := NEW.empresa_id;
    INSERT INTO public.audit_logs (empresa_id, table_name, record_id, action, new_values, user_id)
    VALUES (v_empresa_id, 'riscos', NEW.id::text, 'INSERT', v_new_values, auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old_values := to_jsonb(OLD);
    v_new_values := to_jsonb(NEW);
    v_empresa_id := NEW.empresa_id;
    
    -- Detectar campos alterados
    SELECT array_agg(key) INTO v_changed_fields
    FROM jsonb_each(v_new_values) AS n(key, value)
    WHERE n.value IS DISTINCT FROM v_old_values->n.key
      AND n.key NOT IN ('updated_at');
    
    IF v_changed_fields IS NOT NULL AND array_length(v_changed_fields, 1) > 0 THEN
      INSERT INTO public.audit_logs (empresa_id, table_name, record_id, action, old_values, new_values, changed_fields, user_id)
      VALUES (v_empresa_id, 'riscos', NEW.id::text, 'UPDATE', v_old_values, v_new_values, v_changed_fields, auth.uid());
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER audit_riscos_changes
AFTER INSERT OR UPDATE OR DELETE ON public.riscos
FOR EACH ROW EXECUTE FUNCTION public.audit_riscos_changes();
