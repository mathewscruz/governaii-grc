-- Inserir requisitos COSO Internal Control 2013 (17 princípios)
DO $$
DECLARE
  v_framework_id uuid;
BEGIN
  SELECT id INTO v_framework_id FROM gap_analysis_frameworks WHERE nome = 'COSO Internal Control' AND versao = '2013' AND is_template = true LIMIT 1;
  
  IF v_framework_id IS NOT NULL THEN
    INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, area_responsavel, peso, obrigatorio, ordem) VALUES
    (v_framework_id, '1', 'Demonstra Comprometimento Integridade Valores Éticos', 'Estabelece tom no topo integridade ética', 'Ambiente de Controle', 'Governança', 3, true, 1),
    (v_framework_id, '2', 'Exerce Responsabilidade Supervisão', 'Conselho independente supervisiona controle interno', 'Ambiente de Controle', 'Governança', 3, true, 2),
    (v_framework_id, '3', 'Estabelece Estrutura Autoridade Responsabilidade', 'Define autoridades responsabilidades objetivos', 'Ambiente de Controle', 'Governança', 3, true, 3),
    (v_framework_id, '4', 'Demonstra Comprometimento Competência', 'Atrai desenvolve retém pessoas competentes', 'Ambiente de Controle', 'RH', 2, true, 4),
    (v_framework_id, '5', 'Responsabiliza Pessoas Accountabilidade', 'Responsabiliza pessoas controle interno objetivos', 'Ambiente de Controle', 'Governança', 3, true, 5),
    (v_framework_id, '6', 'Especifica Objetivos Relevantes', 'Especifica objetivos clareza suficiente riscos', 'Avaliação de Riscos', 'Estratégia', 3, true, 6),
    (v_framework_id, '7', 'Identifica Analisa Riscos', 'Identifica analisa riscos alcance objetivos', 'Avaliação de Riscos', 'Risco', 3, true, 7),
    (v_framework_id, '8', 'Avalia Risco Fraude', 'Considera potencial fraude avaliação riscos', 'Avaliação de Riscos', 'Risco', 3, true, 8),
    (v_framework_id, '9', 'Identifica Avalia Mudanças Significativas', 'Identifica avalia mudanças impactam controle interno', 'Avaliação de Riscos', 'Mudança', 2, true, 9),
    (v_framework_id, '10', 'Seleciona Desenvolve Atividades Controle', 'Seleciona desenvolve atividades controle mitigam riscos', 'Atividades de Controle', 'Controles', 3, true, 10),
    (v_framework_id, '11', 'Seleciona Desenvolve Controles Gerais TI', 'Seleciona desenvolve controles tecnologia objetivos', 'Atividades de Controle', 'TI', 3, true, 11),
    (v_framework_id, '12', 'Implementa Atividades Controle Políticas Procedimentos', 'Implementa atividades controle através políticas', 'Atividades de Controle', 'Controles', 3, true, 12),
    (v_framework_id, '13', 'Obtém Usa Informação Relevante Qualidade', 'Obtém gera usa informação relevante qualidade', 'Informação e Comunicação', 'Informação', 2, true, 13),
    (v_framework_id, '14', 'Comunica Informação Internamente', 'Comunica internamente objetivos responsabilidades controle', 'Informação e Comunicação', 'Comunicação', 3, true, 14),
    (v_framework_id, '15', 'Comunica Informação Externamente', 'Comunica externamente assuntos afetam controle interno', 'Informação e Comunicação', 'Comunicação', 2, true, 15),
    (v_framework_id, '16', 'Conduz Avaliações Contínuas Independentes', 'Conduz avaliações contínuas independentes verificar presença', 'Atividades de Monitoramento', 'Auditoria', 3, true, 16),
    (v_framework_id, '17', 'Avalia Comunica Deficiências', 'Avalia comunica deficiências tempestivamente responsáveis', 'Atividades de Monitoramento', 'Comunicação', 3, true, 17);
  END IF;
END $$;