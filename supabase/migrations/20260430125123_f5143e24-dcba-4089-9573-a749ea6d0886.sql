INSERT INTO storage.buckets (id, name, public)
VALUES ('endpoint-agent-binaries', 'endpoint-agent-binaries', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can read endpoint agent binaries"
ON storage.objects FOR SELECT
USING (bucket_id = 'endpoint-agent-binaries');

CREATE POLICY "Super admins can upload endpoint agent binaries"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'endpoint-agent-binaries'
  AND public.is_super_admin()
);

CREATE POLICY "Super admins can update endpoint agent binaries"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'endpoint-agent-binaries'
  AND public.is_super_admin()
);

CREATE POLICY "Super admins can delete endpoint agent binaries"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'endpoint-agent-binaries'
  AND public.is_super_admin()
);