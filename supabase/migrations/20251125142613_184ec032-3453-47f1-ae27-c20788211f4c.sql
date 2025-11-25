-- Inserir requisitos ISO/IEC 20000-1:2018 (40 requisitos)
DO $$
DECLARE
  v_framework_id uuid;
BEGIN
  SELECT id INTO v_framework_id FROM gap_analysis_frameworks WHERE nome = 'ISO/IEC 20000' AND versao = '2018' AND is_template = true LIMIT 1;
  
  IF v_framework_id IS NOT NULL THEN
    INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, area_responsavel, peso, obrigatorio, ordem) VALUES
    (v_framework_id, '4.1', 'Compreender Organização Contexto', 'Determinar questões internas externas', 'Contexto da Organização', 'Estratégia', 2, true, 1),
    (v_framework_id, '4.2', 'Necessidades Expectativas Partes Interessadas', 'Determinar partes interessadas requisitos', 'Contexto da Organização', 'Estratégia', 3, true, 2),
    (v_framework_id, '4.3', 'Determinar Escopo SMS', 'Determinar limites aplicabilidade SMS', 'Contexto da Organização', 'Governança', 3, true, 3),
    (v_framework_id, '4.4', 'Sistema Gestão Serviços', 'Estabelecer implementar manter melhorar SMS', 'Contexto da Organização', 'Governança', 3, true, 4),
    (v_framework_id, '5.1', 'Liderança Comprometimento', 'Demonstrar liderança comprometimento SMS', 'Liderança', 'Alta Direção', 3, true, 5),
    (v_framework_id, '5.2', 'Política', 'Estabelecer política gestão serviços', 'Liderança', 'Governança', 3, true, 6),
    (v_framework_id, '5.3', 'Papéis Responsabilidades Autoridades', 'Atribuir responsabilidades autoridades', 'Liderança', 'Governança', 3, true, 7),
    (v_framework_id, '6.1', 'Ações Riscos Oportunidades', 'Abordar riscos oportunidades SMS', 'Planejamento', 'Risco', 3, true, 8),
    (v_framework_id, '6.2', 'Objetivos Gestão Serviços Planejamento', 'Estabelecer objetivos SMS planejar alcançá-los', 'Planejamento', 'Estratégia', 3, true, 9),
    (v_framework_id, '6.3', 'Planejamento Mudanças', 'Planejar mudanças SMS forma controlada', 'Planejamento', 'Mudança', 3, true, 10),
    (v_framework_id, '7.1', 'Recursos', 'Determinar fornecer recursos SMS', 'Suporte', 'Recursos', 2, true, 11),
    (v_framework_id, '7.2', 'Competência', 'Determinar competência necessária pessoas', 'Suporte', 'RH', 2, true, 12),
    (v_framework_id, '7.3', 'Conscientização', 'Conscientizar pessoas sobre política SMS', 'Suporte', 'RH', 2, true, 13),
    (v_framework_id, '7.4', 'Comunicação', 'Determinar comunicações internas externas', 'Suporte', 'Comunicação', 2, true, 14),
    (v_framework_id, '7.5', 'Informação Documentada', 'Incluir informação documentada requerida', 'Suporte', 'Documentação', 2, true, 15),
    (v_framework_id, '8.1', 'Planejamento Controle Operacional', 'Planejar implementar controlar processos', 'Operação', 'Operações', 3, true, 16),
    (v_framework_id, '8.2', 'Catálogo Serviços', 'Gerenciar catálogo documentado serviços', 'Operação - Novos/Alterados', 'Serviços', 2, true, 17),
    (v_framework_id, '8.3', 'Gestão Ativos Configuração', 'Controlar ativos serviços itens configuração', 'Operação - Novos/Alterados', 'Ativos', 3, true, 18),
    (v_framework_id, '8.4', 'Planejamento Transição Serviços Novos Alterados', 'Planejar transição serviços novos alterados', 'Operação - Novos/Alterados', 'Transição', 2, true, 19),
    (v_framework_id, '8.5', 'Gestão Mudança', 'Controlar mudanças serviços minimizando riscos', 'Operação - Novos/Alterados', 'Mudança', 3, true, 20),
    (v_framework_id, '8.6', 'Gestão Liberação Implantação', 'Disponibilizar serviços novos alterados', 'Operação - Novos/Alterados', 'Liberação', 3, true, 21),
    (v_framework_id, '8.7', 'Service Desk', 'Ser ponto único contato usuários', 'Operação - Resolução/Realização', 'Service Desk', 3, true, 22),
    (v_framework_id, '8.8', 'Gestão Incidentes', 'Restaurar operação normal serviços rapidamente', 'Operação - Resolução/Realização', 'Incidentes', 3, true, 23),
    (v_framework_id, '8.9', 'Gestão Requisições Serviço', 'Atender requisições serviço usuários', 'Operação - Resolução/Realização', 'Requisições', 3, true, 24),
    (v_framework_id, '8.10', 'Gestão Problemas', 'Gerenciar problemas reduzir incidentes', 'Operação - Resolução/Realização', 'Problemas', 3, true, 25),
    (v_framework_id, '8.11', 'Gestão Nível Serviço', 'Definir monitorar reportar níveis serviço', 'Operação - Controle', 'SLA', 3, true, 26),
    (v_framework_id, '8.12', 'Gestão Continuidade Disponibilidade', 'Garantir continuidade disponibilidade serviços', 'Operação - Controle', 'Continuidade', 3, true, 27),
    (v_framework_id, '8.13', 'Gestão Capacidade', 'Garantir capacidade suficiente atender demandas', 'Operação - Controle', 'Capacidade', 3, true, 28),
    (v_framework_id, '8.14', 'Gestão Segurança Informação', 'Gerenciar segurança informação serviços', 'Operação - Controle', 'Segurança', 3, true, 29),
    (v_framework_id, '8.15', 'Orçamento Contabilização', 'Orçar contabilizar custos serviços', 'Operação - Relações', 'Financeiro', 2, true, 30),
    (v_framework_id, '8.16', 'Gestão Demanda', 'Antecipar gerenciar demanda capacidade serviços', 'Operação - Relações', 'Demanda', 2, true, 31),
    (v_framework_id, '8.17', 'Gestão Relacionamento Negócio', 'Estabelecer manter relacionamento negócio', 'Operação - Relações', 'Relacionamento', 2, true, 32),
    (v_framework_id, '8.18', 'Gestão Fornecedores', 'Gerenciar fornecedores garantir entrega serviços', 'Operação - Relações', 'Fornecedores', 2, true, 33),
    (v_framework_id, '8.19', 'Relatórios Gestão Serviços', 'Produzir relatórios gestão serviços', 'Operação - Relações', 'Relatórios', 2, true, 34),
    (v_framework_id, '9.1', 'Monitoramento Medição Análise Avaliação', 'Determinar monitorar medir analisar avaliar', 'Avaliação de Desempenho', 'Medição', 3, true, 35),
    (v_framework_id, '9.2', 'Auditoria Interna', 'Conduzir auditorias internas intervalos planejados', 'Avaliação de Desempenho', 'Auditoria', 3, true, 36),
    (v_framework_id, '9.3', 'Análise Crítica Direção', 'Analisar criticamente SMS intervalos planejados', 'Avaliação de Desempenho', 'Alta Direção', 3, true, 37),
    (v_framework_id, '10.1', 'Não Conformidade Ação Corretiva', 'Reagir não conformidades tomar ações corretivas', 'Melhoria', 'Melhoria', 3, true, 38),
    (v_framework_id, '10.2', 'Melhoria Contínua', 'Melhorar continuamente adequação eficácia SMS', 'Melhoria', 'Melhoria', 3, true, 39),
    (v_framework_id, '10.3', 'Identificação Avaliação Novas Tecnologias', 'Identificar avaliar oportunidades tecnologia', 'Melhoria', 'Inovação', 1, false, 40);
  END IF;
END $$;