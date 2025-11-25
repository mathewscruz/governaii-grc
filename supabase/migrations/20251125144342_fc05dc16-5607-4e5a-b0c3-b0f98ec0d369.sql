-- 2. COSO ERM 2017 (20 princípios de gestão de riscos)
INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, area_responsavel, peso, obrigatorio, ordem, created_at, updated_at)
SELECT 
  (SELECT id FROM gap_analysis_frameworks WHERE nome = 'COSO ERM' AND empresa_id IS NULL),
  codigo, titulo, descricao, categoria, 'Gestão de Riscos', peso, obrigatorio, ordem, now(), now()
FROM (VALUES
  ('P1', 'Demonstra Compromisso com Valores', 'Conselho supervisiona valores', 'Governança', 3, true, 1),
  ('P2', 'Exerce Supervisão dos Riscos', 'Conselho supervisiona gestão riscos', 'Governança', 3, true, 2),
  ('P3', 'Estabelece Estruturas Operacionais', 'Define estrutura e responsabilidades', 'Governança', 2, true, 3),
  ('P4', 'Demonstra Compromisso Competência', 'Atrai e desenvolve talentos', 'Governança', 2, true, 4),
  ('P5', 'Responsabiliza pelo Desempenho', 'Estabelece accountability', 'Governança', 3, true, 5),
  ('P6', 'Define Apetite ao Risco', 'Estabelece apetite e tolerância', 'Estratégia', 3, true, 6),
  ('P7', 'Avalia Estratégias Alternativas', 'Considera riscos nas estratégias', 'Estratégia', 3, true, 7),
  ('P8', 'Formula Objetivos Negócio', 'Objetivos alinhados ao risco', 'Estratégia', 2, true, 8),
  ('P9', 'Identifica Riscos', 'Identifica riscos que afetam objetivos', 'Desempenho', 3, true, 9),
  ('P10', 'Avalia Severidade Risco', 'Avalia gravidade dos riscos', 'Desempenho', 3, true, 10),
  ('P11', 'Prioriza Riscos', 'Prioriza riscos como base ação', 'Desempenho', 3, true, 11),
  ('P12', 'Implementa Respostas aos Riscos', 'Seleciona e implementa respostas', 'Desempenho', 3, true, 12),
  ('P13', 'Desenvolve Visão Portfolio', 'Visão consolidada de riscos', 'Desempenho', 2, true, 13),
  ('P14', 'Avalia Mudanças Substanciais', 'Identifica mudanças significativas', 'Revisão', 2, true, 14),
  ('P15', 'Revisa Riscos Desempenho', 'Monitora riscos e performance', 'Revisão', 3, true, 15),
  ('P16', 'Busca Melhoria Contínua', 'Melhora gestão de riscos', 'Revisão', 2, true, 16),
  ('P17', 'Comunica Informações Risco', 'Comunica riscos organizacionalmente', 'Informação', 2, true, 17),
  ('P18', 'Reporta Riscos Cultura Desempenho', 'Reporta cultura e performance', 'Informação', 2, true, 18),
  ('P19', 'Comunica com Partes Interessadas', 'Comunicação com stakeholders', 'Informação', 2, true, 19),
  ('P20', 'Reporta Riscos Cultura Governança', 'Reporta ao conselho', 'Informação', 3, true, 20)
) AS t(codigo, titulo, descricao, categoria, peso, obrigatorio, ordem)
ON CONFLICT DO NOTHING;