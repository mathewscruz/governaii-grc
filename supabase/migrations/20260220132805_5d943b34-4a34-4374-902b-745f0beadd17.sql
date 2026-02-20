
-- Adicionar campo de orientação de implementação e exemplos de evidências aos requisitos
ALTER TABLE public.gap_analysis_requirements ADD COLUMN IF NOT EXISTS orientacao_implementacao text;
ALTER TABLE public.gap_analysis_requirements ADD COLUMN IF NOT EXISTS exemplos_evidencias text;

-- Adicionar vínculo com plano de ação nas avaliações
ALTER TABLE public.gap_analysis_evaluations ADD COLUMN IF NOT EXISTS plano_acao_id uuid REFERENCES public.planos_acao(id) ON DELETE SET NULL;

-- Índice para consultas de plano de ação vinculado
CREATE INDEX IF NOT EXISTS idx_gap_evaluations_plano_acao ON public.gap_analysis_evaluations(plano_acao_id) WHERE plano_acao_id IS NOT NULL;
