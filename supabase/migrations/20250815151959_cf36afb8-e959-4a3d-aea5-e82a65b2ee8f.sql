-- Criar tabela de notificações
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

-- Verificar se a coluna classificacao já existe antes de adicionar
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public'
                 AND table_name = 'documentos' 
                 AND column_name = 'classificacao') THEN
    ALTER TABLE public.documentos ADD COLUMN classificacao TEXT DEFAULT 'interna';
  END IF;
END $$;

-- Verificar se a coluna confidencial existe e migrar/remover
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public'
             AND table_name = 'documentos' 
             AND column_name = 'confidencial') THEN
    -- Migrar dados de confidencial para classificacao antes de remover
    UPDATE public.documentos 
    SET classificacao = CASE 
      WHEN confidencial = true THEN 'confidencial'
      ELSE 'interna'
    END
    WHERE classificacao IS NULL OR classificacao = 'interna';
    
    -- Remover coluna confidencial
    ALTER TABLE public.documentos DROP COLUMN confidencial;
  END IF;
END $$;

-- Verificar se a coluna categoria existe e migrar/remover
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public'
             AND table_name = 'documentos' 
             AND column_name = 'categoria') THEN
    -- Atualizar classificacao baseado na categoria existente
    UPDATE public.documentos 
    SET classificacao = CASE 
      WHEN categoria IS NULL OR categoria = '' THEN 'interna'
      WHEN LOWER(categoria) LIKE '%confidencial%' THEN 'confidencial'
      WHEN LOWER(categoria) LIKE '%restrita%' THEN 'restrita'
      WHEN LOWER(categoria) LIKE '%publica%' OR LOWER(categoria) LIKE '%pública%' THEN 'publica'
      ELSE 'interna'
    END;
    
    -- Remover coluna categoria após migração
    ALTER TABLE public.documentos DROP COLUMN categoria;
  END IF;
END $$;

-- Enable RLS para notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para notifications
CREATE POLICY "Users can view notifications from their empresa" 
ON public.notifications 
FOR SELECT 
USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can insert notifications in their empresa" 
ON public.notifications 
FOR INSERT 
WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can update notifications from their empresa" 
ON public.notifications 
FOR UPDATE 
USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can delete notifications from their empresa" 
ON public.notifications 
FOR DELETE 
USING (empresa_id = get_user_empresa_id());

-- Função para criar notificação automática
CREATE OR REPLACE FUNCTION public.create_notification(
  p_empresa_id UUID,
  p_user_id UUID,
  p_titulo TEXT,
  p_mensagem TEXT,
  p_tipo TEXT DEFAULT 'info',
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    empresa_id,
    user_id,
    titulo,
    mensagem,
    tipo,
    metadata
  ) VALUES (
    p_empresa_id,
    p_user_id,
    p_titulo,
    p_mensagem,
    p_tipo,
    p_metadata
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Adicionar triggers de updated_at
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();