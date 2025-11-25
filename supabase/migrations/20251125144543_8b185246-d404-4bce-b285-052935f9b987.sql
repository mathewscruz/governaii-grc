-- 6. SOX 2002 (30 requisitos de controles financeiros e governança)
INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, area_responsavel, peso, obrigatorio, ordem, created_at, updated_at)
SELECT 
  (SELECT id FROM gap_analysis_frameworks WHERE nome = 'SOX' AND empresa_id IS NULL),
  codigo, titulo, descricao, categoria, 'Controladoria', peso, obrigatorio, ordem, now(), now()
FROM (VALUES
  ('302', 'Controles Divulgação', 'Estabelecer controles sobre divulgação', 'Controles', 3, true, 1),
  ('404', 'Avaliação Controle Interno', 'Avaliar eficácia controles internos', 'Controles', 3, true, 2),
  ('409', 'Divulgação Tempo Real', 'Divulgação rápida de informações', 'Divulgação', 3, true, 3),
  ('302.1', 'Documentação Procedimentos', 'Documentar procedimentos controles', 'Controles', 3, true, 4),
  ('302.2', 'Revisão Trimestral', 'Revisar controles trimestralmente', 'Controles', 3, true, 5),
  ('302.3', 'Certificação CEO CFO', 'Certificação executiva trimestral', 'Governança', 3, true, 6),
  ('404.1', 'Responsabilidade Gestão', 'Gestão responsável por controles', 'Governança', 3, true, 7),
  ('404.2', 'Relatório Anual Controles', 'Relatório anual sobre controles', 'Controles', 3, true, 8),
  ('404.3', 'Auditoria Externa', 'Auditores atestam controles', 'Auditoria', 3, true, 9),
  ('301', 'Comitê Auditoria Independente', 'Estabelecer comitê independente', 'Governança', 3, true, 10),
  ('407', 'Divulgação Operações Complexas', 'Divulgar transações complexas', 'Divulgação', 2, true, 11),
  ('408', 'Revisão Aprimorada', 'Revisão periódica aprimorada', 'Divulgação', 2, true, 12),
  ('802', 'Proteção Documentos', 'Proteção registros e documentos', 'Controles', 3, true, 13),
  ('1102', 'Interferência Auditoria', 'Proibir interferência em auditoria', 'Auditoria', 3, true, 14),
  ('201', 'Padrões Auditoria', 'Estabelecer padrões auditoria', 'Auditoria', 2, true, 15),
  ('202', 'Pré-aprovação Serviços', 'Pré-aprovar serviços auditoria', 'Auditoria', 2, true, 16),
  ('203', 'Rotação Auditores', 'Rotação de sócios auditoria', 'Auditoria', 2, true, 17),
  ('204', 'Relatórios Auditoria', 'Relatórios ao comitê auditoria', 'Auditoria', 2, true, 18),
  ('303', 'Código Ética Executivos', 'Código de ética para executivos', 'Governança', 3, true, 19),
  ('304', 'Recuperação Compensação', 'Recuperar compensação indevida', 'Governança', 2, true, 20),
  ('305', 'Negociação Executivos', 'Restrições negociação executivos', 'Governança', 2, true, 21),
  ('306', 'Insider Trading', 'Proibir uso informação privilegiada', 'Governança', 3, true, 22),
  ('401', 'Divulgação Balanço', 'Divulgação off-balance sheet', 'Divulgação', 3, true, 23),
  ('402', 'Empréstimos Executivos', 'Proibir empréstimos a executivos', 'Governança', 2, true, 24),
  ('403', 'Negociação Insider', 'Divulgar negociações insiders', 'Divulgação', 2, true, 25),
  ('406', 'Análise Conflitos Interesse', 'Analisar conflitos de interesse', 'Governança', 2, true, 26),
  ('501', 'Tratamento Analistas', 'Regular tratamento de analistas', 'Divulgação', 2, true, 27),
  ('806', 'Proteção Denunciantes', 'Proteger whistleblowers', 'Governança', 3, true, 28),
  ('807', 'Penalidades Criminais', 'Estabelecer penalidades', 'Governança', 2, true, 29),
  ('906', 'Responsabilidade Criminal CEO', 'Responsabilizar criminalmente CEO', 'Governança', 3, true, 30)
) AS t(codigo, titulo, descricao, categoria, peso, obrigatorio, ordem)
ON CONFLICT DO NOTHING;

-- 7. ITIL v4 (34 práticas de gestão de serviços de TI)
INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, area_responsavel, peso, obrigatorio, ordem, created_at, updated_at)
SELECT 
  (SELECT id FROM gap_analysis_frameworks WHERE nome = 'ITIL' AND empresa_id IS NULL),
  codigo, titulo, descricao, categoria, 'TI', peso, obrigatorio, ordem, now(), now()
FROM (VALUES
  ('GP-01', 'Gestão Arquitetura', 'Gerenciar arquitetura de serviços', 'Práticas Gerais', 2, true, 1),
  ('GP-02', 'Melhoria Contínua', 'Promover melhoria contínua', 'Práticas Gerais', 3, true, 2),
  ('GP-03', 'Gestão Segurança Informação', 'Proteger informações organizacionais', 'Práticas Gerais', 3, true, 3),
  ('GP-04', 'Gestão Conhecimento', 'Gerenciar conhecimento organizacional', 'Práticas Gerais', 2, true, 4),
  ('GP-05', 'Medição Relatórios', 'Medir e reportar performance', 'Práticas Gerais', 2, true, 5),
  ('GP-06', 'Gestão Mudanças Organizacionais', 'Gerenciar mudanças organizacionais', 'Práticas Gerais', 2, true, 6),
  ('GP-07', 'Gestão Portfolio', 'Gerenciar portfólio de serviços', 'Práticas Gerais', 2, true, 7),
  ('GP-08', 'Gestão Projetos', 'Gerenciar projetos de TI', 'Práticas Gerais', 2, true, 8),
  ('GP-09', 'Gestão Relacionamentos', 'Gerenciar relacionamentos com stakeholders', 'Práticas Gerais', 2, true, 9),
  ('GP-10', 'Gestão Riscos', 'Identificar e mitigar riscos', 'Práticas Gerais', 3, true, 10),
  ('GP-11', 'Gestão Financeira Serviços', 'Gerenciar aspectos financeiros', 'Práticas Gerais', 2, true, 11),
  ('GP-12', 'Gestão Estratégia', 'Definir estratégia de serviços', 'Práticas Gerais', 3, true, 12),
  ('GP-13', 'Gestão Fornecedores', 'Gerenciar fornecedores externos', 'Práticas Gerais', 2, true, 13),
  ('GP-14', 'Gestão Talentos Força Trabalho', 'Gerenciar pessoas e habilidades', 'Práticas Gerais', 2, true, 14),
  ('SM-01', 'Disponibilidade', 'Assegurar disponibilidade serviços', 'Práticas Gestão Serviços', 3, true, 15),
  ('SM-02', 'Análise Negócio', 'Analisar necessidades negócio', 'Práticas Gestão Serviços', 2, true, 16),
  ('SM-03', 'Gestão Capacidade Desempenho', 'Gerenciar capacidade e performance', 'Práticas Gestão Serviços', 3, true, 17),
  ('SM-04', 'Habilitação Mudanças', 'Habilitar mudanças de forma controlada', 'Práticas Gestão Serviços', 3, true, 18),
  ('SM-05', 'Gestão Incidentes', 'Restaurar serviços rapidamente', 'Práticas Gestão Serviços', 3, true, 19),
  ('SM-06', 'Gestão Ativos TI', 'Gerenciar ativos de TI', 'Práticas Gestão Serviços', 2, true, 20),
  ('SM-07', 'Monitoramento Gestão Eventos', 'Monitorar e gerenciar eventos', 'Práticas Gestão Serviços', 3, true, 21),
  ('SM-08', 'Gestão Problemas', 'Identificar e resolver problemas', 'Práticas Gestão Serviços', 2, true, 22),
  ('SM-09', 'Gestão Liberações', 'Gerenciar liberações de serviços', 'Práticas Gestão Serviços', 3, true, 23),
  ('SM-10', 'Gestão Catálogo Serviços', 'Manter catálogo de serviços', 'Práticas Gestão Serviços', 2, true, 24),
  ('SM-11', 'Configuração Serviços', 'Gerenciar configurações serviços', 'Práticas Gestão Serviços', 3, true, 25),
  ('SM-12', 'Continuidade Serviços', 'Assegurar continuidade negócio', 'Práticas Gestão Serviços', 3, true, 26),
  ('SM-13', 'Design Serviços', 'Projetar novos serviços', 'Práticas Gestão Serviços', 2, true, 27),
  ('SM-14', 'Central Serviços', 'Operar central de serviços', 'Práticas Gestão Serviços', 3, true, 28),
  ('SM-15', 'Gestão Níveis Serviço', 'Gerenciar acordos nível serviço', 'Práticas Gestão Serviços', 3, true, 29),
  ('SM-16', 'Requisição Serviços', 'Atender requisições de serviço', 'Práticas Gestão Serviços', 2, true, 30),
  ('SM-17', 'Validação Testes Serviços', 'Validar e testar serviços', 'Práticas Gestão Serviços', 2, true, 31),
  ('TM-01', 'Gestão Implantação', 'Gerenciar implantações', 'Práticas Gestão Técnica', 2, true, 32),
  ('TM-02', 'Gestão Infraestrutura Plataforma', 'Gerenciar infraestrutura tecnológica', 'Práticas Gestão Técnica', 3, true, 33),
  ('TM-03', 'Desenvolvimento Software', 'Desenvolver e manter software', 'Práticas Gestão Técnica', 2, true, 34)
) AS t(codigo, titulo, descricao, categoria, peso, obrigatorio, ordem)
ON CONFLICT DO NOTHING;