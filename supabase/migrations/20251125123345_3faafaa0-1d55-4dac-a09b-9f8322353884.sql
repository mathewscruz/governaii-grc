-- Insert NIST CSF 2.0 Requirements for all existing NIST frameworks
-- Framework IDs found: b79ce2d7-0674-4575-9540-8fe1518891ec, cc7dab95-fec0-49b2-a13d-59fa6dc1bd8c, d336a9e4-06b2-46fd-bbf7-6599e7e18f20, 7c1ec9ac-05eb-4029-af0a-1f4c5451cfcc, 42b5433d-bff6-4dc8-9019-88688cf17928

-- We'll insert for all of them to ensure consistency

DO $$
DECLARE
  framework_record RECORD;
BEGIN
  FOR framework_record IN 
    SELECT id FROM gap_analysis_frameworks WHERE nome ILIKE '%NIST%'
  LOOP
    -- GOVERN (GV) - Organizational Context
    INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, area_responsavel, peso, obrigatorio, ordem) VALUES
    (framework_record.id, 'GV.OC-01', 'Contexto Organizacional', 'A organização entende e documenta seu contexto de negócios, missão, objetivos e partes interessadas.', 'GOVERN', 'Governança', 3, true, 1),
    (framework_record.id, 'GV.OC-02', 'Objetivos de Segurança Cibernética', 'Os objetivos de segurança cibernética são estabelecidos, comunicados e alinhados com os objetivos organizacionais.', 'GOVERN', 'Governança', 3, true, 2),
    (framework_record.id, 'GV.OC-03', 'Requisitos Legais e Regulatórios', 'Os requisitos legais, regulatórios e contratuais relacionados à segurança cibernética são identificados e gerenciados.', 'GOVERN', 'Compliance', 3, true, 3),
    (framework_record.id, 'GV.OC-04', 'Funções e Responsabilidades Críticas', 'As funções críticas de negócio e suas dependências tecnológicas são identificadas.', 'GOVERN', 'Operações', 2, true, 4),
    (framework_record.id, 'GV.OC-05', 'Cadeia de Suprimentos', 'Os requisitos de segurança cibernética da cadeia de suprimentos são estabelecidos.', 'GOVERN', 'Supply Chain', 2, true, 5),

    -- GOVERN - Risk Management Strategy
    (framework_record.id, 'GV.RM-01', 'Estratégia de Gestão de Riscos', 'Uma estratégia organizacional de gestão de riscos de segurança cibernética é estabelecida e comunicada.', 'GOVERN', 'Riscos', 3, true, 6),
    (framework_record.id, 'GV.RM-02', 'Apetite ao Risco', 'O apetite ao risco é estabelecido, comunicado e monitorado.', 'GOVERN', 'Riscos', 3, true, 7),
    (framework_record.id, 'GV.RM-03', 'Tolerância ao Risco', 'A tolerância ao risco é determinada e comunicada.', 'GOVERN', 'Riscos', 2, true, 8),
    (framework_record.id, 'GV.RM-04', 'Processos de Gestão de Riscos', 'Os processos de gestão de riscos de segurança cibernética são estabelecidos e gerenciados.', 'GOVERN', 'Riscos', 2, true, 9),

    -- GOVERN - Roles, Responsibilities, and Authorities
    (framework_record.id, 'GV.RR-01', 'Responsabilidades de Liderança', 'As responsabilidades de liderança para segurança cibernética são estabelecidas.', 'GOVERN', 'Governança', 3, true, 10),
    (framework_record.id, 'GV.RR-02', 'Funções e Responsabilidades', 'As funções e responsabilidades de segurança cibernética são coordenadas e alinhadas.', 'GOVERN', 'RH', 2, true, 11),
    (framework_record.id, 'GV.RR-03', 'Responsabilidades Externas', 'As responsabilidades de partes externas são definidas e gerenciadas.', 'GOVERN', 'Jurídico', 2, true, 12),

    -- GOVERN - Policy
    (framework_record.id, 'GV.PO-01', 'Política Organizacional', 'Uma política organizacional de segurança cibernética é estabelecida, comunicada e mantida.', 'GOVERN', 'Governança', 3, true, 13),
    (framework_record.id, 'GV.PO-02', 'Políticas e Procedimentos', 'Políticas e procedimentos de segurança cibernética são estabelecidos, mantidos e comunicados.', 'GOVERN', 'Governança', 2, true, 14),

    -- GOVERN - Oversight
    (framework_record.id, 'GV.OV-01', 'Supervisão Executiva', 'A supervisão da estratégia de segurança cibernética é mantida.', 'GOVERN', 'Governança', 3, true, 15),
    (framework_record.id, 'GV.OV-02', 'Conformidade e Auditoria', 'A conformidade com as políticas de segurança cibernética é revisada.', 'GOVERN', 'Auditoria', 2, true, 16),

    -- GOVERN - Supply Chain Risk Management
    (framework_record.id, 'GV.SC-01', 'Gestão de Riscos da Cadeia', 'Um processo de gestão de riscos da cadeia de suprimentos é identificado e estabelecido.', 'GOVERN', 'Supply Chain', 2, true, 17),
    (framework_record.id, 'GV.SC-02', 'Fornecedores Críticos', 'Fornecedores e parceiros críticos são identificados e priorizados.', 'GOVERN', 'Supply Chain', 2, true, 18),

    -- IDENTIFY (ID) - Asset Management
    (framework_record.id, 'ID.AM-01', 'Inventário de Ativos', 'Dispositivos físicos e sistemas dentro da organização são inventariados.', 'IDENTIFY', 'TI', 3, true, 19),
    (framework_record.id, 'ID.AM-02', 'Inventário de Software', 'Plataformas de software e aplicações dentro da organização são inventariadas.', 'IDENTIFY', 'TI', 3, true, 20),
    (framework_record.id, 'ID.AM-03', 'Diagrama de Rede', 'Os fluxos de comunicação e dados organizacionais são mapeados.', 'IDENTIFY', 'Redes', 2, true, 21),
    (framework_record.id, 'ID.AM-04', 'Ativos Externos', 'Recursos externos (sistemas, dispositivos, dados) são catalogados.', 'IDENTIFY', 'TI', 2, true, 22),
    (framework_record.id, 'ID.AM-05', 'Priorização de Ativos', 'Os recursos são priorizados com base em sua criticidade.', 'IDENTIFY', 'Gestão', 3, true, 23),
    (framework_record.id, 'ID.AM-08', 'Gestão de Dados', 'Os dados são gerenciados de forma consistente com a estratégia de risco.', 'IDENTIFY', 'Dados', 2, true, 24),

    -- IDENTIFY - Risk Assessment
    (framework_record.id, 'ID.RA-01', 'Identificação de Vulnerabilidades', 'As vulnerabilidades de ativos são identificadas e documentadas.', 'IDENTIFY', 'Segurança', 3, true, 25),
    (framework_record.id, 'ID.RA-02', 'Inteligência de Ameaças', 'Informações de inteligência de ameaças cibernéticas são recebidas de fóruns e fontes de informação.', 'IDENTIFY', 'Segurança', 2, true, 26),
    (framework_record.id, 'ID.RA-03', 'Identificação de Ameaças', 'As ameaças internas e externas são identificadas e documentadas.', 'IDENTIFY', 'Segurança', 3, true, 27),
    (framework_record.id, 'ID.RA-04', 'Impactos Potenciais', 'Impactos potenciais de negócios e de missão são identificados.', 'IDENTIFY', 'Riscos', 2, true, 28),
    (framework_record.id, 'ID.RA-05', 'Ameaças e Vulnerabilidades', 'Ameaças, vulnerabilidades, probabilidades e impactos são usados para determinar o risco.', 'IDENTIFY', 'Riscos', 3, true, 29),
    (framework_record.id, 'ID.RA-06', 'Respostas ao Risco', 'As respostas ao risco são identificadas e priorizadas.', 'IDENTIFY', 'Riscos', 2, true, 30),

    -- IDENTIFY - Improvement
    (framework_record.id, 'ID.IM-01', 'Melhoria de Processos', 'Os processos de segurança cibernética são melhorados.', 'IDENTIFY', 'Melhoria Contínua', 2, true, 31),
    (framework_record.id, 'ID.IM-02', 'Lições Aprendidas', 'As lições aprendidas são incorporadas nos processos.', 'IDENTIFY', 'Melhoria Contínua', 2, true, 32),

    -- PROTECT (PR) - Identity Management and Access Control
    (framework_record.id, 'PR.AA-01', 'Gestão de Identidades', 'Identidades e credenciais são gerenciadas para dispositivos e usuários autorizados.', 'PROTECT', 'Identidade', 3, true, 33),
    (framework_record.id, 'PR.AA-02', 'Controle de Acesso Físico', 'O acesso físico aos ativos é gerenciado e protegido.', 'PROTECT', 'Segurança Física', 2, true, 34),
    (framework_record.id, 'PR.AA-03', 'Acesso Remoto', 'O acesso remoto é gerenciado.', 'PROTECT', 'Redes', 3, true, 35),
    (framework_record.id, 'PR.AA-04', 'Privilégios de Acesso', 'Os privilégios de acesso e autorizações são gerenciados.', 'PROTECT', 'Identidade', 3, true, 36),
    (framework_record.id, 'PR.AA-05', 'Integridade de Rede', 'A integridade da rede é protegida através de segmentação.', 'PROTECT', 'Redes', 2, true, 37),
    (framework_record.id, 'PR.AA-06', 'Autenticação Física', 'A autenticação física e de acesso lógico são gerenciadas.', 'PROTECT', 'Identidade', 2, true, 38),

    -- PROTECT - Awareness and Training
    (framework_record.id, 'PR.AT-01', 'Treinamento de Usuários', 'Todos os usuários são informados e treinados.', 'PROTECT', 'RH', 3, true, 39),
    (framework_record.id, 'PR.AT-02', 'Treinamento Privilegiado', 'Usuários privilegiados compreendem suas funções e responsabilidades.', 'PROTECT', 'RH', 3, true, 40),
    (framework_record.id, 'PR.AT-03', 'Terceiros', 'Terceiros (stakeholders, fornecedores, parceiros) compreendem suas funções.', 'PROTECT', 'Supply Chain', 2, true, 41),
    (framework_record.id, 'PR.AT-04', 'Executivos', 'Executivos seniores compreendem suas funções e responsabilidades.', 'PROTECT', 'Governança', 2, true, 42),

    -- PROTECT - Data Security
    (framework_record.id, 'PR.DS-01', 'Proteção em Repouso', 'Dados em repouso são protegidos.', 'PROTECT', 'Dados', 3, true, 43),
    (framework_record.id, 'PR.DS-02', 'Proteção em Trânsito', 'Dados em trânsito são protegidos.', 'PROTECT', 'Dados', 3, true, 44),
    (framework_record.id, 'PR.DS-05', 'Proteção contra Vazamento', 'Proteções contra vazamento de dados são implementadas.', 'PROTECT', 'Dados', 2, true, 45),
    (framework_record.id, 'PR.DS-08', 'Mecanismos de Integridade', 'Mecanismos de verificação de integridade são usados para validar software, firmware e informações.', 'PROTECT', 'Segurança', 2, true, 46),

    -- PROTECT - Platform Security
    (framework_record.id, 'PR.PS-01', 'Configurações Seguras', 'As linhas de base de configuração são mantidas e aplicadas.', 'PROTECT', 'TI', 3, true, 47),
    (framework_record.id, 'PR.PS-02', 'Gestão de Patches', 'Atualizações de software são instaladas ou a instalação é documentada.', 'PROTECT', 'TI', 3, true, 48),
    (framework_record.id, 'PR.PS-03', 'Gestão de Logs', 'Registros de auditoria/log de hardware e software são configurados.', 'PROTECT', 'Segurança', 2, true, 49),
    (framework_record.id, 'PR.PS-04', 'Segregação de Ambientes', 'Os ambientes de desenvolvimento, teste e produção são segregados.', 'PROTECT', 'TI', 2, true, 50),
    (framework_record.id, 'PR.PS-06', 'Ambiente Seguro', 'Os ambientes de desenvolvimento são monitorados para atividades não autorizadas.', 'PROTECT', 'Desenvolvimento', 2, false, 51),

    -- PROTECT - Technology Infrastructure Resilience
    (framework_record.id, 'PR.IR-01', 'Redes Protegidas', 'As redes e ambientes são protegidos contra ataques.', 'PROTECT', 'Redes', 3, true, 52),
    (framework_record.id, 'PR.IR-02', 'Redundância', 'A capacidade de recuperação é incorporada na arquitetura de rede.', 'PROTECT', 'TI', 2, true, 53),
    (framework_record.id, 'PR.IR-03', 'Manutenção de Sistemas', 'Sistemas e ativos são submetidos à manutenção regular.', 'PROTECT', 'TI', 2, true, 54),
    (framework_record.id, 'PR.IR-04', 'Testes de Capacidade', 'A capacidade de lidar com cargas de eventos é testada.', 'PROTECT', 'Operações', 2, false, 55),

    -- DETECT (DE) - Continuous Monitoring
    (framework_record.id, 'DE.CM-01', 'Monitoramento de Rede', 'As redes são monitoradas para detectar eventos de segurança cibernética potenciais.', 'DETECT', 'Segurança', 3, true, 56),
    (framework_record.id, 'DE.CM-02', 'Monitoramento Físico', 'O ambiente físico é monitorado para detectar eventos de segurança potenciais.', 'DETECT', 'Segurança Física', 2, true, 57),
    (framework_record.id, 'DE.CM-03', 'Atividades de Pessoal', 'As atividades de pessoal são monitoradas para detectar eventos de segurança potenciais.', 'DETECT', 'RH', 2, true, 58),
    (framework_record.id, 'DE.CM-06', 'Monitoramento de Atividades Externas', 'A atividade externa de provedores de serviços é monitorada.', 'DETECT', 'Supply Chain', 2, true, 59),
    (framework_record.id, 'DE.CM-09', 'Detecção de Software Malicioso', 'Software malicioso é detectado.', 'DETECT', 'Segurança', 3, true, 60),

    -- DETECT - Adverse Event Analysis
    (framework_record.id, 'DE.AE-01', 'Linha de Base', 'Uma linha de base de operações de rede e fluxos de dados esperados é estabelecida.', 'DETECT', 'Redes', 2, true, 61),
    (framework_record.id, 'DE.AE-02', 'Análise de Eventos', 'Eventos detectados são analisados para compreender os alvos e métodos de ataque.', 'DETECT', 'Segurança', 3, true, 62),
    (framework_record.id, 'DE.AE-03', 'Correlação de Dados', 'Os dados de eventos são correlacionados de múltiplas fontes e sensores.', 'DETECT', 'Segurança', 2, true, 63),
    (framework_record.id, 'DE.AE-04', 'Impacto de Eventos', 'O impacto dos eventos é determinado.', 'DETECT', 'Segurança', 3, true, 64),
    (framework_record.id, 'DE.AE-06', 'Informações de Inteligência', 'As informações de inteligência de ameaças são correlacionadas com as detecções.', 'DETECT', 'Segurança', 2, false, 65),

    -- RESPOND (RS) - Incident Management
    (framework_record.id, 'RS.MA-01', 'Plano de Resposta', 'O plano de resposta a incidentes é executado durante ou após um evento.', 'RESPOND', 'Incidentes', 3, true, 66),
    (framework_record.id, 'RS.MA-02', 'Notificação de Incidentes', 'Os incidentes são relatados de acordo com critérios estabelecidos.', 'RESPOND', 'Incidentes', 3, true, 67),
    (framework_record.id, 'RS.MA-03', 'Funções e Responsabilidades', 'As funções e responsabilidades de resposta a incidentes são estabelecidas.', 'RESPOND', 'Incidentes', 2, true, 68),
    (framework_record.id, 'RS.MA-04', 'Coordenação', 'As informações são coordenadas com partes interessadas externas.', 'RESPOND', 'Comunicação', 2, true, 69),
    (framework_record.id, 'RS.MA-05', 'Escalação Voluntária', 'A escalação voluntária de compartilhamento de informações é realizada.', 'RESPOND', 'Comunicação', 1, false, 70),

    -- RESPOND - Incident Analysis
    (framework_record.id, 'RS.AN-01', 'Notificações Investigadas', 'As notificações de sistemas de detecção são investigadas.', 'RESPOND', 'Incidentes', 3, true, 71),
    (framework_record.id, 'RS.AN-02', 'Impacto Analisado', 'O impacto do incidente é compreendido.', 'RESPOND', 'Incidentes', 3, true, 72),
    (framework_record.id, 'RS.AN-03', 'Análise Forense', 'A análise forense é realizada.', 'RESPOND', 'Incidentes', 2, true, 73),
    (framework_record.id, 'RS.AN-04', 'Classificação de Incidentes', 'Os incidentes são categorizados de forma consistente.', 'RESPOND', 'Incidentes', 2, true, 74),

    -- RESPOND - Incident Response Reporting and Communication
    (framework_record.id, 'RS.CO-01', 'Coordenação de Pessoal', 'O pessoal sabe suas funções durante um incidente.', 'RESPOND', 'RH', 2, true, 75),
    (framework_record.id, 'RS.CO-02', 'Relatórios de Incidentes', 'Os eventos são relatados de acordo com critérios estabelecidos.', 'RESPOND', 'Incidentes', 3, true, 76),
    (framework_record.id, 'RS.CO-03', 'Compartilhamento de Informações', 'As informações são compartilhadas com partes interessadas.', 'RESPOND', 'Comunicação', 2, true, 77),

    -- RESPOND - Incident Mitigation
    (framework_record.id, 'RS.MI-01', 'Contenção de Incidentes', 'Os incidentes são contidos.', 'RESPOND', 'Incidentes', 3, true, 78),
    (framework_record.id, 'RS.MI-02', 'Mitigação de Incidentes', 'Os incidentes são mitigados.', 'RESPOND', 'Incidentes', 3, true, 79),
    (framework_record.id, 'RS.MI-03', 'Vulnerabilidades Recém-Identificadas', 'Vulnerabilidades recém-identificadas são mitigadas ou documentadas como riscos aceitos.', 'RESPOND', 'Segurança', 2, true, 80),

    -- RECOVER (RC) - Incident Recovery Plan Execution
    (framework_record.id, 'RC.RP-01', 'Execução do Plano', 'O plano de recuperação é executado durante ou após um evento.', 'RECOVER', 'Continuidade', 3, true, 81),
    (framework_record.id, 'RC.RP-02', 'Teste do Plano', 'Os planos de recuperação são testados.', 'RECOVER', 'Continuidade', 2, true, 82),
    (framework_record.id, 'RC.RP-03', 'Gestão de Crises', 'As comunicações de gestão de crises são executadas.', 'RECOVER', 'Comunicação', 2, true, 83),
    (framework_record.id, 'RC.RP-04', 'Coordenação Externa', 'A coordenação com partes interessadas externas é realizada.', 'RECOVER', 'Comunicação', 2, true, 84),

    -- RECOVER - Incident Recovery Communication
    (framework_record.id, 'RC.CO-01', 'Relações Públicas', 'As relações públicas são gerenciadas.', 'RECOVER', 'Comunicação', 2, true, 85),
    (framework_record.id, 'RC.CO-02', 'Comunicação com Partes Internas', 'As atividades de recuperação são comunicadas às partes interessadas internas.', 'RECOVER', 'Comunicação', 2, true, 86),
    (framework_record.id, 'RC.CO-03', 'Comunicação com Executivos', 'As atividades de recuperação são comunicadas à liderança executiva.', 'RECOVER', 'Governança', 3, true, 87);

  END LOOP;
END $$;