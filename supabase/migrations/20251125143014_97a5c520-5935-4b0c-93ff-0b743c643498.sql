-- Inserir requisitos ISO 14001:2015 (45 requisitos)
DO $$
DECLARE
  v_framework_id uuid;
BEGIN
  SELECT id INTO v_framework_id FROM gap_analysis_frameworks WHERE nome = 'ISO 14001' AND versao = '2015' AND is_template = true LIMIT 1;
  
  IF v_framework_id IS NOT NULL THEN
    INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, area_responsavel, peso, obrigatorio, ordem) VALUES
    (v_framework_id, '4.1', 'Compreender Organização Contexto', 'Determinar questões ambientais internas externas', 'Contexto da Organização', 'Meio Ambiente', 2, true, 1),
    (v_framework_id, '4.2', 'Necessidades Expectativas Partes Interessadas', 'Determinar partes interessadas requisitos ambientais', 'Contexto da Organização', 'Meio Ambiente', 3, true, 2),
    (v_framework_id, '4.3', 'Determinar Escopo SGA', 'Determinar limites aplicabilidade SGA', 'Contexto da Organização', 'Meio Ambiente', 3, true, 3),
    (v_framework_id, '4.4', 'Sistema Gestão Ambiental', 'Estabelecer implementar manter melhorar SGA', 'Contexto da Organização', 'Meio Ambiente', 3, true, 4),
    (v_framework_id, '5.1', 'Liderança Comprometimento', 'Demonstrar liderança comprometimento SGA', 'Liderança', 'Alta Direção', 3, true, 5),
    (v_framework_id, '5.2', 'Política Ambiental', 'Estabelecer implementar manter política ambiental', 'Liderança', 'Meio Ambiente', 3, true, 6),
    (v_framework_id, '5.3', 'Papéis Responsabilidades Autoridades', 'Atribuir responsabilidades autoridades SGA', 'Liderança', 'Governança', 3, true, 7),
    (v_framework_id, '6.1.1', 'Ações Riscos Oportunidades Geral', 'Abordar riscos oportunidades ambientais', 'Planejamento', 'Risco', 3, true, 8),
    (v_framework_id, '6.1.2', 'Aspectos Ambientais', 'Determinar aspectos ambientais impactos associados', 'Planejamento', 'Meio Ambiente', 3, true, 9),
    (v_framework_id, '6.1.3', 'Requisitos Legais Outros', 'Determinar manter requisitos legais outros aplicáveis', 'Planejamento', 'Compliance', 3, true, 10),
    (v_framework_id, '6.1.4', 'Planejamento Ações', 'Planejar ações abordar aspectos ambientais requisitos', 'Planejamento', 'Meio Ambiente', 3, true, 11),
    (v_framework_id, '6.2', 'Objetivos Ambientais Planejamento', 'Estabelecer objetivos ambientais planejar alcançá-los', 'Planejamento', 'Meio Ambiente', 3, true, 12),
    (v_framework_id, '7.1', 'Recursos', 'Determinar fornecer recursos SGA', 'Apoio', 'Recursos', 2, true, 13),
    (v_framework_id, '7.2', 'Competência', 'Determinar competência necessária pessoas', 'Apoio', 'RH', 2, true, 14),
    (v_framework_id, '7.3', 'Conscientização', 'Conscientizar pessoas sobre política ambiental', 'Apoio', 'Treinamento', 3, true, 15),
    (v_framework_id, '7.4', 'Comunicação Geral', 'Determinar comunicações internas externas ambientais', 'Apoio', 'Comunicação', 2, true, 16),
    (v_framework_id, '7.4.2', 'Comunicação Interna', 'Comunicar internamente informações relevantes SGA', 'Apoio', 'Comunicação', 2, true, 17),
    (v_framework_id, '7.4.3', 'Comunicação Externa', 'Comunicar externamente informações relevantes SGA', 'Apoio', 'Comunicação', 2, true, 18),
    (v_framework_id, '7.5', 'Informação Documentada', 'Incluir informação documentada requerida SGA', 'Apoio', 'Documentação', 2, true, 19),
    (v_framework_id, '8.1', 'Planejamento Controle Operacional', 'Planejar implementar controlar processos ambientais', 'Operação', 'Meio Ambiente', 3, true, 20),
    (v_framework_id, '8.2', 'Preparação Resposta Emergências', 'Preparar responder emergências ambientais potenciais', 'Operação', 'Emergências', 3, true, 21),
    (v_framework_id, '9.1.1', 'Monitoramento Medição Análise Avaliação Geral', 'Determinar monitorar medir analisar avaliar desempenho ambiental', 'Avaliação de Desempenho', 'Monitoramento', 3, true, 22),
    (v_framework_id, '9.1.2', 'Avaliação Atendimento Requisitos Legais Outros', 'Avaliar atendimento requisitos legais outros', 'Avaliação de Desempenho', 'Compliance', 3, true, 23),
    (v_framework_id, '9.2', 'Auditoria Interna', 'Conduzir auditorias internas SGA intervalos planejados', 'Avaliação de Desempenho', 'Auditoria', 3, true, 24),
    (v_framework_id, '9.3', 'Análise Crítica Direção', 'Analisar criticamente SGA intervalos planejados', 'Avaliação de Desempenho', 'Alta Direção', 3, true, 25),
    (v_framework_id, '10.1', 'Não Conformidade Ação Corretiva', 'Reagir não conformidades ambientais ações corretivas', 'Melhoria', 'Meio Ambiente', 3, true, 26),
    (v_framework_id, '10.2', 'Melhoria Contínua', 'Melhorar continuamente adequação eficácia SGA', 'Melhoria', 'Melhoria', 3, true, 27),
    (v_framework_id, 'A.1', 'Gestão Resíduos Sólidos', 'Gerenciar adequadamente resíduos sólidos gerados', 'Aspectos Críticos', 'Resíduos', 3, true, 28),
    (v_framework_id, 'A.2', 'Gestão Efluentes Líquidos', 'Tratar adequadamente efluentes líquidos', 'Aspectos Críticos', 'Água', 3, true, 29),
    (v_framework_id, 'A.3', 'Gestão Emissões Atmosféricas', 'Controlar emissões atmosféricas poluentes', 'Aspectos Críticos', 'Ar', 3, true, 30),
    (v_framework_id, 'A.4', 'Gestão Recursos Hídricos', 'Gerenciar uso conservação recursos hídricos', 'Aspectos Críticos', 'Água', 3, true, 31),
    (v_framework_id, 'A.5', 'Gestão Energia', 'Gerenciar consumo eficiência energética', 'Aspectos Críticos', 'Energia', 2, true, 32),
    (v_framework_id, 'A.6', 'Gestão Produtos Químicos', 'Gerenciar armazenamento uso produtos químicos', 'Aspectos Críticos', 'Químicos', 3, true, 33),
    (v_framework_id, 'A.7', 'Gestão Ruído Vibrações', 'Controlar emissões ruído vibrações', 'Aspectos Críticos', 'Ruído', 2, true, 34),
    (v_framework_id, 'A.8', 'Gestão Biodiversidade', 'Proteger conservar biodiversidade áreas influência', 'Aspectos Críticos', 'Biodiversidade', 2, true, 35),
    (v_framework_id, 'A.9', 'Gestão Solo Contaminação', 'Prevenir controlar contaminação solo', 'Aspectos Críticos', 'Solo', 2, true, 36),
    (v_framework_id, 'A.10', 'Mudanças Climáticas', 'Abordar mudanças climáticas emissões GEE', 'Aspectos Críticos', 'Clima', 2, true, 37),
    (v_framework_id, 'B.1', 'Economia Circular', 'Implementar práticas economia circular', 'Práticas Sustentáveis', 'Sustentabilidade', 1, false, 38),
    (v_framework_id, 'B.2', 'Cadeia Fornecimento Sustentável', 'Promover sustentabilidade cadeia fornecimento', 'Práticas Sustentáveis', 'Fornecedores', 1, false, 39),
    (v_framework_id, 'B.3', 'Produtos Serviços Sustentáveis', 'Desenvolver produtos serviços sustentáveis', 'Práticas Sustentáveis', 'Desenvolvimento', 1, false, 40),
    (v_framework_id, 'B.4', 'Engajamento Comunidade', 'Engajar comunidades locais questões ambientais', 'Práticas Sustentáveis', 'Comunidade', 1, false, 41),
    (v_framework_id, 'B.5', 'Educação Ambiental', 'Promover educação ambiental colaboradores comunidade', 'Práticas Sustentáveis', 'Educação', 1, false, 42),
    (v_framework_id, 'B.6', 'Inovação Ambiental', 'Fomentar inovações tecnológicas ambientais', 'Práticas Sustentáveis', 'Inovação', 1, false, 43),
    (v_framework_id, 'B.7', 'Certificações Selos Ambientais', 'Obter manter certificações selos ambientais', 'Práticas Sustentáveis', 'Certificação', 1, false, 44),
    (v_framework_id, 'B.8', 'Relatórios Sustentabilidade', 'Publicar relatórios desempenho sustentabilidade', 'Práticas Sustentáveis', 'Relatórios', 1, false, 45);
  END IF;
END $$;