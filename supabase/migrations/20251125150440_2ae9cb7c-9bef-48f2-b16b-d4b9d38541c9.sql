-- Completar ISO 14001 (12 requisitos faltantes - cláusulas 6-10)
INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, area_responsavel, peso, obrigatorio, ordem) VALUES
-- Cláusula 6: Planejamento
('a1d9b9b0-e211-4a7a-9913-adcc47a6427f', '6.1.1', 'Generalidades do Planejamento', 'A organização deve estabelecer processos necessários para atender aos requisitos de planejamento do SGA', 'Planejamento', 'Meio Ambiente', 2, true, 34),
('a1d9b9b0-e211-4a7a-9913-adcc47a6427f', '6.1.2', 'Aspectos Ambientais', 'A organização deve determinar os aspectos ambientais de suas atividades, produtos e serviços que pode controlar', 'Planejamento', 'Meio Ambiente', 3, true, 35),
('a1d9b9b0-e211-4a7a-9913-adcc47a6427f', '6.1.3', 'Requisitos Legais e Outros', 'A organização deve determinar e ter acesso aos requisitos legais e outros requisitos relacionados aos seus aspectos ambientais', 'Planejamento', 'Jurídico', 3, true, 36),
('a1d9b9b0-e211-4a7a-9913-adcc47a6427f', '6.2.1', 'Objetivos Ambientais', 'A organização deve estabelecer objetivos ambientais em funções e níveis pertinentes', 'Planejamento', 'Meio Ambiente', 2, true, 37),
('a1d9b9b0-e211-4a7a-9913-adcc47a6427f', '6.2.2', 'Planejamento de Ações', 'A organização deve planejar como alcançar seus objetivos ambientais', 'Planejamento', 'Meio Ambiente', 2, true, 38),
-- Cláusula 7: Apoio
('a1d9b9b0-e211-4a7a-9913-adcc47a6427f', '7.3', 'Conscientização', 'Pessoas que realizam trabalho sob controle da organização devem estar conscientes da política ambiental, aspectos e impactos ambientais', 'Apoio', 'Recursos Humanos', 2, true, 39),
('a1d9b9b0-e211-4a7a-9913-adcc47a6427f', '7.4.1', 'Comunicação Geral', 'A organização deve estabelecer processos necessários para comunicações internas e externas pertinentes ao SGA', 'Apoio', 'Comunicação', 2, true, 40),
('a1d9b9b0-e211-4a7a-9913-adcc47a6427f', '7.5.1', 'Informação Documentada Geral', 'O SGA da organização deve incluir informação documentada requerida pela norma e determinada como necessária pela organização', 'Apoio', 'Gestão da Qualidade', 2, true, 41),
-- Cláusula 8: Operação
('a1d9b9b0-e211-4a7a-9913-adcc47a6427f', '8.1', 'Planejamento e Controle Operacional', 'A organização deve estabelecer, implementar e manter processos necessários para atender a requisitos do SGA', 'Operação', 'Operações', 3, true, 42),
('a1d9b9b0-e211-4a7a-9913-adcc47a6427f', '8.2', 'Preparação e Resposta a Emergências', 'A organização deve estabelecer processos para preparação e resposta a situações de emergência potenciais', 'Operação', 'Segurança', 3, true, 43),
-- Cláusula 9: Avaliação de Desempenho
('a1d9b9b0-e211-4a7a-9913-adcc47a6427f', '9.1.2', 'Avaliação do Atendimento', 'A organização deve avaliar o atendimento aos seus requisitos legais e outros requisitos', 'Avaliação de Desempenho', 'Compliance', 3, true, 44),
-- Cláusula 10: Melhoria
('a1d9b9b0-e211-4a7a-9913-adcc47a6427f', '10.2', 'Não Conformidade e Ação Corretiva', 'Quando ocorrer uma não conformidade, a organização deve reagir à não conformidade e tomar ações para controlá-la e corrigi-la', 'Melhoria', 'Gestão da Qualidade', 3, true, 45);

-- Completar ISO/IEC 27701 (34 requisitos faltantes - extensões de privacidade)
INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, area_responsavel, peso, obrigatorio, ordem) VALUES
-- Seção 5: Extensões ISO 27001 para Controlador
('e78f3714-fc07-4245-9ebd-48a651d1e2a2', '5.2.1', 'Política de Privacidade', 'A organização deve estabelecer política de privacidade documentada', 'Controlador - Política', 'Privacidade', 3, true, 16),
('e78f3714-fc07-4245-9ebd-48a651d1e2a2', '5.2.2', 'Responsabilidades de Privacidade', 'Responsabilidades e autoridades de privacidade devem ser atribuídas e comunicadas', 'Controlador - Organização', 'Privacidade', 3, true, 17),
('e78f3714-fc07-4245-9ebd-48a651d1e2a2', '5.3.1', 'Base Legal para Tratamento', 'A organização deve identificar e documentar bases legais para tratamento de dados pessoais', 'Controlador - Base Legal', 'Jurídico', 3, true, 18),
('e78f3714-fc07-4245-9ebd-48a651d1e2a2', '5.3.2', 'Consentimento', 'Quando o consentimento for base legal, deve ser obtido, registrado e gerenciado adequadamente', 'Controlador - Base Legal', 'Privacidade', 3, true, 19),
('e78f3714-fc07-4245-9ebd-48a651d1e2a2', '5.4.1', 'Aviso aos Titulares', 'A organização deve fornecer aviso claro e acessível aos titulares sobre o tratamento de seus dados', 'Controlador - Transparência', 'Privacidade', 3, true, 20),
('e78f3714-fc07-4245-9ebd-48a651d1e2a2', '5.4.2', 'Linguagem Clara', 'Avisos de privacidade devem ser escritos em linguagem clara e de fácil compreensão', 'Controlador - Transparência', 'Comunicação', 2, true, 21),
('e78f3714-fc07-4245-9ebd-48a651d1e2a2', '5.5.1', 'Direito de Acesso', 'Processos devem ser implementados para permitir que titulares exerçam direito de acesso', 'Controlador - Direitos', 'Privacidade', 3, true, 22),
('e78f3714-fc07-4245-9ebd-48a651d1e2a2', '5.5.2', 'Direito de Retificação', 'Processos devem permitir correção de dados pessoais inexatos', 'Controlador - Direitos', 'Privacidade', 3, true, 23),
('e78f3714-fc07-4245-9ebd-48a651d1e2a2', '5.5.3', 'Direito de Eliminação', 'Processos devem permitir eliminação de dados pessoais quando apropriado', 'Controlador - Direitos', 'Privacidade', 3, true, 24),
('e78f3714-fc07-4245-9ebd-48a651d1e2a2', '5.5.4', 'Direito de Portabilidade', 'Processos devem permitir portabilidade de dados em formato estruturado', 'Controlador - Direitos', 'TI', 2, true, 25),
('e78f3714-fc07-4245-9ebd-48a651d1e2a2', '5.6.1', 'Minimização de Dados', 'Dados coletados devem ser limitados ao necessário para finalidades específicas', 'Controlador - Tratamento', 'Privacidade', 3, true, 26),
('e78f3714-fc07-4245-9ebd-48a651d1e2a2', '5.6.2', 'Limitação de Finalidade', 'Dados devem ser tratados apenas para finalidades especificadas no momento da coleta', 'Controlador - Tratamento', 'Privacidade', 3, true, 27),
('e78f3714-fc07-4245-9ebd-48a651d1e2a2', '5.6.3', 'Exatidão de Dados', 'Medidas devem assegurar que dados pessoais sejam exatos e mantidos atualizados', 'Controlador - Tratamento', 'Privacidade', 2, true, 28),
('e78f3714-fc07-4245-9ebd-48a651d1e2a2', '5.6.4', 'Limitação de Retenção', 'Dados devem ser retidos apenas pelo tempo necessário', 'Controlador - Tratamento', 'Privacidade', 3, true, 29),
('e78f3714-fc07-4245-9ebd-48a651d1e2a2', '5.7.1', 'Transferência Internacional', 'Transferências internacionais devem garantir nível adequado de proteção', 'Controlador - Transferência', 'Jurídico', 3, true, 30),
('e78f3714-fc07-4245-9ebd-48a651d1e2a2', '5.7.2', 'Salvaguardas para Transferência', 'Mecanismos apropriados devem ser implementados para transferências internacionais', 'Controlador - Transferência', 'Jurídico', 3, true, 31),
('e78f3714-fc07-4245-9ebd-48a651d1e2a2', '5.8.1', 'DPIA - Avaliação de Impacto', 'Avaliação de impacto à privacidade deve ser conduzida quando apropriado', 'Controlador - Avaliação', 'Privacidade', 3, true, 32),
('e78f3714-fc07-4245-9ebd-48a651d1e2a2', '5.8.2', 'DPIA - Metodologia', 'Metodologia sistemática deve ser seguida para DPIAs', 'Controlador - Avaliação', 'Privacidade', 2, true, 33),
-- Seção 6: Extensões ISO 27001 para Operador
('e78f3714-fc07-4245-9ebd-48a651d1e2a2', '6.2.1', 'Instruções do Controlador', 'O operador deve tratar dados pessoais apenas sob instruções do controlador', 'Operador - Obrigações', 'TI', 3, true, 34),
('e78f3714-fc07-4245-9ebd-48a651d1e2a2', '6.2.2', 'Acordo de Tratamento', 'Contrato ou instrumento legal deve regular tratamento pelo operador', 'Operador - Obrigações', 'Jurídico', 3, true, 35),
('e78f3714-fc07-4245-9ebd-48a651d1e2a2', '6.3.1', 'Segurança do Tratamento', 'O operador deve implementar medidas de segurança apropriadas', 'Operador - Segurança', 'Segurança da Informação', 3, true, 36),
('e78f3714-fc07-4245-9ebd-48a651d1e2a2', '6.3.2', 'Confidencialidade', 'Pessoas autorizadas a tratar dados devem comprometer-se com confidencialidade', 'Operador - Segurança', 'Recursos Humanos', 3, true, 37),
('e78f3714-fc07-4245-9ebd-48a651d1e2a2', '6.4.1', 'Suboperadores', 'O operador não deve contratar outro operador sem autorização', 'Operador - Subcontratação', 'Contratos', 3, true, 38),
('e78f3714-fc07-4245-9ebd-48a651d1e2a2', '6.4.2', 'Due Diligence de Suboperadores', 'Due diligence adequado deve ser conduzido antes de contratar suboperador', 'Operador - Subcontratação', 'Compliance', 3, true, 39),
('e78f3714-fc07-4245-9ebd-48a651d1e2a2', '6.5.1', 'Assistência ao Controlador', 'O operador deve auxiliar o controlador no atendimento de direitos dos titulares', 'Operador - Assistência', 'TI', 2, true, 40),
('e78f3714-fc07-4245-9ebd-48a651d1e2a2', '6.5.2', 'Assistência em DPIAs', 'O operador deve auxiliar o controlador na condução de DPIAs', 'Operador - Assistência', 'Privacidade', 2, true, 41),
('e78f3714-fc07-4245-9ebd-48a651d1e2a2', '6.6.1', 'Notificação de Incidentes', 'O operador deve notificar o controlador sobre incidentes de dados pessoais', 'Operador - Incidentes', 'Segurança da Informação', 3, true, 42),
('e78f3714-fc07-4245-9ebd-48a651d1e2a2', '6.6.2', 'Resposta a Incidentes', 'Procedimentos de resposta a incidentes devem considerar dados pessoais', 'Operador - Incidentes', 'Segurança da Informação', 3, true, 43),
('e78f3714-fc07-4245-9ebd-48a651d1e2a2', '6.7.1', 'Devolução/Eliminação', 'Dados pessoais devem ser devolvidos ou eliminados ao término do contrato', 'Operador - Término', 'TI', 3, true, 44),
('e78f3714-fc07-4245-9ebd-48a651d1e2a2', '6.7.2', 'Eliminação Segura', 'Métodos seguros devem ser usados para eliminação de dados pessoais', 'Operador - Término', 'TI', 3, true, 45),
-- Controles Adicionais do Anexo
('e78f3714-fc07-4245-9ebd-48a651d1e2a2', 'A.7.2.1', 'Registro de Atividades de Tratamento', 'Registros de atividades de tratamento devem ser mantidos conforme requisitos legais', 'Anexo - Controlador', 'Privacidade', 3, true, 46),
('e78f3714-fc07-4245-9ebd-48a651d1e2a2', 'A.7.3.1', 'Comunicação com Autoridades', 'Processos para comunicação com autoridades de proteção de dados', 'Anexo - Controlador', 'Jurídico', 2, true, 47),
('e78f3714-fc07-4245-9ebd-48a651d1e2a2', 'A.8.2.1', 'Relatórios ao Controlador', 'O operador deve fornecer relatórios periódicos ao controlador', 'Anexo - Operador', 'TI', 2, true, 48),
('e78f3714-fc07-4245-9ebd-48a651d1e2a2', 'A.8.3.1', 'Auditoria de Conformidade', 'O operador deve permitir auditorias de conformidade pelo controlador', 'Anexo - Operador', 'Compliance', 2, true, 49);