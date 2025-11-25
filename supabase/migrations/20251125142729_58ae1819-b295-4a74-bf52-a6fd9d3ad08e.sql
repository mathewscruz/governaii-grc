-- Inserir requisitos ISO 37301:2021 (40 requisitos)
DO $$
DECLARE
  v_framework_id uuid;
BEGIN
  SELECT id INTO v_framework_id FROM gap_analysis_frameworks WHERE nome = 'ISO 37301' AND versao = '2021' AND is_template = true LIMIT 1;
  
  IF v_framework_id IS NOT NULL THEN
    INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, area_responsavel, peso, obrigatorio, ordem) VALUES
    (v_framework_id, '4.1', 'Compreender Organização Contexto', 'Determinar questões internas externas compliance', 'Contexto da Organização', 'Compliance', 3, true, 1),
    (v_framework_id, '4.2', 'Necessidades Expectativas Partes Interessadas', 'Determinar partes interessadas requisitos compliance', 'Contexto da Organização', 'Compliance', 3, true, 2),
    (v_framework_id, '4.3', 'Determinar Escopo Sistema Compliance', 'Determinar limites aplicabilidade sistema', 'Contexto da Organização', 'Compliance', 3, true, 3),
    (v_framework_id, '4.4', 'Sistema Gestão Compliance', 'Estabelecer implementar manter melhorar sistema', 'Contexto da Organização', 'Compliance', 3, true, 4),
    (v_framework_id, '5.1', 'Liderança Comprometimento', 'Demonstrar liderança comprometimento compliance', 'Liderança', 'Alta Direção', 3, true, 5),
    (v_framework_id, '5.2', 'Política Compliance', 'Estabelecer política compliance apropriada', 'Liderança', 'Compliance', 3, true, 6),
    (v_framework_id, '5.3', 'Papéis Responsabilidades Autoridades', 'Atribuir responsabilidades autoridades compliance', 'Liderança', 'Governança', 3, true, 7),
    (v_framework_id, '5.4', 'Função Compliance', 'Estabelecer função compliance apropriada', 'Liderança', 'Compliance', 3, true, 8),
    (v_framework_id, '6.1', 'Ações Riscos Oportunidades Compliance', 'Abordar riscos oportunidades compliance', 'Planejamento', 'Risco', 3, true, 9),
    (v_framework_id, '6.2', 'Objetivos Compliance Planejamento', 'Estabelecer objetivos compliance planejar alcançá-los', 'Planejamento', 'Compliance', 3, true, 10),
    (v_framework_id, '7.1', 'Recursos', 'Determinar fornecer recursos compliance', 'Suporte', 'Recursos', 2, true, 11),
    (v_framework_id, '7.2', 'Competência', 'Determinar competência necessária compliance', 'Suporte', 'RH', 2, true, 12),
    (v_framework_id, '7.3', 'Conscientização', 'Conscientizar pessoas sobre compliance', 'Suporte', 'Treinamento', 3, true, 13),
    (v_framework_id, '7.4', 'Comunicação', 'Determinar comunicações compliance', 'Suporte', 'Comunicação', 2, true, 14),
    (v_framework_id, '7.5', 'Informação Documentada', 'Incluir informação documentada compliance', 'Suporte', 'Documentação', 2, true, 15),
    (v_framework_id, '8.1', 'Planejamento Controle Operacional', 'Planejar implementar controlar processos compliance', 'Operação', 'Compliance', 3, true, 16),
    (v_framework_id, '8.2', 'Identificar Obrigações Compliance', 'Identificar obrigações compliance aplicáveis', 'Operação', 'Compliance', 3, true, 17),
    (v_framework_id, '8.3', 'Analisar Obrigações Compliance', 'Analisar como obrigações aplicam organização', 'Operação', 'Compliance', 3, true, 18),
    (v_framework_id, '8.4', 'Avaliar Obrigações Compliance', 'Avaliar obrigações compliance requisitos específicos', 'Operação', 'Compliance', 3, true, 19),
    (v_framework_id, '8.5', 'Tratar Obrigações Compliance', 'Tratar obrigações compliance controles processos', 'Operação', 'Compliance', 3, true, 20),
    (v_framework_id, '8.6', 'Estabelecer Controles', 'Estabelecer controles operacionais compliance', 'Operação', 'Controles', 3, true, 21),
    (v_framework_id, '8.7', 'Preocupações Compliance', 'Estabelecer processo levantar preocupações compliance', 'Operação', 'Compliance', 3, true, 22),
    (v_framework_id, '8.8', 'Investigações Internas', 'Conduzir investigações não compliance suspeitas', 'Operação', 'Compliance', 3, true, 23),
    (v_framework_id, '8.9', 'Relacionamento Autoridades', 'Manter relacionamento apropriado autoridades', 'Operação', 'Relacionamento', 2, true, 24),
    (v_framework_id, '8.10', 'Gestão Mudanças', 'Controlar mudanças planejadas compliance', 'Operação', 'Mudança', 2, true, 25),
    (v_framework_id, '9.1', 'Monitoramento Medição Análise Avaliação', 'Determinar monitorar medir analisar avaliar compliance', 'Avaliação de Desempenho', 'Monitoramento', 3, true, 26),
    (v_framework_id, '9.2', 'Auditoria Interna Compliance', 'Conduzir auditorias internas compliance', 'Avaliação de Desempenho', 'Auditoria', 3, true, 27),
    (v_framework_id, '9.3', 'Análise Crítica Direção', 'Analisar criticamente sistema compliance', 'Avaliação de Desempenho', 'Alta Direção', 3, true, 28),
    (v_framework_id, '10.1', 'Não Conformidade Ação Corretiva', 'Reagir não conformidades compliance ações corretivas', 'Melhoria', 'Compliance', 3, true, 29),
    (v_framework_id, '10.2', 'Melhoria Contínua', 'Melhorar continuamente sistema compliance', 'Melhoria', 'Melhoria', 3, true, 30),
    (v_framework_id, 'A.1', 'Cultura Compliance', 'Desenvolver promover cultura compliance', 'Orientações Adicionais', 'RH', 2, true, 31),
    (v_framework_id, 'A.2', 'Governança Compliance', 'Estabelecer estrutura governança compliance', 'Orientações Adicionais', 'Governança', 3, true, 32),
    (v_framework_id, 'A.3', 'Due Diligence Terceiros', 'Realizar due diligence terceiros compliance', 'Orientações Adicionais', 'Terceiros', 2, true, 33),
    (v_framework_id, 'A.4', 'Capacitação Treinamento', 'Fornecer capacitação treinamento compliance', 'Orientações Adicionais', 'Treinamento', 2, true, 34),
    (v_framework_id, 'A.5', 'Incentivos Disciplina', 'Estabelecer incentivos disciplina comportamento compliance', 'Orientações Adicionais', 'RH', 2, true, 35),
    (v_framework_id, 'A.6', 'Proteção Denunciantes', 'Proteger pessoas levantam preocupações compliance', 'Orientações Adicionais', 'Compliance', 3, true, 36),
    (v_framework_id, 'A.7', 'Resposta Incidentes', 'Responder efetivamente incidentes não compliance', 'Orientações Adicionais', 'Incidentes', 3, true, 37),
    (v_framework_id, 'A.8', 'Registro Manutenção', 'Manter registros compliance apropriados', 'Orientações Adicionais', 'Documentação', 2, true, 38),
    (v_framework_id, 'A.9', 'Comunicação Externa', 'Comunicar externamente assuntos compliance', 'Orientações Adicionais', 'Comunicação', 2, true, 39),
    (v_framework_id, 'A.10', 'Integração Outros Sistemas', 'Integrar sistema compliance outros sistemas gestão', 'Orientações Adicionais', 'Integração', 1, false, 40);
  END IF;
END $$;