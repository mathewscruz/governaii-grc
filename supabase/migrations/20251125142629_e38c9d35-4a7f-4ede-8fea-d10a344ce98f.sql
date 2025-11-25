-- Inserir requisitos COSO ERM 2017 (20 princípios)
DO $$
DECLARE
  v_framework_id uuid;
BEGIN
  SELECT id INTO v_framework_id FROM gap_analysis_frameworks WHERE nome = 'COSO ERM' AND versao = '2017' AND is_template = true LIMIT 1;
  
  IF v_framework_id IS NOT NULL THEN
    INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, area_responsavel, peso, obrigatorio, ordem) VALUES
    (v_framework_id, '1', 'Supervisão Risco Exercida', 'Conselho administração supervisiona estratégia risco', 'Governança e Cultura', 'Governança', 3, true, 1),
    (v_framework_id, '2', 'Estruturas Autoridade Responsabilidade', 'Estabelecer estruturas operacionais autoridade responsabilidade', 'Governança e Cultura', 'Governança', 3, true, 2),
    (v_framework_id, '3', 'Cultura Desejada Definida', 'Define comportamentos desejados cultura organização', 'Governança e Cultura', 'RH', 2, true, 3),
    (v_framework_id, '4', 'Comprometimento Competência', 'Demonstra comprometimento competência valor', 'Governança e Cultura', 'RH', 2, true, 4),
    (v_framework_id, '5', 'Accountabilidade Desempenho', 'Responsabiliza pessoas desempenho gestão risco', 'Governança e Cultura', 'Governança', 3, true, 5),
    (v_framework_id, '6', 'Contexto Negócio Analisado', 'Analisa contexto negócio objetivos estratégicos', 'Estratégia e Definição de Objetivos', 'Estratégia', 3, true, 6),
    (v_framework_id, '7', 'Apetite Risco Definido', 'Define apetite risco alinhado estratégia', 'Estratégia e Definição de Objetivos', 'Risco', 3, true, 7),
    (v_framework_id, '8', 'Estratégias Alternativas Avaliadas', 'Avalia estratégias alternativas impacto risco', 'Estratégia e Definição de Objetivos', 'Estratégia', 2, true, 8),
    (v_framework_id, '9', 'Objetivos Negócio Formulados', 'Formula objetivos negócio alinhados estratégia', 'Estratégia e Definição de Objetivos', 'Estratégia', 3, true, 9),
    (v_framework_id, '10', 'Riscos Identificados', 'Identifica riscos afetam desempenho estratégia', 'Desempenho', 'Risco', 3, true, 10),
    (v_framework_id, '11', 'Severidade Risco Avaliada', 'Avalia severidade riscos probabilidade impacto', 'Desempenho', 'Risco', 3, true, 11),
    (v_framework_id, '12', 'Riscos Priorizados', 'Prioriza riscos base severidade', 'Desempenho', 'Risco', 3, true, 12),
    (v_framework_id, '13', 'Respostas Risco Implementadas', 'Implementa respostas riscos alinhadas apetite', 'Desempenho', 'Risco', 3, true, 13),
    (v_framework_id, '14', 'Visão Portfólio Desenvolvida', 'Desenvolve gerencia visão portfólio riscos', 'Desempenho', 'Risco', 2, true, 14),
    (v_framework_id, '15', 'Informação Risco Identificada Analisada', 'Identifica obtém analisa informações risco relevantes', 'Análise e Comunicação', 'Informação', 2, true, 15),
    (v_framework_id, '16', 'Informação Risco Comunicada', 'Comunica informações risco internamente externamente', 'Análise e Comunicação', 'Comunicação', 3, true, 16),
    (v_framework_id, '17', 'Informação Risco Reportada', 'Reporta risco cultura desempenho toda organização', 'Análise e Comunicação', 'Relatórios', 3, true, 17),
    (v_framework_id, '18', 'Mudanças Substanciais Avaliadas', 'Avalia impacto mudanças substanciais gestão risco', 'Monitoramento', 'Monitoramento', 3, true, 18),
    (v_framework_id, '19', 'Gestão Risco Revisada', 'Revisa práticas componentes gestão risco', 'Monitoramento', 'Auditoria', 2, true, 19),
    (v_framework_id, '20', 'Melhorias Realizadas', 'Identifica implementa melhorias gestão risco', 'Monitoramento', 'Melhoria', 2, true, 20);
  END IF;
END $$;