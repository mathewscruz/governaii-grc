-- Função para consumir crédito de IA
CREATE OR REPLACE FUNCTION consume_ai_credit(
  p_empresa_id uuid,
  p_user_id uuid,
  p_funcionalidade text,
  p_descricao text DEFAULT NULL
) RETURNS boolean AS $$
DECLARE
  v_franquia integer;
  v_consumidos integer;
BEGIN
  -- Buscar franquia do plano e consumo atual
  SELECT p.creditos_franquia, e.creditos_consumidos
  INTO v_franquia, v_consumidos
  FROM empresas e
  LEFT JOIN planos p ON e.plano_id = p.id
  WHERE e.id = p_empresa_id;

  -- Se empresa não tem plano ou franquia já esgotada, retornar false
  IF v_franquia IS NULL OR v_consumidos >= v_franquia THEN
    RETURN false;
  END IF;

  -- Registrar consumo no histórico
  INSERT INTO creditos_consumo (empresa_id, user_id, funcionalidade, descricao)
  VALUES (p_empresa_id, p_user_id, p_funcionalidade, p_descricao);

  -- Atualizar contador de créditos consumidos
  UPDATE empresas SET creditos_consumidos = creditos_consumidos + 1
  WHERE id = p_empresa_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;