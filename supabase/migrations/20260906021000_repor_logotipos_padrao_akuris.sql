-- One-time reset explicitly requested for all existing companies.
-- NULL activates the existing context-aware Akuris fallback, including the
-- black wordmark on the public reporting portal. Preserve original objects.
BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '30s';
UPDATE public.empresas SET logo_url = NULL WHERE logo_url IS NOT NULL;
UPDATE public.denuncias_configuracoes SET logo_url = NULL WHERE logo_url IS NOT NULL;
-- Existing generated documents are historical records and are not rewritten.
UPDATE public.docgen_layouts SET logo_url = NULL WHERE empresa_id IS NOT NULL AND logo_url IS NOT NULL;
COMMIT;
