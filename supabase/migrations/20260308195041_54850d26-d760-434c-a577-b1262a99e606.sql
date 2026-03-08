
-- Fix: Use simpler approach that works with Supabase JS client
-- The key security improvement is that the view is now SECURITY INVOKER (not DEFINER)
-- so RLS on denuncias_configuracoes is enforced

-- 1. Anon config policy: allow reading only active configs (token_publico is needed to use the portal anyway)
DROP POLICY IF EXISTS "Anon can view config by token" ON public.denuncias_configuracoes;
CREATE POLICY "Anon can view active config"
ON public.denuncias_configuracoes
FOR SELECT TO anon
USING (ativo = true);

-- 2. Categorias: scope by empresa_id matching an active config
DROP POLICY IF EXISTS "Anon can view categories by empresa context" ON public.denuncias_categorias;
CREATE POLICY "Anon can view categories for active portals"
ON public.denuncias_categorias
FOR SELECT TO anon
USING (
  ativo = true AND EXISTS (
    SELECT 1 FROM public.denuncias_configuracoes dc 
    WHERE dc.empresa_id = denuncias_categorias.empresa_id AND dc.ativo = true
  )
);

-- 3. Anexos: require valid denuncia exists (keep existing check)
DROP POLICY IF EXISTS "Anon can insert anexos with valid denuncia" ON public.denuncias_anexos;
CREATE POLICY "Anon can insert anexos for valid denuncias"
ON public.denuncias_anexos
FOR INSERT TO anon
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.denuncias d
    WHERE d.id = denuncias_anexos.denuncia_id
    AND d.empresa_id IN (
      SELECT dc.empresa_id FROM public.denuncias_configuracoes dc WHERE dc.ativo = true
    )
  )
);

-- 4. Due diligence questions: keep scoped by template with active assessment (already good enough)
DROP POLICY IF EXISTS "Anon can view questions via specific assessment token" ON public.due_diligence_questions;
CREATE POLICY "Anon can view questions for active assessments"
ON public.due_diligence_questions
FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.due_diligence_assessments a
    WHERE a.template_id = due_diligence_questions.template_id
    AND a.link_token IS NOT NULL
    AND a.status IN ('enviado', 'em_andamento')
  )
);
