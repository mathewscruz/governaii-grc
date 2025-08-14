-- Configurar cron job para processamento diário de lembretes
-- Habilitar extensões necessárias se não estiverem habilitadas
SELECT cron.schedule(
  'daily-invitation-reminders',
  '0 9 * * *', -- Todo dia às 9h da manhã
  $$
  SELECT
    net.http_post(
        url:='https://lnlkahtugwmkznasapfd.supabase.co/functions/v1/daily-reminder-processor',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubGthaHR1Z3dta3puYXNhcGZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxOTk4MjcsImV4cCI6MjA2ODc3NTgyN30.DRHZ_55_8aH8fEDghoY84fl3rChFNgVyPA9UM3y-KCY"}'::jsonb,
        body:='{"timestamp": "' || now() || '"}'::jsonb
    ) as request_id;
  $$
);

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