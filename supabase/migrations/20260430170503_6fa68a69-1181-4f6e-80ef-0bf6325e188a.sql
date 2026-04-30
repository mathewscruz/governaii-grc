-- Remove cron job
DO $$
BEGIN
  PERFORM cron.unschedule('mark-offline-endpoints');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Drop function
DROP FUNCTION IF EXISTS public.mark_offline_endpoints();

-- Drop tables (CASCADE removes triggers, indexes, policies)
DROP TABLE IF EXISTS public.endpoint_inventory_snapshots CASCADE;
DROP TABLE IF EXISTS public.endpoint_agents CASCADE;
DROP TABLE IF EXISTS public.endpoint_enrollment_tokens CASCADE;

-- Drop storage policies for endpoint-agent-binaries bucket
DROP POLICY IF EXISTS "Public can read endpoint agent binaries" ON storage.objects;
DROP POLICY IF EXISTS "Super admins can upload endpoint agent binaries" ON storage.objects;
DROP POLICY IF EXISTS "Super admins can update endpoint agent binaries" ON storage.objects;
DROP POLICY IF EXISTS "Super admins can delete endpoint agent binaries" ON storage.objects;