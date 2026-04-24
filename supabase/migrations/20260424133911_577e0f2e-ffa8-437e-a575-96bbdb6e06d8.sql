ALTER TABLE public.documentos
ADD COLUMN IF NOT EXISTS arquivo_url_externa TEXT;

COMMENT ON COLUMN public.documentos.arquivo_url_externa IS 'URL externa do documento (Google Drive, SharePoint, etc) como alternativa ao upload de arquivo';