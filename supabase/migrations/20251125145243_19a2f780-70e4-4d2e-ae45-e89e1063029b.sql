-- Remover todos os frameworks empresa-específicos duplicados (mantém só os 20 globais)
DELETE FROM gap_analysis_frameworks 
WHERE empresa_id IS NOT NULL;

-- Comentário: Agora só existem os 20 frameworks globais com empresa_id = NULL e is_template = true