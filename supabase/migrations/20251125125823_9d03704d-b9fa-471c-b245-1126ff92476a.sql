-- Criar tabela para vincular avaliações NIST com riscos
CREATE TABLE IF NOT EXISTS gap_evaluation_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES gap_analysis_evaluations(id) ON DELETE CASCADE,
  risco_id UUID NOT NULL REFERENCES riscos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(evaluation_id, risco_id)
);

-- Habilitar RLS
ALTER TABLE gap_evaluation_risks ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem gerenciar vinculações de riscos da própria empresa
CREATE POLICY "Users can manage evaluation risks from their empresa"
  ON gap_evaluation_risks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM gap_analysis_evaluations e
      JOIN gap_analysis_frameworks f ON e.framework_id = f.id
      WHERE e.id = gap_evaluation_risks.evaluation_id
      AND f.empresa_id = get_user_empresa_id()
    )
  );

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_gap_evaluation_risks_evaluation_id ON gap_evaluation_risks(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_gap_evaluation_risks_risco_id ON gap_evaluation_risks(risco_id);