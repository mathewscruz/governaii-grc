
-- 1. Tabela de marcos de lembretes de trial enviados
CREATE TABLE IF NOT EXISTS public.trial_reminders_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  milestone TEXT NOT NULL CHECK (milestone IN ('d_minus_3', 'd_zero')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  recipient_email TEXT,
  UNIQUE (empresa_id, milestone)
);

ALTER TABLE public.trial_reminders_sent ENABLE ROW LEVEL SECURITY;

-- Apenas service_role lê/escreve nessa tabela
CREATE POLICY "service_role_only_select" ON public.trial_reminders_sent
  FOR SELECT TO authenticated USING (false);

-- 2. Campos de visibilidade do convite em profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS invitation_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS invitation_link TEXT;

CREATE INDEX IF NOT EXISTS idx_trial_reminders_empresa ON public.trial_reminders_sent(empresa_id);
