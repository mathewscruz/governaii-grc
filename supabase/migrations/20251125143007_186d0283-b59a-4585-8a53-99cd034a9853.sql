-- Inserir requisitos ISO 9001:2015 (50 requisitos)
DO $$
DECLARE
  v_framework_id uuid;
BEGIN
  SELECT id INTO v_framework_id FROM gap_analysis_frameworks WHERE nome = 'ISO 9001' AND versao = '2015' AND is_template = true LIMIT 1;
  
  IF v_framework_id IS NOT NULL THEN
    INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, area_responsavel, peso, obrigatorio, ordem) VALUES
    (v_framework_id, '4.1', 'Compreender Organização Contexto', 'Determinar questões internas externas relevantes propósito', 'Contexto da Organização', 'Estratégia', 2, true, 1),
    (v_framework_id, '4.2', 'Necessidades Expectativas Partes Interessadas', 'Determinar partes interessadas requisitos relevantes SGQ', 'Contexto da Organização', 'Estratégia', 3, true, 2),
    (v_framework_id, '4.3', 'Determinar Escopo SGQ', 'Determinar limites aplicabilidade SGQ', 'Contexto da Organização', 'Qualidade', 3, true, 3),
    (v_framework_id, '4.4', 'Sistema Gestão Qualidade Processos', 'Estabelecer implementar manter melhorar SGQ', 'Contexto da Organização', 'Qualidade', 3, true, 4),
    (v_framework_id, '5.1', 'Liderança Comprometimento Geral', 'Demonstrar liderança comprometimento SGQ', 'Liderança', 'Alta Direção', 3, true, 5),
    (v_framework_id, '5.1.2', 'Foco Cliente', 'Demonstrar foco cliente atendimento requisitos', 'Liderança', 'Alta Direção', 3, true, 6),
    (v_framework_id, '5.2', 'Política Qualidade', 'Estabelecer comunicar política qualidade', 'Liderança', 'Qualidade', 3, true, 7),
    (v_framework_id, '5.3', 'Papéis Responsabilidades Autoridades', 'Atribuir responsabilidades autoridades SGQ', 'Liderança', 'Governança', 3, true, 8),
    (v_framework_id, '6.1', 'Ações Riscos Oportunidades', 'Abordar riscos oportunidades SGQ', 'Planejamento', 'Risco', 3, true, 9),
    (v_framework_id, '6.2', 'Objetivos Qualidade Planejamento', 'Estabelecer objetivos qualidade planejar alcançá-los', 'Planejamento', 'Qualidade', 3, true, 10),
    (v_framework_id, '6.3', 'Planejamento Mudanças', 'Planejar mudanças SGQ forma sistemática', 'Planejamento', 'Mudança', 2, true, 11),
    (v_framework_id, '7.1.1', 'Recursos Gerais', 'Determinar fornecer recursos SGQ', 'Apoio', 'Recursos', 2, true, 12),
    (v_framework_id, '7.1.2', 'Pessoas', 'Determinar fornecer pessoas operação SGQ', 'Apoio', 'RH', 2, true, 13),
    (v_framework_id, '7.1.3', 'Infraestrutura', 'Determinar fornecer manter infraestrutura', 'Apoio', 'Infraestrutura', 2, true, 14),
    (v_framework_id, '7.1.4', 'Ambiente Operação Processos', 'Determinar gerenciar ambiente operação processos', 'Apoio', 'Operações', 2, true, 15),
    (v_framework_id, '7.1.5', 'Recursos Monitoramento Medição', 'Fornecer recursos monitoramento medição', 'Apoio', 'Medição', 2, true, 16),
    (v_framework_id, '7.1.6', 'Conhecimento Organizacional', 'Determinar manter conhecimento necessário operação', 'Apoio', 'Conhecimento', 2, true, 17),
    (v_framework_id, '7.2', 'Competência', 'Determinar competência necessária pessoas', 'Apoio', 'RH', 2, true, 18),
    (v_framework_id, '7.3', 'Conscientização', 'Conscientizar pessoas sobre política qualidade', 'Apoio', 'RH', 2, true, 19),
    (v_framework_id, '7.4', 'Comunicação', 'Determinar comunicações internas externas SGQ', 'Apoio', 'Comunicação', 2, true, 20),
    (v_framework_id, '7.5', 'Informação Documentada', 'Incluir informação documentada requerida SGQ', 'Apoio', 'Documentação', 2, true, 21),
    (v_framework_id, '8.1', 'Planejamento Controle Operacional', 'Planejar implementar controlar processos', 'Operação', 'Operações', 3, true, 22),
    (v_framework_id, '8.2.1', 'Comunicação Cliente', 'Comunicar clientes informações produtos serviços', 'Operação', 'Cliente', 3, true, 23),
    (v_framework_id, '8.2.2', 'Determinação Requisitos Produtos Serviços', 'Determinar requisitos produtos serviços clientes', 'Operação', 'Cliente', 3, true, 24),
    (v_framework_id, '8.2.3', 'Análise Crítica Requisitos', 'Analisar criticamente requisitos antes compromisso', 'Operação', 'Cliente', 3, true, 25),
    (v_framework_id, '8.2.4', 'Mudanças Requisitos', 'Controlar mudanças requisitos produtos serviços', 'Operação', 'Mudança', 2, true, 26),
    (v_framework_id, '8.3', 'Design Desenvolvimento', 'Estabelecer implementar controlar processo design', 'Operação', 'Desenvolvimento', 2, true, 27),
    (v_framework_id, '8.4', 'Controle Processos Produtos Serviços Providos Externamente', 'Controlar processos produtos serviços externos', 'Operação', 'Fornecedores', 3, true, 28),
    (v_framework_id, '8.5', 'Produção Provisão Serviço', 'Implementar produção provisão serviço condições controladas', 'Operação', 'Produção', 3, true, 29),
    (v_framework_id, '8.5.2', 'Identificação Rastreabilidade', 'Identificar rastrear saídas quando apropriado', 'Operação', 'Produção', 2, true, 30),
    (v_framework_id, '8.5.3', 'Propriedade Cliente Provedores Externos', 'Cuidar propriedade clientes provedores externos', 'Operação', 'Cliente', 2, true, 31),
    (v_framework_id, '8.5.4', 'Preservação', 'Preservar saídas durante produção provisão serviço', 'Operação', 'Produção', 2, true, 32),
    (v_framework_id, '8.5.5', 'Atividades Pós-Entrega', 'Atender requisitos atividades pós-entrega', 'Operação', 'Cliente', 2, true, 33),
    (v_framework_id, '8.5.6', 'Controle Mudanças', 'Analisar criticamente controlar mudanças produção', 'Operação', 'Mudança', 3, true, 34),
    (v_framework_id, '8.6', 'Liberação Produtos Serviços', 'Implementar verificações liberação produtos serviços', 'Operação', 'Qualidade', 3, true, 35),
    (v_framework_id, '8.7', 'Controle Saídas Não Conformes', 'Controlar saídas não conformes prevenir uso entrega', 'Operação', 'Qualidade', 3, true, 36),
    (v_framework_id, '9.1.1', 'Monitoramento Medição Análise Avaliação Geral', 'Determinar monitorar medir analisar avaliar', 'Avaliação de Desempenho', 'Medição', 3, true, 37),
    (v_framework_id, '9.1.2', 'Satisfação Cliente', 'Monitorar percepções clientes atendimento requisitos', 'Avaliação de Desempenho', 'Cliente', 3, true, 38),
    (v_framework_id, '9.1.3', 'Análise Avaliação', 'Analisar avaliar dados informações apropriadas monitoramento', 'Avaliação de Desempenho', 'Análise', 3, true, 39),
    (v_framework_id, '9.2', 'Auditoria Interna', 'Conduzir auditorias internas intervalos planejados', 'Avaliação de Desempenho', 'Auditoria', 3, true, 40),
    (v_framework_id, '9.3', 'Análise Crítica Direção', 'Analisar criticamente SGQ intervalos planejados', 'Avaliação de Desempenho', 'Alta Direção', 3, true, 41),
    (v_framework_id, '10.1', 'Melhoria Geral', 'Determinar selecionar oportunidades melhoria', 'Melhoria', 'Melhoria', 2, true, 42),
    (v_framework_id, '10.2', 'Não Conformidade Ação Corretiva', 'Reagir não conformidades tomar ações corretivas', 'Melhoria', 'Qualidade', 3, true, 43),
    (v_framework_id, '10.3', 'Melhoria Contínua', 'Melhorar continuamente adequação eficácia SGQ', 'Melhoria', 'Melhoria', 3, true, 44),
    (v_framework_id, 'A.1', 'Inovação Produtos Serviços', 'Identificar implementar inovações produtos serviços', 'Requisitos Adicionais', 'Inovação', 1, false, 45),
    (v_framework_id, 'A.2', 'Sustentabilidade Ambiental', 'Considerar aspectos ambientais operações', 'Requisitos Adicionais', 'Sustentabilidade', 1, false, 46),
    (v_framework_id, 'A.3', 'Responsabilidade Social', 'Demonstrar responsabilidade social comunidades', 'Requisitos Adicionais', 'Responsabilidade Social', 1, false, 47),
    (v_framework_id, 'A.4', 'Segurança Saúde Ocupacional', 'Considerar segurança saúde colaboradores', 'Requisitos Adicionais', 'SSO', 1, false, 48),
    (v_framework_id, 'A.5', 'Ética Negócios', 'Manter práticas éticas transparentes negócios', 'Requisitos Adicionais', 'Ética', 1, false, 49),
    (v_framework_id, 'A.6', 'Gestão Conhecimento Inovação', 'Promover cultura aprendizado inovação', 'Requisitos Adicionais', 'Conhecimento', 1, false, 50);
  END IF;
END $$;