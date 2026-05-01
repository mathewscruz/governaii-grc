
-- =====================================================================
-- Tighten storage policies for 'documentos' and 'due-diligence-evidencias'
-- =====================================================================

-- ---------- documentos bucket ----------
DROP POLICY IF EXISTS "Users can view documents from their empresa" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete documents" ON storage.objects;

-- SELECT: authenticated users from the same empresa
-- Either path starts with their empresa_id OR the file path is referenced
-- by a documents row belonging to their empresa (legacy uploads at root).
CREATE POLICY "documentos_select_same_empresa"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documentos'
  AND (
    (storage.foldername(name))[1] = public.get_user_empresa_id()::text
    OR EXISTS (
      SELECT 1 FROM public.documentos d
      WHERE d.empresa_id = public.get_user_empresa_id()
        AND (d.arquivo_url = storage.objects.name OR d.arquivo_url LIKE '%/' || storage.objects.name)
    )
  )
);

-- INSERT: only authenticated users, must place file under their empresa_id folder
CREATE POLICY "documentos_insert_same_empresa"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documentos'
  AND (storage.foldername(name))[1] = public.get_user_empresa_id()::text
);

-- UPDATE: same empresa scope
CREATE POLICY "documentos_update_same_empresa"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documentos'
  AND (
    (storage.foldername(name))[1] = public.get_user_empresa_id()::text
    OR EXISTS (
      SELECT 1 FROM public.documentos d
      WHERE d.empresa_id = public.get_user_empresa_id()
        AND (d.arquivo_url = storage.objects.name OR d.arquivo_url LIKE '%/' || storage.objects.name)
    )
  )
);

-- DELETE: same empresa scope
CREATE POLICY "documentos_delete_same_empresa"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documentos'
  AND (
    (storage.foldername(name))[1] = public.get_user_empresa_id()::text
    OR EXISTS (
      SELECT 1 FROM public.documentos d
      WHERE d.empresa_id = public.get_user_empresa_id()
        AND (d.arquivo_url = storage.objects.name OR d.arquivo_url LIKE '%/' || storage.objects.name)
    )
  )
);

-- ---------- due-diligence-evidencias bucket ----------
DROP POLICY IF EXISTS "Anyone can upload due diligence evidence" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read due diligence evidence" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can manage due diligence evidence" ON storage.objects;

-- INSERT: anyone may upload, but only under a valid assessment id with an active invitation link
CREATE POLICY "due_diligence_evid_insert_valid_assessment"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'due-diligence-evidencias'
  AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND EXISTS (
    SELECT 1 FROM public.due_diligence_assessments a
    WHERE a.id::text = (storage.foldername(name))[1]
      AND a.link_token IS NOT NULL
  )
);

-- SELECT: only authenticated users from the empresa owning the assessment
CREATE POLICY "due_diligence_evid_select_same_empresa"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'due-diligence-evidencias'
  AND EXISTS (
    SELECT 1 FROM public.due_diligence_assessments a
    WHERE a.id::text = (storage.foldername(name))[1]
      AND a.empresa_id = public.get_user_empresa_id()
  )
);

-- UPDATE/DELETE: only authenticated users from the same empresa
CREATE POLICY "due_diligence_evid_update_same_empresa"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'due-diligence-evidencias'
  AND EXISTS (
    SELECT 1 FROM public.due_diligence_assessments a
    WHERE a.id::text = (storage.foldername(name))[1]
      AND a.empresa_id = public.get_user_empresa_id()
  )
);

CREATE POLICY "due_diligence_evid_delete_same_empresa"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'due-diligence-evidencias'
  AND EXISTS (
    SELECT 1 FROM public.due_diligence_assessments a
    WHERE a.id::text = (storage.foldername(name))[1]
      AND a.empresa_id = public.get_user_empresa_id()
  )
);
