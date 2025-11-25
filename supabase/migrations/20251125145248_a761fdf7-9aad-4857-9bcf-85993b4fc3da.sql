-- Garantir RLS adequado para frameworks globais e evaluations isoladas

-- Drop políticas antigas se existirem
DROP POLICY IF EXISTS "Users can view global frameworks" ON gap_analysis_frameworks;
DROP POLICY IF EXISTS "Users can view template frameworks" ON gap_analysis_frameworks;
DROP POLICY IF EXISTS "Users can view frameworks" ON gap_analysis_frameworks;

-- Permitir visualização de frameworks globais (empresa_id = NULL) por todos
CREATE POLICY "Users can view global frameworks"
ON gap_analysis_frameworks FOR SELECT
USING (empresa_id IS NULL);

-- Garantir que evaluations são isoladas por empresa
DROP POLICY IF EXISTS "Users can manage their evaluations" ON gap_analysis_evaluations;
DROP POLICY IF EXISTS "Users can view their company evaluations" ON gap_analysis_evaluations;
DROP POLICY IF EXISTS "Users can insert their company evaluations" ON gap_analysis_evaluations;
DROP POLICY IF EXISTS "Users can update their company evaluations" ON gap_analysis_evaluations;
DROP POLICY IF EXISTS "Users can delete their company evaluations" ON gap_analysis_evaluations;

CREATE POLICY "Users can manage their evaluations"
ON gap_analysis_evaluations FOR ALL
USING (empresa_id = get_user_empresa_id())
WITH CHECK (empresa_id = get_user_empresa_id());

-- Garantir que requirements são visíveis para todos (ligados a frameworks globais)
DROP POLICY IF EXISTS "Users can view all requirements" ON gap_analysis_requirements;
DROP POLICY IF EXISTS "Users can view requirements" ON gap_analysis_requirements;

CREATE POLICY "Users can view all requirements"
ON gap_analysis_requirements FOR SELECT
USING (true);