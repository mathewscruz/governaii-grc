-- Add is_template column to gap_analysis_frameworks
ALTER TABLE gap_analysis_frameworks 
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT FALSE;

-- Drop old RLS policies
DROP POLICY IF EXISTS "Users can view frameworks from their empresa" ON gap_analysis_frameworks;
DROP POLICY IF EXISTS "Users can insert frameworks in their empresa" ON gap_analysis_frameworks;
DROP POLICY IF EXISTS "Users can update frameworks from their empresa" ON gap_analysis_frameworks;
DROP POLICY IF EXISTS "Users can delete frameworks from their empresa" ON gap_analysis_frameworks;

-- Create new RLS policy for SELECT: allow viewing templates OR company-specific frameworks
CREATE POLICY "Users can view frameworks" ON gap_analysis_frameworks 
FOR SELECT USING (
  is_template = true 
  OR empresa_id = get_user_empresa_id()
);

-- Recreate other policies (INSERT, UPDATE, DELETE remain company-specific)
CREATE POLICY "Users can insert frameworks in their empresa" ON gap_analysis_frameworks 
FOR INSERT 
WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can update frameworks from their empresa" ON gap_analysis_frameworks 
FOR UPDATE 
USING (empresa_id = get_user_empresa_id() AND is_template = false);

CREATE POLICY "Users can delete frameworks from their empresa" ON gap_analysis_frameworks 
FOR DELETE 
USING (empresa_id = get_user_empresa_id() AND is_template = false);

-- Update RLS for requirements: allow viewing if framework is template OR belongs to user's company
DROP POLICY IF EXISTS "Users can view requirements from their empresa" ON gap_analysis_requirements;

CREATE POLICY "Users can view requirements" ON gap_analysis_requirements 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM gap_analysis_frameworks f 
    WHERE f.id = gap_analysis_requirements.framework_id 
    AND (f.is_template = true OR f.empresa_id = get_user_empresa_id())
  )
);

-- Keep INSERT/UPDATE/DELETE restricted to frameworks owned by the company
DROP POLICY IF EXISTS "Users can insert requirements in their empresa frameworks" ON gap_analysis_requirements;
DROP POLICY IF EXISTS "Users can update requirements from their empresa" ON gap_analysis_requirements;
DROP POLICY IF EXISTS "Users can delete requirements from their empresa" ON gap_analysis_requirements;

CREATE POLICY "Users can insert requirements in their empresa frameworks" ON gap_analysis_requirements 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM gap_analysis_frameworks f 
    WHERE f.id = gap_analysis_requirements.framework_id 
    AND f.empresa_id = get_user_empresa_id()
    AND f.is_template = false
  )
);

CREATE POLICY "Users can update requirements from their empresa" ON gap_analysis_requirements 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM gap_analysis_frameworks f 
    WHERE f.id = gap_analysis_requirements.framework_id 
    AND f.empresa_id = get_user_empresa_id()
    AND f.is_template = false
  )
);

CREATE POLICY "Users can delete requirements from their empresa" ON gap_analysis_requirements 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM gap_analysis_frameworks f 
    WHERE f.id = gap_analysis_requirements.framework_id 
    AND f.empresa_id = get_user_empresa_id()
    AND f.is_template = false
  )
);

-- Mark existing NIST and ISO frameworks as templates
UPDATE gap_analysis_frameworks 
SET is_template = true 
WHERE nome IN ('NIST CSF 2.0', 'ISO/IEC 27001', 'ISO 27001', 'ISO/IEC 27001:2022')
  OR tipo_framework IN ('nist-csf-2.0', 'iso-27001');

-- Evaluations remain isolated by empresa_id (existing RLS is correct)
-- No changes needed for gap_analysis_evaluations table