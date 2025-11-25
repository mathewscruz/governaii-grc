-- Atualizar pesos dos requisitos NIST CSF 2.0 baseado em critérios de auditoria
-- Peso 3: Controles críticos de segurança
-- Peso 2: Controles importantes de governança e processos
-- Peso 1: Controles básicos e de suporte

-- GOVERN (Governar)
UPDATE gap_analysis_requirements SET peso = 2 WHERE codigo = 'GV.OC-01'; -- Contexto organizacional
UPDATE gap_analysis_requirements SET peso = 2 WHERE codigo = 'GV.OC-02'; -- Missão e objetivos
UPDATE gap_analysis_requirements SET peso = 2 WHERE codigo = 'GV.OC-03'; -- Ambiente legal e regulatório
UPDATE gap_analysis_requirements SET peso = 2 WHERE codigo = 'GV.OC-04'; -- Papéis e responsabilidades
UPDATE gap_analysis_requirements SET peso = 2 WHERE codigo = 'GV.OC-05'; -- Políticas e procedimentos
UPDATE gap_analysis_requirements SET peso = 3 WHERE codigo = 'GV.RM-01'; -- Gestão de riscos
UPDATE gap_analysis_requirements SET peso = 3 WHERE codigo = 'GV.RM-02'; -- Avaliação de riscos
UPDATE gap_analysis_requirements SET peso = 2 WHERE codigo = 'GV.RM-03'; -- Tratamento de riscos
UPDATE gap_analysis_requirements SET peso = 2 WHERE codigo = 'GV.RM-04'; -- Comunicação de riscos
UPDATE gap_analysis_requirements SET peso = 2 WHERE codigo = 'GV.SC-01'; -- Gestão da cadeia de suprimentos
UPDATE gap_analysis_requirements SET peso = 2 WHERE codigo = 'GV.SC-02'; -- Due diligence de fornecedores
UPDATE gap_analysis_requirements SET peso = 1 WHERE codigo = 'GV.SC-03'; -- Contratos com fornecedores

-- IDENTIFY (Identificar)
UPDATE gap_analysis_requirements SET peso = 3 WHERE codigo = 'ID.AM-01'; -- Inventário de ativos
UPDATE gap_analysis_requirements SET peso = 3 WHERE codigo = 'ID.AM-02'; -- Classificação de ativos
UPDATE gap_analysis_requirements SET peso = 2 WHERE codigo = 'ID.AM-03'; -- Fluxo de dados
UPDATE gap_analysis_requirements SET peso = 2 WHERE codigo = 'ID.AM-04'; -- Catálogo de sistemas
UPDATE gap_analysis_requirements SET peso = 3 WHERE codigo = 'ID.RA-01'; -- Identificação de vulnerabilidades
UPDATE gap_analysis_requirements SET peso = 3 WHERE codigo = 'ID.RA-02'; -- Threat intelligence
UPDATE gap_analysis_requirements SET peso = 2 WHERE codigo = 'ID.RA-03'; -- Análise de impacto
UPDATE gap_analysis_requirements SET peso = 2 WHERE codigo = 'ID.RA-04'; -- Priorização de riscos
UPDATE gap_analysis_requirements SET peso = 1 WHERE codigo = 'ID.IM-01'; -- Melhoria contínua

-- PROTECT (Proteger)
UPDATE gap_analysis_requirements SET peso = 3 WHERE codigo = 'PR.AA-01'; -- Controle de acesso
UPDATE gap_analysis_requirements SET peso = 3 WHERE codigo = 'PR.AA-02'; -- Gestão de identidades
UPDATE gap_analysis_requirements SET peso = 3 WHERE codigo = 'PR.AA-03'; -- Autenticação multifator
UPDATE gap_analysis_requirements SET peso = 3 WHERE codigo = 'PR.AA-04'; -- Privilégios mínimos
UPDATE gap_analysis_requirements SET peso = 3 WHERE codigo = 'PR.AA-05'; -- Segregação de funções
UPDATE gap_analysis_requirements SET peso = 3 WHERE codigo = 'PR.DS-01'; -- Proteção de dados em repouso
UPDATE gap_analysis_requirements SET peso = 3 WHERE codigo = 'PR.DS-02'; -- Proteção de dados em trânsito
UPDATE gap_analysis_requirements SET peso = 2 WHERE codigo = 'PR.DS-03'; -- Backup de dados
UPDATE gap_analysis_requirements SET peso = 2 WHERE codigo = 'PR.DS-04'; -- Capacidade e disponibilidade
UPDATE gap_analysis_requirements SET peso = 3 WHERE codigo = 'PR.PS-01'; -- Configuração segura
UPDATE gap_analysis_requirements SET peso = 3 WHERE codigo = 'PR.PS-02'; -- Gestão de vulnerabilidades
UPDATE gap_analysis_requirements SET peso = 2 WHERE codigo = 'PR.PS-03'; -- Gestão de patches
UPDATE gap_analysis_requirements SET peso = 2 WHERE codigo = 'PR.AT-01'; -- Treinamento de segurança

-- DETECT (Detectar)
UPDATE gap_analysis_requirements SET peso = 3 WHERE codigo = 'DE.CM-01'; -- Monitoramento contínuo
UPDATE gap_analysis_requirements SET peso = 3 WHERE codigo = 'DE.CM-02'; -- Logs de segurança
UPDATE gap_analysis_requirements SET peso = 3 WHERE codigo = 'DE.CM-03'; -- Análise de comportamento
UPDATE gap_analysis_requirements SET peso = 3 WHERE codigo = 'DE.CM-04'; -- Detecção de anomalias
UPDATE gap_analysis_requirements SET peso = 3 WHERE codigo = 'DE.CM-05'; -- Alertas de segurança
UPDATE gap_analysis_requirements SET peso = 3 WHERE codigo = 'DE.CM-06'; -- Detecção de intrusão
UPDATE gap_analysis_requirements SET peso = 3 WHERE codigo = 'DE.CM-07'; -- Monitoramento de rede
UPDATE gap_analysis_requirements SET peso = 3 WHERE codigo = 'DE.CM-08'; -- Análise de vulnerabilidades
UPDATE gap_analysis_requirements SET peso = 3 WHERE codigo = 'DE.CM-09'; -- Detecção de malware

-- RESPOND (Responder)
UPDATE gap_analysis_requirements SET peso = 3 WHERE codigo = 'RS.MA-01'; -- Gestão de incidentes
UPDATE gap_analysis_requirements SET peso = 3 WHERE codigo = 'RS.MA-02'; -- Plano de resposta
UPDATE gap_analysis_requirements SET peso = 2 WHERE codigo = 'RS.MA-03'; -- Comunicação de incidentes
UPDATE gap_analysis_requirements SET peso = 2 WHERE codigo = 'RS.MA-04'; -- Coordenação de resposta
UPDATE gap_analysis_requirements SET peso = 3 WHERE codigo = 'RS.AN-01'; -- Análise de incidentes
UPDATE gap_analysis_requirements SET peso = 2 WHERE codigo = 'RS.AN-02'; -- Documentação de incidentes
UPDATE gap_analysis_requirements SET peso = 2 WHERE codigo = 'RS.AN-03'; -- Forensics
UPDATE gap_analysis_requirements SET peso = 3 WHERE codigo = 'RS.MI-01'; -- Contenção de incidentes
UPDATE gap_analysis_requirements SET peso = 2 WHERE codigo = 'RS.MI-02'; -- Erradicação de ameaças
UPDATE gap_analysis_requirements SET peso = 2 WHERE codigo = 'RS.MI-03'; -- Lições aprendidas

-- RECOVER (Recuperar)
UPDATE gap_analysis_requirements SET peso = 3 WHERE codigo = 'RC.RP-01'; -- Plano de recuperação
UPDATE gap_analysis_requirements SET peso = 2 WHERE codigo = 'RC.RP-02'; -- Teste de recuperação
UPDATE gap_analysis_requirements SET peso = 3 WHERE codigo = 'RC.RP-03'; -- Continuidade de negócios
UPDATE gap_analysis_requirements SET peso = 2 WHERE codigo = 'RC.RP-04'; -- Restauração de serviços
UPDATE gap_analysis_requirements SET peso = 2 WHERE codigo = 'RC.CO-01'; -- Comunicação de recuperação
UPDATE gap_analysis_requirements SET peso = 1 WHERE codigo = 'RC.CO-02'; -- Relatórios de recuperação
UPDATE gap_analysis_requirements SET peso = 2 WHERE codigo = 'RC.IM-01'; -- Melhorias pós-incidente
UPDATE gap_analysis_requirements SET peso = 1 WHERE codigo = 'RC.IM-02'; -- Documentação de melhorias;