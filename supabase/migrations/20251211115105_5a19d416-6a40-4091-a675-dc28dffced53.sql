-- Criar tabela para armazenar histórico de descobertas de dados
CREATE TABLE public.dados_descobertas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  titulo_pagina TEXT,
  total_formularios INTEGER DEFAULT 0,
  total_campos INTEGER DEFAULT 0,
  campos_sensiveis INTEGER DEFAULT 0,
  campos_criticos INTEGER DEFAULT 0,
  resultado_scan JSONB DEFAULT '[]'::jsonb,
  campos_importados INTEGER DEFAULT 0,
  status TEXT DEFAULT 'concluido',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.dados_descobertas ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Users can view discoveries from their empresa"
ON public.dados_descobertas FOR SELECT
USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can insert discoveries in their empresa"
ON public.dados_descobertas FOR INSERT
WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can delete discoveries from their empresa"
ON public.dados_descobertas FOR DELETE
USING (empresa_id = get_user_empresa_id());

-- Índices
CREATE INDEX idx_dados_descobertas_empresa ON public.dados_descobertas(empresa_id);
CREATE INDEX idx_dados_descobertas_created_at ON public.dados_descobertas(created_at DESC);