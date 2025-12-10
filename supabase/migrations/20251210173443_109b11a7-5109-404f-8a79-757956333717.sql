-- Tabela para armazenar usuários vinculados a sistemas (independente de contas privilegiadas)
CREATE TABLE public.sistemas_usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  sistema_id UUID NOT NULL REFERENCES public.sistemas_privilegiados(id) ON DELETE CASCADE,
  nome_usuario TEXT NOT NULL,
  email_usuario TEXT,
  departamento TEXT,
  cargo TEXT,
  tipo_acesso TEXT DEFAULT 'leitura',
  nivel_privilegio TEXT DEFAULT 'usuario',
  data_concessao DATE,
  data_expiracao DATE,
  justificativa TEXT,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sistemas_usuarios ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view sistemas_usuarios from their empresa"
  ON public.sistemas_usuarios FOR SELECT
  USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can insert sistemas_usuarios in their empresa"
  ON public.sistemas_usuarios FOR INSERT
  WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can update sistemas_usuarios from their empresa"
  ON public.sistemas_usuarios FOR UPDATE
  USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can delete sistemas_usuarios from their empresa"
  ON public.sistemas_usuarios FOR DELETE
  USING (empresa_id = get_user_empresa_id());

-- Index for performance
CREATE INDEX idx_sistemas_usuarios_empresa_id ON public.sistemas_usuarios(empresa_id);
CREATE INDEX idx_sistemas_usuarios_sistema_id ON public.sistemas_usuarios(sistema_id);
CREATE INDEX idx_sistemas_usuarios_ativo ON public.sistemas_usuarios(ativo);