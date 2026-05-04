
-- =========================================================
-- 1) PROFILES: bloquear auto-escalação de privilégio
-- =========================================================
CREATE OR REPLACE FUNCTION public.prevent_profile_self_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se quem está atualizando é o próprio dono do registro E não é admin/super_admin,
  -- impedir alteração de campos sensíveis.
  IF auth.uid() = OLD.user_id
     AND NOT public.is_admin()
     AND NOT public.is_super_admin() THEN

    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Não é permitido alterar a própria função (role).'
        USING ERRCODE = '42501';
    END IF;

    IF NEW.empresa_id IS DISTINCT FROM OLD.empresa_id THEN
      RAISE EXCEPTION 'Não é permitido alterar a própria empresa.'
        USING ERRCODE = '42501';
    END IF;

    IF NEW.permission_profile_id IS DISTINCT FROM OLD.permission_profile_id THEN
      RAISE EXCEPTION 'Não é permitido alterar o próprio perfil de permissão.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_self_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_self_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_self_escalation();

-- =========================================================
-- 2) STORAGE: sistema-logos — somente admin/super_admin
-- =========================================================
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload de logos de sistema" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar logos de sistema" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir logos de sistema" ON storage.objects;

CREATE POLICY "Admins can upload sistema logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'sistema-logos'
  AND (public.is_admin() OR public.is_super_admin())
);

CREATE POLICY "Admins can update sistema logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'sistema-logos'
  AND (public.is_admin() OR public.is_super_admin())
);

CREATE POLICY "Admins can delete sistema logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'sistema-logos'
  AND (public.is_admin() OR public.is_super_admin())
);

-- =========================================================
-- 3) STORAGE: logotipo (privado) — somente super_admin
-- =========================================================
DROP POLICY IF EXISTS "Super admins can view logotipo" ON storage.objects;
DROP POLICY IF EXISTS "Super admins can upload logotipo" ON storage.objects;
DROP POLICY IF EXISTS "Super admins can update logotipo" ON storage.objects;
DROP POLICY IF EXISTS "Super admins can delete logotipo" ON storage.objects;

CREATE POLICY "Super admins can view logotipo"
ON storage.objects FOR SELECT
USING (bucket_id = 'logotipo' AND public.is_super_admin());

CREATE POLICY "Super admins can upload logotipo"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'logotipo' AND public.is_super_admin());

CREATE POLICY "Super admins can update logotipo"
ON storage.objects FOR UPDATE
USING (bucket_id = 'logotipo' AND public.is_super_admin());

CREATE POLICY "Super admins can delete logotipo"
ON storage.objects FOR DELETE
USING (bucket_id = 'logotipo' AND public.is_super_admin());

-- =========================================================
-- 4) STORAGE: contrato-documentos — escopo por empresa
--    Path layout: <contrato_id>/<filename>
-- =========================================================
DROP POLICY IF EXISTS "Users can view contrato documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload contrato documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update contrato documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete contrato documents" ON storage.objects;

CREATE POLICY "Empresa users can view contrato documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'contrato-documentos'
  AND EXISTS (
    SELECT 1 FROM public.contratos c
    WHERE c.id::text = (storage.foldername(name))[1]
      AND c.empresa_id = public.get_user_empresa_id()
  )
);

CREATE POLICY "Empresa users can upload contrato documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'contrato-documentos'
  AND EXISTS (
    SELECT 1 FROM public.contratos c
    WHERE c.id::text = (storage.foldername(name))[1]
      AND c.empresa_id = public.get_user_empresa_id()
  )
);

CREATE POLICY "Empresa users can update contrato documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'contrato-documentos'
  AND EXISTS (
    SELECT 1 FROM public.contratos c
    WHERE c.id::text = (storage.foldername(name))[1]
      AND c.empresa_id = public.get_user_empresa_id()
  )
);

CREATE POLICY "Empresa users can delete contrato documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'contrato-documentos'
  AND EXISTS (
    SELECT 1 FROM public.contratos c
    WHERE c.id::text = (storage.foldername(name))[1]
      AND c.empresa_id = public.get_user_empresa_id()
  )
);

-- =========================================================
-- 5) STORAGE: controles-evidencias — escopo por empresa
--    Path layout: <controle_id>/<filename>
-- =========================================================
DROP POLICY IF EXISTS "Authenticated users can view controles evidencias" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload controles evidencias" ON storage.objects;
DROP POLICY IF EXISTS "Users can update controles evidencias" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete controles evidencias" ON storage.objects;

CREATE POLICY "Empresa users can view controles evidencias"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'controles-evidencias'
  AND EXISTS (
    SELECT 1 FROM public.controles c
    WHERE c.id::text = (storage.foldername(name))[1]
      AND c.empresa_id = public.get_user_empresa_id()
  )
);

CREATE POLICY "Empresa users can upload controles evidencias"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'controles-evidencias'
  AND EXISTS (
    SELECT 1 FROM public.controles c
    WHERE c.id::text = (storage.foldername(name))[1]
      AND c.empresa_id = public.get_user_empresa_id()
  )
);

CREATE POLICY "Empresa users can update controles evidencias"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'controles-evidencias'
  AND EXISTS (
    SELECT 1 FROM public.controles c
    WHERE c.id::text = (storage.foldername(name))[1]
      AND c.empresa_id = public.get_user_empresa_id()
  )
);

CREATE POLICY "Empresa users can delete controles evidencias"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'controles-evidencias'
  AND EXISTS (
    SELECT 1 FROM public.controles c
    WHERE c.id::text = (storage.foldername(name))[1]
      AND c.empresa_id = public.get_user_empresa_id()
  )
);

-- =========================================================
-- 6) STORAGE: dados-documentos — aceita empresa_id ou user_id no path
-- =========================================================
DROP POLICY IF EXISTS "Users can view dados documents from their empresa" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload dados documents in their empresa" ON storage.objects;
DROP POLICY IF EXISTS "Users can update dados documents from their empresa" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete dados documents from their empresa" ON storage.objects;

CREATE POLICY "Empresa users can view dados documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'dados-documentos'
  AND (
    public.get_user_empresa_id()::text = (storage.foldername(name))[1]
    OR auth.uid()::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Empresa users can upload dados documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'dados-documentos'
  AND (
    public.get_user_empresa_id()::text = (storage.foldername(name))[1]
    OR auth.uid()::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Empresa users can update dados documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'dados-documentos'
  AND (
    public.get_user_empresa_id()::text = (storage.foldername(name))[1]
    OR auth.uid()::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Empresa users can delete dados documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'dados-documentos'
  AND (
    public.get_user_empresa_id()::text = (storage.foldername(name))[1]
    OR auth.uid()::text = (storage.foldername(name))[1]
  )
);

-- =========================================================
-- 7) STORAGE: profile-photos — edição/deleção restritas ao dono
--    Path layout: <user_id>.<ext>
-- =========================================================
DROP POLICY IF EXISTS "Users can update their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own profile photos" ON storage.objects;

CREATE POLICY "Users can upload their own profile photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-photos'
  AND auth.role() = 'authenticated'
  AND split_part(name, '.', 1) = auth.uid()::text
);

CREATE POLICY "Users can update their own profile photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-photos'
  AND split_part(name, '.', 1) = auth.uid()::text
);

CREATE POLICY "Users can delete their own profile photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-photos'
  AND split_part(name, '.', 1) = auth.uid()::text
);
