
-- 1) Inserir os 3 novos frameworks globais (empresa_id NULL = template global)
INSERT INTO public.gap_analysis_frameworks (id, empresa_id, nome, versao, tipo_framework, descricao, is_template)
VALUES
  ('a8c1f2d4-1111-4111-8111-000000000801', NULL, 'NIST SP 800-82', 'Rev. 3', 'seguranca_informacao',
   'Guide to Operational Technology (OT) Security. Diretrizes para segurança de Sistemas de Controle Industrial (ICS), SCADA, DCS e PLCs.', true),
  ('a8c1f2d4-2222-4222-8222-000000000802', NULL, 'DORA', '2022/2554', 'compliance',
   'Digital Operational Resilience Act. Regulamento da União Europeia para resiliência operacional digital de entidades financeiras.', true),
  ('a8c1f2d4-3333-4333-8333-000000000803', NULL, 'ISO/IEC 62443', '2018', 'seguranca_informacao',
   'Segurança de Sistemas de Automação e Controle Industrial (IACS). Padrão internacional para cibersegurança em ambientes OT/ICS.', true);

-- 2) Requisitos NIST SP 800-82 (OT Security)
INSERT INTO public.gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, ordem, peso, obrigatorio)
VALUES
  ('a8c1f2d4-1111-4111-8111-000000000801', 'OT.GV-1', 'Governança de Segurança OT', 'Estabelecer programa formal de segurança para tecnologia operacional alinhado aos objetivos de negócio.', 'Governança OT', 1, 3, true),
  ('a8c1f2d4-1111-4111-8111-000000000801', 'OT.GV-2', 'Análise de Risco OT', 'Realizar avaliações de risco específicas para ambientes ICS/SCADA considerando impacto em segurança física e operacional.', 'Governança OT', 2, 3, true),
  ('a8c1f2d4-1111-4111-8111-000000000801', 'OT.AR-1', 'Arquitetura de Rede Segmentada', 'Implementar segmentação de rede entre TI e OT utilizando zonas e condutos (modelo Purdue).', 'Arquitetura', 3, 3, true),
  ('a8c1f2d4-1111-4111-8111-000000000801', 'OT.AR-2', 'DMZ Industrial', 'Implementar zona desmilitarizada (IDMZ) entre redes corporativas e de controle.', 'Arquitetura', 4, 2, true),
  ('a8c1f2d4-1111-4111-8111-000000000801', 'OT.IM-1', 'Inventário de Ativos OT', 'Manter inventário atualizado de todos os ativos OT, incluindo PLCs, RTUs, HMIs e sensores.', 'Identificação', 5, 3, true),
  ('a8c1f2d4-1111-4111-8111-000000000801', 'OT.AC-1', 'Controle de Acesso Físico OT', 'Restringir acesso físico aos equipamentos de controle industrial.', 'Controle de Acesso', 6, 3, true),
  ('a8c1f2d4-1111-4111-8111-000000000801', 'OT.AC-2', 'Acesso Remoto Seguro', 'Implementar controles para acesso remoto a sistemas OT (jump server, MFA, gravação de sessão).', 'Controle de Acesso', 7, 3, true),
  ('a8c1f2d4-1111-4111-8111-000000000801', 'OT.MO-1', 'Monitoramento Contínuo OT', 'Implementar monitoramento passivo de tráfego OT com detecção de anomalias.', 'Monitoramento', 8, 2, true),
  ('a8c1f2d4-1111-4111-8111-000000000801', 'OT.IR-1', 'Resposta a Incidentes OT', 'Manter plano específico de resposta a incidentes para ambientes OT considerando segurança física.', 'Resposta a Incidentes', 9, 3, true),
  ('a8c1f2d4-1111-4111-8111-000000000801', 'OT.PT-1', 'Gestão de Patches OT', 'Estabelecer processo de gestão de patches considerando janelas de manutenção e testes de compatibilidade.', 'Manutenção', 10, 2, true),
  ('a8c1f2d4-1111-4111-8111-000000000801', 'OT.BC-1', 'Continuidade Operacional', 'Manter planos de continuidade e recuperação específicos para processos industriais críticos.', 'Continuidade', 11, 3, true),
  ('a8c1f2d4-1111-4111-8111-000000000801', 'OT.TR-1', 'Treinamento OT', 'Capacitar equipes técnicas em segurança específica de ambientes OT/ICS.', 'Treinamento', 12, 2, true);

-- 3) Requisitos DORA (Resiliência Financeira)
INSERT INTO public.gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, ordem, peso, obrigatorio)
VALUES
  ('a8c1f2d4-2222-4222-8222-000000000802', 'DORA.GV-1', 'Governança e Organização', 'Órgão de administração com responsabilidade final pela gestão de risco de TIC e resiliência operacional.', 'Governança TIC', 1, 3, true),
  ('a8c1f2d4-2222-4222-8222-000000000802', 'DORA.GV-2', 'Estratégia de Resiliência Digital', 'Definir e manter estratégia formal de resiliência operacional digital aprovada pela alta direção.', 'Governança TIC', 2, 3, true),
  ('a8c1f2d4-2222-4222-8222-000000000802', 'DORA.RM-1', 'Framework de Gestão de Risco TIC', 'Implementar framework abrangente de gestão de risco de TIC documentado e revisado anualmente.', 'Gestão de Risco TIC', 3, 3, true),
  ('a8c1f2d4-2222-4222-8222-000000000802', 'DORA.RM-2', 'Identificação e Classificação de Ativos TIC', 'Identificar, classificar e documentar todos os ativos de TIC críticos e suas dependências.', 'Gestão de Risco TIC', 4, 3, true),
  ('a8c1f2d4-2222-4222-8222-000000000802', 'DORA.RM-3', 'Proteção e Prevenção', 'Implementar políticas, procedimentos e ferramentas para proteger sistemas TIC contra ameaças.', 'Gestão de Risco TIC', 5, 3, true),
  ('a8c1f2d4-2222-4222-8222-000000000802', 'DORA.IR-1', 'Detecção de Incidentes TIC', 'Mecanismos para detecção rápida de atividades anômalas e incidentes relacionados a TIC.', 'Incidentes TIC', 6, 3, true),
  ('a8c1f2d4-2222-4222-8222-000000000802', 'DORA.IR-2', 'Classificação e Reporte de Incidentes', 'Processo para classificar incidentes maiores e reportar às autoridades competentes nos prazos regulatórios.', 'Incidentes TIC', 7, 3, true),
  ('a8c1f2d4-2222-4222-8222-000000000802', 'DORA.TT-1', 'Programa de Testes de Resiliência', 'Programa anual de testes de resiliência operacional digital incluindo testes de vulnerabilidade e cenários.', 'Testes de Resiliência', 8, 3, true),
  ('a8c1f2d4-2222-4222-8222-000000000802', 'DORA.TT-2', 'Threat-Led Penetration Testing (TLPT)', 'Para entidades significativas: realizar TLPT a cada 3 anos sob supervisão regulatória.', 'Testes de Resiliência', 9, 2, false),
  ('a8c1f2d4-2222-4222-8222-000000000802', 'DORA.TP-1', 'Gestão de Risco de Terceiros TIC', 'Política de gestão de risco para prestadores terceiros de serviços TIC, incluindo due diligence.', 'Terceiros TIC', 10, 3, true),
  ('a8c1f2d4-2222-4222-8222-000000000802', 'DORA.TP-2', 'Registro de Acordos Contratuais', 'Manter registro de informações de todos os acordos contratuais com terceiros TIC.', 'Terceiros TIC', 11, 3, true),
  ('a8c1f2d4-2222-4222-8222-000000000802', 'DORA.TP-3', 'Cláusulas Contratuais Mínimas', 'Garantir que contratos com terceiros TIC contenham cláusulas mínimas exigidas pelo regulamento.', 'Terceiros TIC', 12, 3, true),
  ('a8c1f2d4-2222-4222-8222-000000000802', 'DORA.IS-1', 'Compartilhamento de Informações', 'Participar em arranjos de compartilhamento de informações sobre ameaças cibernéticas no setor financeiro.', 'Inteligência de Ameaças', 13, 1, false),
  ('a8c1f2d4-2222-4222-8222-000000000802', 'DORA.BC-1', 'Continuidade de Negócios TIC', 'Política de continuidade e planos de recuperação testados regularmente para serviços TIC críticos.', 'Continuidade', 14, 3, true);

-- 4) Requisitos ISO/IEC 62443 (Segurança IACS)
INSERT INTO public.gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, ordem, peso, obrigatorio)
VALUES
  ('a8c1f2d4-3333-4333-8333-000000000803', 'IEC.SP-1', 'Programa de Segurança Cibernética IACS', 'Estabelecer Cybersecurity Management System (CSMS) específico para sistemas de automação industrial (62443-2-1).', 'Programa de Segurança', 1, 3, true),
  ('a8c1f2d4-3333-4333-8333-000000000803', 'IEC.SP-2', 'Análise de Risco IACS', 'Conduzir avaliação de risco baseada em cenários de ameaça para sistemas IACS.', 'Programa de Segurança', 2, 3, true),
  ('a8c1f2d4-3333-4333-8333-000000000803', 'IEC.ZC-1', 'Definição de Zonas e Condutos', 'Identificar e documentar zonas de segurança e condutos conforme modelo de referência (62443-3-2).', 'Arquitetura de Rede', 3, 3, true),
  ('a8c1f2d4-3333-4333-8333-000000000803', 'IEC.ZC-2', 'Security Level Target (SL-T)', 'Definir nível de segurança alvo (SL 1-4) para cada zona com base no risco.', 'Arquitetura de Rede', 4, 3, true),
  ('a8c1f2d4-3333-4333-8333-000000000803', 'IEC.FR-1', 'FR1 - Identification and Authentication Control', 'Identificar e autenticar usuários, processos e dispositivos antes de conceder acesso a IACS.', 'Requisitos Fundamentais', 5, 3, true),
  ('a8c1f2d4-3333-4333-8333-000000000803', 'IEC.FR-2', 'FR2 - Use Control', 'Aplicar controle de uso baseado em privilégios e funções dos usuários autenticados.', 'Requisitos Fundamentais', 6, 3, true),
  ('a8c1f2d4-3333-4333-8333-000000000803', 'IEC.FR-3', 'FR3 - System Integrity', 'Garantir integridade dos sistemas IACS e proteger contra modificações não autorizadas.', 'Requisitos Fundamentais', 7, 3, true),
  ('a8c1f2d4-3333-4333-8333-000000000803', 'IEC.FR-4', 'FR4 - Data Confidentiality', 'Proteger a confidencialidade das informações em trânsito e armazenadas no IACS.', 'Requisitos Fundamentais', 8, 2, true),
  ('a8c1f2d4-3333-4333-8333-000000000803', 'IEC.FR-5', 'FR5 - Restricted Data Flow', 'Restringir fluxo de dados entre zonas conforme arquitetura definida (segmentação).', 'Requisitos Fundamentais', 9, 3, true),
  ('a8c1f2d4-3333-4333-8333-000000000803', 'IEC.FR-6', 'FR6 - Timely Response to Events', 'Resposta tempestiva a eventos de segurança através de monitoramento e correlação.', 'Requisitos Fundamentais', 10, 3, true),
  ('a8c1f2d4-3333-4333-8333-000000000803', 'IEC.FR-7', 'FR7 - Resource Availability', 'Garantir disponibilidade de recursos do IACS contra degradação ou negação de serviço.', 'Requisitos Fundamentais', 11, 3, true),
  ('a8c1f2d4-3333-4333-8333-000000000803', 'IEC.SD-1', 'Secure Development Lifecycle', 'Fornecedores devem seguir ciclo de vida de desenvolvimento seguro (62443-4-1) para produtos IACS.', 'Desenvolvimento Seguro', 12, 2, true),
  ('a8c1f2d4-3333-4333-8333-000000000803', 'IEC.SD-2', 'Requisitos Técnicos de Componentes', 'Componentes IACS devem atender requisitos técnicos de segurança (62443-4-2) conforme SL-C.', 'Desenvolvimento Seguro', 13, 2, true),
  ('a8c1f2d4-3333-4333-8333-000000000803', 'IEC.PM-1', 'Gestão de Patches IACS', 'Processo de gestão de patches considerando criticidade operacional e janelas de manutenção.', 'Manutenção', 14, 2, true),
  ('a8c1f2d4-3333-4333-8333-000000000803', 'IEC.IR-1', 'Resposta a Incidentes IACS', 'Plano de resposta a incidentes específico para ambiente IACS com integração à equipe de operações.', 'Resposta a Incidentes', 15, 3, true);
