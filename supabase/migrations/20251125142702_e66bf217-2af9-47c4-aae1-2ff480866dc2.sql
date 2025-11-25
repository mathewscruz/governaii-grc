-- Inserir requisitos ISO 31000:2018 (22 requisitos)
DO $$
DECLARE
  v_framework_id uuid;
BEGIN
  SELECT id INTO v_framework_id FROM gap_analysis_frameworks WHERE nome = 'ISO 31000' AND versao = '2018' AND is_template = true LIMIT 1;
  
  IF v_framework_id IS NOT NULL THEN
    INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, area_responsavel, peso, obrigatorio, ordem) VALUES
    (v_framework_id, 'P.1', 'Integrado', 'Gestão risco parte integrante atividades organizacionais', 'Princípios', 'Governança', 3, true, 1),
    (v_framework_id, 'P.2', 'Estruturado Abrangente', 'Abordagem estruturada abrangente contribui resultados consistentes', 'Princípios', 'Governança', 2, true, 2),
    (v_framework_id, 'P.3', 'Personalizado', 'Framework processo gestão risco personalizados adaptados', 'Princípios', 'Governança', 2, true, 3),
    (v_framework_id, 'P.4', 'Inclusivo', 'Envolvimento apropriado tempestivo stakeholders', 'Princípios', 'Relacionamento', 2, true, 4),
    (v_framework_id, 'P.5', 'Dinâmico', 'Riscos surgem mudam desaparecem mudanças internas externas', 'Princípios', 'Risco', 2, true, 5),
    (v_framework_id, 'P.6', 'Melhor Informação Disponível', 'Baseado histórico experiência informações atualizadas', 'Princípios', 'Informação', 2, true, 6),
    (v_framework_id, 'P.7', 'Fatores Humanos Culturais', 'Comportamento humano cultura influenciam gestão risco', 'Princípios', 'RH', 2, true, 7),
    (v_framework_id, 'P.8', 'Melhoria Contínua', 'Gestão risco continuamente melhorada aprendizado experiência', 'Princípios', 'Melhoria', 2, true, 8),
    (v_framework_id, 'F.1', 'Liderança Comprometimento', 'Garantir integração gestão risco organização', 'Framework - Liderança e Comprometimento', 'Alta Direção', 3, true, 9),
    (v_framework_id, 'F.2', 'Integração', 'Integrar gestão risco todas atividades organização', 'Framework - Integração', 'Governança', 3, true, 10),
    (v_framework_id, 'F.3', 'Design Framework', 'Projetar framework gestão risco adequado organização', 'Framework - Design', 'Governança', 3, true, 11),
    (v_framework_id, 'F.4', 'Implementação Framework', 'Implementar framework gestão risco organização', 'Framework - Implementação', 'Governança', 3, true, 12),
    (v_framework_id, 'F.5', 'Avaliação Framework', 'Avaliar periodicamente eficácia framework gestão risco', 'Framework - Avaliação', 'Auditoria', 3, true, 13),
    (v_framework_id, 'F.6', 'Melhoria Framework', 'Melhorar continuamente framework gestão risco', 'Framework - Melhoria', 'Melhoria', 2, true, 14),
    (v_framework_id, 'PR.1', 'Comunicação Consulta', 'Facilitar comunicação consulta partes interessadas', 'Processo - Comunicação', 'Comunicação', 2, true, 15),
    (v_framework_id, 'PR.2', 'Escopo Contexto Critérios', 'Definir escopo contexto critérios gestão risco', 'Processo - Definição', 'Estratégia', 3, true, 16),
    (v_framework_id, 'PR.3', 'Identificação Risco', 'Encontrar reconhecer descrever riscos afetem objetivos', 'Processo - Avaliação', 'Risco', 3, true, 17),
    (v_framework_id, 'PR.4', 'Análise Risco', 'Compreender natureza risco base avaliação', 'Processo - Avaliação', 'Risco', 3, true, 18),
    (v_framework_id, 'PR.5', 'Avaliação Risco', 'Comparar resultados análise risco critérios decidir ação', 'Processo - Avaliação', 'Risco', 3, true, 19),
    (v_framework_id, 'PR.6', 'Tratamento Risco', 'Selecionar implementar opções tratamento riscos', 'Processo - Tratamento', 'Risco', 3, true, 20),
    (v_framework_id, 'PR.7', 'Monitoramento Análise Crítica', 'Monitorar analisar criticamente riscos tratamentos controles', 'Processo - Monitoramento', 'Monitoramento', 3, true, 21),
    (v_framework_id, 'PR.8', 'Registro Relato', 'Registrar reportar processo gestão risco resultados', 'Processo - Registro', 'Relatórios', 2, true, 22);
  END IF;
END $$;