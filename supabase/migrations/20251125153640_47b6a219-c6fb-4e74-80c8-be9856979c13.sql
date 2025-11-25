-- Habilitar RLS na tabela planos
ALTER TABLE planos ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem visualizar os planos
CREATE POLICY "Anyone can view plans" ON planos
  FOR SELECT USING (true);

-- Política: Apenas super_admin pode modificar planos
CREATE POLICY "Only super admin can modify plans" ON planos
  FOR ALL USING (is_super_admin());