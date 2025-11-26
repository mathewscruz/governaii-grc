-- Remover antiga constraint única por framework+requisito
ALTER TABLE public.gap_analysis_evaluations
  DROP CONSTRAINT IF EXISTS gap_analysis_evaluations_framework_requirement_unique;