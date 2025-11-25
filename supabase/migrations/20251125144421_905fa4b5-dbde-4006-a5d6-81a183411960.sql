-- 3. COSO Internal Control 2013 (17 princípios de controle interno)
INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, area_responsavel, peso, obrigatorio, ordem, created_at, updated_at)
SELECT 
  (SELECT id FROM gap_analysis_frameworks WHERE nome = 'COSO Internal Control' AND empresa_id IS NULL),
  codigo, titulo, descricao, categoria, 'Controladoria', peso, obrigatorio, ordem, now(), now()
FROM (VALUES
  ('P1', 'Demonstra Compromisso Integridade', 'Valores éticos e integridade', 'Ambiente Controle', 3, true, 1),
  ('P2', 'Supervisão Independente', 'Conselho supervisiona controles', 'Ambiente Controle', 3, true, 2),
  ('P3', 'Estrutura Autoridade Responsabilidade', 'Define estrutura e responsabilidades', 'Ambiente Controle', 2, true, 3),
  ('P4', 'Compromisso Competência', 'Atrai e desenvolve competências', 'Ambiente Controle', 2, true, 4),
  ('P5', 'Responsabilização', 'Estabelece accountability', 'Ambiente Controle', 2, true, 5),
  ('P6', 'Objetivos Apropriados', 'Define objetivos claros', 'Avaliação Riscos', 3, true, 6),
  ('P7', 'Identifica Analisa Riscos', 'Identifica e avalia riscos', 'Avaliação Riscos', 3, true, 7),
  ('P8', 'Avalia Risco Fraude', 'Considera potencial de fraude', 'Avaliação Riscos', 3, true, 8),
  ('P9', 'Identifica Mudanças', 'Identifica mudanças significativas', 'Avaliação Riscos', 2, true, 9),
  ('P10', 'Seleciona Atividades Controle', 'Desenvolve atividades de controle', 'Atividades Controle', 3, true, 10),
  ('P11', 'Seleciona Controles Tecnologia', 'Controles sobre tecnologia', 'Atividades Controle', 3, true, 11),
  ('P12', 'Implementa Políticas Procedimentos', 'Implementa através de políticas', 'Atividades Controle', 2, true, 12),
  ('P13', 'Usa Informação Relevante', 'Obtém e usa informação de qualidade', 'Informação Comunicação', 2, true, 13),
  ('P14', 'Comunica Internamente', 'Comunicação interna efetiva', 'Informação Comunicação', 2, true, 14),
  ('P15', 'Comunica Externamente', 'Comunicação externa efetiva', 'Informação Comunicação', 2, true, 15),
  ('P16', 'Monitora Controles', 'Avaliações contínuas e separadas', 'Monitoramento', 3, true, 16),
  ('P17', 'Avalia Comunica Deficiências', 'Reporta deficiências tempestivamente', 'Monitoramento', 3, true, 17)
) AS t(codigo, titulo, descricao, categoria, peso, obrigatorio, ordem)
ON CONFLICT DO NOTHING;

-- 4. ISO 31000:2018 (22 princípios e diretrizes de gestão de riscos)
INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, area_responsavel, peso, obrigatorio, ordem, created_at, updated_at)
SELECT 
  (SELECT id FROM gap_analysis_frameworks WHERE nome = 'ISO 31000' AND empresa_id IS NULL),
  codigo, titulo, descricao, categoria, 'Gestão de Riscos', peso, obrigatorio, ordem, now(), now()
FROM (VALUES
  ('5.2', 'Liderança e Compromisso', 'Alta direção demonstra liderança', 'Princípios', 3, true, 1),
  ('5.3', 'Integração', 'Integrar gestão de riscos', 'Princípios', 3, true, 2),
  ('5.4', 'Customização', 'Customizar framework ao contexto', 'Princípios', 2, true, 3),
  ('5.5', 'Inclusão', 'Envolvimento apropriado', 'Princípios', 2, true, 4),
  ('5.6', 'Dinâmica', 'Gestão dinâmica e responsiva', 'Princípios', 2, true, 5),
  ('5.7', 'Melhor Informação Disponível', 'Basear em informação de qualidade', 'Princípios', 2, true, 6),
  ('5.8', 'Fatores Humanos Culturais', 'Considerar aspectos humanos', 'Princípios', 2, true, 7),
  ('5.9', 'Melhoria Contínua', 'Melhorar continuamente', 'Princípios', 2, true, 8),
  ('6.3', 'Mandato e Compromisso', 'Estabelecer mandato e compromisso', 'Framework', 3, true, 9),
  ('6.4.1', 'Compreender Organização Contexto', 'Entender contexto organizacional', 'Framework', 3, true, 10),
  ('6.4.2', 'Articular Compromisso', 'Articular compromisso com gestão riscos', 'Framework', 2, true, 11),
  ('6.4.3', 'Atribuir Papéis', 'Definir papéis e responsabilidades', 'Framework', 3, true, 12),
  ('6.4.4', 'Alocar Recursos', 'Alocar recursos adequados', 'Framework', 2, true, 13),
  ('6.4.5', 'Estabelecer Comunicação', 'Estabelecer comunicação e consulta', 'Framework', 2, true, 14),
  ('6.5', 'Implementação Gestão Riscos', 'Implementar framework', 'Framework', 3, true, 15),
  ('6.6', 'Avaliação Framework', 'Avaliar eficácia do framework', 'Framework', 3, true, 16),
  ('6.7', 'Melhoria Framework', 'Melhorar continuamente framework', 'Framework', 2, true, 17),
  ('6.2', 'Processo Gestão Riscos', 'Aplicar processo sistematicamente', 'Processo', 3, true, 18),
  ('6.3.1', 'Comunicação e Consulta', 'Comunicar e consultar partes interessadas', 'Processo', 2, true, 19),
  ('6.3.2-6', 'Escopo Contexto Critérios', 'Estabelecer escopo, contexto e critérios', 'Processo', 3, true, 20),
  ('6.4.1-3', 'Identificação Análise Avaliação', 'Identificar, analisar e avaliar riscos', 'Processo', 3, true, 21),
  ('6.5', 'Tratamento Monitoramento', 'Tratar, monitorar e revisar riscos', 'Processo', 3, true, 22)
) AS t(codigo, titulo, descricao, categoria, peso, obrigatorio, ordem)
ON CONFLICT DO NOTHING;