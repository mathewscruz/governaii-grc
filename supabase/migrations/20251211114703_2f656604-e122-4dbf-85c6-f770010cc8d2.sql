-- Adicionar coluna imagem_url na tabela sistemas_privilegiados
ALTER TABLE public.sistemas_privilegiados 
ADD COLUMN IF NOT EXISTS imagem_url TEXT;

-- Criar bucket para logos de sistemas
INSERT INTO storage.buckets (id, name, public)
VALUES ('sistema-logos', 'sistema-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir visualização pública
CREATE POLICY "Sistema logos são públicas para visualização"
ON storage.objects FOR SELECT
USING (bucket_id = 'sistema-logos');

-- Política para permitir upload por usuários autenticados
CREATE POLICY "Usuários autenticados podem fazer upload de logos de sistema"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'sistema-logos' AND auth.role() = 'authenticated');

-- Política para permitir atualização por usuários autenticados
CREATE POLICY "Usuários autenticados podem atualizar logos de sistema"
ON storage.objects FOR UPDATE
USING (bucket_id = 'sistema-logos' AND auth.role() = 'authenticated');

-- Política para permitir exclusão por usuários autenticados
CREATE POLICY "Usuários autenticados podem excluir logos de sistema"
ON storage.objects FOR DELETE
USING (bucket_id = 'sistema-logos' AND auth.role() = 'authenticated');