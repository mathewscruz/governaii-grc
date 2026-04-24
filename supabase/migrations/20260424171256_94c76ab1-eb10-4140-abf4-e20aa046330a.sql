
-- 1. Make riscos-anexos bucket PRIVATE
UPDATE storage.buckets SET public = false WHERE id = 'riscos-anexos';

-- 2. Tighten riscos-anexos INSERT policy: validate empresa_id in path
DROP POLICY IF EXISTS "Users can upload riscos anexos for their empresa" ON storage.objects;

CREATE POLICY "Users can upload riscos anexos for their empresa"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'riscos-anexos'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = (
    SELECT empresa_id::text FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
  )
);

-- 3. Tighten denuncias-anexos INSERT policies: require an active denuncia
DROP POLICY IF EXISTS "Public can upload anexos via valid denuncia" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload denuncia anexos" ON storage.objects;

CREATE POLICY "Anon can upload denuncia anexos for active denuncia"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'denuncias-anexos'
  AND EXISTS (
    SELECT 1 FROM public.denuncias d
    WHERE d.id::text = (storage.foldername(name))[1]
      AND coalesce(d.status, '') NOT IN ('arquivada', 'encerrada')
  )
);

CREATE POLICY "Authenticated can upload denuncia anexos for own empresa"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'denuncias-anexos'
  AND EXISTS (
    SELECT 1 FROM public.denuncias d
    WHERE d.id::text = (storage.foldername(name))[1]
      AND d.empresa_id = public.get_user_empresa_id()
  )
);

-- 4. Restrict anon SELECT on denuncias_configuracoes — drop the broad anon policy
-- and create a safe public view that excludes token_publico and emails.
DROP POLICY IF EXISTS "Anon can view active config" ON public.denuncias_configuracoes;
DROP POLICY IF EXISTS "Public can view basic denuncia config" ON public.denuncias_configuracoes;

CREATE OR REPLACE VIEW public.denuncias_configuracoes_publicas
WITH (security_invoker = true) AS
SELECT
  id,
  empresa_id,
  texto_apresentacao,
  politica_privacidade,
  permitir_anonimas,
  requerer_email,
  ativo
FROM public.denuncias_configuracoes
WHERE ativo = true;

GRANT SELECT ON public.denuncias_configuracoes_publicas TO anon, authenticated;

-- Server-side token validation function (does not expose the token itself)
CREATE OR REPLACE FUNCTION public.validate_denuncia_token(p_token text)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT empresa_id FROM public.denuncias_configuracoes
  WHERE token_publico = p_token AND ativo = true
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.validate_denuncia_token(text) TO anon, authenticated;

-- 5. Fix function missing search_path
CREATE OR REPLACE FUNCTION public.update_adherence_assessments_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
