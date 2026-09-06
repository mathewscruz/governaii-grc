-- Scheduled maintenance: scoped credentials, run visibility and duplicate guards.
-- Secrets are provisioned separately. This migration does not run or schedule jobs.
BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '30s';

CREATE TABLE public.rotinas_agendadas_execucoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rotina text NOT NULL CHECK (rotina IN ('lembretes-diarios', 'expurgar-denuncias')),
  dia date NOT NULL,
  status text NOT NULL CHECK (status IN ('executando', 'concluida', 'falhou')),
  iniciado_em timestamptz NOT NULL DEFAULT now(),
  concluido_em timestamptz,
  reserva_ate timestamptz NOT NULL,
  tentativas integer NOT NULL DEFAULT 1,
  resumo jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (rotina, dia)
);
ALTER TABLE public.rotinas_agendadas_execucoes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.rotinas_agendadas_execucoes FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.rotinas_agendadas_execucoes TO service_role;
COMMENT ON TABLE public.rotinas_agendadas_execucoes IS
  'Resultado real das rotinas, sem destinatários ou conteúdo de denúncias. Uma reserva diária impede execuções simultâneas.';

CREATE FUNCTION public.iniciar_rotina_agendada(p_rotina text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp' AS $$
DECLARE v_id uuid;
BEGIN
  IF p_rotina NOT IN ('lembretes-diarios', 'expurgar-denuncias') OR p_rotina IS NULL THEN
    RAISE EXCEPTION 'Rotina inválida';
  END IF;
  INSERT INTO public.rotinas_agendadas_execucoes (rotina, dia, status, reserva_ate)
  VALUES (p_rotina, (now() AT TIME ZONE 'UTC')::date, 'executando', now() + interval '15 minutes')
  ON CONFLICT (rotina, dia) DO UPDATE SET
    id = gen_random_uuid(), status = 'executando', iniciado_em = now(),
    concluido_em = NULL, reserva_ate = now() + interval '15 minutes',
    tentativas = rotinas_agendadas_execucoes.tentativas + 1, resumo = '{}'::jsonb
  WHERE rotinas_agendadas_execucoes.status = 'falhou'
     OR (rotinas_agendadas_execucoes.status = 'executando' AND rotinas_agendadas_execucoes.reserva_ate < now())
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

CREATE FUNCTION public.finalizar_rotina_agendada(p_id uuid, p_sucesso boolean, p_resumo jsonb DEFAULT '{}'::jsonb)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp' AS $$
BEGIN
  IF octet_length(coalesce(p_resumo, '{}'::jsonb)::text) > 16000 THEN
    RAISE EXCEPTION 'Resumo demasiado grande';
  END IF;
  UPDATE public.rotinas_agendadas_execucoes
     SET status = CASE WHEN p_sucesso IS TRUE THEN 'concluida' ELSE 'falhou' END,
         concluido_em = now(), reserva_ate = now(), resumo = coalesce(p_resumo, '{}'::jsonb)
   WHERE id = p_id AND status = 'executando';
  RETURN FOUND;
END $$;

-- No invented PostgREST relationship: temporary_passwords references auth.users,
-- not profiles. Only return contact data actually needed by this internal worker.
CREATE FUNCTION public.convites_elegiveis_lembrete(p_empresa_id uuid DEFAULT NULL, p_user_id uuid DEFAULT NULL)
RETURNS TABLE(user_id uuid, empresa_id uuid, nome text, email text, empresa_nome text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public', 'pg_temp' AS $$
  SELECT p.user_id, p.empresa_id, p.nome::text, p.email::text, e.nome::text, p.created_at
  FROM public.profiles p
  JOIN public.empresas e ON e.id = p.empresa_id
  JOIN public.empresa_reminder_settings s ON s.empresa_id = p.empresa_id AND s.reminders_enabled
  WHERE p.ativo IS TRUE
    AND (p_empresa_id IS NULL OR p.empresa_id = p_empresa_id)
    AND (p_user_id IS NULL OR p.user_id = p_user_id)
    AND EXISTS (SELECT 1 FROM public.temporary_passwords t WHERE t.user_id = p.user_id
                AND t.is_temporary AND t.expires_at > now())
  ORDER BY p.user_id;
$$;

CREATE FUNCTION public.prever_expurgo_denuncias()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp' AS $$
  SELECT jsonb_build_object(
    'denuncias_elegiveis', (SELECT count(*) FROM public.denuncias d
      JOIN public.denuncias_configuracoes c ON c.empresa_id = d.empresa_id
      WHERE c.retencao_meses > 0 AND d.status IN ('resolvida', 'arquivada')
        AND d.data_conclusao IS NOT NULL
        AND d.data_conclusao < now() - make_interval(months => c.retencao_meses)),
    'ficheiros_pendentes', (SELECT count(*) FROM public.denuncias_ficheiros_por_apagar WHERE apagado_em IS NULL),
    'ficheiros_com_falhas', (SELECT count(*) FROM public.denuncias_ficheiros_por_apagar WHERE apagado_em IS NULL AND tentativas >= 5)
  );
$$;

-- Token resolution happens at execution time, never interpolated into cron.job.
CREATE FUNCTION public.executar_rotina_agendada(p_rotina text, p_dry_run boolean DEFAULT false)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'pg_temp' AS $$
DECLARE v_url text; v_token text; v_secret text; v_function text; v_request bigint;
BEGIN
  CASE p_rotina
    WHEN 'lembretes-diarios' THEN
      v_secret := 'lembretes_diarios_token'; v_function := 'daily-reminder-processor';
    WHEN 'expurgar-denuncias' THEN
      v_secret := 'expurgo_denuncias_token'; v_function := 'expurgar-denuncias';
    ELSE RAISE EXCEPTION 'Rotina inválida';
  END CASE;
  SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'projeto_url';
  SELECT decrypted_secret INTO v_token FROM vault.decrypted_secrets WHERE name = v_secret;
  IF v_url IS NULL OR v_url !~ '^https://[a-z0-9]+\.supabase\.co$'
     OR v_token IS NULL OR length(v_token) < 32 THEN
    RAISE EXCEPTION 'Credenciais da rotina não configuradas';
  END IF;
  SELECT net.http_post(
    url := v_url || '/functions/v1/' || v_function,
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_token),
    body := jsonb_build_object('origem', 'cron', 'dry_run', p_dry_run),
    timeout_milliseconds := 120000
  ) INTO v_request;
  RETURN v_request;
END $$;

CREATE OR REPLACE FUNCTION public.agendar_lembretes_diarios()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'pg_temp' AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'projeto_url')
     OR NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'lembretes_diarios_token') THEN
    RAISE EXCEPTION 'Credenciais de lembretes não configuradas';
  END IF;
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'daily-invitation-reminders';
  PERFORM cron.schedule('lembretes-diarios', '0 9 * * *',
    $cron$SELECT public.executar_rotina_agendada('lembretes-diarios');$cron$);
  RETURN 'agendado';
END $$;

CREATE OR REPLACE FUNCTION public.agendar_expurgo_denuncias()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'pg_temp' AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'projeto_url')
     OR NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'expurgo_denuncias_token') THEN
    RAISE EXCEPTION 'Credenciais de expurgo não configuradas';
  END IF;
  PERFORM cron.schedule('expurgar-denuncias', '30 4 * * *',
    $cron$SELECT public.executar_rotina_agendada('expurgar-denuncias');$cron$);
  RETURN 'agendado';
END $$;

REVOKE ALL ON FUNCTION public.iniciar_rotina_agendada(text), public.finalizar_rotina_agendada(uuid, boolean, jsonb),
  public.convites_elegiveis_lembrete(uuid, uuid), public.prever_expurgo_denuncias(),
  public.executar_rotina_agendada(text, boolean), public.agendar_lembretes_diarios(), public.agendar_expurgo_denuncias()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.iniciar_rotina_agendada(text), public.finalizar_rotina_agendada(uuid, boolean, jsonb),
  public.convites_elegiveis_lembrete(uuid, uuid), public.prever_expurgo_denuncias(),
  public.executar_rotina_agendada(text, boolean), public.agendar_lembretes_diarios(), public.agendar_expurgo_denuncias()
  TO service_role;
COMMIT;
