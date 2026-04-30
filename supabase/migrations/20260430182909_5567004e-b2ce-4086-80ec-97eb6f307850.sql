-- Enriquece tabela planos
ALTER TABLE public.planos
  ADD COLUMN IF NOT EXISTS preco_mensal numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS preco_anual numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS moeda text NOT NULL DEFAULT 'BRL',
  ADD COLUMN IF NOT EXISTS limite_usuarios integer,
  ADD COLUMN IF NOT EXISTS modulos_habilitados jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS recursos_destacados jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_destaque boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ordem integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Empresas: vigência manual da assinatura
ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS data_inicio_assinatura timestamptz,
  ADD COLUMN IF NOT EXISTS data_fim_assinatura timestamptz;

-- Trigger updated_at em planos
DROP TRIGGER IF EXISTS update_planos_updated_at ON public.planos;
CREATE TRIGGER update_planos_updated_at
  BEFORE UPDATE ON public.planos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Backfill dos 3 planos existentes
UPDATE public.planos SET
  preco_mensal = 99,
  preco_anual = 1069.20,
  limite_usuarios = 5,
  ordem = 1,
  modulos_habilitados = '["riscos","controles","documentos","incidentes","planos_acao"]'::jsonb,
  recursos_destacados = '["Até 5 usuários","10 créditos IA/mês","Gestão de Riscos","Controles Internos","Documentos","Incidentes","Suporte por email"]'::jsonb
WHERE codigo = 'compliance_start';

UPDATE public.planos SET
  preco_mensal = 249,
  preco_anual = 2689.20,
  limite_usuarios = 20,
  is_destaque = true,
  ordem = 2,
  modulos_habilitados = '["riscos","controles","documentos","incidentes","planos_acao","gap_analysis","due_diligence","contratos","denuncia","revisao_acessos","integracoes"]'::jsonb,
  recursos_destacados = '["Até 20 usuários","50 créditos IA/mês","Tudo do Compliance Start","Gap Analysis & Frameworks","Due Diligence","Contratos","Canal de Denúncias","Revisão de Acessos","Integrações","Suporte prioritário"]'::jsonb
WHERE codigo = 'grc_manager';

UPDATE public.planos SET
  preco_mensal = 499,
  preco_anual = 5389.20,
  limite_usuarios = NULL,
  ordem = 3,
  modulos_habilitados = '["riscos","controles","documentos","incidentes","planos_acao","gap_analysis","due_diligence","contratos","denuncia","revisao_acessos","integracoes","contas_privilegiadas","auditorias","continuidade","privacidade","governanca","ativos","relatorios","api_publica"]'::jsonb,
  recursos_destacados = '["Usuários ilimitados","200 créditos IA/mês","Tudo do GRC Manager","API Pública & Webhooks","Contas Privilegiadas","Auditoria Completa","Multi-frameworks","Relatórios avançados","Onboarding dedicado","Suporte 24/7"]'::jsonb
WHERE codigo = 'governaii_enterprise';

-- Backfill: Fast2Mine -> Compliance Start
UPDATE public.empresas
SET plano_id = (SELECT id FROM public.planos WHERE codigo = 'compliance_start' LIMIT 1)
WHERE nome = 'Fast2Mine' AND plano_id IS NULL;

-- RLS: planos
ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Planos visiveis para autenticados" ON public.planos;
CREATE POLICY "Planos visiveis para autenticados"
  ON public.planos FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Super admin pode inserir planos" ON public.planos;
CREATE POLICY "Super admin pode inserir planos"
  ON public.planos FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Super admin pode atualizar planos" ON public.planos;
CREATE POLICY "Super admin pode atualizar planos"
  ON public.planos FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Super admin pode deletar planos" ON public.planos;
CREATE POLICY "Super admin pode deletar planos"
  ON public.planos FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Função: verificar limite de usuários da empresa
CREATE OR REPLACE FUNCTION public.check_company_user_limit(_empresa_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limite integer;
  v_atual integer;
BEGIN
  SELECT p.limite_usuarios INTO v_limite
  FROM public.empresas e
  LEFT JOIN public.planos p ON p.id = e.plano_id
  WHERE e.id = _empresa_id;

  SELECT count(*) INTO v_atual
  FROM public.profiles
  WHERE empresa_id = _empresa_id;

  RETURN jsonb_build_object(
    'limite', v_limite,
    'atual', v_atual,
    'pode_criar', (v_limite IS NULL OR v_atual < v_limite)
  );
END;
$$;