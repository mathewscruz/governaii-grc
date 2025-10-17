-- Adicionar coluna metadata na tabela notifications
ALTER TABLE public.notifications 
ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;

-- Comentário explicativo
COMMENT ON COLUMN public.notifications.metadata IS 'Dados estruturados adicionais da notificação (documento_id, aprovacao_id, tipo, etc)';

-- Criar índice para melhorar performance de consultas por metadata
CREATE INDEX idx_notifications_metadata ON public.notifications USING GIN (metadata);