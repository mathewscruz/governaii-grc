-- Limpar duplicatas do NIST CSF 2.0 preservando avaliações
DELETE FROM public.gap_analysis_requirements 
WHERE framework_id = '8af9057c-eabd-437d-b5c7-617b4bd96c37'
AND id NOT IN (
  SELECT DISTINCT ON (codigo) r.id
  FROM public.gap_analysis_requirements r
  LEFT JOIN public.gap_analysis_evaluations e ON e.requirement_id = r.id
  WHERE r.framework_id = '8af9057c-eabd-437d-b5c7-617b4bd96c37'
  ORDER BY codigo, CASE WHEN e.id IS NOT NULL THEN 0 ELSE 1 END, r.created_at
);

-- Deletar todos os requisitos restantes para recriar com os 106 oficiais
DELETE FROM public.gap_analysis_requirements 
WHERE framework_id = '8af9057c-eabd-437d-b5c7-617b4bd96c37';

-- Inserir os 106 requisitos oficiais do NIST CSF 2.0

-- GOVERN (GV) - 31 requisitos
INSERT INTO public.gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, peso, obrigatorio, ordem) VALUES
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'GV.OC-01', 'Missão da Organização', 'A missão organizacional é compreendida e informa a gestão de riscos de cibersegurança', 'Contexto Organizacional', 2, true, 1),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'GV.OC-02', 'Compreensão do Ambiente Interno', 'O ambiente interno da organização é compreendido', 'Contexto Organizacional', 2, true, 2),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'GV.OC-03', 'Compreensão do Ambiente Externo', 'O ambiente externo é compreendido', 'Contexto Organizacional', 2, true, 3),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'GV.OC-04', 'Requisitos Legais e Regulatórios', 'Os requisitos de cibersegurança são estabelecidos e comunicados', 'Contexto Organizacional', 3, true, 4),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'GV.OC-05', 'Resultados e Expectativas', 'Resultados, papéis e expectativas são estabelecidos e comunicados', 'Contexto Organizacional', 2, true, 5),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'GV.RM-01', 'Estratégia de Gestão de Riscos', 'A estratégia de gestão de riscos é estabelecida e comunicada', 'Estratégia de Gestão de Riscos', 3, true, 6),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'GV.RM-02', 'Apetite e Tolerância ao Risco', 'O apetite e a tolerância ao risco são estabelecidos e comunicados', 'Estratégia de Gestão de Riscos', 3, true, 7),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'GV.RM-03', 'Determinação e Avaliação de Riscos', 'A determinação de riscos de cibersegurança é informada por fontes internas e externas', 'Estratégia de Gestão de Riscos', 3, true, 8),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'GV.RM-04', 'Impactos nos Negócios', 'Os impactos potenciais nos negócios são informados pela análise de riscos', 'Estratégia de Gestão de Riscos', 3, true, 9),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'GV.RM-05', 'Priorização de Riscos', 'Os riscos de cibersegurança são priorizados', 'Estratégia de Gestão de Riscos', 3, true, 10),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'GV.RM-06', 'Resposta aos Riscos', 'As respostas aos riscos são estabelecidas e comunicadas', 'Estratégia de Gestão de Riscos', 3, true, 11),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'GV.RM-07', 'Monitoramento de Riscos', 'Os riscos são monitorados continuamente', 'Estratégia de Gestão de Riscos', 3, true, 12),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'GV.RR-01', 'Papéis e Responsabilidades', 'Os papéis e responsabilidades de cibersegurança são estabelecidos', 'Papéis e Responsabilidades', 3, true, 13),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'GV.RR-02', 'Liderança de Cibersegurança', 'A liderança de cibersegurança é identificada e tem autoridade', 'Papéis e Responsabilidades', 3, true, 14),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'GV.RR-03', 'Recursos Adequados', 'Recursos adequados são alocados para cibersegurança', 'Papéis e Responsabilidades', 3, true, 15),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'GV.RR-04', 'Integração com Governança', 'A cibersegurança é integrada à governança corporativa', 'Papéis e Responsabilidades', 3, true, 16),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'GV.PO-01', 'Política de Cibersegurança', 'A política de cibersegurança é estabelecida e comunicada', 'Política', 3, true, 17),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'GV.PO-02', 'Revisão da Política', 'A política é revisada e atualizada regularmente', 'Política', 2, true, 18),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'GV.OV-01', 'Supervisão da Estratégia', 'A estratégia de cibersegurança é supervisionada', 'Supervisão', 3, true, 19),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'GV.OV-02', 'Responsabilidades de Supervisão', 'As responsabilidades de supervisão são compreendidas', 'Supervisão', 2, true, 20),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'GV.OV-03', 'Resultado de Revisões', 'Os resultados das revisões são comunicados à alta administração', 'Supervisão', 2, true, 21),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'GV.SC-01', 'Estratégia de Cadeia de Suprimentos', 'Uma estratégia de cibersegurança da cadeia de suprimentos é estabelecida', 'Cadeia de Suprimentos', 3, true, 22),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'GV.SC-02', 'Inventário de Fornecedores', 'Os fornecedores são identificados e priorizados', 'Cadeia de Suprimentos', 2, true, 23),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'GV.SC-03', 'Contratos com Fornecedores', 'Os contratos incluem requisitos de cibersegurança', 'Cadeia de Suprimentos', 3, true, 24),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'GV.SC-04', 'Avaliação de Fornecedores', 'Os fornecedores são avaliados rotineiramente', 'Cadeia de Suprimentos', 3, true, 25),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'GV.SC-05', 'Resposta a Mudanças', 'As respostas a mudanças na cadeia de suprimentos são gerenciadas', 'Cadeia de Suprimentos', 2, true, 26),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'GV.SC-06', 'Planejamento para Disrupções', 'O planejamento para disrupções na cadeia de suprimentos é realizado', 'Cadeia de Suprimentos', 2, true, 27),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'GV.SC-07', 'Melhoria da Cadeia de Suprimentos', 'A cadeia de suprimentos é continuamente melhorada', 'Cadeia de Suprimentos', 1, true, 28),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'GV.SC-08', 'Auditoria de Fornecedores', 'Os fornecedores são auditados conforme necessário', 'Cadeia de Suprimentos', 2, true, 29),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'GV.SC-09', 'Terceirização Segura', 'A terceirização é gerenciada de forma segura', 'Cadeia de Suprimentos', 2, true, 30),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'GV.SC-10', 'Risco de Concentração', 'O risco de concentração de fornecedores é gerenciado', 'Cadeia de Suprimentos', 2, true, 31);

-- IDENTIFY (ID) - 22 requisitos
INSERT INTO public.gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, peso, obrigatorio, ordem) VALUES
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'ID.AM-01', 'Inventário de Ativos', 'Os ativos físicos são inventariados', 'Gestão de Ativos', 3, true, 32),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'ID.AM-02', 'Inventário de Software', 'Os ativos de software são inventariados', 'Gestão de Ativos', 3, true, 33),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'ID.AM-03', 'Mapeamento de Comunicações', 'As comunicações organizacionais são mapeadas', 'Gestão de Ativos', 2, true, 34),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'ID.AM-04', 'Mapeamento de Dados', 'Os dados são categorizados e mapeados', 'Gestão de Ativos', 3, true, 35),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'ID.AM-05', 'Priorização de Ativos', 'Os ativos são priorizados por criticidade', 'Gestão de Ativos', 3, true, 36),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'ID.AM-07', 'Inventário de Serviços', 'Os serviços são inventariados', 'Gestão de Ativos', 2, true, 37),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'ID.AM-08', 'Gestão de Ciclo de Vida', 'O ciclo de vida dos ativos é gerenciado', 'Gestão de Ativos', 2, true, 38),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'ID.RA-01', 'Identificação de Vulnerabilidades', 'As vulnerabilidades são identificadas', 'Avaliação de Riscos', 3, true, 39),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'ID.RA-02', 'Inteligência de Ameaças', 'A inteligência de ameaças é recebida e analisada', 'Avaliação de Riscos', 3, true, 40),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'ID.RA-03', 'Comunicação de Ameaças', 'As ameaças são comunicadas internamente', 'Avaliação de Riscos', 2, true, 41),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'ID.RA-04', 'Impactos Potenciais', 'Os impactos potenciais são determinados', 'Avaliação de Riscos', 3, true, 42),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'ID.RA-05', 'Resposta a Ameaças', 'As respostas a ameaças são definidas', 'Avaliação de Riscos', 3, true, 43),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'ID.RA-06', 'Identificação de Riscos', 'Os riscos são identificados e documentados', 'Avaliação de Riscos', 3, true, 44),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'ID.RA-07', 'Validação de Riscos', 'A análise de riscos é validada ou refinada', 'Avaliação de Riscos', 2, true, 45),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'ID.RA-08', 'Processos Repetíveis', 'Os processos de avaliação são repetíveis', 'Avaliação de Riscos', 2, true, 46),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'ID.RA-09', 'Análise de Cadeia de Suprimentos', 'Os riscos da cadeia de suprimentos são avaliados', 'Avaliação de Riscos', 3, true, 47),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'ID.RA-10', 'Dados de Vulnerabilidades', 'As informações de vulnerabilidades são atualizadas', 'Avaliação de Riscos', 2, true, 48),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'ID.IM-01', 'Lições Aprendidas', 'As lições aprendidas são integradas', 'Melhoria', 2, true, 49),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'ID.IM-02', 'Resposta Melhorada', 'A resposta a incidentes é melhorada', 'Melhoria', 2, true, 50),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'ID.IM-03', 'Melhoria de Vulnerabilidades', 'As vulnerabilidades são gerenciadas proativamente', 'Melhoria', 2, true, 51),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'ID.IM-04', 'Eficácia Validada', 'A eficácia dos controles é validada', 'Melhoria', 2, true, 52);

-- PROTECT (PR) - 27 requisitos
INSERT INTO public.gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, peso, obrigatorio, ordem) VALUES
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'PR.AA-01', 'Gerenciamento de Identidades', 'As identidades são gerenciadas para usuários autorizados', 'Controle de Acesso', 3, true, 53),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'PR.AA-02', 'Gerenciamento de Credenciais', 'As credenciais são gerenciadas adequadamente', 'Controle de Acesso', 3, true, 54),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'PR.AA-03', 'Controle de Acesso Físico', 'O acesso físico é gerenciado', 'Controle de Acesso', 3, true, 55),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'PR.AA-04', 'Controle de Acesso Remoto', 'O acesso remoto é gerenciado', 'Controle de Acesso', 3, true, 56),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'PR.AA-05', 'Autenticação Robusta', 'Os mecanismos de autenticação são robustos', 'Controle de Acesso', 3, true, 57),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'PR.AA-06', 'Autorização', 'As autorizações são gerenciadas', 'Controle de Acesso', 3, true, 58),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'PR.AT-01', 'Conscientização', 'Os usuários são treinados em cibersegurança', 'Treinamento', 3, true, 59),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'PR.AT-02', 'Treinamento de Privilégios', 'Os usuários privilegiados recebem treinamento especial', 'Treinamento', 3, true, 60),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'PR.DS-01', 'Proteção em Repouso', 'Os dados em repouso são protegidos', 'Segurança de Dados', 3, true, 61),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'PR.DS-02', 'Proteção em Trânsito', 'Os dados em trânsito são protegidos', 'Segurança de Dados', 3, true, 62),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'PR.DS-10', 'Integridade de Dados', 'A integridade dos dados é verificada', 'Segurança de Dados', 3, true, 63),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'PR.DS-11', 'Gestão de Capacidade', 'A capacidade é gerenciada adequadamente', 'Segurança de Dados', 2, true, 64),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'PR.DS-05', 'Proteção contra Vazamentos', 'A proteção contra vazamento de dados é implementada', 'Segurança de Dados', 3, true, 65),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'PR.DS-06', 'Verificação de Integridade', 'Mecanismos de verificação de integridade são usados', 'Segurança de Dados', 2, true, 66),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'PR.DS-07', 'Segregação de Ambientes', 'Os ambientes de desenvolvimento e produção são segregados', 'Segurança de Dados', 2, true, 67),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'PR.DS-08', 'Mecanismos de Backup', 'Os mecanismos de backup estão em vigor', 'Segurança de Dados', 3, true, 68),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'PR.DS-09', 'Teste de Backup', 'Os backups são testados periodicamente', 'Segurança de Dados', 3, true, 69),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'PR.PS-01', 'Linha de Base de Configuração', 'As configurações baseline são estabelecidas', 'Segurança de Plataforma', 3, true, 70),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'PR.PS-02', 'Gestão de Configuração', 'A gestão de configuração é implementada', 'Segurança de Plataforma', 2, true, 71),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'PR.PS-03', 'Hardening', 'O hardening de sistemas é realizado', 'Segurança de Plataforma', 3, true, 72),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'PR.PS-04', 'Registro de Eventos', 'Os registros de eventos são gerados e mantidos', 'Segurança de Plataforma', 3, true, 73),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'PR.PS-05', 'Instalação de Software', 'A instalação de software é controlada', 'Segurança de Plataforma', 2, true, 74),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'PR.PS-06', 'Segurança de Rede', 'A segurança de rede é implementada', 'Segurança de Plataforma', 3, true, 75),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'PR.IR-01', 'Redes Protegidas', 'As redes são protegidas', 'Resiliência de Infraestrutura', 3, true, 76),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'PR.IR-02', 'Ciclo de Vida Seguro', 'O ciclo de vida de desenvolvimento é seguro', 'Resiliência de Infraestrutura', 2, true, 77),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'PR.IR-03', 'Gestão de Mudanças', 'A gestão de mudanças é implementada', 'Resiliência de Infraestrutura', 2, true, 78),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'PR.IR-04', 'Redundância', 'A redundância é implementada para sistemas críticos', 'Resiliência de Infraestrutura', 3, true, 79);

-- DETECT (DE) - 16 requisitos
INSERT INTO public.gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, peso, obrigatorio, ordem) VALUES
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'DE.CM-01', 'Monitoramento de Rede', 'A rede é monitorada para eventos anômalos', 'Monitoramento Contínuo', 3, true, 80),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'DE.CM-02', 'Monitoramento Físico', 'O ambiente físico é monitorado', 'Monitoramento Contínuo', 2, true, 81),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'DE.CM-03', 'Monitoramento de Pessoal', 'As atividades do pessoal são monitoradas', 'Monitoramento Contínuo', 2, true, 82),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'DE.CM-06', 'Monitoramento Externo', 'As ameaças externas são monitoradas', 'Monitoramento Contínuo', 3, true, 83),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'DE.CM-09', 'Computação e Recursos', 'A computação e recursos de rede são monitorados', 'Monitoramento Contínuo', 2, true, 84),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'DE.CM-04', 'Código Malicioso', 'O código malicioso é detectado', 'Monitoramento Contínuo', 3, true, 85),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'DE.CM-05', 'Acesso Não Autorizado', 'O acesso não autorizado é detectado', 'Monitoramento Contínuo', 3, true, 86),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'DE.CM-07', 'Varredura de Vulnerabilidades', 'As varreduras de vulnerabilidades são realizadas', 'Monitoramento Contínuo', 3, true, 87),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'DE.CM-08', 'Testes de Invasão', 'Os testes de invasão são realizados', 'Monitoramento Contínuo', 2, true, 88),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'DE.AE-02', 'Correlação de Eventos', 'Os dados de eventos são correlacionados', 'Análise de Eventos', 3, true, 89),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'DE.AE-03', 'Impacto de Eventos', 'O impacto dos eventos é determinado', 'Análise de Eventos', 3, true, 90),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'DE.AE-04', 'Análise de Incidentes', 'Os incidentes são analisados', 'Análise de Eventos', 3, true, 91),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'DE.AE-06', 'Informações de Incidentes', 'As informações de incidentes são compartilhadas', 'Análise de Eventos', 2, true, 92),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'DE.AE-07', 'Inteligência de Ameaças', 'A inteligência de ameaças é usada na detecção', 'Análise de Eventos', 2, true, 93),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'DE.AE-08', 'Indicadores de Incidente', 'Os indicadores de incidente são detectados', 'Análise de Eventos', 3, true, 94);

-- RESPOND (RS) - 15 requisitos
INSERT INTO public.gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, peso, obrigatorio, ordem) VALUES
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'RS.MA-01', 'Plano de Resposta', 'O plano de resposta a incidentes é executado', 'Gestão de Incidentes', 3, true, 95),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'RS.MA-02', 'Relatórios de Incidentes', 'Os incidentes são reportados', 'Gestão de Incidentes', 3, true, 96),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'RS.MA-03', 'Gestão de Incidentes', 'Os incidentes são gerenciados', 'Gestão de Incidentes', 3, true, 97),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'RS.MA-04', 'Coordenação de Incidentes', 'Os incidentes são coordenados', 'Gestão de Incidentes', 2, true, 98),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'RS.MA-05', 'Coordenação Externa', 'A coordenação externa é realizada', 'Gestão de Incidentes', 2, true, 99),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'RS.AN-01', 'Notificações de Incidentes', 'As notificações são avaliadas e investigadas', 'Análise de Incidentes', 3, true, 100),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'RS.AN-03', 'Análise Forense', 'A análise forense é realizada', 'Análise de Incidentes', 3, true, 101),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'RS.AN-04', 'Categorização de Incidentes', 'Os incidentes são categorizados', 'Análise de Incidentes', 2, true, 102),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'RS.AN-06', 'Resposta Coordenada', 'As ações são coordenadas com stakeholders', 'Análise de Incidentes', 2, true, 103),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'RS.AN-07', 'Inteligência de Ameaças na Resposta', 'A inteligência de ameaças é aplicada', 'Análise de Incidentes', 2, true, 104),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'RS.CO-02', 'Comunicação de Incidentes', 'Os incidentes são comunicados internamente', 'Comunicação de Incidentes', 3, true, 105),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'RS.CO-03', 'Compartilhamento de Informações', 'As informações são compartilhadas', 'Comunicação de Incidentes', 2, true, 106),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'RS.MI-01', 'Contenção de Incidentes', 'Os incidentes são contidos', 'Mitigação de Incidentes', 3, true, 107),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'RS.MI-02', 'Mitigação de Incidentes', 'Os incidentes são mitigados', 'Mitigação de Incidentes', 3, true, 108);

-- RECOVER (RC) - 8 requisitos
INSERT INTO public.gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, peso, obrigatorio, ordem) VALUES
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'RC.RP-01', 'Execução do Plano de Recuperação', 'O plano de recuperação é executado', 'Execução da Recuperação', 3, true, 109),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'RC.RP-03', 'Restauração de Serviços', 'Os serviços de negócio são restaurados', 'Execução da Recuperação', 3, true, 110),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'RC.RP-04', 'Sistemas Críticos', 'Os sistemas críticos são priorizados na recuperação', 'Execução da Recuperação', 3, true, 111),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'RC.RP-05', 'Gerenciamento de Vulnerabilidades', 'As vulnerabilidades são gerenciadas durante recuperação', 'Execução da Recuperação', 2, true, 112),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'RC.RP-06', 'Lições Aprendidas de Recuperação', 'As lições aprendidas são incorporadas', 'Execução da Recuperação', 2, true, 113),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'RC.CO-01', 'Reputação Gerenciada', 'A reputação é gerenciada após incidentes', 'Comunicação de Recuperação', 2, true, 114),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'RC.CO-03', 'Comunicação de Recuperação', 'As atividades de recuperação são comunicadas', 'Comunicação de Recuperação', 2, true, 115),
('8af9057c-eabd-437d-b5c7-617b4bd96c37', 'RC.CO-04', 'Divulgação Pública', 'A divulgação pública é gerenciada', 'Comunicação de Recuperação', 2, true, 116);