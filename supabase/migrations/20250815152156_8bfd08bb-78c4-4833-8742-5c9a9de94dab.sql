-- Criar apenas a tabela de notificações primeiro
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

-- Adicionar trigger de updated_at
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();