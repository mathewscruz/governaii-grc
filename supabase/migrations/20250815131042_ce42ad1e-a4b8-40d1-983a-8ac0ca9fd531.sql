-- Corrigir funções sem search_path definido
ALTER FUNCTION public.trigger_calculate_score() SET search_path TO 'public';
ALTER FUNCTION public.mark_user_reminders_completed() SET search_path TO 'public';
ALTER FUNCTION public.apply_default_permissions_for_user(uuid) SET search_path TO 'public';
ALTER FUNCTION public.audit_ativos_changes() SET search_path TO 'public';
ALTER FUNCTION public.audit_controles_changes() SET search_path TO 'public';
ALTER FUNCTION public.calculate_due_diligence_score(uuid) SET search_path TO 'public';