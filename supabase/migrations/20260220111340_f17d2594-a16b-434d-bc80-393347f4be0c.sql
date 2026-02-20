
-- Insert NIS2 Framework
INSERT INTO gap_analysis_frameworks (nome, versao, tipo_framework, descricao, is_template, empresa_id)
VALUES (
  'NIS2',
  '2022/2555',
  'compliance',
  'Diretiva NIS2 (Network and Information Security Directive 2) - Legislação europeia sobre cibersegurança (EU 2022/2555) que define obrigações de gestão de riscos, reporte de incidentes e governança para entidades essenciais e importantes na UE.',
  true,
  NULL
);

-- Insert NIS2 Requirements
DO $$
DECLARE
  v_fw_id uuid;
BEGIN
  SELECT id INTO v_fw_id FROM gap_analysis_frameworks WHERE nome = 'NIS2' AND is_template = true LIMIT 1;

  INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, area_responsavel, peso, obrigatorio, ordem) VALUES
  -- Âmbito e Definições (Art. 1-6)
  (v_fw_id, 'Art. 1', 'Objeto e Âmbito de Aplicação', 'Definição do objeto da diretiva, estabelecendo medidas para alcançar um elevado nível comum de cibersegurança em toda a União Europeia.', 'Âmbito e Definições', 'Compliance', 2, true, 1),
  (v_fw_id, 'Art. 2', 'Âmbito de Aplicação', 'Determinação das entidades abrangidas pela diretiva, incluindo critérios de dimensão e setores de atividade essenciais e importantes.', 'Âmbito e Definições', 'Compliance', 2, true, 2),
  (v_fw_id, 'Art. 3', 'Entidades Essenciais e Importantes', 'Classificação das entidades em essenciais e importantes com base no setor, dimensão e impacto potencial de incidentes.', 'Âmbito e Definições', 'Compliance', 2, true, 3),
  (v_fw_id, 'Art. 4-5', 'Definições e Atos Jurídicos Setoriais', 'Definições técnicas e jurídicas utilizadas na diretiva e relação com legislação setorial específica da UE.', 'Âmbito e Definições', 'Jurídico', 1, true, 4),
  (v_fw_id, 'Art. 6', 'Definições Técnicas', 'Definições de rede, sistema de informação, segurança, incidente, ciber-ameaça, vulnerabilidade e outros conceitos técnicos fundamentais.', 'Âmbito e Definições', 'TI', 1, true, 5),

  -- Governança e Responsabilidade (Art. 20)
  (v_fw_id, 'Art. 20(1)', 'Responsabilidade dos Órgãos de Direção', 'Os órgãos de direção das entidades essenciais e importantes devem aprovar e supervisionar as medidas de gestão de riscos de cibersegurança.', 'Governança e Responsabilidade', 'Diretoria', 3, true, 6),
  (v_fw_id, 'Art. 20(2)', 'Formação em Cibersegurança da Gestão', 'Os membros dos órgãos de direção devem frequentar formação sobre gestão de riscos de cibersegurança e seus impactos nos serviços.', 'Governança e Responsabilidade', 'Diretoria', 3, true, 7),
  (v_fw_id, 'Art. 20(3)', 'Formação Regular dos Colaboradores', 'As entidades devem oferecer formação regular em cibersegurança a todos os colaboradores para identificar riscos e avaliar práticas de gestão.', 'Governança e Responsabilidade', 'RH', 2, true, 8),
  (v_fw_id, 'Art. 20(4)', 'Responsabilização Pessoal', 'Os membros dos órgãos de direção podem ser responsabilizados por infrações às obrigações de gestão de riscos de cibersegurança.', 'Governança e Responsabilidade', 'Jurídico', 3, true, 9),

  -- Medidas de Gestão de Riscos (Art. 21)
  (v_fw_id, 'Art. 21(1)', 'Medidas de Gestão de Riscos de Cibersegurança', 'Implementar medidas técnicas, operacionais e organizacionais adequadas e proporcionadas para gerir riscos de segurança das redes e sistemas de informação.', 'Medidas de Gestão de Riscos', 'CISO', 3, true, 10),
  (v_fw_id, 'Art. 21(2)(a)', 'Políticas de Análise de Riscos e Segurança', 'Estabelecer políticas de análise de riscos e de segurança dos sistemas de informação, incluindo avaliações regulares de riscos.', 'Medidas de Gestão de Riscos', 'CISO', 3, true, 11),
  (v_fw_id, 'Art. 21(2)(b)', 'Tratamento de Incidentes', 'Implementar procedimentos de prevenção, deteção e resposta a incidentes de cibersegurança, incluindo planos de resposta.', 'Medidas de Gestão de Riscos', 'CISO', 3, true, 12),
  (v_fw_id, 'Art. 21(2)(c)', 'Continuidade das Atividades e Gestão de Crises', 'Assegurar a continuidade das atividades, incluindo gestão de backups, recuperação de desastres e gestão de crises.', 'Medidas de Gestão de Riscos', 'TI', 3, true, 13),
  (v_fw_id, 'Art. 21(2)(d)', 'Segurança da Cadeia de Abastecimento', 'Garantir a segurança da cadeia de abastecimento, incluindo aspetos de segurança nas relações entre cada entidade e os seus fornecedores diretos.', 'Medidas de Gestão de Riscos', 'Compliance', 3, true, 14),
  (v_fw_id, 'Art. 21(2)(e)', 'Segurança na Aquisição e Desenvolvimento', 'Assegurar a segurança na aquisição, desenvolvimento e manutenção das redes e sistemas de informação, incluindo gestão de vulnerabilidades.', 'Medidas de Gestão de Riscos', 'TI', 2, true, 15),
  (v_fw_id, 'Art. 21(2)(f)', 'Avaliação da Eficácia das Medidas', 'Implementar políticas e procedimentos para avaliar a eficácia das medidas de gestão de riscos de cibersegurança.', 'Medidas de Gestão de Riscos', 'CISO', 2, true, 16),
  (v_fw_id, 'Art. 21(2)(g)', 'Práticas Básicas de Ciber-Higiene e Formação', 'Implementar práticas básicas de ciber-higiene e formação em cibersegurança para todos os utilizadores.', 'Medidas de Gestão de Riscos', 'RH', 2, true, 17),
  (v_fw_id, 'Art. 21(2)(h)', 'Criptografia e Cifra', 'Estabelecer políticas e procedimentos relativos ao uso de criptografia e, quando adequado, de cifra para proteger dados.', 'Medidas de Gestão de Riscos', 'TI', 2, true, 18),
  (v_fw_id, 'Art. 21(2)(i)', 'Segurança dos Recursos Humanos e Controle de Acesso', 'Implementar políticas de segurança dos recursos humanos, controle de acesso e gestão de ativos.', 'Medidas de Gestão de Riscos', 'RH', 2, true, 19),
  (v_fw_id, 'Art. 21(2)(j)', 'Autenticação Multifator e Comunicações Seguras', 'Utilizar soluções de autenticação multifator ou autenticação contínua, comunicações seguras de voz, vídeo e texto, e sistemas de comunicação de emergência.', 'Medidas de Gestão de Riscos', 'TI', 3, true, 20),

  -- Reporte de Incidentes (Art. 23-24)
  (v_fw_id, 'Art. 23(1)', 'Obrigação de Notificação de Incidentes', 'As entidades devem notificar sem demora injustificada a sua CSIRT ou autoridade competente sobre incidentes significativos.', 'Reporte de Incidentes', 'CISO', 3, true, 21),
  (v_fw_id, 'Art. 23(4)(a)', 'Alerta Inicial (24 horas)', 'Enviar alerta inicial à CSIRT ou autoridade competente no prazo de 24 horas após tomar conhecimento de um incidente significativo.', 'Reporte de Incidentes', 'CISO', 3, true, 22),
  (v_fw_id, 'Art. 23(4)(b)', 'Notificação do Incidente (72 horas)', 'Enviar notificação detalhada do incidente no prazo de 72 horas, incluindo avaliação inicial de gravidade e impacto, e indicadores de comprometimento.', 'Reporte de Incidentes', 'CISO', 3, true, 23),
  (v_fw_id, 'Art. 23(4)(c)', 'Relatório Intermédio', 'Fornecer atualizações sobre o estado do tratamento do incidente quando solicitado pela CSIRT ou autoridade competente.', 'Reporte de Incidentes', 'CISO', 2, true, 24),
  (v_fw_id, 'Art. 23(4)(d)', 'Relatório Final (1 mês)', 'Apresentar relatório final no prazo de um mês após a notificação, incluindo descrição detalhada, causa provável, medidas de mitigação e impacto transfronteiriço.', 'Reporte de Incidentes', 'CISO', 3, true, 25),
  (v_fw_id, 'Art. 23(7)', 'Informação aos Destinatários dos Serviços', 'Informar sem demora injustificada os destinatários dos serviços que possam ser afetados por uma ciber-ameaça significativa sobre medidas de proteção.', 'Reporte de Incidentes', 'Comunicação', 2, true, 26),

  -- Segurança da Cadeia de Suprimentos (Art. 21(2)(d) detalhado)
  (v_fw_id, 'Art. 21(3)', 'Avaliação de Riscos de Fornecedores', 'Ter em conta as vulnerabilidades específicas de cada fornecedor direto e a qualidade global dos produtos e práticas de cibersegurança dos fornecedores.', 'Segurança da Cadeia de Suprimentos', 'Compliance', 3, true, 27),
  (v_fw_id, 'Art. 21(3)(a)', 'Cláusulas Contratuais de Segurança', 'Incluir nos contratos com fornecedores e prestadores de serviços requisitos e cláusulas de cibersegurança adequados.', 'Segurança da Cadeia de Suprimentos', 'Jurídico', 2, true, 28),
  (v_fw_id, 'Art. 21(3)(b)', 'Monitoramento Contínuo de Fornecedores', 'Monitorar continuamente a postura de segurança dos fornecedores e avaliar o impacto de vulnerabilidades na cadeia de abastecimento.', 'Segurança da Cadeia de Suprimentos', 'Compliance', 2, true, 29),
  (v_fw_id, 'Art. 22', 'Avaliações Coordenadas de Riscos na Cadeia', 'Participar em avaliações coordenadas de riscos de segurança das cadeias de abastecimento críticas a nível da UE.', 'Segurança da Cadeia de Suprimentos', 'CISO', 2, false, 30),

  -- Supervisão e Execução (Art. 31-37)
  (v_fw_id, 'Art. 31', 'Supervisão de Entidades Essenciais', 'As autoridades competentes devem supervisionar eficazmente as entidades essenciais, incluindo inspeções no local e auditorias de segurança.', 'Supervisão e Execução', 'Compliance', 3, true, 31),
  (v_fw_id, 'Art. 32', 'Medidas de Supervisão - Entidades Essenciais', 'Sujeição a auditorias de segurança regulares, análises de segurança direcionadas e pedidos de informação, incluindo políticas de cibersegurança documentadas.', 'Supervisão e Execução', 'Compliance', 3, true, 32),
  (v_fw_id, 'Art. 33', 'Supervisão de Entidades Importantes', 'Supervisão ex post para entidades importantes, acionada por provas ou indicações de incumprimento das obrigações.', 'Supervisão e Execução', 'Compliance', 2, true, 33),
  (v_fw_id, 'Art. 34', 'Medidas de Execução - Entidades Essenciais', 'Aplicação de instruções vinculativas, ordens de implementação de recomendações de auditoria e imposição de prazos de cumprimento.', 'Supervisão e Execução', 'Jurídico', 3, true, 34),
  (v_fw_id, 'Art. 35', 'Medidas de Execução - Entidades Importantes', 'Medidas de execução proporcionadas para entidades importantes, incluindo instruções vinculativas e ordens de cessação de conduta.', 'Supervisão e Execução', 'Jurídico', 2, true, 35),
  (v_fw_id, 'Art. 36-37', 'Regime Sancionatório e Coimas', 'Regime de sanções efetivas, proporcionadas e dissuasivas, incluindo coimas até 10M€ ou 2% do volume de negócios mundial para entidades essenciais.', 'Supervisão e Execução', 'Jurídico', 3, true, 36),

  -- Compartilhamento de Informações (Art. 29-30)
  (v_fw_id, 'Art. 29', 'Partilha Voluntária de Informações', 'Participar em mecanismos voluntários de partilha de informações sobre cibersegurança entre entidades essenciais e importantes.', 'Compartilhamento de Informações', 'CISO', 1, false, 37),
  (v_fw_id, 'Art. 30(1)', 'Divulgação Coordenada de Vulnerabilidades', 'Adotar e publicar política de divulgação coordenada de vulnerabilidades, incluindo canais de comunicação com investigadores de segurança.', 'Compartilhamento de Informações', 'CISO', 2, true, 38),
  (v_fw_id, 'Art. 30(2)', 'Cooperação com CSIRTs', 'Cooperar com as equipas de resposta a incidentes de segurança informática (CSIRTs) nacionais para coordenação de divulgação de vulnerabilidades.', 'Compartilhamento de Informações', 'CISO', 2, true, 39),

  -- Registros e Documentação (Art. 27-28)
  (v_fw_id, 'Art. 27', 'Registo de Entidades', 'As entidades essenciais e importantes devem registar-se junto da autoridade competente do Estado-Membro onde estão estabelecidas.', 'Registros e Documentação', 'Compliance', 2, true, 40),
  (v_fw_id, 'Art. 27(2)', 'Informações de Registo', 'Fornecer informações de registo incluindo nome, endereço, contactos atualizados, setor de atividade e Estados-Membros onde prestam serviços.', 'Registros e Documentação', 'Compliance', 1, true, 41),
  (v_fw_id, 'Art. 28', 'Base de Dados de Nomes de Domínio', 'Manter dados de registo de nomes de domínio exatos e completos, garantindo políticas de verificação e correção de dados inexatos.', 'Registros e Documentação', 'TI', 1, false, 42),

  -- Jurisdição e Cooperação (Art. 25-26)
  (v_fw_id, 'Art. 25', 'Jurisdição e Territorialidade', 'Determinar a jurisdição aplicável com base no estabelecimento principal da entidade ou no local de prestação de serviços na UE.', 'Jurisdição e Cooperação', 'Jurídico', 2, true, 43),
  (v_fw_id, 'Art. 26(1)', 'Assistência Mútua entre Autoridades', 'As autoridades competentes devem cooperar e prestar assistência mútua, incluindo partilha de informações e ações de supervisão conjuntas.', 'Jurisdição e Cooperação', 'Compliance', 1, false, 44),
  (v_fw_id, 'Art. 26(2)', 'Cooperação Transfronteiriça', 'Estabelecer mecanismos de cooperação transfronteiriça para entidades que operam em múltiplos Estados-Membros da UE.', 'Jurisdição e Cooperação', 'Jurídico', 1, false, 45);
END;
$$;
