
-- Tabela de trilha de auditoria para Gap Analysis
CREATE TABLE public.gap_analysis_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid NOT NULL,
  framework_id uuid NOT NULL,
  requirement_id uuid NOT NULL,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  campo_alterado text NOT NULL,
  valor_anterior text,
  valor_novo text,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index para busca rápida
CREATE INDEX idx_gap_audit_log_evaluation ON public.gap_analysis_audit_log(evaluation_id);
CREATE INDEX idx_gap_audit_log_empresa ON public.gap_analysis_audit_log(empresa_id);
CREATE INDEX idx_gap_audit_log_requirement ON public.gap_analysis_audit_log(requirement_id);

-- RLS
ALTER TABLE public.gap_analysis_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audit logs of their company"
  ON public.gap_analysis_audit_log FOR SELECT
  TO authenticated
  USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "System can insert audit logs"
  ON public.gap_analysis_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (empresa_id = public.get_user_empresa_id());

-- Trigger function para registrar mudanças de conformity_status
CREATE OR REPLACE FUNCTION public.audit_gap_analysis_evaluation_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.conformity_status IS DISTINCT FROM NEW.conformity_status THEN
    INSERT INTO public.gap_analysis_audit_log (
      evaluation_id, framework_id, requirement_id, empresa_id,
      campo_alterado, valor_anterior, valor_novo, user_id
    ) VALUES (
      NEW.id, NEW.framework_id, NEW.requirement_id, NEW.empresa_id,
      'conformity_status', OLD.conformity_status, NEW.conformity_status, auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger na tabela de evaluations
CREATE TRIGGER trg_audit_gap_evaluation_changes
  AFTER UPDATE ON public.gap_analysis_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_gap_analysis_evaluation_changes();
