-- Criar tabela de notificações se não existir
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  user_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'info',
  lida BOOLEAN NOT NULL DEFAULT false,
  data_leitura TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Verificar se RLS já está habilitado antes de habilitar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
    AND c.relname = 'notifications'
    AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Adicionar coluna classificacao se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public'
                 AND table_name = 'documentos' 
                 AND column_name = 'classificacao') THEN
    ALTER TABLE public.documentos ADD COLUMN classificacao TEXT DEFAULT 'interna';
  END IF;
END $$;

-- Migrar dados de categoria e confidencial para classificacao
UPDATE public.documentos 
SET classificacao = CASE 
  WHEN confidencial = true THEN 'confidencial'
  WHEN categoria IS NULL OR categoria = '' THEN 'interna'
  WHEN LOWER(categoria) LIKE '%confidencial%' THEN 'confidencial'
  WHEN LOWER(categoria) LIKE '%restrita%' THEN 'restrita'
  WHEN LOWER(categoria) LIKE '%publica%' OR LOWER(categoria) LIKE '%pública%' THEN 'publica'
  ELSE 'interna'
END
WHERE classificacao IS NULL OR classificacao = 'interna';

-- Remover colunas antigas se existirem
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public'
             AND table_name = 'documentos' 
             AND column_name = 'confidencial') THEN
    ALTER TABLE public.documentos DROP COLUMN confidencial;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public'
             AND table_name = 'documentos' 
             AND column_name = 'categoria') THEN
    ALTER TABLE public.documentos DROP COLUMN categoria;
  END IF;
END $$;