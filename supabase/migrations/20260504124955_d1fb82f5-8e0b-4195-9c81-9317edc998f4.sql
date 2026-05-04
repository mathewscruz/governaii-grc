
-- 1) contact_form_submissions: restringir leitura/edição a super_admin apenas
DROP POLICY IF EXISTS "Admins can view contact submissions" ON public.contact_form_submissions;
DROP POLICY IF EXISTS "Admins can update contact submissions" ON public.contact_form_submissions;
DROP POLICY IF EXISTS "Admins can delete contact submissions" ON public.contact_form_submissions;

CREATE POLICY "Super admins can view contact submissions"
ON public.contact_form_submissions
FOR SELECT
USING (public.is_super_admin());

CREATE POLICY "Super admins can update contact submissions"
ON public.contact_form_submissions
FOR UPDATE
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admins can delete contact submissions"
ON public.contact_form_submissions
FOR DELETE
USING (public.is_super_admin());

-- 2) profiles_update_policy: bloquear privilege escalation via WITH CHECK além do trigger
DROP POLICY IF EXISTS profiles_update_policy ON public.profiles;

CREATE POLICY profiles_update_policy
ON public.profiles
FOR UPDATE
USING (
  public.is_super_admin()
  OR (public.is_admin() AND empresa_id = public.get_user_empresa_id())
  OR (user_id = auth.uid())
)
WITH CHECK (
  public.is_super_admin()
  OR (
    public.is_admin()
    AND empresa_id = public.get_user_empresa_id()
  )
  OR (
    user_id = auth.uid()
    -- Usuário comum só pode salvar a linha se NÃO estiver mudando role/empresa/profile
    AND role = (SELECT p.role FROM public.profiles p WHERE p.user_id = auth.uid())
    AND empresa_id IS NOT DISTINCT FROM (SELECT p.empresa_id FROM public.profiles p WHERE p.user_id = auth.uid())
    AND permission_profile_id IS NOT DISTINCT FROM (SELECT p.permission_profile_id FROM public.profiles p WHERE p.user_id = auth.uid())
  )
);

-- 3) endpoint-agent-binaries: tornar bucket privado e restringir leitura a autenticados
UPDATE storage.buckets SET public = false WHERE id = 'endpoint-agent-binaries';

DROP POLICY IF EXISTS "Authenticated users can read endpoint agent binaries" ON storage.objects;
CREATE POLICY "Authenticated users can read endpoint agent binaries"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'endpoint-agent-binaries'
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Admins manage endpoint agent binaries" ON storage.objects;
CREATE POLICY "Admins manage endpoint agent binaries"
ON storage.objects
FOR ALL
USING (bucket_id = 'endpoint-agent-binaries' AND public.is_admin())
WITH CHECK (bucket_id = 'endpoint-agent-binaries' AND public.is_admin());

-- 4) due-diligence-evidencias INSERT: exigir token correspondente no header
DROP POLICY IF EXISTS due_diligence_evid_insert_valid_assessment ON storage.objects;

CREATE POLICY due_diligence_evid_insert_valid_assessment
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'due-diligence-evidencias'
  AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND EXISTS (
    SELECT 1 FROM public.due_diligence_assessments a
    WHERE a.id::text = (storage.foldername(name))[1]
      AND a.link_token IS NOT NULL
      AND (
        -- Usuário autenticado da mesma empresa pode subir evidência
        (auth.uid() IS NOT NULL AND a.empresa_id = public.get_user_empresa_id())
        -- OU portador do token correto enviado via header x-assessment-token
        OR a.link_token = current_setting('request.headers', true)::json->>'x-assessment-token'
      )
  )
);
