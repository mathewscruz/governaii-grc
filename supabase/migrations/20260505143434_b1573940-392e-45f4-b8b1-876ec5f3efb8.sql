
-- 1) api_keys: restrict raw key visibility to admins; non-admins can list metadata only
DROP POLICY IF EXISTS "Empresa pode gerenciar suas API Keys" ON public.api_keys;

CREATE POLICY "Admins can manage API Keys" ON public.api_keys
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND empresa_id = public.get_user_empresa_id()
  )
  WITH CHECK (
    public.is_admin()
    AND empresa_id = public.get_user_empresa_id()
  );

-- 2) mfa_codes: restrict to authenticated role only (defense in depth)
DROP POLICY IF EXISTS "Users can read own mfa codes" ON public.mfa_codes;
CREATE POLICY "Users can read own mfa codes" ON public.mfa_codes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 3) denuncias: restrict identifying fields to admins/responsible users
DROP POLICY IF EXISTS "Users can view denuncias from their empresa" ON public.denuncias;
CREATE POLICY "Admins/responsavel can view denuncias" ON public.denuncias
  FOR SELECT TO authenticated
  USING (
    empresa_id = public.get_user_empresa_id()
    AND (public.is_admin() OR responsavel_id = auth.uid())
  );

-- 4) profiles.invitation_link: revoke column from non-service roles, add admin RPC
REVOKE SELECT (invitation_link) ON public.profiles FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_user_invitation_link(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT invitation_link
  FROM public.profiles
  WHERE user_id = _user_id
    AND public.is_admin()
    AND (public.is_super_admin() OR empresa_id = public.get_user_empresa_id())
$$;

REVOKE ALL ON FUNCTION public.get_user_invitation_link(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_invitation_link(uuid) TO authenticated;

-- Clear invitation_link when first login completes (extend existing trigger behavior)
CREATE OR REPLACE FUNCTION public.mark_user_reminders_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.last_sign_in_at IS NULL AND NEW.last_sign_in_at IS NOT NULL THEN
    UPDATE public.user_invitation_reminders
      SET status = 'completed', updated_at = now()
      WHERE user_id = NEW.id AND status = 'active';

    UPDATE public.temporary_passwords
      SET is_temporary = false, updated_at = now()
      WHERE user_id = NEW.id AND is_temporary = true;

    UPDATE public.profiles
      SET invitation_link = NULL
      WHERE user_id = NEW.id AND invitation_link IS NOT NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- 5) due_diligence_questions: require valid x-assessment-token header (no anon enumeration)
DROP POLICY IF EXISTS "Anon can view questions for active assessments" ON public.due_diligence_questions;
CREATE POLICY "Token-bearer can view questions for active assessments"
  ON public.due_diligence_questions
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.due_diligence_assessments a
      WHERE a.template_id = due_diligence_questions.template_id
        AND a.link_token IS NOT NULL
        AND a.status IN ('enviado','em_andamento')
        AND a.link_token = ((current_setting('request.headers', true))::json ->> 'x-assessment-token')
    )
  );

-- 6) trial_reminders_sent: super_admin read access
DROP POLICY IF EXISTS service_role_only_select ON public.trial_reminders_sent;
CREATE POLICY "Super admins can view trial reminders"
  ON public.trial_reminders_sent
  FOR SELECT TO authenticated
  USING (public.is_super_admin());

-- 7) dados_descobertas: explicit UPDATE policy
CREATE POLICY "Users can update discoveries from their empresa"
  ON public.dados_descobertas
  FOR UPDATE TO authenticated
  USING (empresa_id = public.get_user_empresa_id())
  WITH CHECK (empresa_id = public.get_user_empresa_id());

-- 8) due_diligence_templates: restrict to authenticated only
DROP POLICY IF EXISTS "Users can view templates from their empresa or standard templat" ON public.due_diligence_templates;
CREATE POLICY "Users can view templates from their empresa or standard templates"
  ON public.due_diligence_templates
  FOR SELECT TO authenticated
  USING (empresa_id = public.get_user_empresa_id() OR padrao = true);
