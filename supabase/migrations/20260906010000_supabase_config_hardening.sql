-- Align hosted security with the existing Akuris MFA and upload contracts.
-- No business rows, existing objects, session records or credentials are changed.
BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '30s';

-- Internal helper: its only callers are postgres-owned SECURITY DEFINER
-- functions (the history trigger and the tenant-authorized recalculation RPC).
-- It does not validate the caller's tenant and must not be callable directly.
REVOKE ALL ON FUNCTION public.risco_avaliar_na_matriz(uuid, smallint, smallint)
  FROM PUBLIC, anon, authenticated;

-- The new privacy tables had tenant/module policies but lacked the second
-- factor required on other business tables. Public portal RPCs and service-role
-- handlers retain their existing access; permissive tenant policies stay intact.
DO $migration$
DECLARE v_table text;
BEGIN
  FOREACH v_table IN ARRAY ARRAY[
    'contratos_templates',
    'dados_solicitacao_anexos', 'dados_solicitacao_eventos',
    'privacidade_auditoria', 'privacidade_avaliacoes',
    'privacidade_consentimentos', 'privacidade_incidente_detalhes',
    'privacidade_portais', 'privacidade_retencoes', 'privacidade_terceiros'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = v_table
        AND policyname = 'akuris_mfa_required'
    ) THEN
      EXECUTE format(
        'CREATE POLICY akuris_mfa_required ON public.%I AS RESTRICTIVE FOR ALL TO authenticated '
        'USING (public.has_valid_mfa_session()) WITH CHECK (public.has_valid_mfa_session())',
        v_table
      );
    END IF;
  END LOOP;
END;
$migration$;

-- Apply the same limits already enforced by the upload screens, on the
-- server as well. Preserve any stricter limits and existing MIME restrictions.
-- These settings affect future uploads, not existing file downloads.
UPDATE storage.buckets
SET file_size_limit = LEAST(COALESCE(file_size_limit, 5242880), 5242880),
    allowed_mime_types = COALESCE(allowed_mime_types, ARRAY[
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'
    ])
WHERE id IN ('empresa-logos', 'profile-photos');

-- The system-logo RLS policies already accept only PNG/JPEG/WebP.
UPDATE storage.buckets
SET file_size_limit = LEAST(COALESCE(file_size_limit, 2097152), 2097152),
    allowed_mime_types = COALESCE(allowed_mime_types, ARRAY[
      'image/jpeg', 'image/png', 'image/webp'
    ])
WHERE id = 'sistema-logos';

COMMIT;
