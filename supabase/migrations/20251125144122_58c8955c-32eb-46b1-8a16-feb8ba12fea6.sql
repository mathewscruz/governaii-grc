-- Corrigir versões dos frameworks globais e copiar requisitos de LGPD e GDPR

-- Atualizar versão do GDPR no framework global de 2016 para 2018
UPDATE gap_analysis_frameworks
SET versao = '2018', updated_at = now()
WHERE nome = 'GDPR' AND empresa_id IS NULL;

-- Atualizar versão do LGPD no framework global de 2018 para 2020
UPDATE gap_analysis_frameworks
SET versao = '2020', updated_at = now()
WHERE nome = 'LGPD' AND empresa_id IS NULL;

-- Copiar requisitos do LGPD (65 requisitos) com versão corrigida
INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, area_responsavel, peso, obrigatorio, ordem, created_at, updated_at)
SELECT 
  (SELECT id FROM gap_analysis_frameworks WHERE nome = 'LGPD' AND versao = '2020' AND empresa_id IS NULL LIMIT 1),
  r.codigo, r.titulo, r.descricao, r.categoria, r.area_responsavel, r.peso, r.obrigatorio, r.ordem, now(), now()
FROM gap_analysis_requirements r
INNER JOIN gap_analysis_frameworks f ON f.id = r.framework_id
WHERE f.nome = 'LGPD' AND f.versao = '2020' AND f.empresa_id IS NOT NULL
LIMIT 65
ON CONFLICT DO NOTHING;

-- Copiar requisitos do GDPR (99 requisitos) com versão corrigida
INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, area_responsavel, peso, obrigatorio, ordem, created_at, updated_at)
SELECT 
  (SELECT id FROM gap_analysis_frameworks WHERE nome = 'GDPR' AND versao = '2018' AND empresa_id IS NULL LIMIT 1),
  r.codigo, r.titulo, r.descricao, r.categoria, r.area_responsavel, r.peso, r.obrigatorio, r.ordem, now(), now()
FROM gap_analysis_requirements r
INNER JOIN gap_analysis_frameworks f ON f.id = r.framework_id
WHERE f.nome = 'GDPR' AND f.versao = '2018' AND f.empresa_id IS NOT NULL
LIMIT 99
ON CONFLICT DO NOTHING;