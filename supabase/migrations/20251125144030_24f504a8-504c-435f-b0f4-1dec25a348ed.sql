-- Copiar requisitos dos frameworks existentes para os frameworks globais correspondentes

-- 1. Copiar requisitos do NIST CSF 2.0 (87 requisitos)
INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, area_responsavel, peso, obrigatorio, ordem, created_at, updated_at)
SELECT 
  (SELECT id FROM gap_analysis_frameworks WHERE nome = 'NIST CSF' AND versao = '2.0' AND empresa_id IS NULL LIMIT 1),
  r.codigo, r.titulo, r.descricao, r.categoria, r.area_responsavel, r.peso, r.obrigatorio, r.ordem, now(), now()
FROM gap_analysis_requirements r
INNER JOIN gap_analysis_frameworks f ON f.id = r.framework_id
WHERE f.nome = 'NIST CSF' AND f.versao = '2.0' AND f.empresa_id IS NOT NULL
LIMIT 87
ON CONFLICT DO NOTHING;

-- 2. Copiar requisitos do ISO/IEC 27001:2022 (119 requisitos)
INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, area_responsavel, peso, obrigatorio, ordem, created_at, updated_at)
SELECT 
  (SELECT id FROM gap_analysis_frameworks WHERE nome = 'ISO/IEC 27001' AND versao = '2022' AND empresa_id IS NULL LIMIT 1),
  r.codigo, r.titulo, r.descricao, r.categoria, r.area_responsavel, r.peso, r.obrigatorio, r.ordem, now(), now()
FROM gap_analysis_requirements r
INNER JOIN gap_analysis_frameworks f ON f.id = r.framework_id
WHERE f.nome = 'ISO/IEC 27001' AND f.versao = '2022' AND f.empresa_id IS NOT NULL
LIMIT 119
ON CONFLICT DO NOTHING;

-- 3. Copiar requisitos do LGPD (65 requisitos)
INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, area_responsavel, peso, obrigatorio, ordem, created_at, updated_at)
SELECT 
  (SELECT id FROM gap_analysis_frameworks WHERE nome = 'LGPD' AND versao = '2018' AND empresa_id IS NULL LIMIT 1),
  r.codigo, r.titulo, r.descricao, r.categoria, r.area_responsavel, r.peso, r.obrigatorio, r.ordem, now(), now()
FROM gap_analysis_requirements r
INNER JOIN gap_analysis_frameworks f ON f.id = r.framework_id
WHERE f.nome = 'LGPD' AND f.versao = '2018' AND f.empresa_id IS NOT NULL
LIMIT 65
ON CONFLICT DO NOTHING;

-- 4. Copiar requisitos do GDPR (99 requisitos)
INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, area_responsavel, peso, obrigatorio, ordem, created_at, updated_at)
SELECT 
  (SELECT id FROM gap_analysis_frameworks WHERE nome = 'GDPR' AND versao = '2016' AND empresa_id IS NULL LIMIT 1),
  r.codigo, r.titulo, r.descricao, r.categoria, r.area_responsavel, r.peso, r.obrigatorio, r.ordem, now(), now()
FROM gap_analysis_requirements r
INNER JOIN gap_analysis_frameworks f ON f.id = r.framework_id
WHERE f.nome = 'GDPR' AND f.versao = '2016' AND f.empresa_id IS NOT NULL
LIMIT 99
ON CONFLICT DO NOTHING;

-- 5. Copiar requisitos do PCI DSS 4.0 (se existirem)
INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, area_responsavel, peso, obrigatorio, ordem, created_at, updated_at)
SELECT 
  (SELECT id FROM gap_analysis_frameworks WHERE nome = 'PCI DSS' AND versao = '4.0' AND empresa_id IS NULL LIMIT 1),
  r.codigo, r.titulo, r.descricao, r.categoria, r.area_responsavel, r.peso, r.obrigatorio, r.ordem, now(), now()
FROM gap_analysis_requirements r
INNER JOIN gap_analysis_frameworks f ON f.id = r.framework_id
WHERE f.nome = 'PCI DSS' AND f.versao = '4.0' AND f.empresa_id IS NOT NULL
LIMIT 100
ON CONFLICT DO NOTHING;

-- 6. Copiar requisitos do CIS Controls v8 (se existirem)
INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, area_responsavel, peso, obrigatorio, ordem, created_at, updated_at)
SELECT 
  (SELECT id FROM gap_analysis_frameworks WHERE nome = 'CIS Controls' AND versao = 'v8' AND empresa_id IS NULL LIMIT 1),
  r.codigo, r.titulo, r.descricao, r.categoria, r.area_responsavel, r.peso, r.obrigatorio, r.ordem, now(), now()
FROM gap_analysis_requirements r
INNER JOIN gap_analysis_frameworks f ON f.id = r.framework_id
WHERE f.nome = 'CIS Controls' AND f.versao = 'v8' AND f.empresa_id IS NOT NULL
LIMIT 100
ON CONFLICT DO NOTHING;

-- 7. Copiar requisitos do HIPAA (se existirem)
INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, area_responsavel, peso, obrigatorio, ordem, created_at, updated_at)
SELECT 
  (SELECT id FROM gap_analysis_frameworks WHERE nome = 'HIPAA' AND versao = '1996' AND empresa_id IS NULL LIMIT 1),
  r.codigo, r.titulo, r.descricao, r.categoria, r.area_responsavel, r.peso, r.obrigatorio, r.ordem, now(), now()
FROM gap_analysis_requirements r
INNER JOIN gap_analysis_frameworks f ON f.id = r.framework_id
WHERE f.nome = 'HIPAA' AND f.versao = '1996' AND f.empresa_id IS NOT NULL
LIMIT 100
ON CONFLICT DO NOTHING;

-- 8. Copiar requisitos do CCPA (se existirem)
INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, area_responsavel, peso, obrigatorio, ordem, created_at, updated_at)
SELECT 
  (SELECT id FROM gap_analysis_frameworks WHERE nome = 'CCPA' AND versao = '2018' AND empresa_id IS NULL LIMIT 1),
  r.codigo, r.titulo, r.descricao, r.categoria, r.area_responsavel, r.peso, r.obrigatorio, r.ordem, now(), now()
FROM gap_analysis_requirements r
INNER JOIN gap_analysis_frameworks f ON f.id = r.framework_id
WHERE f.nome = 'CCPA' AND f.versao = '2018' AND f.empresa_id IS NOT NULL
LIMIT 100
ON CONFLICT DO NOTHING;