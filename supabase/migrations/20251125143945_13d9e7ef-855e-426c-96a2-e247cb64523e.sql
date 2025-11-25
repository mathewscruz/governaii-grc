-- Parte 1: Alterar coluna empresa_id para permitir NULL (frameworks globais)

ALTER TABLE gap_analysis_frameworks 
ALTER COLUMN empresa_id DROP NOT NULL;

-- Parte 2: Criar 20 frameworks globais compartilhados (empresa_id = NULL, is_template = true)

-- Remover frameworks globais antigos se existirem
DELETE FROM gap_analysis_frameworks WHERE empresa_id IS NULL;

-- Criar frameworks globais
INSERT INTO gap_analysis_frameworks (id, nome, versao, tipo_framework, descricao, is_template, empresa_id, created_at, updated_at)
VALUES 
  -- Frameworks já com alguns requisitos (consolidar)
  (gen_random_uuid(), 'NIST CSF', '2.0', 'seguranca_informacao', 'NIST Cybersecurity Framework 2.0', true, NULL, now(), now()),
  (gen_random_uuid(), 'ISO/IEC 27001', '2022', 'seguranca_informacao', 'Sistema de Gestão de Segurança da Informação', true, NULL, now(), now()),
  (gen_random_uuid(), 'PCI DSS', '4.0', 'seguranca_informacao', 'Payment Card Industry Data Security Standard', true, NULL, now(), now()),
  (gen_random_uuid(), 'CIS Controls', 'v8', 'seguranca_informacao', 'Center for Internet Security Controls', true, NULL, now(), now()),
  (gen_random_uuid(), 'LGPD', '2018', 'privacidade', 'Lei Geral de Proteção de Dados - Brasil', true, NULL, now(), now()),
  (gen_random_uuid(), 'GDPR', '2016', 'privacidade', 'General Data Protection Regulation - EU', true, NULL, now(), now()),
  (gen_random_uuid(), 'HIPAA', '1996', 'privacidade', 'Health Insurance Portability and Accountability Act', true, NULL, now(), now()),
  (gen_random_uuid(), 'CCPA', '2018', 'privacidade', 'California Consumer Privacy Act', true, NULL, now(), now()),
  
  -- Frameworks vazios (precisam de requisitos)
  (gen_random_uuid(), 'COBIT', '2019', 'governanca_ti', 'Governança e Gestão de TI Empresarial', true, NULL, now(), now()),
  (gen_random_uuid(), 'COSO ERM', '2017', 'gestao_riscos', 'Enterprise Risk Management Framework', true, NULL, now(), now()),
  (gen_random_uuid(), 'COSO Internal Control', '2013', 'governanca_ti', 'Framework de Controle Interno', true, NULL, now(), now()),
  (gen_random_uuid(), 'ISO 31000', '2018', 'gestao_riscos', 'Gestão de Riscos - Diretrizes', true, NULL, now(), now()),
  (gen_random_uuid(), 'ISO 37301', '2021', 'compliance', 'Sistema de Gestão de Compliance', true, NULL, now(), now()),
  (gen_random_uuid(), 'SOX', '2002', 'compliance', 'Sarbanes-Oxley Act - Controles Financeiros', true, NULL, now(), now()),
  (gen_random_uuid(), 'ITIL', 'v4', 'governanca_ti', 'Information Technology Infrastructure Library', true, NULL, now(), now()),
  (gen_random_uuid(), 'ISO/IEC 20000', '2018', 'governanca_ti', 'Sistema de Gestão de Serviços de TI', true, NULL, now(), now()),
  (gen_random_uuid(), 'ISO 9001', '2015', 'qualidade', 'Sistema de Gestão da Qualidade', true, NULL, now(), now()),
  (gen_random_uuid(), 'ISO 14001', '2015', 'meio_ambiente', 'Sistema de Gestão Ambiental', true, NULL, now(), now()),
  (gen_random_uuid(), 'ISO/IEC 27701', '2019', 'privacidade', 'Sistema de Gestão de Informações de Privacidade', true, NULL, now(), now()),
  (gen_random_uuid(), 'SOC 2 Type II', '2017', 'seguranca_informacao', 'Service Organization Control 2 - Trust Services', true, NULL, now(), now())
ON CONFLICT DO NOTHING;

-- Parte 3: Atualizar RLS Policies para permitir visualização de frameworks globais

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view frameworks for their company" ON gap_analysis_frameworks;
DROP POLICY IF EXISTS "Users can view global frameworks" ON gap_analysis_frameworks;
DROP POLICY IF EXISTS "Users can view global and company frameworks" ON gap_analysis_frameworks;

-- Criar policy que permite ver frameworks globais E frameworks da empresa
CREATE POLICY "Users can view global and company frameworks"
ON gap_analysis_frameworks FOR SELECT
USING (
  empresa_id IS NULL  -- Frameworks globais (compartilhados)
  OR empresa_id = get_user_empresa_id()  -- Frameworks específicos da empresa
);

-- Manter policies de INSERT/UPDATE/DELETE apenas para frameworks da empresa
CREATE POLICY "Users can insert frameworks for their company"
ON gap_analysis_frameworks FOR INSERT
WITH CHECK (empresa_id = get_user_empresa_id() AND is_template = false);

CREATE POLICY "Users can update frameworks for their company"
ON gap_analysis_frameworks FOR UPDATE
USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can delete frameworks for their company"
ON gap_analysis_frameworks FOR DELETE
USING (empresa_id = get_user_empresa_id() AND is_template = false);

-- Parte 4: Atualizar RLS Policy dos Requirements para funcionar com frameworks globais

DROP POLICY IF EXISTS "Users can view requirements" ON gap_analysis_requirements;
DROP POLICY IF EXISTS "Users can view requirements for their frameworks" ON gap_analysis_requirements;

CREATE POLICY "Users can view all requirements"
ON gap_analysis_requirements FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM gap_analysis_frameworks f
    WHERE f.id = framework_id 
    AND (
      f.empresa_id IS NULL  -- Framework global
      OR f.empresa_id = get_user_empresa_id()  -- Framework da empresa
    )
  )
);

-- Manter policies de INSERT/UPDATE/DELETE (apenas super_admin pode editar requisitos)
CREATE POLICY "Only super admin can insert requirements"
ON gap_analysis_requirements FOR INSERT
WITH CHECK (is_super_admin());

CREATE POLICY "Only super admin can update requirements"
ON gap_analysis_requirements FOR UPDATE
USING (is_super_admin());

CREATE POLICY "Only super admin can delete requirements"
ON gap_analysis_requirements FOR DELETE
USING (is_super_admin());