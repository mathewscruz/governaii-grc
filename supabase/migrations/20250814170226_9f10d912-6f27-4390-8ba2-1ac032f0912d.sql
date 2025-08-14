-- Função para marcar lembretes como concluídos quando usuário faz login
CREATE OR REPLACE FUNCTION public.mark_user_reminders_completed()
RETURNS TRIGGER AS $$
BEGIN
  -- Se é a primeira vez que o usuário está fazendo login (não tem last_sign_in_at anterior)
  IF OLD.last_sign_in_at IS NULL AND NEW.last_sign_in_at IS NOT NULL THEN
    -- Marcar todos os lembretes ativos deste usuário como concluídos
    UPDATE public.user_invitation_reminders 
    SET 
      status = 'completed',
      updated_at = now()
    WHERE 
      user_id = NEW.id 
      AND status = 'active';
      
    -- Deletar senha temporária já que o usuário fez login
    UPDATE public.temporary_passwords 
    SET 
      is_temporary = false,
      updated_at = now()
    WHERE 
      user_id = NEW.id 
      AND is_temporary = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para detectar primeiro login e parar lembretes automaticamente
CREATE TRIGGER trigger_mark_user_reminders_completed
AFTER UPDATE OF last_sign_in_at ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.mark_user_reminders_completed();

-- Criar configurações padrão para empresa do super admin
INSERT INTO public.empresa_reminder_settings (empresa_id, reminders_enabled, reminder_intervals, max_reminders)
SELECT 
  p.empresa_id,
  true,
  ARRAY[3, 7, 14],
  3
FROM public.profiles p
WHERE p.role = 'super_admin' 
  AND p.empresa_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.empresa_reminder_settings ers 
    WHERE ers.empresa_id = p.empresa_id
  );