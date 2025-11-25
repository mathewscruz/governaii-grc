-- Deletar avaliações órfãs (sem framework_id)
-- Essas avaliações não funcionam corretamente pois não podem ser associadas a um framework
DELETE FROM gap_analysis_evaluations
WHERE framework_id IS NULL;