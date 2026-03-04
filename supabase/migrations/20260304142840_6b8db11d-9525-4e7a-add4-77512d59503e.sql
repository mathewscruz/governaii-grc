
-- Add diagnostic questions column to requirements table
ALTER TABLE public.gap_analysis_requirements
  ADD COLUMN IF NOT EXISTS perguntas_diagnostico text;
