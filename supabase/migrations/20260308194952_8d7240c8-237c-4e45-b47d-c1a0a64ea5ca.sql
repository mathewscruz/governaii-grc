
-- 1. Fix SECURITY DEFINER view: recreate as SECURITY INVOKER + add anon policy on underlying table
DROP VIEW IF EXISTS public.denuncias_configuracoes_public;

CREATE VIEW public.denuncias_configuracoes_public 
WITH (security_invoker = true)
AS 
SELECT id, empresa_id, ativo, token_publico, permitir_anonimas, requerer_email, texto_apresentacao, politica_privacidade
FROM public.denuncias_configuracoes;

GRANT SELECT ON public.denuncias_configuracoes_public TO anon;
GRANT SELECT ON public.denuncias_configuracoes_public TO authenticated;

-- Add anon SELECT policy on denuncias_configuracoes scoped to token_publico context
CREATE POLICY "Anon can view config by token"
ON public.denuncias_configuracoes
FOR SELECT
TO anon
USING (
  ativo = true AND (
    token_publico = current_setting('request.headers', true)::json->>'x-token-publico'
    OR empresa_id = (SELECT get_empresa_by_slug(current_setting('request.headers', true)::json->>'x-empresa-slug'))
  )
);

-- 2. Fix denuncias_categorias: restrict anon SELECT to empresa context
DROP POLICY IF EXISTS "Public access to active denuncia categories" ON public.denuncias_categorias;

CREATE POLICY "Anon can view categories by empresa context"
ON public.denuncias_categorias
FOR SELECT
TO anon
USING (
  ativo = true AND empresa_id IN (
    SELECT dc.empresa_id FROM public.denuncias_configuracoes dc 
    WHERE dc.token_publico = current_setting('request.headers', true)::json->>'x-token-publico'
    AND dc.ativo = true
  )
);

-- 3. Fix denuncias_anexos: restrict anon INSERT to require matching token  
DROP POLICY IF EXISTS "Public can insert anexos for existing denuncias" ON public.denuncias_anexos;

CREATE POLICY "Anon can insert anexos with valid denuncia"
ON public.denuncias_anexos
FOR INSERT
TO anon
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.denuncias d
    INNER JOIN public.denuncias_configuracoes dc ON dc.empresa_id = d.empresa_id
    WHERE d.id = denuncias_anexos.denuncia_id
    AND dc.token_publico = current_setting('request.headers', true)::json->>'x-token-publico'
    AND dc.ativo = true
  )
);

-- 4. Fix due_diligence_questions: scope anon SELECT by specific assessment link_token header
DROP POLICY IF EXISTS "Allow viewing questions via assessment link_token" ON public.due_diligence_questions;

CREATE POLICY "Anon can view questions via specific assessment token"
ON public.due_diligence_questions
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.due_diligence_assessments a
    WHERE a.template_id = due_diligence_questions.template_id
    AND a.link_token = current_setting('request.headers', true)::json->>'x-assessment-token'
    AND a.link_token IS NOT NULL
    AND a.status IN ('enviado', 'em_andamento')
  )
);
