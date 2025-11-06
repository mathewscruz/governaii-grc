-- Adicionar coluna tipo à tabela gap_analysis_frameworks
ALTER TABLE gap_analysis_frameworks 
ADD COLUMN tipo text NOT NULL DEFAULT 'personalizado' CHECK (tipo IN ('padrao', 'personalizado'));

-- Atualizar frameworks padrão existentes
UPDATE gap_analysis_frameworks 
SET tipo = 'padrao'
WHERE nome IN ('SOX', 'GDPR', 'ISO 37301', 'ISO 14001', 'COSO ERM');