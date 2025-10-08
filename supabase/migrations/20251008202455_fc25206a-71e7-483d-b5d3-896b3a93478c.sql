-- Criar bucket público para logos permanentes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public-assets',
  'public-assets',
  true,
  2097152, -- 2MB
  ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Criar políticas para o bucket public-assets
CREATE POLICY "Public assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'public-assets');

CREATE POLICY "Admins can upload public assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'public-assets' 
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  )
);

CREATE POLICY "Admins can update public assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'public-assets' 
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  )
);

CREATE POLICY "Admins can delete public assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'public-assets' 
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  )
);

-- Adicionar campo logo_url na tabela empresas
ALTER TABLE public.empresas 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

COMMENT ON COLUMN public.empresas.logo_url IS 'URL permanente do logo da empresa no storage público';