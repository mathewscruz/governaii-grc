
-- Tabela principal de planos de ação transversais
CREATE TABLE public.planos_acao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'cancelado', 'atrasado')),
  prioridade TEXT NOT NULL DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'critica')),
  responsavel_id UUID REFERENCES auth.users(id),
  prazo DATE,
  data_conclusao DATE,
  -- Vinculação com módulos
  modulo_origem TEXT CHECK (modulo_origem IN ('riscos', 'controles', 'frameworks', 'incidentes', 'auditorias', 'contratos', 'documentos', 'dados', 'due-diligence', 'denuncia', 'ativos', 'contas-privilegiadas', 'manual')),
  registro_origem_id UUID,
  registro_origem_titulo TEXT,
  -- Metadados
  tags TEXT[],
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_planos_acao_empresa ON public.planos_acao(empresa_id);
CREATE INDEX idx_planos_acao_responsavel ON public.planos_acao(responsavel_id);
CREATE INDEX idx_planos_acao_status ON public.planos_acao(status);
CREATE INDEX idx_planos_acao_prazo ON public.planos_acao(prazo);
CREATE INDEX idx_planos_acao_modulo ON public.planos_acao(modulo_origem);

-- RLS
ALTER TABLE public.planos_acao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "planos_acao_select" ON public.planos_acao FOR SELECT
  USING (empresa_id IN (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "planos_acao_insert" ON public.planos_acao FOR INSERT
  WITH CHECK (empresa_id IN (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "planos_acao_update" ON public.planos_acao FOR UPDATE
  USING (empresa_id IN (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "planos_acao_delete" ON public.planos_acao FOR DELETE
  USING (empresa_id IN (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()));

-- Trigger updated_at
CREATE TRIGGER update_planos_acao_updated_at
  BEFORE UPDATE ON public.planos_acao
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de comentários/histórico
CREATE TABLE public.planos_acao_comentarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plano_id UUID NOT NULL REFERENCES public.planos_acao(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  comentario TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.planos_acao_comentarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "planos_acao_comentarios_select" ON public.planos_acao_comentarios FOR SELECT
  USING (plano_id IN (SELECT id FROM public.planos_acao WHERE empresa_id IN (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid())));

CREATE POLICY "planos_acao_comentarios_insert" ON public.planos_acao_comentarios FOR INSERT
  WITH CHECK (plano_id IN (SELECT id FROM public.planos_acao WHERE empresa_id IN (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid())));

CREATE POLICY "planos_acao_comentarios_delete" ON public.planos_acao_comentarios FOR DELETE
  USING (user_id = auth.uid());
