-- Tabela de campanhas
CREATE TABLE public.email_campanhas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  criado_por uuid NOT NULL,
  assunto text NOT NULL,
  conteudo_html text NOT NULL DEFAULT '',
  imagem_url text,
  status text NOT NULL DEFAULT 'rascunho',
  enviado_em timestamptz,
  total_destinatarios integer NOT NULL DEFAULT 0,
  total_enviados integer NOT NULL DEFAULT 0,
  total_falhados integer NOT NULL DEFAULT 0,
  erro text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT email_campanhas_status_check CHECK (status IN ('rascunho','enviando','enviado','falhou'))
);

ALTER TABLE public.email_campanhas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins podem ver campanhas"
  ON public.email_campanhas FOR SELECT
  USING (public.is_super_admin());

CREATE POLICY "Super admins podem criar campanhas"
  ON public.email_campanhas FOR INSERT
  WITH CHECK (public.is_super_admin() AND criado_por = auth.uid());

CREATE POLICY "Super admins podem atualizar campanhas"
  ON public.email_campanhas FOR UPDATE
  USING (public.is_super_admin());

CREATE POLICY "Super admins podem deletar campanhas"
  ON public.email_campanhas FOR DELETE
  USING (public.is_super_admin());

CREATE TRIGGER trg_email_campanhas_updated_at
  BEFORE UPDATE ON public.email_campanhas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de logs por destinatário
CREATE TABLE public.email_campanha_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campanha_id uuid NOT NULL REFERENCES public.email_campanhas(id) ON DELETE CASCADE,
  email text NOT NULL,
  status text NOT NULL,
  erro text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT email_campanha_logs_status_check CHECK (status IN ('sent','failed'))
);

CREATE INDEX idx_email_campanha_logs_campanha ON public.email_campanha_logs(campanha_id);

ALTER TABLE public.email_campanha_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins podem ver logs de campanha"
  ON public.email_campanha_logs FOR SELECT
  USING (public.is_super_admin());

CREATE POLICY "Sistema pode inserir logs de campanha"
  ON public.email_campanha_logs FOR INSERT
  WITH CHECK (true);

-- Bucket público para imagens dos e-mails
INSERT INTO storage.buckets (id, name, public)
VALUES ('email-assets', 'email-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Imagens de e-mail são públicas"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'email-assets');

CREATE POLICY "Super admins podem fazer upload de imagens de e-mail"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'email-assets' AND public.is_super_admin());

CREATE POLICY "Super admins podem atualizar imagens de e-mail"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'email-assets' AND public.is_super_admin());

CREATE POLICY "Super admins podem deletar imagens de e-mail"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'email-assets' AND public.is_super_admin());