-- Inserir requisitos ITIL v4 (34 práticas)
DO $$
DECLARE
  v_framework_id uuid;
BEGIN
  SELECT id INTO v_framework_id FROM gap_analysis_frameworks WHERE nome = 'ITIL' AND versao = 'v4' AND is_template = true LIMIT 1;
  
  IF v_framework_id IS NOT NULL THEN
    INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, area_responsavel, peso, obrigatorio, ordem) VALUES
    (v_framework_id, 'SVS.1', 'Estratégia', 'Definir estratégia serviços organização', 'Práticas Gerais Gestão', 'Estratégia', 3, true, 1),
    (v_framework_id, 'SVS.2', 'Gestão Portfólio', 'Gerenciar portfólio serviços produtos', 'Práticas Gerais Gestão', 'Portfólio', 2, true, 2),
    (v_framework_id, 'SVS.3', 'Arquitetura', 'Compreender elementos organização trabalham juntos', 'Práticas Gerais Gestão', 'Arquitetura', 2, true, 3),
    (v_framework_id, 'SVS.4', 'Melhoria Contínua', 'Alinhar práticas objetivos organização', 'Práticas Gerais Gestão', 'Melhoria', 3, true, 4),
    (v_framework_id, 'SVS.5', 'Medição Relatório', 'Apoiar decisões boa governança', 'Práticas Gerais Gestão', 'Medição', 2, true, 5),
    (v_framework_id, 'SVS.6', 'Gestão Risco', 'Compreender lidar riscos organização', 'Práticas Gerais Gestão', 'Risco', 3, true, 6),
    (v_framework_id, 'SVS.7', 'Segurança Informação', 'Proteger informações organização', 'Práticas Gerais Gestão', 'Segurança', 3, true, 7),
    (v_framework_id, 'SVS.8', 'Gestão Conhecimento', 'Manter melhorar uso conhecimento', 'Práticas Gerais Gestão', 'Conhecimento', 2, true, 8),
    (v_framework_id, 'SVS.9', 'Gestão Organizacional Mudança', 'Maximizar sucesso mudanças organizacionais', 'Práticas Gerais Gestão', 'Mudança Organizacional', 2, true, 9),
    (v_framework_id, 'SVS.10', 'Gestão Projetos', 'Entregar produtos serviços tempo custo', 'Práticas Gerais Gestão', 'Projetos', 2, true, 10),
    (v_framework_id, 'SVS.11', 'Gestão Relacionamento', 'Estabelecer cultivar links stakeholders', 'Práticas Gerais Gestão', 'Relacionamento', 2, true, 11),
    (v_framework_id, 'SVS.12', 'Gestão Fornecedores', 'Garantir fornecedores gerenciados apoiem serviços', 'Práticas Gerais Gestão', 'Fornecedores', 2, true, 12),
    (v_framework_id, 'SVS.13', 'Gestão Talentos Força Trabalho', 'Garantir pessoas certas habilidades certas', 'Práticas Gerais Gestão', 'RH', 2, true, 13),
    (v_framework_id, 'SVS.14', 'Disponibilidade', 'Garantir serviços disponíveis quando necessário', 'Práticas Gestão Serviços', 'Disponibilidade', 3, true, 14),
    (v_framework_id, 'SVS.15', 'Análise Negócio', 'Analisar negócio identificar necessidades', 'Práticas Gestão Serviços', 'Análise Negócio', 2, true, 15),
    (v_framework_id, 'SVS.16', 'Gestão Capacidade Desempenho', 'Capacidade desempenho atendam expectativas', 'Práticas Gestão Serviços', 'Capacidade', 3, true, 16),
    (v_framework_id, 'SVS.17', 'Habilitação Mudança', 'Maximizar mudanças bem-sucedidas', 'Práticas Gestão Serviços', 'Mudança', 3, true, 17),
    (v_framework_id, 'SVS.18', 'Gestão Incidentes', 'Minimizar impacto negativo incidentes', 'Práticas Gestão Serviços', 'Incidentes', 3, true, 18),
    (v_framework_id, 'SVS.19', 'Gestão Ativos TI', 'Planejar gerenciar ciclo vida ativos', 'Práticas Gestão Serviços', 'Ativos', 2, true, 19),
    (v_framework_id, 'SVS.20', 'Monitoramento Gestão Eventos', 'Observar sistematicamente serviços componentes', 'Práticas Gestão Serviços', 'Monitoramento', 3, true, 20),
    (v_framework_id, 'SVS.21', 'Gestão Problemas', 'Reduzir probabilidade recorrência incidentes', 'Práticas Gestão Serviços', 'Problemas', 3, true, 21),
    (v_framework_id, 'SVS.22', 'Gestão Liberação', 'Disponibilizar serviços recursos novos alterados', 'Práticas Gestão Serviços', 'Liberação', 3, true, 22),
    (v_framework_id, 'SVS.23', 'Catálogo Serviços', 'Fornecer fonte única informações serviços', 'Práticas Gestão Serviços', 'Catálogo', 2, true, 23),
    (v_framework_id, 'SVS.24', 'Configuração Serviços', 'Configurar serviços suportem resultados', 'Práticas Gestão Serviços', 'Configuração', 2, true, 24),
    (v_framework_id, 'SVS.25', 'Continuidade Serviços', 'Reduzir probabilidade impacto interrupções', 'Práticas Gestão Serviços', 'Continuidade', 3, true, 25),
    (v_framework_id, 'SVS.26', 'Design Serviços', 'Projetar produtos serviços adequados propósito', 'Práticas Gestão Serviços', 'Design', 2, true, 26),
    (v_framework_id, 'SVS.27', 'Service Desk', 'Capturar demanda incidentes requisições serviço', 'Práticas Gestão Serviços', 'Service Desk', 3, true, 27),
    (v_framework_id, 'SVS.28', 'Gestão Nível Serviço', 'Definir expectativas claras desempenho', 'Práticas Gestão Serviços', 'SLA', 3, true, 28),
    (v_framework_id, 'SVS.29', 'Requisição Serviços', 'Suportar qualidade acordada requisições', 'Práticas Gestão Serviços', 'Requisições', 2, true, 29),
    (v_framework_id, 'SVS.30', 'Validação Testes Serviços', 'Garantir produtos serviços atendam requisitos', 'Práticas Gestão Serviços', 'Testes', 2, true, 30),
    (v_framework_id, 'SVS.31', 'Implantação Software', 'Disponibilizar software hardware ambientes', 'Práticas Gestão Técnica', 'Implantação', 3, true, 31),
    (v_framework_id, 'SVS.32', 'Gestão Infraestrutura Plataforma', 'Supervisionar infraestrutura plataformas tecnologia', 'Práticas Gestão Técnica', 'Infraestrutura', 3, true, 32),
    (v_framework_id, 'SVS.33', 'Desenvolvimento Gestão Software', 'Garantir aplicações atendam necessidades', 'Práticas Gestão Técnica', 'Desenvolvimento', 2, true, 33),
    (v_framework_id, 'SVS.34', 'Cadeia Valor Serviço', 'Criar valor co-criando serviços', 'Sistema Valor Serviço', 'Cadeia Valor', 3, true, 34);
  END IF;
END $$;