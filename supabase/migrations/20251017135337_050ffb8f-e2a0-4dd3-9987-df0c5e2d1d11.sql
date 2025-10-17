-- Criar tabela para histórico de versões de documentos
CREATE TABLE IF NOT EXISTS public.documentos_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id UUID NOT NULL REFERENCES public.documentos(id) ON DELETE CASCADE,
  versao INTEGER NOT NULL,
  arquivo_url TEXT,
  arquivo_nome TEXT,
  arquivo_tipo TEXT,
  arquivo_tamanho BIGINT,
  data_aprovacao TIMESTAMP WITH TIME ZONE,
  aprovado_por UUID REFERENCES auth.users(id),
  status TEXT NOT NULL,
  data_vencimento DATE,
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(documento_id, versao)
);

-- Habilitar RLS
ALTER TABLE public.documentos_historico ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view historico from their empresa"
ON public.documentos_historico FOR SELECT
USING (documento_pertence_empresa(documento_id));

CREATE POLICY "Users can insert historico in their empresa"
ON public.documentos_historico FOR INSERT
WITH CHECK (documento_pertence_empresa(documento_id));

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_documentos_historico_documento_id ON public.documentos_historico(documento_id);
CREATE INDEX IF NOT EXISTS idx_documentos_historico_versao ON public.documentos_historico(documento_id, versao DESC);