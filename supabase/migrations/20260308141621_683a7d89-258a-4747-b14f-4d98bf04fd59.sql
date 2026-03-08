
-- =============================================
-- 1. CRITICAL: Fix temporary_passwords INSERT policy
-- =============================================
DROP POLICY IF EXISTS "Admins can insert temporary passwords" ON temporary_passwords;
CREATE POLICY "Admins can insert temporary passwords" ON temporary_passwords
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_super_admin());

-- =============================================
-- 2. HIGH: Add MFA sessions policies
-- =============================================
CREATE POLICY "Users can view own mfa sessions" ON mfa_sessions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own mfa sessions" ON mfa_sessions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own mfa sessions" ON mfa_sessions
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- =============================================
-- 3. HIGH: Fix denuncias INSERT policies
-- =============================================
DROP POLICY IF EXISTS "Public can insert denuncias via token" ON denuncias;
DROP POLICY IF EXISTS "Public insert for denuncias" ON denuncias;
CREATE POLICY "Public can insert denuncias for active companies" ON denuncias
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM denuncias_configuracoes dc
      WHERE dc.empresa_id = denuncias.empresa_id AND dc.ativo = true
    )
  );

DROP POLICY IF EXISTS "Public can insert anexos via denuncia" ON denuncias_anexos;
CREATE POLICY "Public can insert anexos for existing denuncias" ON denuncias_anexos
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM denuncias WHERE id = denuncia_id)
  );

-- =============================================
-- 4. MEDIUM: Create public view for denuncia config (hides emails)
-- =============================================
CREATE OR REPLACE VIEW public.denuncias_configuracoes_public AS
  SELECT id, empresa_id, ativo, token_publico, permitir_anonimas,
         requerer_email, texto_apresentacao, politica_privacidade
  FROM public.denuncias_configuracoes;

GRANT SELECT ON public.denuncias_configuracoes_public TO anon;
GRANT SELECT ON public.denuncias_configuracoes_public TO authenticated;

DROP POLICY IF EXISTS "Public can view basic denuncia config" ON denuncias_configuracoes;
CREATE POLICY "Authenticated can view denuncia config" ON denuncias_configuracoes
  FOR SELECT TO authenticated USING (empresa_id = public.get_user_empresa_id());

-- =============================================
-- 5. MEDIUM: Fix gap_analysis_requirements cross-tenant read
-- =============================================
DROP POLICY IF EXISTS "Users can view all requirements" ON gap_analysis_requirements;
CREATE POLICY "Users can view own or global requirements" ON gap_analysis_requirements
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM gap_analysis_frameworks f
      WHERE f.id = framework_id
      AND (f.empresa_id IS NULL OR f.empresa_id = public.get_user_empresa_id())
    )
  );

-- =============================================
-- 6. LOW: Fix search_path on function
-- =============================================
CREATE OR REPLACE FUNCTION public.can_update_assessment_via_token(assessment_link_token text)
  RETURNS boolean
  LANGUAGE sql
  STABLE SECURITY DEFINER
  SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.due_diligence_assessments 
    WHERE link_token = assessment_link_token 
    AND link_token IS NOT NULL
  );
$$;
