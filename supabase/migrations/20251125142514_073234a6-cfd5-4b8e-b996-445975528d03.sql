-- Inserir requisitos COBIT (40 objetivos)
DO $$
DECLARE
  v_framework_id uuid;
BEGIN
  SELECT id INTO v_framework_id FROM gap_analysis_frameworks WHERE nome = 'COBIT' AND versao = '2019' AND is_template = true LIMIT 1;
  
  IF v_framework_id IS NOT NULL THEN
    INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, area_responsavel, peso, obrigatorio, ordem) VALUES
    (v_framework_id, 'EDM01', 'Assegurar Governança', 'Estabelecer e manter framework governança', 'Avaliar, Dirigir, Monitorar (EDM)', 'Governança', 3, true, 1),
    (v_framework_id, 'EDM02', 'Assegurar Entrega Benefícios', 'Otimizar contribuição valor negócio', 'Avaliar, Dirigir, Monitorar (EDM)', 'Governança', 3, true, 2),
    (v_framework_id, 'EDM03', 'Assegurar Otimização Risco', 'Assegurar que apetite risco aceitável', 'Avaliar, Dirigir, Monitorar (EDM)', 'Risco', 3, true, 3),
    (v_framework_id, 'EDM04', 'Assegurar Otimização Recursos', 'Otimizar capacidade recursos', 'Avaliar, Dirigir, Monitorar (EDM)', 'Recursos', 2, true, 4),
    (v_framework_id, 'EDM05', 'Assegurar Transparência Stakeholders', 'Transparência comunicação stakeholders', 'Avaliar, Dirigir, Monitorar (EDM)', 'Comunicação', 2, true, 5),
    (v_framework_id, 'APO01', 'Gerenciar Framework Gestão TI', 'Manter e comunicar visão estratégica TI', 'Alinhar, Planejar, Organizar (APO)', 'Estratégia', 3, true, 6),
    (v_framework_id, 'APO02', 'Gerenciar Estratégia', 'Executar processos estratégicos com TI', 'Alinhar, Planejar, Organizar (APO)', 'Estratégia', 3, true, 7),
    (v_framework_id, 'APO03', 'Gerenciar Arquitetura Empresarial', 'Estabelecer arquitetura comum', 'Alinhar, Planejar, Organizar (APO)', 'Arquitetura', 2, true, 8),
    (v_framework_id, 'APO04', 'Gerenciar Inovação', 'Manter conscientização inovações', 'Alinhar, Planejar, Organizar (APO)', 'Inovação', 2, true, 9),
    (v_framework_id, 'APO05', 'Gerenciar Portfólio', 'Executar direção estratégica investimentos', 'Alinhar, Planejar, Organizar (APO)', 'Portfólio', 3, true, 10),
    (v_framework_id, 'APO06', 'Gerenciar Orçamento Custos', 'Gerenciar atividades financeiras TI', 'Alinhar, Planejar, Organizar (APO)', 'Financeiro', 2, true, 11),
    (v_framework_id, 'APO07', 'Gerenciar Recursos Humanos', 'Fornecer estrutura organizada recursos', 'Alinhar, Planejar, Organizar (APO)', 'RH', 2, true, 12),
    (v_framework_id, 'APO08', 'Gerenciar Relacionamentos', 'Gerenciar relacionamento negócio e TI', 'Alinhar, Planejar, Organizar (APO)', 'Relacionamento', 2, true, 13),
    (v_framework_id, 'APO09', 'Gerenciar Acordos Serviço', 'Alinhar serviços baseados requisitos', 'Alinhar, Planejar, Organizar (APO)', 'Serviços', 3, true, 14),
    (v_framework_id, 'APO10', 'Gerenciar Fornecedores', 'Minimizar riscos fornecedores', 'Alinhar, Planejar, Organizar (APO)', 'Fornecedores', 2, true, 15),
    (v_framework_id, 'APO11', 'Gerenciar Qualidade', 'Definir manter padrões qualidade', 'Alinhar, Planejar, Organizar (APO)', 'Qualidade', 2, true, 16),
    (v_framework_id, 'APO12', 'Gerenciar Risco', 'Identificar analisar reduzir riscos TI', 'Alinhar, Planejar, Organizar (APO)', 'Risco', 3, true, 17),
    (v_framework_id, 'APO13', 'Gerenciar Segurança', 'Manter nível aceitável risco segurança', 'Alinhar, Planejar, Organizar (APO)', 'Segurança', 3, true, 18),
    (v_framework_id, 'APO14', 'Gerenciar Dados', 'Gerenciar dados como ativo valioso', 'Alinhar, Planejar, Organizar (APO)', 'Dados', 3, true, 19),
    (v_framework_id, 'BAI01', 'Gerenciar Programas', 'Gerenciar programas alinhados estratégia', 'Construir, Adquirir, Implementar (BAI)', 'Programas', 2, true, 20),
    (v_framework_id, 'BAI02', 'Gerenciar Definição Requisitos', 'Identificar soluções requisitos', 'Construir, Adquirir, Implementar (BAI)', 'Requisitos', 3, true, 21),
    (v_framework_id, 'BAI03', 'Gerenciar Identificação Construção Soluções', 'Estabelecer e manter soluções identificadas', 'Construir, Adquirir, Implementar (BAI)', 'Desenvolvimento', 2, true, 22),
    (v_framework_id, 'BAI04', 'Gerenciar Disponibilidade Capacidade', 'Equilibrar necessidades disponibilidade', 'Construir, Adquirir, Implementar (BAI)', 'Capacidade', 3, true, 23),
    (v_framework_id, 'BAI05', 'Gerenciar Mudanças Organizacionais', 'Facilitar aceitação mudanças', 'Construir, Adquirir, Implementar (BAI)', 'Mudança', 2, true, 24),
    (v_framework_id, 'BAI06', 'Gerenciar Mudanças TI', 'Gerenciar mudanças controladas', 'Construir, Adquirir, Implementar (BAI)', 'Mudança', 3, true, 25),
    (v_framework_id, 'BAI07', 'Gerenciar Aceite Mudança Transição', 'Aceitar formalmente novas soluções', 'Construir, Adquirir, Implementar (BAI)', 'Transição', 2, true, 26),
    (v_framework_id, 'BAI08', 'Gerenciar Conhecimento', 'Manter disponível conhecimento relevante', 'Construir, Adquirir, Implementar (BAI)', 'Conhecimento', 2, true, 27),
    (v_framework_id, 'BAI09', 'Gerenciar Ativos', 'Gerenciar ativos durante ciclo vida', 'Construir, Adquirir, Implementar (BAI)', 'Ativos', 2, true, 28),
    (v_framework_id, 'BAI10', 'Gerenciar Configuração', 'Definir manter descrições ativos', 'Construir, Adquirir, Implementar (BAI)', 'Configuração', 3, true, 29),
    (v_framework_id, 'BAI11', 'Gerenciar Projetos', 'Gerenciar projetos alinhados programas', 'Construir, Adquirir, Implementar (BAI)', 'Projetos', 2, true, 30),
    (v_framework_id, 'DSS01', 'Gerenciar Operações', 'Coordenar executar atividades serviços', 'Entregar, Servir, Suportar (DSS)', 'Operações', 3, true, 31),
    (v_framework_id, 'DSS02', 'Gerenciar Requisições Incidentes Serviço', 'Fornecer resposta oportuna requisições', 'Entregar, Servir, Suportar (DSS)', 'Suporte', 3, true, 32),
    (v_framework_id, 'DSS03', 'Gerenciar Problemas', 'Identificar classificar problemas raiz', 'Entregar, Servir, Suportar (DSS)', 'Problemas', 3, true, 33),
    (v_framework_id, 'DSS04', 'Gerenciar Continuidade', 'Estabelecer manter plano continuidade', 'Entregar, Servir, Suportar (DSS)', 'Continuidade', 3, true, 34),
    (v_framework_id, 'DSS05', 'Gerenciar Serviços Segurança', 'Proteger informações empresa', 'Entregar, Servir, Suportar (DSS)', 'Segurança', 3, true, 35),
    (v_framework_id, 'DSS06', 'Gerenciar Controles Processos Negócio', 'Definir manter controles apropriados', 'Entregar, Servir, Suportar (DSS)', 'Controles', 3, true, 36),
    (v_framework_id, 'MEA01', 'Monitorar Avaliar Desempenho Conformidade', 'Coletar monitorar reportar desempenho', 'Monitorar, Avaliar, Analisar (MEA)', 'Monitoramento', 3, true, 37),
    (v_framework_id, 'MEA02', 'Monitorar Avaliar Sistema Controle Interno', 'Monitorar avaliar controle ambiente TI', 'Monitorar, Avaliar, Analisar (MEA)', 'Controle Interno', 3, true, 38),
    (v_framework_id, 'MEA03', 'Monitorar Avaliar Conformidade Requisitos Externos', 'Identificar avaliar conformidade legal', 'Monitorar, Avaliar, Analisar (MEA)', 'Conformidade', 3, true, 39),
    (v_framework_id, 'MEA04', 'Gerenciar Garantia', 'Obter manter garantia otimização objetivos', 'Monitorar, Avaliar, Analisar (MEA)', 'Auditoria', 2, true, 40);
  END IF;
END $$;