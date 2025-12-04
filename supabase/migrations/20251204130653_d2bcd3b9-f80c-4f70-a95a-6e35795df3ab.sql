-- Fix 1: Remove overly permissive public SELECT policy on denuncias
DROP POLICY IF EXISTS "Public select denuncias by protocol" ON public.denuncias;

-- Create a new policy that requires the token_publico to match via header
CREATE POLICY "View denuncia by token or auth" ON public.denuncias
FOR SELECT
USING (
  -- Authenticated users from the same company can view
  (auth.uid() IS NOT NULL AND empresa_id = public.get_user_empresa_id())
  OR
  -- Public users can only view with their specific token_publico
  (token_publico IS NOT NULL AND token_publico = current_setting('request.headers', true)::json->>'x-token-publico')
);

-- Fix 2: Also secure denuncias_movimentacoes
DROP POLICY IF EXISTS "Public access to denuncia movements" ON public.denuncias_movimentacoes;

-- Create proper policy for movimentacoes that requires token
CREATE POLICY "View denuncia movements by token or auth" ON public.denuncias_movimentacoes
FOR SELECT
USING (
  -- Authenticated users can view movements for denuncias in their company
  (auth.uid() IS NOT NULL AND public.denuncia_pertence_empresa(denuncia_id))
  OR
  -- Public users must have the token_publico matching the parent denuncia
  EXISTS (
    SELECT 1 FROM public.denuncias d 
    WHERE d.id = denuncias_movimentacoes.denuncia_id 
    AND d.token_publico IS NOT NULL 
    AND d.token_publico = current_setting('request.headers', true)::json->>'x-token-publico'
  )
);