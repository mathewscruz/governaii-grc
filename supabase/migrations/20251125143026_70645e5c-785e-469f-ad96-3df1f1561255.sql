-- Inserir requisitos ISO/IEC 27701:2019 (49 controles)
DO $$
DECLARE
  v_framework_id uuid;
BEGIN
  SELECT id INTO v_framework_id FROM gap_analysis_frameworks WHERE nome = 'ISO/IEC 27701' AND versao = '2019' AND is_template = true LIMIT 1;
  
  IF v_framework_id IS NOT NULL THEN
    INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, area_responsavel, peso, obrigatorio, ordem) VALUES
    (v_framework_id, '5.2.1', 'Políticas Privacidade', 'Estabelecer políticas tratamento dados pessoais', 'Controlador de PII - Políticas', 'Privacidade', 3, true, 1),
    (v_framework_id, '5.2.2', 'Retornar Transferir Eliminar PII', 'Processos retorno transferência eliminação PII', 'Controlador de PII - Políticas', 'Privacidade', 3, true, 2),
    (v_framework_id, '5.2.3', 'Compartilhamento Transferência PII', 'Estabelecer processos compartilhamento transferência', 'Controlador de PII - Políticas', 'Privacidade', 3, true, 3),
    (v_framework_id, '5.2.4', 'Retenção PII', 'Definir períodos retenção PII', 'Controlador de PII - Políticas', 'Privacidade', 3, true, 4),
    (v_framework_id, '5.3.1', 'Obrigações Titulares Dados', 'Atender obrigações relativas titulares dados', 'Controlador de PII - Organização', 'Privacidade', 3, true, 5),
    (v_framework_id, '5.3.2', 'Determinar Documentar Finalidade', 'Determinar documentar finalidade tratamento PII', 'Controlador de PII - Organização', 'Privacidade', 3, true, 6),
    (v_framework_id, '5.3.3', 'Determinar Legalidade Base Legal', 'Determinar base legal tratamento PII', 'Controlador de PII - Organização', 'Privacidade', 3, true, 7),
    (v_framework_id, '5.3.4', 'Obtenção Consentimento Autorização', 'Obter consentimento autorização tratamento PII', 'Controlador de PII - Organização', 'Privacidade', 3, true, 8),
    (v_framework_id, '5.3.5', 'Privacidade Design Padrão', 'Implementar privacidade design padrão', 'Controlador de PII - Organização', 'Privacidade', 3, true, 9),
    (v_framework_id, '5.4.1', 'Gestão Ciclo Vida Ativos PII', 'Gerenciar ciclo vida ativos contêm PII', 'Controlador de PII - Controles Humanos', 'Ativos', 2, true, 10),
    (v_framework_id, '5.4.2', 'Minimização Dados', 'Minimizar coleta processamento PII', 'Controlador de PII - Controles Humanos', 'Privacidade', 3, true, 11),
    (v_framework_id, '5.4.3', 'Exatidão Qualidade', 'Garantir exatidão qualidade PII', 'Controlador de PII - Controles Humanos', 'Dados', 2, true, 12),
    (v_framework_id, '5.4.4', 'Direitos Titulares Dados', 'Facilitar exercício direitos titulares', 'Controlador de PII - Controles Humanos', 'Privacidade', 3, true, 13),
    (v_framework_id, '5.4.5', 'Acesso Correção Eliminação', 'Fornecer mecanismos acesso correção eliminação', 'Controlador de PII - Controles Humanos', 'Privacidade', 3, true, 14),
    (v_framework_id, '5.5.1', 'Conformidade Obrigações Legais', 'Garantir conformidade obrigações legais contratuais', 'Controlador de PII - Conformidade', 'Compliance', 3, true, 15),
    (v_framework_id, '5.5.2', 'Avaliação Impacto Privacidade', 'Realizar avaliações impacto privacidade', 'Controlador de PII - Conformidade', 'Privacidade', 3, true, 16),
    (v_framework_id, '5.5.3', 'Transferência Entre Jurisdições', 'Controlar transferências PII entre jurisdições', 'Controlador de PII - Conformidade', 'Privacidade', 3, true, 17),
    (v_framework_id, '5.5.4', 'Encarregado Proteção Dados DPO', 'Designar encarregado proteção dados', 'Controlador de PII - Conformidade', 'Privacidade', 3, true, 18),
    (v_framework_id, '5.5.5', 'Registros Atividades Tratamento', 'Manter registros atividades tratamento', 'Controlador de PII - Conformidade', 'Privacidade', 3, true, 19),
    (v_framework_id, '5.6.1', 'Comunicação Titulares', 'Comunicar titulares sobre tratamento PII', 'Controlador de PII - Comunicação', 'Comunicação', 3, true, 20),
    (v_framework_id, '5.6.2', 'Avisos Privacidade', 'Fornecer avisos privacidade claros acessíveis', 'Controlador de PII - Comunicação', 'Comunicação', 3, true, 21),
    (v_framework_id, '5.6.3', 'Transparência Tratamento', 'Garantir transparência tratamento PII', 'Controlador de PII - Comunicação', 'Comunicação', 2, true, 22),
    (v_framework_id, '5.6.4', 'Notificação Violação', 'Notificar autoridades titulares sobre violações', 'Controlador de PII - Comunicação', 'Incidentes', 3, true, 23),
    (v_framework_id, '5.7.1', 'Marketing Direto', 'Controlar uso PII marketing direto', 'Controlador de PII - Usos Específicos', 'Marketing', 2, true, 24),
    (v_framework_id, '5.7.2', 'Decisões Automatizadas Perfil', 'Controlar decisões automatizadas perfil', 'Controlador de PII - Usos Específicos', 'Automação', 3, true, 25),
    (v_framework_id, '6.2.1', 'Obrigações Processador', 'Estabelecer obrigações como processador PII', 'Processador de PII - Políticas', 'Privacidade', 3, true, 26),
    (v_framework_id, '6.2.2', 'Instruções Controlador', 'Processar PII conforme instruções controlador', 'Processador de PII - Políticas', 'Privacidade', 3, true, 27),
    (v_framework_id, '6.3.1', 'Responsabilidade Processador', 'Definir responsabilidades como processador', 'Processador de PII - Organização', 'Privacidade', 3, true, 28),
    (v_framework_id, '6.3.2', 'Subprocessadores', 'Gerenciar uso subprocessadores', 'Processador de PII - Organização', 'Fornecedores', 2, true, 29),
    (v_framework_id, '6.4.1', 'Segurança Processamento', 'Implementar segurança técnica organizacional', 'Processador de PII - Controles', 'Segurança', 3, true, 30),
    (v_framework_id, '6.4.2', 'Criptografia Pseudonimização', 'Aplicar criptografia pseudonimização PII', 'Processador de PII - Controles', 'Segurança', 3, true, 31),
    (v_framework_id, '6.5.1', 'Assistência Controlador', 'Assistir controlador atendimento direitos titulares', 'Processador de PII - Conformidade', 'Privacidade', 3, true, 32),
    (v_framework_id, '6.5.2', 'Retorno Eliminação PII', 'Retornar eliminar PII término contrato', 'Processador de PII - Conformidade', 'Privacidade', 3, true, 33),
    (v_framework_id, '6.6.1', 'Auditoria Processador', 'Permitir auditorias inspeções controlador', 'Processador de PII - Auditoria', 'Auditoria', 2, true, 34),
    (v_framework_id, '6.6.2', 'Evidências Conformidade', 'Fornecer evidências conformidade controlador', 'Processador de PII - Auditoria', 'Auditoria', 2, true, 35),
    (v_framework_id, 'A.1', 'Identificação Classificação PII', 'Identificar classificar PII processos', 'Controles Adicionais ISO 27002', 'Privacidade', 3, true, 36),
    (v_framework_id, 'A.2', 'Controle Acesso PII', 'Controlar acesso lógico físico PII', 'Controles Adicionais ISO 27002', 'Segurança', 3, true, 37),
    (v_framework_id, 'A.3', 'Gestão Vulnerabilidades PII', 'Gerenciar vulnerabilidades sistemas PII', 'Controles Adicionais ISO 27002', 'Segurança', 2, true, 38),
    (v_framework_id, 'A.4', 'Monitoramento Logs PII', 'Monitorar logs acesso processamento PII', 'Controles Adicionais ISO 27002', 'Monitoramento', 2, true, 39),
    (v_framework_id, 'A.5', 'Backup Recuperação PII', 'Garantir backup recuperação adequados PII', 'Controles Adicionais ISO 27002', 'Backup', 2, true, 40),
    (v_framework_id, 'A.6', 'Testes Segurança PII', 'Realizar testes segurança sistemas PII', 'Controles Adicionais ISO 27002', 'Segurança', 2, true, 41),
    (v_framework_id, 'A.7', 'Descarte Seguro PII', 'Descartar PII forma segura irrecuperável', 'Controles Adicionais ISO 27002', 'Privacidade', 3, true, 42),
    (v_framework_id, 'A.8', 'Capacitação Privacidade', 'Capacitar pessoal proteção dados', 'Controles Adicionais ISO 27002', 'Treinamento', 2, true, 43),
    (v_framework_id, 'A.9', 'Conscientização Privacidade', 'Promover conscientização privacidade organização', 'Controles Adicionais ISO 27002', 'Treinamento', 2, true, 44),
    (v_framework_id, 'A.10', 'Gestão Incidentes Privacidade', 'Gerenciar incidentes violações privacidade', 'Controles Adicionais ISO 27002', 'Incidentes', 3, true, 45),
    (v_framework_id, 'A.11', 'Continuidade Processamento PII', 'Garantir continuidade processamento PII', 'Controles Adicionais ISO 27002', 'Continuidade', 2, true, 46),
    (v_framework_id, 'A.12', 'Análise Risco Privacidade', 'Realizar análises risco privacidade', 'Controles Adicionais ISO 27002', 'Risco', 3, true, 47),
    (v_framework_id, 'A.13', 'Revisão Contratos Terceiros', 'Revisar contratos terceiros cláusulas privacidade', 'Controles Adicionais ISO 27002', 'Fornecedores', 2, true, 48),
    (v_framework_id, 'A.14', 'Auditoria Privacidade', 'Realizar auditorias privacidade periódicas', 'Controles Adicionais ISO 27002', 'Auditoria', 3, true, 49);
  END IF;
END $$;