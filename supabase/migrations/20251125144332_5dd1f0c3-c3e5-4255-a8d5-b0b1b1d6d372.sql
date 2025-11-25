-- Inserir requisitos para os 13 frameworks globais vazios (~451 requisitos)

-- 1. COBIT 2019 (40 objetivos de governança e gestão)
INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, area_responsavel, peso, obrigatorio, ordem, created_at, updated_at)
SELECT 
  (SELECT id FROM gap_analysis_frameworks WHERE nome = 'COBIT' AND empresa_id IS NULL),
  codigo, titulo, descricao, categoria, 'Governança TI', peso, obrigatorio, ordem, now(), now()
FROM (VALUES
  ('EDM01', 'Assegurar Governança', 'Estabelecer e manter framework de governança', 'Governança', 3, true, 1),
  ('EDM02', 'Assegurar Entrega Benefícios', 'Otimizar valor das partes interessadas', 'Governança', 3, true, 2),
  ('EDM03', 'Assegurar Otimização Riscos', 'Gestão integrada de riscos', 'Governança', 3, true, 3),
  ('EDM04', 'Assegurar Otimização Recursos', 'Gestão eficiente de recursos', 'Governança', 2, true, 4),
  ('EDM05', 'Assegurar Transparência', 'Reportar para partes interessadas', 'Governança', 2, true, 5),
  ('APO01', 'Gerenciar Framework Gestão', 'Estabelecer sistema de gestão TI', 'Alinhar', 3, true, 6),
  ('APO02', 'Gerenciar Estratégia', 'Estratégia de TI alinhada ao negócio', 'Alinhar', 3, true, 7),
  ('APO03', 'Gerenciar Arquitetura Empresarial', 'Definir arquitetura corporativa', 'Alinhar', 2, true, 8),
  ('APO04', 'Gerenciar Inovação', 'Promover inovação tecnológica', 'Alinhar', 2, true, 9),
  ('APO05', 'Gerenciar Portfolio', 'Gestão de portfólio de investimentos', 'Alinhar', 3, true, 10),
  ('APO06', 'Gerenciar Orçamento', 'Gestão financeira de TI', 'Alinhar', 3, true, 11),
  ('APO07', 'Gerenciar Recursos Humanos', 'Gestão de talentos e capacidades', 'Alinhar', 2, true, 12),
  ('APO08', 'Gerenciar Relacionamentos', 'Relacionamento com fornecedores', 'Alinhar', 2, true, 13),
  ('APO09', 'Gerenciar Acordos Serviço', 'SLAs e acordos de nível de serviço', 'Alinhar', 3, true, 14),
  ('APO10', 'Gerenciar Fornecedores', 'Gestão de fornecedores externos', 'Alinhar', 2, true, 15),
  ('APO11', 'Gerenciar Qualidade', 'Sistema de gestão da qualidade', 'Alinhar', 2, true, 16),
  ('APO12', 'Gerenciar Riscos', 'Gestão integrada de riscos TI', 'Alinhar', 3, true, 17),
  ('APO13', 'Gerenciar Segurança', 'Sistema de gestão de segurança', 'Alinhar', 3, true, 18),
  ('APO14', 'Gerenciar Dados', 'Governança de dados corporativos', 'Alinhar', 3, true, 19),
  ('BAI01', 'Gerenciar Programas', 'Gestão de programas e projetos', 'Construir', 2, true, 20),
  ('BAI02', 'Gerenciar Definição Requisitos', 'Levantamento e análise requisitos', 'Construir', 2, true, 21),
  ('BAI03', 'Gerenciar Soluções', 'Desenvolvimento de soluções', 'Construir', 2, true, 22),
  ('BAI04', 'Gerenciar Disponibilidade', 'Gestão de disponibilidade serviços', 'Construir', 3, true, 23),
  ('BAI05', 'Gerenciar Mudanças', 'Controle de mudanças', 'Construir', 3, true, 24),
  ('BAI06', 'Gerenciar Mudanças Negócio', 'Gestão de mudanças organizacionais', 'Construir', 2, true, 25),
  ('BAI07', 'Gerenciar Aceitação Mudanças', 'Aceite e transição de mudanças', 'Construir', 2, true, 26),
  ('BAI08', 'Gerenciar Conhecimento', 'Gestão do conhecimento', 'Construir', 2, true, 27),
  ('BAI09', 'Gerenciar Ativos', 'Gestão de ativos de TI', 'Construir', 2, true, 28),
  ('BAI10', 'Gerenciar Configuração', 'Gestão de configuração', 'Construir', 3, true, 29),
  ('BAI11', 'Gerenciar Projetos', 'Gestão de projetos', 'Construir', 2, true, 30),
  ('DSS01', 'Gerenciar Operações', 'Operações de TI', 'Entregar', 3, true, 31),
  ('DSS02', 'Gerenciar Requisições Serviço', 'Service desk e atendimento', 'Entregar', 2, true, 32),
  ('DSS03', 'Gerenciar Problemas', 'Gestão de problemas', 'Entregar', 2, true, 33),
  ('DSS04', 'Gerenciar Continuidade', 'Continuidade de negócios', 'Entregar', 3, true, 34),
  ('DSS05', 'Gerenciar Serviços Segurança', 'Operação de segurança', 'Entregar', 3, true, 35),
  ('DSS06', 'Gerenciar Controles Processos', 'Controles de processos negócio', 'Entregar', 3, true, 36),
  ('MEA01', 'Monitorar Desempenho', 'Monitoramento de performance', 'Monitorar', 2, true, 37),
  ('MEA02', 'Monitorar Controle Interno', 'Sistema de controle interno', 'Monitorar', 3, true, 38),
  ('MEA03', 'Monitorar Compliance', 'Conformidade regulatória', 'Monitorar', 3, true, 39),
  ('MEA04', 'Gerenciar Garantia', 'Auditoria e garantia', 'Monitorar', 2, true, 40)
) AS t(codigo, titulo, descricao, categoria, peso, obrigatorio, ordem)
ON CONFLICT DO NOTHING;