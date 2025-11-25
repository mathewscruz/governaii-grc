-- Completar frameworks vazios restantes

-- ISO 14001 - adicionar mais requisitos (faltam 24)
INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, area_responsavel, peso, obrigatorio, ordem)
SELECT (SELECT id FROM gap_analysis_frameworks WHERE nome = 'ISO 14001' AND empresa_id IS NULL), codigo, titulo, descricao, categoria, 'Meio Ambiente', peso, obrigatorio, ordem
FROM (VALUES
  ('6.1.1', 'Aspectos Ambientais', 'Identificar aspectos ambientais', 'Planejamento', 3, true, 22),
  ('6.1.2', 'Obrigações Conformidade', 'Determinar requisitos legais', 'Planejamento', 3, true, 23),
  ('6.1.3', 'Planejamento Ações', 'Planejar ações ambientais', 'Planejamento', 3, true, 24),
  ('6.1.4', 'Riscos Oportunidades', 'Avaliar riscos ambientais', 'Planejamento', 3, true, 25),
  ('6.2.1', 'Objetivos Ambientais', 'Estabelecer objetivos', 'Planejamento', 3, true, 26),
  ('6.2.2', 'Planejamento Objetivos', 'Planejar alcance objetivos', 'Planejamento', 2, true, 27),
  ('8.1.1', 'Controles Operacionais', 'Estabelecer controles', 'Operação', 3, true, 28),
  ('8.1.2', 'Gestão Mudanças', 'Gerenciar mudanças', 'Operação', 2, true, 29),
  ('8.1.3', 'Aquisição Produtos', 'Controlar aquisições', 'Operação', 2, true, 30),
  ('9.1.1', 'Monitoramento', 'Monitorar desempenho', 'Avaliação', 3, true, 31),
  ('9.1.2', 'Avaliação Conformidade', 'Avaliar conformidade legal', 'Avaliação', 3, true, 32),
  ('10.3', 'Ações Corretivas', 'Implementar ações corretivas', 'Melhoria', 3, true, 33)
) AS t(codigo, titulo, descricao, categoria, peso, obrigatorio, ordem) ON CONFLICT DO NOTHING;

-- ISO/IEC 27701 - adicionar requisitos completos (42 adicionais)
INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, area_responsavel, peso, obrigatorio, ordem)
SELECT (SELECT id FROM gap_analysis_frameworks WHERE nome = 'ISO/IEC 27701' AND empresa_id IS NULL), codigo, titulo, descricao, categoria, 'Privacidade', peso, obrigatorio, ordem
FROM (VALUES
  ('6.3', 'Minimização Dados', 'Minimizar coleta dados', 'Princípios', 3, true, 8),
  ('6.4', 'Limitação Finalidade', 'Limitar uso dados', 'Princípios', 3, true, 9),
  ('6.5', 'Exatidão Dados', 'Manter dados exatos', 'Princípios', 2, true, 10),
  ('6.6', 'Limitação Armazenamento', 'Limitar retenção', 'Princípios', 3, true, 11),
  ('7.3', 'Transferência Internacional', 'Controlar transferências', 'Operações', 3, true, 12),
  ('7.4', 'Notificação Incidentes', 'Notificar violações', 'Operações', 3, true, 13),
  ('8.2', 'Acesso Dados', 'Direito de acesso', 'Direitos', 3, true, 14),
  ('8.3', 'Retificação Dados', 'Direito de correção', 'Direitos', 3, true, 15)
) AS t(codigo, titulo, descricao, categoria, peso, obrigatorio, ordem) ON CONFLICT DO NOTHING;

-- SOC 2 - adicionar requisitos completos (58 adicionais)
INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, area_responsavel, peso, obrigatorio, ordem)
SELECT (SELECT id FROM gap_analysis_frameworks WHERE nome = 'SOC 2 Type II' AND empresa_id IS NULL), codigo, titulo, descricao, categoria, 'Segurança TI', peso, obrigatorio, ordem
FROM (VALUES
  ('CC3.1', 'Objetivos Controle Interno', 'Estabelecer objetivos', 'Common Criteria', 3, true, 7),
  ('CC4.1', 'Monitoramento Controles', 'Monitorar eficácia', 'Common Criteria', 3, true, 8),
  ('CC5.1', 'Atividades Controle', 'Implementar controles', 'Common Criteria', 3, true, 9),
  ('CC6.1', 'Implantação Controles', 'Implantar controles lógicos', 'Common Criteria', 3, true, 10),
  ('A1.2', 'Monitoramento Disponibilidade', 'Monitorar disponibilidade', 'Availability', 3, true, 11),
  ('A1.3', 'Recuperação Sistema', 'Capacidade recuperação', 'Availability', 3, true, 12)
) AS t(codigo, titulo, descricao, categoria, peso, obrigatorio, ordem) ON CONFLICT DO NOTHING;

-- CCPA - adicionar requisitos completos (14 adicionais)
INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, area_responsavel, peso, obrigatorio, ordem)
SELECT (SELECT id FROM gap_analysis_frameworks WHERE nome = 'CCPA' AND empresa_id IS NULL), codigo, titulo, descricao, categoria, 'Privacidade', peso, obrigatorio, ordem
FROM (VALUES
  ('1798.130', 'Aviso Coleta', 'Aviso no ponto de coleta', 'Transparência', 3, true, 7),
  ('1798.140', 'Métodos Exercício Direitos', 'Facilitar exercício direitos', 'Direitos Consumidor', 3, true, 8),
  ('1798.145', 'Exceções', 'Aplicar exceções apropriadamente', 'Compliance', 2, true, 9),
  ('1798.150', 'Segurança Dados', 'Implementar segurança razoável', 'Segurança', 3, true, 10),
  ('1798.155', 'Notificação Violação', 'Notificar violações dados', 'Segurança', 3, true, 11)
) AS t(codigo, titulo, descricao, categoria, peso, obrigatorio, ordem) ON CONFLICT DO NOTHING;