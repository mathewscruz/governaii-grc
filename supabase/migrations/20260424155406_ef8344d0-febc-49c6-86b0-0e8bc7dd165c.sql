CREATE OR REPLACE FUNCTION public.get_assessment_empresa_info(p_token text)
RETURNS TABLE (
  empresa_id uuid,
  empresa_nome text,
  empresa_logo_url text,
  assessment_id uuid,
  data_expiracao timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    e.id as empresa_id,
    e.nome as empresa_nome,
    e.logo_url as empresa_logo_url,
    a.id as assessment_id,
    a.data_expiracao
  FROM public.due_diligence_assessments a
  JOIN public.empresas e ON e.id = a.empresa_id
  WHERE a.link_token = p_token
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_assessment_empresa_info(text) TO anon, authenticated;