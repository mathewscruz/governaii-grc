DO $$
DECLARE
  v_jobid bigint;
  v_count int;
BEGIN
  -- Re-aplicar o agendamento de forma idempotente
  SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = 'check-trial-expiration-daily';
  IF v_jobid IS NOT NULL THEN
    PERFORM cron.unschedule(v_jobid);
  END IF;

  PERFORM cron.schedule(
    'check-trial-expiration-daily',
    '0 3 * * *',
    'SELECT public.check_trial_expiration();'
  );

  SELECT count(*) INTO v_count FROM cron.job WHERE jobname='check-trial-expiration-daily';
  RAISE NOTICE 'Cron jobs com nome check-trial-expiration-daily: %', v_count;
END $$;