-- Criar tabela para comentários em controles (similar a auditoria_itens_comentarios)
CREATE TABLE public.controles_comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  controle_id UUID NOT NULL REFERENCES public.controles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  comentario TEXT NOT NULL,
  mencoes UUID[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX idx_controles_comentarios_controle ON public.controles_comentarios(controle_id);
CREATE INDEX idx_controles_comentarios_user ON public.controles_comentarios(user_id);

-- Habilitar RLS
ALTER TABLE public.controles_comentarios ENABLE ROW LEVEL SECURITY;

-- Criar política para leitura (usuários podem ver comentários de controles da mesma empresa)
CREATE POLICY "Usuarios podem ver comentarios de controles da empresa"
ON public.controles_comentarios
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.controles c
    WHERE c.id = controle_id
    AND c.empresa_id = public.get_user_empresa_id()
  )
);

-- Criar política para inserção
CREATE POLICY "Usuarios podem criar comentarios em controles da empresa"
ON public.controles_comentarios
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.controles c
    WHERE c.id = controle_id
    AND c.empresa_id = public.get_user_empresa_id()
  )
);

-- Criar política para deleção (apenas autor pode deletar)
CREATE POLICY "Usuarios podem deletar proprios comentarios"
ON public.controles_comentarios
FOR DELETE
USING (auth.uid() = user_id);