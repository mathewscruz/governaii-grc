-- Tabela principal de itens de auditoria
CREATE TABLE public.auditoria_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auditoria_id UUID NOT NULL REFERENCES public.auditorias(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  responsavel_id UUID REFERENCES public.profiles(user_id),
  status TEXT NOT NULL DEFAULT 'pendente',
  prazo DATE,
  prioridade TEXT NOT NULL DEFAULT 'media',
  observacoes TEXT,
  controle_vinculado_id UUID REFERENCES public.controles(id),
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de evidências por item
CREATE TABLE public.auditoria_itens_evidencias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.auditoria_itens(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  arquivo_url TEXT,
  arquivo_nome TEXT,
  arquivo_tamanho BIGINT,
  arquivo_tipo TEXT,
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de comentários por item
CREATE TABLE public.auditoria_itens_comentarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.auditoria_itens(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  comentario TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.auditoria_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_itens_evidencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_itens_comentarios ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para verificar se item pertence à empresa
CREATE OR REPLACE FUNCTION public.auditoria_item_pertence_empresa(item_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.auditoria_itens ai
    INNER JOIN public.auditorias a ON ai.auditoria_id = a.id
    WHERE ai.id = item_id AND a.empresa_id = public.get_user_empresa_id()
  );
$$;

-- Políticas RLS para auditoria_itens
CREATE POLICY "Users can view audit items from their empresa"
ON public.auditoria_itens FOR SELECT
USING (auditoria_pertence_empresa(auditoria_id));

CREATE POLICY "Users can insert audit items in their empresa"
ON public.auditoria_itens FOR INSERT
WITH CHECK (auditoria_pertence_empresa(auditoria_id));

CREATE POLICY "Users can update audit items from their empresa"
ON public.auditoria_itens FOR UPDATE
USING (auditoria_pertence_empresa(auditoria_id));

CREATE POLICY "Users can delete audit items from their empresa"
ON public.auditoria_itens FOR DELETE
USING (auditoria_pertence_empresa(auditoria_id));

-- Políticas RLS para auditoria_itens_evidencias
CREATE POLICY "Users can view item evidences from their empresa"
ON public.auditoria_itens_evidencias FOR SELECT
USING (auditoria_item_pertence_empresa(item_id));

CREATE POLICY "Users can insert item evidences in their empresa"
ON public.auditoria_itens_evidencias FOR INSERT
WITH CHECK (auditoria_item_pertence_empresa(item_id));

CREATE POLICY "Users can update item evidences from their empresa"
ON public.auditoria_itens_evidencias FOR UPDATE
USING (auditoria_item_pertence_empresa(item_id));

CREATE POLICY "Users can delete item evidences from their empresa"
ON public.auditoria_itens_evidencias FOR DELETE
USING (auditoria_item_pertence_empresa(item_id));

-- Políticas RLS para auditoria_itens_comentarios
CREATE POLICY "Users can view item comments from their empresa"
ON public.auditoria_itens_comentarios FOR SELECT
USING (auditoria_item_pertence_empresa(item_id));

CREATE POLICY "Users can insert item comments in their empresa"
ON public.auditoria_itens_comentarios FOR INSERT
WITH CHECK (auditoria_item_pertence_empresa(item_id));

CREATE POLICY "Users can delete own item comments"
ON public.auditoria_itens_comentarios FOR DELETE
USING (auditoria_item_pertence_empresa(item_id) AND user_id = auth.uid());

-- Trigger para updated_at
CREATE TRIGGER update_auditoria_itens_updated_at
BEFORE UPDATE ON public.auditoria_itens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_auditoria_itens_auditoria_id ON public.auditoria_itens(auditoria_id);
CREATE INDEX idx_auditoria_itens_responsavel_id ON public.auditoria_itens(responsavel_id);
CREATE INDEX idx_auditoria_itens_status ON public.auditoria_itens(status);
CREATE INDEX idx_auditoria_itens_evidencias_item_id ON public.auditoria_itens_evidencias(item_id);
CREATE INDEX idx_auditoria_itens_comentarios_item_id ON public.auditoria_itens_comentarios(item_id);