-- Criar tabela para controle de lembretes de convites
CREATE TABLE public.user_invitation_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  empresa_id UUID NOT NULL,
  reminder_count INTEGER NOT NULL DEFAULT 0,
  last_reminder_sent TIMESTAMP WITH TIME ZONE,
  next_reminder_due TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_user_invitation_reminders_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Habilitar RLS
ALTER TABLE public.user_invitation_reminders ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view reminders from their empresa" 
ON public.user_invitation_reminders 
FOR SELECT 
USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Admins can insert reminders in their empresa" 
ON public.user_invitation_reminders 
FOR INSERT 
WITH CHECK (empresa_id = get_user_empresa_id() AND is_admin());

CREATE POLICY "Admins can update reminders from their empresa" 
ON public.user_invitation_reminders 
FOR UPDATE 
USING (empresa_id = get_user_empresa_id() AND is_admin());

CREATE POLICY "Admins can delete reminders from their empresa" 
ON public.user_invitation_reminders 
FOR DELETE 
USING (empresa_id = get_user_empresa_id() AND is_admin());

-- Trigger para atualizar updated_at
CREATE TRIGGER update_user_invitation_reminders_updated_at
BEFORE UPDATE ON public.user_invitation_reminders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_user_invitation_reminders_next_due ON public.user_invitation_reminders(next_reminder_due) WHERE status = 'active';
CREATE INDEX idx_user_invitation_reminders_user_empresa ON public.user_invitation_reminders(user_id, empresa_id);

-- Configurações da empresa para lembretes
CREATE TABLE public.empresa_reminder_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  reminders_enabled BOOLEAN NOT NULL DEFAULT true,
  reminder_intervals INTEGER[] NOT NULL DEFAULT ARRAY[3, 7, 14], -- dias após último lembrete
  max_reminders INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(empresa_id)
);

-- Habilitar RLS na tabela de configurações
ALTER TABLE public.empresa_reminder_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para configurações
CREATE POLICY "Users can view reminder settings from their empresa" 
ON public.empresa_reminder_settings 
FOR SELECT 
USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Admins can manage reminder settings in their empresa" 
ON public.empresa_reminder_settings 
FOR ALL 
USING (empresa_id = get_user_empresa_id() AND is_admin())
WITH CHECK (empresa_id = get_user_empresa_id() AND is_admin());

-- Trigger para atualizar updated_at das configurações
CREATE TRIGGER update_empresa_reminder_settings_updated_at
BEFORE UPDATE ON public.empresa_reminder_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();