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

-- Remover colunas antigas
ALTER TABLE public.documentos DROP COLUMN IF EXISTS confidencial;
ALTER TABLE public.documentos DROP COLUMN IF EXISTS categoria;

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

-- Função trigger para notificações de aprovação
CREATE OR REPLACE FUNCTION public.handle_document_approval_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  documento_nome TEXT;
  documento_empresa_id UUID;
  solicitante_id UUID;
BEGIN
  -- Buscar informações do documento
  SELECT nome, empresa_id, created_by 
  INTO documento_nome, documento_empresa_id, solicitante_id
  FROM public.documentos 
  WHERE id = NEW.documento_id;

  -- Notificar aprovador quando nova aprovação for solicitada
  IF TG_OP = 'INSERT' THEN
    PERFORM create_notification(
      documento_empresa_id,
      NEW.aprovador_id,
      'Documento para Aprovação',
      'O documento "' || documento_nome || '" foi enviado para sua aprovação.',
      'info',
      jsonb_build_object(
        'documento_id', NEW.documento_id,
        'aprovacao_id', NEW.id,
        'acao', 'solicitar_aprovacao'
      )
    );
  END IF;

  -- Notificar solicitante quando status mudar
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status AND NEW.status != 'pendente' THEN
    PERFORM create_notification(
      documento_empresa_id,
      solicitante_id,
      CASE 
        WHEN NEW.status = 'aprovado' THEN 'Documento Aprovado'
        WHEN NEW.status = 'rejeitado' THEN 'Documento Rejeitado'
        ELSE 'Status de Aprovação Alterado'
      END,
      'O documento "' || documento_nome || '" foi ' || NEW.status || '.',
      CASE 
        WHEN NEW.status = 'aprovado' THEN 'success'
        WHEN NEW.status = 'rejeitado' THEN 'error'
        ELSE 'info'
      END,
      jsonb_build_object(
        'documento_id', NEW.documento_id,
        'aprovacao_id', NEW.id,
        'status', NEW.status
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Criar trigger para notificações
DROP TRIGGER IF EXISTS trigger_document_approval_notification ON public.documentos_aprovacoes;
CREATE TRIGGER trigger_document_approval_notification
  AFTER INSERT OR UPDATE ON public.documentos_aprovacoes
  FOR EACH ROW
  EXECUTE FUNCTION handle_document_approval_notification();

-- Adicionar triggers de updated_at
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();