-- Adicionar coluna codigo na tabela controles
ALTER TABLE controles ADD COLUMN codigo text;

-- Criar índice único por empresa para evitar duplicação de códigos
CREATE UNIQUE INDEX controles_codigo_empresa_unique 
ON controles (empresa_id, codigo) 
WHERE codigo IS NOT NULL;