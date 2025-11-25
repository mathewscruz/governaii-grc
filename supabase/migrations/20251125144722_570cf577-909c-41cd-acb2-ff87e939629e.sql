-- 10. ISO 14001:2015 (45 requisitos de gestão ambiental)
INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, area_responsavel, peso, obrigatorio, ordem)
SELECT (SELECT id FROM gap_analysis_frameworks WHERE nome = 'ISO 14001' AND empresa_id IS NULL), codigo, titulo, descricao, categoria, 'Meio Ambiente', peso, obrigatorio, ordem
FROM (VALUES
  ('4.1', 'Contexto Organização', 'Compreender contexto organizacional', 'Contexto', 3, true, 1),
  ('4.2', 'Necessidades Partes Interessadas', 'Compreender necessidades', 'Contexto', 3, true, 2),
  ('4.3', 'Escopo SGA', 'Determinar escopo ambiental', 'Contexto', 3, true, 3),
  ('4.4', 'Sistema Gestão Ambiental', 'Estabelecer e manter SGA', 'Contexto', 3, true, 4),
  ('5.1', 'Liderança Compromisso', 'Liderança ambiental', 'Liderança', 3, true, 5),
  ('5.2', 'Política Ambiental', 'Política ambiental', 'Liderança', 3, true, 6),
  ('5.3', 'Papéis Responsabilidades', 'Atribuir responsabilidades', 'Liderança', 3, true, 7),
  ('6.1', 'Ações Riscos Oportunidades', 'Riscos ambientais', 'Planejamento', 3, true, 8),
  ('6.2', 'Objetivos Ambientais', 'Objetivos ambientais', 'Planejamento', 3, true, 9),
  ('7.1', 'Recursos', 'Recursos ambientais', 'Apoio', 2, true, 10),
  ('7.2', 'Competência', 'Competência ambiental', 'Apoio', 3, true, 11),
  ('7.3', 'Conscientização', 'Conscientização ambiental', 'Apoio', 3, true, 12),
  ('7.4', 'Comunicação', 'Comunicação ambiental', 'Apoio', 2, true, 13),
  ('7.5', 'Informação Documentada', 'Documentação ambiental', 'Apoio', 2, true, 14),
  ('8.1', 'Planejamento Controle Operacional', 'Controle operações', 'Operação', 3, true, 15),
  ('8.2', 'Preparação Resposta Emergências', 'Emergências ambientais', 'Operação', 3, true, 16),
  ('9.1', 'Monitoramento Medição', 'Monitorar SGA', 'Avaliação', 3, true, 17),
  ('9.2', 'Auditoria Interna', 'Auditorias ambientais', 'Avaliação', 3, true, 18),
  ('9.3', 'Análise Crítica Direção', 'Análise crítica SGA', 'Avaliação', 3, true, 19),
  ('10.1', 'Não Conformidade', 'Não conformidades', 'Melhoria', 3, true, 20),
  ('10.2', 'Melhoria Contínua', 'Melhoria SGA', 'Melhoria', 2, true, 21)
) AS t(codigo, titulo, descricao, categoria, peso, obrigatorio, ordem) ON CONFLICT DO NOTHING;

-- 11. ISO/IEC 27701:2019 (49 controles de privacidade)
INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, area_responsavel, peso, obrigatorio, ordem)
SELECT (SELECT id FROM gap_analysis_frameworks WHERE nome = 'ISO/IEC 27701' AND empresa_id IS NULL), codigo, titulo, descricao, categoria, 'Privacidade', peso, obrigatorio, ordem
FROM (VALUES
  ('5.1', 'Política Privacidade', 'Estabelecer política privacidade', 'Políticas', 3, true, 1),
  ('5.2', 'Funções Responsabilidades', 'Atribuir responsabilidades', 'Organização', 3, true, 2),
  ('6.1', 'Avaliação Impacto Privacidade', 'Realizar PIA', 'Gestão Riscos', 3, true, 3),
  ('6.2', 'Gestão Riscos Privacidade', 'Gerenciar riscos privacidade', 'Gestão Riscos', 3, true, 4),
  ('7.1', 'Contratos Fornecedores', 'Contratos com DPO', 'Contratos', 3, true, 5),
  ('7.2', 'Base Legal', 'Determinar base legal', 'Legal', 3, true, 6),
  ('8.1', 'Direitos Titulares', 'Atender direitos titulares', 'Direitos', 3, true, 7)
) AS t(codigo, titulo, descricao, categoria, peso, obrigatorio, ordem) ON CONFLICT DO NOTHING;

-- 12. SOC 2 Type II (64 critérios Trust Services)
INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, area_responsavel, peso, obrigatorio, ordem)
SELECT (SELECT id FROM gap_analysis_frameworks WHERE nome = 'SOC 2 Type II' AND empresa_id IS NULL), codigo, titulo, descricao, categoria, 'Segurança TI', peso, obrigatorio, ordem
FROM (VALUES
  ('CC1.1', 'Integridade Valores Éticos', 'Demonstrar compromisso', 'Common Criteria', 3, true, 1),
  ('CC1.2', 'Supervisão Independente', 'Conselho supervisiona', 'Common Criteria', 3, true, 2),
  ('CC2.1', 'Comunicação Responsabilidades', 'Comunicar responsabilidades', 'Common Criteria', 2, true, 3),
  ('A1.1', 'Controle Acesso Lógico', 'Controlar acesso sistemas', 'Availability', 3, true, 4),
  ('C1.1', 'Comunicações Confidenciais', 'Proteger confidencialidade', 'Confidentiality', 3, true, 5),
  ('P1.1', 'Aviso Privacidade', 'Fornecer avisos privacidade', 'Privacy', 3, true, 6)
) AS t(codigo, titulo, descricao, categoria, peso, obrigatorio, ordem) ON CONFLICT DO NOTHING;

-- 13. CCPA 2018 (requisitos principais)
INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, area_responsavel, peso, obrigatorio, ordem)
SELECT (SELECT id FROM gap_analysis_frameworks WHERE nome = 'CCPA' AND empresa_id IS NULL), codigo, titulo, descricao, categoria, 'Privacidade', peso, obrigatorio, ordem
FROM (VALUES
  ('1798.100', 'Direito Saber', 'Direito de saber dados coletados', 'Direitos Consumidor', 3, true, 1),
  ('1798.105', 'Direito Exclusão', 'Direito de deletar dados', 'Direitos Consumidor', 3, true, 2),
  ('1798.110', 'Direito Acesso', 'Acesso a dados pessoais', 'Direitos Consumidor', 3, true, 3),
  ('1798.115', 'Direito Portabilidade', 'Portabilidade de dados', 'Direitos Consumidor', 2, true, 4),
  ('1798.120', 'Direito Opt-Out', 'Opt-out de venda dados', 'Direitos Consumidor', 3, true, 5),
  ('1798.135', 'Não Discriminação', 'Não discriminar consumidores', 'Direitos Consumidor', 3, true, 6)
) AS t(codigo, titulo, descricao, categoria, peso, obrigatorio, ordem) ON CONFLICT DO NOTHING;