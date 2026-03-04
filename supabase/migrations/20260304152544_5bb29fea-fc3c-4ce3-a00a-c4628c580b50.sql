
-- First, migrate any existing evaluations from 9.2 to 9.2.1 and 9.3 to 9.3.1
-- by updating the requirement_id references

-- Insert 6.3 - Planejamento de mudanças (between 6.2 ordem=11 and 7.1)
INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, peso, obrigatorio, ordem)
VALUES (
  '79b28dbc-cd8b-40ac-ad48-41a90e6538f9',
  '6.3',
  'Planejamento de mudanças',
  'Quando a organização determina a necessidade de mudanças no SGSI, as mudanças devem ser realizadas de maneira planejada',
  'Planejamento',
  2,
  true,
  12
);

-- Insert 9.2.1 - Generalidades (Auditoria interna)
INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, peso, obrigatorio, ordem)
VALUES (
  '79b28dbc-cd8b-40ac-ad48-41a90e6538f9',
  '9.2.1',
  'Generalidades - Auditoria interna',
  'A organização deve conduzir auditorias internas em intervalos planejados para prover informações sobre se o SGSI está em conformidade',
  'Avaliação',
  3,
  true,
  22
);

-- Insert 9.2.2 - Programa de auditoria interna
INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, peso, obrigatorio, ordem)
VALUES (
  '79b28dbc-cd8b-40ac-ad48-41a90e6538f9',
  '9.2.2',
  'Programa de auditoria interna',
  'A organização deve planejar, estabelecer, implementar e manter um programa de auditoria, incluindo frequência, métodos, responsabilidades, requisitos de planejamento e relato',
  'Avaliação',
  3,
  true,
  23
);

-- Insert 9.3.1 - Generalidades (Análise crítica pela direção)
INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, peso, obrigatorio, ordem)
VALUES (
  '79b28dbc-cd8b-40ac-ad48-41a90e6538f9',
  '9.3.1',
  'Generalidades - Análise crítica pela direção',
  'A Alta Direção deve analisar criticamente o SGSI da organização em intervalos planejados para assegurar sua contínua adequação, suficiência e eficácia',
  'Avaliação',
  3,
  true,
  24
);

-- Insert 9.3.2 - Entradas da análise crítica pela direção
INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, peso, obrigatorio, ordem)
VALUES (
  '79b28dbc-cd8b-40ac-ad48-41a90e6538f9',
  '9.3.2',
  'Entradas da análise crítica pela direção',
  'A análise crítica pela direção deve incluir considerações sobre o status das ações de análises críticas anteriores, mudanças nas questões externas e internas, retroalimentação sobre o desempenho da segurança da informação, retroalimentação das partes interessadas, resultados da avaliação de riscos e status do plano de tratamento de riscos, e oportunidades para melhoria contínua',
  'Avaliação',
  3,
  true,
  25
);

-- Insert 9.3.3 - Resultados da análise crítica pela direção
INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, peso, obrigatorio, ordem)
VALUES (
  '79b28dbc-cd8b-40ac-ad48-41a90e6538f9',
  '9.3.3',
  'Resultados da análise crítica pela direção',
  'Os resultados da análise crítica pela direção devem incluir decisões relacionadas a oportunidades de melhoria contínua e quaisquer necessidades de mudanças no SGSI',
  'Avaliação',
  3,
  true,
  26
);

-- Migrate evaluations from old 9.2 to new 9.2.1
UPDATE gap_analysis_evaluations 
SET requirement_id = (SELECT id FROM gap_analysis_requirements WHERE framework_id = '79b28dbc-cd8b-40ac-ad48-41a90e6538f9' AND codigo = '9.2.1' LIMIT 1)
WHERE requirement_id = 'bc731caf-52f7-4fa1-84f0-a5a7cfd05dc6';

-- Migrate evaluations from old 9.3 to new 9.3.1
UPDATE gap_analysis_evaluations 
SET requirement_id = (SELECT id FROM gap_analysis_requirements WHERE framework_id = '79b28dbc-cd8b-40ac-ad48-41a90e6538f9' AND codigo = '9.3.1' LIMIT 1)
WHERE requirement_id = '98d41bce-8a27-469f-8619-a036b63aba86';

-- Migrate audit log entries too
UPDATE gap_analysis_audit_log 
SET requirement_id = (SELECT id FROM gap_analysis_requirements WHERE framework_id = '79b28dbc-cd8b-40ac-ad48-41a90e6538f9' AND codigo = '9.2.1' LIMIT 1)
WHERE requirement_id = 'bc731caf-52f7-4fa1-84f0-a5a7cfd05dc6';

UPDATE gap_analysis_audit_log 
SET requirement_id = (SELECT id FROM gap_analysis_requirements WHERE framework_id = '79b28dbc-cd8b-40ac-ad48-41a90e6538f9' AND codigo = '9.3.1' LIMIT 1)
WHERE requirement_id = '98d41bce-8a27-469f-8619-a036b63aba86';

-- Now delete old 9.2 and 9.3
DELETE FROM gap_analysis_requirements WHERE id = 'bc731caf-52f7-4fa1-84f0-a5a7cfd05dc6';
DELETE FROM gap_analysis_requirements WHERE id = '98d41bce-8a27-469f-8619-a036b63aba86';

-- Re-order: bump ordem for items after 6.2 to make room for 6.3, and reorder 9.x/10.x
UPDATE gap_analysis_requirements SET ordem = ordem + 1 
WHERE framework_id = '79b28dbc-cd8b-40ac-ad48-41a90e6538f9' 
  AND ordem >= 12 AND ordem <= 19
  AND codigo != '6.3';

-- Reorder 10.x items
UPDATE gap_analysis_requirements SET ordem = 27 
WHERE framework_id = '79b28dbc-cd8b-40ac-ad48-41a90e6538f9' AND codigo = '10.1';

UPDATE gap_analysis_requirements SET ordem = 28 
WHERE framework_id = '79b28dbc-cd8b-40ac-ad48-41a90e6538f9' AND codigo = '10.2';
