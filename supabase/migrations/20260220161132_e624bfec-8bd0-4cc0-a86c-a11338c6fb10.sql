
-- Tabela mfa_sessions para bypass diário de MFA
CREATE TABLE public.mfa_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  verified_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  ip_hint text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_mfa_sessions_user ON public.mfa_sessions(user_id, expires_at);

ALTER TABLE public.mfa_sessions ENABLE ROW LEVEL SECURITY;

-- Apenas service role acessa (edge functions)
-- Nenhuma policy para anon/authenticated = acesso bloqueado exceto via service role
