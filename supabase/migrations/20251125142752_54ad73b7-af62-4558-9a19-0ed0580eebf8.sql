-- Inserir requisitos SOX 2002 (30 requisitos)
DO $$
DECLARE
  v_framework_id uuid;
BEGIN
  SELECT id INTO v_framework_id FROM gap_analysis_frameworks WHERE nome = 'SOX' AND versao = '2002' AND is_template = true LIMIT 1;
  
  IF v_framework_id IS NOT NULL THEN
    INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, area_responsavel, peso, obrigatorio, ordem) VALUES
    (v_framework_id, '302', 'Certificação Relatórios Financeiros', 'CEO CFO certificam relatórios financeiros', 'Seção 302 - Responsabilidade Corporativa', 'Alta Direção', 3, true, 1),
    (v_framework_id, '302.1', 'Revisão Relatórios', 'Oficiais revisaram relatórios financeiros', 'Seção 302 - Responsabilidade Corporativa', 'Financeiro', 3, true, 2),
    (v_framework_id, '302.2', 'Exatidão Apresentação', 'Informações financeiras apresentadas corretamente', 'Seção 302 - Responsabilidade Corporativa', 'Financeiro', 3, true, 3),
    (v_framework_id, '302.3', 'Controles Internos', 'Responsáveis estabelecer manter controles internos', 'Seção 302 - Responsabilidade Corporativa', 'Controles', 3, true, 4),
    (v_framework_id, '302.4', 'Avaliação Controles', 'Avaliar eficácia controles internos', 'Seção 302 - Responsabilidade Corporativa', 'Auditoria', 3, true, 5),
    (v_framework_id, '302.5', 'Divulgação Deficiências', 'Divulgar deficiências controles internos auditores', 'Seção 302 - Responsabilidade Corporativa', 'Auditoria', 3, true, 6),
    (v_framework_id, '404', 'Avaliação Controle Interno', 'Relatório anual avaliar controle interno', 'Seção 404 - Avaliação Gerencial', 'Controles', 3, true, 7),
    (v_framework_id, '404.1', 'Responsabilidade Gestão', 'Gestão responsável estabelecer manter controle interno', 'Seção 404 - Avaliação Gerencial', 'Governança', 3, true, 8),
    (v_framework_id, '404.2', 'Framework Controle', 'Avaliar eficácia usando framework reconhecido', 'Seção 404 - Avaliação Gerencial', 'Controles', 3, true, 9),
    (v_framework_id, '404.3', 'Atestação Auditores', 'Auditores atestam avaliam avaliação gestão', 'Seção 404 - Avaliação Gerencial', 'Auditoria', 3, true, 10),
    (v_framework_id, '409', 'Divulgação Tempo Real', 'Divulgar rapidamente mudanças materiais', 'Seção 409 - Divulgações', 'Comunicação', 3, true, 11),
    (v_framework_id, '802', 'Penalidades Criminais', 'Penalidades alteração destruição documentos', 'Seção 802 - Penalidades', 'Compliance', 3, true, 12),
    (v_framework_id, '806', 'Proteção Denunciantes', 'Proteção funcionários relatam fraudes', 'Seção 806 - Proteção', 'Compliance', 3, true, 13),
    (v_framework_id, '906', 'Certificação Financeira CEO CFO', 'CEO CFO certificam relatórios periódicos', 'Seção 906 - Certificação', 'Alta Direção', 3, true, 14),
    (v_framework_id, 'ITGC.1', 'Gestão Mudanças', 'Controles mudanças sistemas TI', 'Controles Gerais TI', 'TI', 3, true, 15),
    (v_framework_id, 'ITGC.2', 'Gestão Acesso', 'Controles acesso lógico sistemas', 'Controles Gerais TI', 'Segurança', 3, true, 16),
    (v_framework_id, 'ITGC.3', 'Operações Computador', 'Controles operações processamento dados', 'Controles Gerais TI', 'TI', 3, true, 17),
    (v_framework_id, 'ITGC.4', 'Desenvolvimento Aquisição Programas', 'Controles desenvolvimento aquisição software', 'Controles Gerais TI', 'Desenvolvimento', 2, true, 18),
    (v_framework_id, 'ITAC.1', 'Controles Aplicação', 'Controles automáticos aplicações financeiras', 'Controles Aplicação TI', 'TI', 3, true, 19),
    (v_framework_id, 'ITAC.2', 'Interface Sistemas', 'Controles integridade interfaces sistemas', 'Controles Aplicação TI', 'TI', 3, true, 20),
    (v_framework_id, 'ITAC.3', 'Relatórios Financeiros', 'Controles geração relatórios financeiros', 'Controles Aplicação TI', 'Financeiro', 3, true, 21),
    (v_framework_id, 'PC.1', 'Controles Nível Processo', 'Controles processos negócio críticos', 'Controles Nível Processo', 'Processos', 3, true, 22),
    (v_framework_id, 'PC.2', 'Reconciliações', 'Reconciliações contas balancetes', 'Controles Nível Processo', 'Financeiro', 3, true, 23),
    (v_framework_id, 'PC.3', 'Revisões Gerenciais', 'Revisões gerenciais análises variações', 'Controles Nível Processo', 'Gestão', 2, true, 24),
    (v_framework_id, 'PC.4', 'Segregação Funções', 'Segregação apropriada responsabilidades', 'Controles Nível Processo', 'Governança', 3, true, 25),
    (v_framework_id, 'ELC.1', 'Controles Nível Entidade', 'Ambiente controle tom no topo', 'Controles Nível Entidade', 'Governança', 3, true, 26),
    (v_framework_id, 'ELC.2', 'Comitê Auditoria', 'Supervisão comitê auditoria independente', 'Controles Nível Entidade', 'Governança', 3, true, 27),
    (v_framework_id, 'ELC.3', 'Código Conduta', 'Código conduta ética organizacional', 'Controles Nível Entidade', 'Compliance', 2, true, 28),
    (v_framework_id, 'ELC.4', 'Políticas Procedimentos', 'Políticas procedimentos documentados comunicados', 'Controles Nível Entidade', 'Governança', 2, true, 29),
    (v_framework_id, 'ELC.5', 'Monitoramento Controles', 'Monitoramento contínuo eficácia controles', 'Controles Nível Entidade', 'Auditoria', 3, true, 30);
  END IF;
END $$;