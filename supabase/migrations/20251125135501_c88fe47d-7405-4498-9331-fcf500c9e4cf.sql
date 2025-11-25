-- Criar tabela de histórico de scores para Gap Analysis
CREATE TABLE gap_analysis_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES gap_analysis_frameworks(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  score DECIMAL(5,2) NOT NULL,
  total_requirements INTEGER NOT NULL,
  evaluated_requirements INTEGER NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para queries eficientes por empresa, framework e data
CREATE INDEX idx_score_history_empresa_framework ON gap_analysis_score_history(empresa_id, framework_id);
CREATE INDEX idx_score_history_recorded_at ON gap_analysis_score_history(recorded_at DESC);
CREATE INDEX idx_score_history_lookup ON gap_analysis_score_history(empresa_id, framework_id, recorded_at DESC);

-- Habilitar RLS
ALTER TABLE gap_analysis_score_history ENABLE ROW LEVEL SECURITY;

-- Política para visualizar histórico da própria empresa
CREATE POLICY "Users can view their company score history" 
  ON gap_analysis_score_history
  FOR SELECT 
  USING (empresa_id = get_user_empresa_id());

-- Política para inserir histórico da própria empresa
CREATE POLICY "Users can insert score history for their company" 
  ON gap_analysis_score_history
  FOR INSERT 
  WITH CHECK (empresa_id = get_user_empresa_id());