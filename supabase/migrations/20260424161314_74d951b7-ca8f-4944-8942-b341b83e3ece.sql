-- Remove requisitos antigos (parciais) para reinserir cobertura completa
DELETE FROM gap_analysis_requirements WHERE framework_id IN (
  'a8c1f2d4-1111-4111-8111-000000000801',
  'a8c1f2d4-2222-4222-8222-000000000802',
  'a8c1f2d4-3333-4333-8333-000000000803'
);

-- ============================================================
-- NIST SP 800-82 Rev 3 - Guide to OT Security (~45 requisitos)
-- ============================================================
INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, peso, ordem) VALUES
-- Governance (GV)
('a8c1f2d4-1111-4111-8111-000000000801', 'GV.OC-01', 'Missão e contexto operacional de OT', 'Compreender a missão organizacional, processos críticos e contexto operacional dos sistemas OT/ICS.', 'Governance', 3, 1),
('a8c1f2d4-1111-4111-8111-000000000801', 'GV.OC-02', 'Stakeholders internos e externos de OT', 'Identificar stakeholders relevantes (operações, segurança, fornecedores, reguladores) para sistemas OT.', 'Governance', 2, 2),
('a8c1f2d4-1111-4111-8111-000000000801', 'GV.RM-01', 'Estratégia de gestão de riscos OT', 'Estabelecer estratégia formal de gestão de riscos cibernéticos para ambientes OT/ICS.', 'Governance', 3, 3),
('a8c1f2d4-1111-4111-8111-000000000801', 'GV.RR-01', 'Papéis e responsabilidades em OT', 'Definir papéis e responsabilidades claras de cibersegurança OT, incluindo CISO/OT Security Manager.', 'Governance', 3, 4),
('a8c1f2d4-1111-4111-8111-000000000801', 'GV.PO-01', 'Políticas de cibersegurança OT', 'Estabelecer e manter políticas formais de cibersegurança específicas para OT.', 'Governance', 3, 5),
('a8c1f2d4-1111-4111-8111-000000000801', 'GV.SC-01', 'Gestão de risco da cadeia de suprimentos OT', 'Programa para gerenciar riscos de cadeia de suprimentos de hardware, software e serviços OT.', 'Governance', 3, 6),

-- Identify (ID)
('a8c1f2d4-1111-4111-8111-000000000801', 'ID.AM-01', 'Inventário de ativos OT (hardware)', 'Manter inventário completo de PLCs, RTUs, IEDs, HMIs, servidores SCADA e dispositivos de campo.', 'Asset Management', 3, 7),
('a8c1f2d4-1111-4111-8111-000000000801', 'ID.AM-02', 'Inventário de software e firmware OT', 'Catalogar software, firmware e versões em todos os dispositivos OT.', 'Asset Management', 3, 8),
('a8c1f2d4-1111-4111-8111-000000000801', 'ID.AM-03', 'Mapeamento de fluxos de comunicação OT', 'Mapear e documentar fluxos de dados e comunicação entre zonas IT e OT (Purdue Model).', 'Asset Management', 3, 9),
('a8c1f2d4-1111-4111-8111-000000000801', 'ID.AM-04', 'Classificação de criticidade de ativos OT', 'Classificar ativos OT por criticidade para processos de negócio e segurança.', 'Asset Management', 3, 10),
('a8c1f2d4-1111-4111-8111-000000000801', 'ID.RA-01', 'Identificação de vulnerabilidades OT', 'Identificar vulnerabilidades em ativos OT considerando restrições operacionais (ex.: sem patching online).', 'Risk Management', 3, 11),
('a8c1f2d4-1111-4111-8111-000000000801', 'ID.RA-02', 'Inteligência de ameaças OT', 'Receber e processar inteligência de ameaças específicas de OT (ICS-CERT, ISACs setoriais).', 'Risk Management', 2, 12),
('a8c1f2d4-1111-4111-8111-000000000801', 'ID.RA-03', 'Avaliação de impacto safety/operacional', 'Avaliar impacto cibernético em segurança física, ambiental e continuidade operacional.', 'Risk Management', 3, 13),

-- Protect (PR)
('a8c1f2d4-1111-4111-8111-000000000801', 'PR.AA-01', 'Gestão de identidades em OT', 'Gerenciar identidades de usuários, processos e dispositivos com acesso a sistemas OT.', 'Access Control', 3, 14),
('a8c1f2d4-1111-4111-8111-000000000801', 'PR.AA-02', 'Autenticação multifator para OT', 'Aplicar MFA para acesso remoto e privilegiado a ambientes OT, considerando latência operacional.', 'Access Control', 3, 15),
('a8c1f2d4-1111-4111-8111-000000000801', 'PR.AA-03', 'Princípio do menor privilégio em OT', 'Conceder apenas privilégios mínimos necessários para operação OT.', 'Access Control', 3, 16),
('a8c1f2d4-1111-4111-8111-000000000801', 'PR.AA-04', 'Acesso remoto seguro a OT', 'Implementar jump servers, VPN dedicada e MFA para acesso remoto a sistemas OT.', 'Access Control', 3, 17),
('a8c1f2d4-1111-4111-8111-000000000801', 'PR.AT-01', 'Conscientização em segurança OT', 'Treinamento de conscientização em segurança específico para operadores e engenheiros OT.', 'Training', 2, 18),
('a8c1f2d4-1111-4111-8111-000000000801', 'PR.AT-02', 'Treinamento especializado OT', 'Treinamento avançado para administradores OT, incluindo resposta a incidentes ICS.', 'Training', 2, 19),
('a8c1f2d4-1111-4111-8111-000000000801', 'PR.DS-01', 'Proteção de dados OT em repouso', 'Proteger configurações, lógica de PLC, históricos e dados de processo armazenados.', 'Data Security', 2, 20),
('a8c1f2d4-1111-4111-8111-000000000801', 'PR.DS-02', 'Proteção de dados OT em trânsito', 'Proteger comunicações OT considerando protocolos legados (Modbus, DNP3, OPC).', 'Data Security', 2, 21),
('a8c1f2d4-1111-4111-8111-000000000801', 'PR.PS-01', 'Hardening de plataformas OT', 'Aplicar hardening em HMIs, servidores SCADA, engineering workstations e dispositivos de campo.', 'Protective Technology', 3, 22),
('a8c1f2d4-1111-4111-8111-000000000801', 'PR.PS-02', 'Gestão de mudanças e patches OT', 'Processo formal de change management e patching com janelas de manutenção e testes em ambiente espelho.', 'Protective Technology', 3, 23),
('a8c1f2d4-1111-4111-8111-000000000801', 'PR.PS-03', 'Mídias removíveis em OT', 'Controlar e monitorar uso de mídias removíveis (USB) em ambientes OT.', 'Protective Technology', 2, 24),
('a8c1f2d4-1111-4111-8111-000000000801', 'PR.IR-01', 'Segmentação de rede IT/OT', 'Segmentar redes IT e OT com DMZ industrial conforme modelo Purdue (níveis 0-5).', 'Protective Technology', 3, 25),
('a8c1f2d4-1111-4111-8111-000000000801', 'PR.IR-02', 'Firewalls industriais e data diodes', 'Implementar firewalls industriais e/ou data diodes entre zonas críticas.', 'Protective Technology', 3, 26),
('a8c1f2d4-1111-4111-8111-000000000801', 'PR.IR-03', 'Proteção de wireless OT', 'Proteger comunicações wireless industriais (WirelessHART, ISA100, 5G privado).', 'Protective Technology', 2, 27),

-- Detect (DE)
('a8c1f2d4-1111-4111-8111-000000000801', 'DE.CM-01', 'Monitoramento contínuo de redes OT', 'Implementar monitoramento passivo de redes OT (network IDS específico para protocolos industriais).', 'Detection', 3, 28),
('a8c1f2d4-1111-4111-8111-000000000801', 'DE.CM-02', 'Monitoramento de ambiente físico', 'Monitorar acessos físicos a salas de controle, racks e dispositivos de campo.', 'Detection', 2, 29),
('a8c1f2d4-1111-4111-8111-000000000801', 'DE.CM-03', 'Monitoramento de atividade de pessoal', 'Monitorar atividades de operadores e engenheiros em sistemas OT críticos.', 'Detection', 2, 30),
('a8c1f2d4-1111-4111-8111-000000000801', 'DE.AE-01', 'Detecção de eventos anômalos OT', 'Estabelecer baseline operacional e detectar desvios comportamentais em processos OT.', 'Detection', 3, 31),
('a8c1f2d4-1111-4111-8111-000000000801', 'DE.AE-02', 'Análise de eventos OT', 'Analisar eventos correlacionando logs IT, OT e dados de processo.', 'Detection', 2, 32),

-- Respond (RS)
('a8c1f2d4-1111-4111-8111-000000000801', 'RS.MA-01', 'Plano de resposta a incidentes OT', 'Plano formal de resposta a incidentes específico para OT, integrado com safety e operações.', 'Response', 3, 33),
('a8c1f2d4-1111-4111-8111-000000000801', 'RS.MA-02', 'Comunicação durante incidentes OT', 'Procedimentos de comunicação interna, com reguladores (CISA, ANEEL, ANP) e stakeholders.', 'Response', 2, 34),
('a8c1f2d4-1111-4111-8111-000000000801', 'RS.AN-01', 'Análise forense em OT', 'Capacidade de análise forense em ambientes OT preservando evidências sem impactar operação.', 'Response', 2, 35),
('a8c1f2d4-1111-4111-8111-000000000801', 'RS.MI-01', 'Contenção de incidentes OT', 'Procedimentos de contenção considerando impacto em safety e continuidade do processo.', 'Response', 3, 36),
('a8c1f2d4-1111-4111-8111-000000000801', 'RS.CO-01', 'Coordenação com CSIRT/ICS-CERT', 'Coordenação com equipes externas (ICS-CERT, CISA, CERT.br) durante incidentes.', 'Response', 2, 37),

-- Recover (RC)
('a8c1f2d4-1111-4111-8111-000000000801', 'RC.RP-01', 'Plano de recuperação OT', 'Plano de recuperação considerando restauração segura de processos físicos.', 'Recovery', 3, 38),
('a8c1f2d4-1111-4111-8111-000000000801', 'RC.RP-02', 'Backup e restore de OT', 'Backups de configurações de PLC, projetos SCADA, lógica ladder, com testes de restore.', 'Recovery', 3, 39),
('a8c1f2d4-1111-4111-8111-000000000801', 'RC.RP-03', 'Manual fallback / operação manual', 'Procedimentos para operação manual em caso de indisponibilidade de sistemas OT.', 'Recovery', 3, 40),
('a8c1f2d4-1111-4111-8111-000000000801', 'RC.IM-01', 'Lições aprendidas OT', 'Processo formal de lições aprendidas pós-incidente OT alimentando melhorias.', 'Recovery', 2, 41),
('a8c1f2d4-1111-4111-8111-000000000801', 'RC.CO-01', 'Comunicação de recuperação', 'Comunicar status de recuperação a stakeholders, reguladores e clientes.', 'Recovery', 2, 42),

-- Specific OT Considerations
('a8c1f2d4-1111-4111-8111-000000000801', 'OT.SF-01', 'Integração cyber-safety', 'Integração entre processos de cibersegurança e Safety Instrumented Systems (SIS / IEC 61511).', 'Safety Integration', 3, 43),
('a8c1f2d4-1111-4111-8111-000000000801', 'OT.LC-01', 'Sistemas legados em OT', 'Estratégia para proteção de sistemas legados (EOL) sem suporte de patches.', 'Legacy Systems', 3, 44),
('a8c1f2d4-1111-4111-8111-000000000801', 'OT.RT-01', 'Restrições de tempo real', 'Soluções de segurança que respeitam requisitos determinísticos e de tempo real do processo.', 'Real-Time Constraints', 2, 45);

-- ============================================================
-- DORA - Digital Operational Resilience Act (~42 requisitos)
-- ============================================================
INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, peso, ordem) VALUES
-- Pilar 1: ICT Risk Management (Arts. 5-16)
('a8c1f2d4-2222-4222-8222-000000000802', 'DORA-RM-01', 'Framework de gestão de risco TIC', 'Estabelecer framework abrangente de gestão de riscos de TIC aprovado pelo órgão de administração.', 'ICT Risk Management', 3, 1),
('a8c1f2d4-2222-4222-8222-000000000802', 'DORA-RM-02', 'Responsabilidade do órgão de administração', 'Órgão de administração define, aprova, supervisiona e é responsável pelo framework de risco TIC.', 'Governance', 3, 2),
('a8c1f2d4-2222-4222-8222-000000000802', 'DORA-RM-03', 'Estratégia de resiliência operacional digital', 'Estratégia documentada de resiliência operacional digital alinhada à estratégia de negócio.', 'ICT Risk Management', 3, 3),
('a8c1f2d4-2222-4222-8222-000000000802', 'DORA-RM-04', 'Identificação de funções críticas', 'Identificar e classificar funções críticas ou importantes (CIFs) e ativos TIC associados.', 'ICT Risk Management', 3, 4),
('a8c1f2d4-2222-4222-8222-000000000802', 'DORA-RM-05', 'Proteção e prevenção TIC', 'Medidas técnicas e organizacionais para proteger sistemas TIC, incluindo criptografia e controles de acesso.', 'ICT Risk Management', 3, 5),
('a8c1f2d4-2222-4222-8222-000000000802', 'DORA-RM-06', 'Detecção de anomalias TIC', 'Mecanismos para detectar prontamente atividades anômalas, incluindo problemas de performance.', 'ICT Risk Management', 3, 6),
('a8c1f2d4-2222-4222-8222-000000000802', 'DORA-RM-07', 'Resposta e recuperação TIC', 'Política dedicada de continuidade de negócio TIC e planos de resposta e recuperação.', 'ICT Risk Management', 3, 7),
('a8c1f2d4-2222-4222-8222-000000000802', 'DORA-RM-08', 'Backup, restauração e recuperação', 'Políticas e procedimentos de backup com testes regulares de restauração.', 'ICT Risk Management', 3, 8),
('a8c1f2d4-2222-4222-8222-000000000802', 'DORA-RM-09', 'Aprendizado e evolução', 'Capacidade de aprender com incidentes TIC e evoluir o framework de resiliência.', 'ICT Risk Management', 2, 9),
('a8c1f2d4-2222-4222-8222-000000000802', 'DORA-RM-10', 'Comunicação e treinamento', 'Programas de conscientização e treinamento em resiliência operacional digital.', 'ICT Risk Management', 2, 10),
('a8c1f2d4-2222-4222-8222-000000000802', 'DORA-RM-11', 'Função independente de controle TIC', 'Função independente de controle e auditoria do framework de risco TIC.', 'Governance', 3, 11),
('a8c1f2d4-2222-4222-8222-000000000802', 'DORA-RM-12', 'Auditoria interna TIC', 'Auditoria interna periódica do framework de risco TIC com plano formal.', 'Governance', 2, 12),
('a8c1f2d4-2222-4222-8222-000000000802', 'DORA-RM-13', 'Orçamento dedicado para TIC e resiliência', 'Alocação de recursos financeiros e humanos adequados para gestão de risco TIC.', 'Governance', 2, 13),

-- Pilar 2: ICT-Related Incident Reporting (Arts. 17-23)
('a8c1f2d4-2222-4222-8222-000000000802', 'DORA-IR-01', 'Processo de gestão de incidentes TIC', 'Processo formal para detectar, gerir, classificar e registrar incidentes relacionados a TIC.', 'Incident Reporting', 3, 14),
('a8c1f2d4-2222-4222-8222-000000000802', 'DORA-IR-02', 'Classificação de incidentes', 'Classificar incidentes TIC e ameaças cibernéticas significativas conforme critérios DORA.', 'Incident Reporting', 3, 15),
('a8c1f2d4-2222-4222-8222-000000000802', 'DORA-IR-03', 'Reporte inicial às autoridades', 'Capacidade de reportar incidentes major TIC à autoridade competente em até 4h após classificação.', 'Incident Reporting', 3, 16),
('a8c1f2d4-2222-4222-8222-000000000802', 'DORA-IR-04', 'Reporte intermediário e final', 'Submeter reportes intermediário e final conforme prazos regulatórios DORA.', 'Incident Reporting', 3, 17),
('a8c1f2d4-2222-4222-8222-000000000802', 'DORA-IR-05', 'Notificação a clientes', 'Notificar clientes afetados por incidentes major TIC sem demora indevida.', 'Incident Reporting', 2, 18),
('a8c1f2d4-2222-4222-8222-000000000802', 'DORA-IR-06', 'Reporte voluntário de ameaças', 'Capacidade opcional de reportar ameaças cibernéticas significativas às autoridades.', 'Incident Reporting', 1, 19),
('a8c1f2d4-2222-4222-8222-000000000802', 'DORA-IR-07', 'Harmonização com outros reportes', 'Harmonizar reporte DORA com NIS2, GDPR e outros frameworks aplicáveis.', 'Incident Reporting', 2, 20),

-- Pilar 3: Digital Operational Resilience Testing (Arts. 24-27)
('a8c1f2d4-2222-4222-8222-000000000802', 'DORA-RT-01', 'Programa de testes de resiliência', 'Programa abrangente de testes de resiliência operacional digital baseado em risco.', 'Resilience Testing', 3, 21),
('a8c1f2d4-2222-4222-8222-000000000802', 'DORA-RT-02', 'Testes anuais de sistemas críticos', 'Testar anualmente todos os sistemas TIC que suportam funções críticas ou importantes.', 'Resilience Testing', 3, 22),
('a8c1f2d4-2222-4222-8222-000000000802', 'DORA-RT-03', 'Tipos de testes', 'Realizar variedade de testes: vulnerability scans, source code reviews, scenario-based, performance, penetration tests.', 'Resilience Testing', 3, 23),
('a8c1f2d4-2222-4222-8222-000000000802', 'DORA-RT-04', 'TLPT - Threat-Led Penetration Testing', 'Realizar TLPT a cada 3 anos para entidades em escopo, com testadores qualificados (ex.: TIBER-EU).', 'Resilience Testing', 3, 24),
('a8c1f2d4-2222-4222-8222-000000000802', 'DORA-RT-05', 'Independência dos testadores', 'Testadores internos ou externos com independência adequada e competência comprovada.', 'Resilience Testing', 2, 25),
('a8c1f2d4-2222-4222-8222-000000000802', 'DORA-RT-06', 'Tratamento de issues identificados', 'Processo de tratamento e remediação de issues identificados em testes com rastreabilidade.', 'Resilience Testing', 3, 26),

-- Pilar 4: ICT Third-Party Risk Management (Arts. 28-44)
('a8c1f2d4-2222-4222-8222-000000000802', 'DORA-TP-01', 'Estratégia de risco de terceiros TIC', 'Estratégia para gestão de risco de terceiros TIC aprovada pelo órgão de administração.', 'Third-Party Risk', 3, 27),
('a8c1f2d4-2222-4222-8222-000000000802', 'DORA-TP-02', 'Registro de informação de terceiros', 'Manter Register of Information completo de todos os contratos com prestadores TIC.', 'Third-Party Risk', 3, 28),
('a8c1f2d4-2222-4222-8222-000000000802', 'DORA-TP-03', 'Due diligence pré-contratação', 'Due diligence aprofundada antes de contratar prestadores TIC, especialmente para CIFs.', 'Third-Party Risk', 3, 29),
('a8c1f2d4-2222-4222-8222-000000000802', 'DORA-TP-04', 'Cláusulas contratuais obrigatórias', 'Contratos com cláusulas mínimas obrigatórias DORA (descrição serviço, locais, sub-contratação, SLAs, exit, auditoria).', 'Third-Party Risk', 3, 30),
('a8c1f2d4-2222-4222-8222-000000000802', 'DORA-TP-05', 'Avaliação de concentração de risco', 'Avaliar e monitorar risco de concentração com prestadores TIC, especialmente cloud.', 'Third-Party Risk', 3, 31),
('a8c1f2d4-2222-4222-8222-000000000802', 'DORA-TP-06', 'Estratégia de saída (exit)', 'Estratégia de saída documentada e testada para prestadores TIC críticos.', 'Third-Party Risk', 3, 32),
('a8c1f2d4-2222-4222-8222-000000000802', 'DORA-TP-07', 'Monitoramento contínuo de terceiros', 'Monitorar continuamente performance, riscos e compliance de prestadores TIC.', 'Third-Party Risk', 3, 33),
('a8c1f2d4-2222-4222-8222-000000000802', 'DORA-TP-08', 'Sub-contratação', 'Controlar e monitorar sub-contratação por prestadores TIC, especialmente em CIFs.', 'Third-Party Risk', 2, 34),
('a8c1f2d4-2222-4222-8222-000000000802', 'DORA-TP-09', 'Críticos designados (CTPPs)', 'Preparação para regime aplicável a Critical Third-Party Providers (CTPPs) designados pelas ESAs.', 'Third-Party Risk', 2, 35),
('a8c1f2d4-2222-4222-8222-000000000802', 'DORA-TP-10', 'Direito de auditoria e acesso', 'Garantir direitos contratuais de auditoria, acesso e inspeção sobre prestadores TIC.', 'Third-Party Risk', 3, 36),

-- Pilar 5: Information Sharing (Art. 45)
('a8c1f2d4-2222-4222-8222-000000000802', 'DORA-IS-01', 'Compartilhamento de inteligência', 'Participação em arranjos de compartilhamento de informações sobre ameaças cibernéticas.', 'Information Sharing', 1, 37),
('a8c1f2d4-2222-4222-8222-000000000802', 'DORA-IS-02', 'Proteção de informação compartilhada', 'Garantir confidencialidade e proteção de dados pessoais ao compartilhar inteligência.', 'Information Sharing', 1, 38),

-- Cross-cutting
('a8c1f2d4-2222-4222-8222-000000000802', 'DORA-CC-01', 'Proporcionalidade', 'Aplicar princípio da proporcionalidade conforme tamanho, perfil e complexidade da entidade.', 'Cross-cutting', 2, 39),
('a8c1f2d4-2222-4222-8222-000000000802', 'DORA-CC-02', 'Documentação e evidências', 'Manter documentação abrangente e evidências de conformidade DORA disponíveis para autoridades.', 'Cross-cutting', 2, 40),
('a8c1f2d4-2222-4222-8222-000000000802', 'DORA-CC-03', 'Integração com NIS2 e GDPR', 'Integração e harmonização com NIS2, GDPR e outras regulações aplicáveis.', 'Cross-cutting', 2, 41),
('a8c1f2d4-2222-4222-8222-000000000802', 'DORA-CC-04', 'RTS e ITS aplicáveis', 'Acompanhar e implementar Regulatory Technical Standards (RTS) e Implementing Technical Standards (ITS).', 'Cross-cutting', 2, 42);

-- ============================================================
-- ISO/IEC 62443 - IACS Security (~55 requisitos)
-- ============================================================
INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, peso, ordem) VALUES
-- 62443-2-1: CSMS - Cyber Security Management System
('a8c1f2d4-3333-4333-8333-000000000803', 'CSMS-01', 'Análise de risco de negócio IACS', 'Identificar riscos cibernéticos para sistemas IACS sob perspectiva de negócio.', 'CSMS - Risk Analysis', 3, 1),
('a8c1f2d4-3333-4333-8333-000000000803', 'CSMS-02', 'Identificação e classificação de ativos IACS', 'Inventariar e classificar ativos IACS por criticidade.', 'CSMS - Risk Analysis', 3, 2),
('a8c1f2d4-3333-4333-8333-000000000803', 'CSMS-03', 'Avaliação de risco detalhada', 'Avaliação detalhada de riscos por zona e conduit.', 'CSMS - Risk Analysis', 3, 3),
('a8c1f2d4-3333-4333-8333-000000000803', 'CSMS-04', 'Política de segurança IACS', 'Política formal de segurança para IACS aprovada pela alta direção.', 'CSMS - Policy', 3, 4),
('a8c1f2d4-3333-4333-8333-000000000803', 'CSMS-05', 'Organização de segurança IACS', 'Estrutura organizacional com papéis e responsabilidades definidos para segurança IACS.', 'CSMS - Policy', 3, 5),
('a8c1f2d4-3333-4333-8333-000000000803', 'CSMS-06', 'Treinamento e conscientização', 'Programa de treinamento e conscientização em segurança IACS.', 'CSMS - Policy', 2, 6),
('a8c1f2d4-3333-4333-8333-000000000803', 'CSMS-07', 'Gestão de continuidade de negócio', 'Planos de continuidade de negócio incluindo cenários cibernéticos IACS.', 'CSMS - Policy', 3, 7),
('a8c1f2d4-3333-4333-8333-000000000803', 'CSMS-08', 'Conformidade e auditoria CSMS', 'Auditorias periódicas de conformidade do CSMS com IEC 62443.', 'CSMS - Policy', 2, 8),
('a8c1f2d4-3333-4333-8333-000000000803', 'CSMS-09', 'Revisão e melhoria contínua', 'Revisão pela direção e melhoria contínua do CSMS.', 'CSMS - Policy', 2, 9),

-- 62443-3-3: System Security Requirements (Foundational Requirements)
-- FR1: Identification and Authentication Control (IAC)
('a8c1f2d4-3333-4333-8333-000000000803', 'SR-1.1', 'Identificação e autenticação de usuários humanos', 'Sistema deve identificar e autenticar todos os usuários humanos.', 'FR1 - IAC', 3, 10),
('a8c1f2d4-3333-4333-8333-000000000803', 'SR-1.2', 'Identificação e autenticação de processos e dispositivos', 'Identificação e autenticação de processos de software e dispositivos.', 'FR1 - IAC', 3, 11),
('a8c1f2d4-3333-4333-8333-000000000803', 'SR-1.3', 'Gestão de contas', 'Gestão do ciclo de vida de contas de usuários e dispositivos.', 'FR1 - IAC', 3, 12),
('a8c1f2d4-3333-4333-8333-000000000803', 'SR-1.4', 'Gestão de identificadores', 'Gestão de identificadores únicos para usuários, dispositivos e processos.', 'FR1 - IAC', 2, 13),
('a8c1f2d4-3333-4333-8333-000000000803', 'SR-1.5', 'Gestão de autenticadores', 'Gestão segura de autenticadores (senhas, tokens, certificados).', 'FR1 - IAC', 3, 14),
('a8c1f2d4-3333-4333-8333-000000000803', 'SR-1.6', 'Gestão de acesso wireless', 'Gestão de acesso wireless com autenticação forte.', 'FR1 - IAC', 2, 15),
('a8c1f2d4-3333-4333-8333-000000000803', 'SR-1.7', 'Força de autenticação baseada em senha', 'Requisitos de força para autenticação baseada em senha.', 'FR1 - IAC', 2, 16),
('a8c1f2d4-3333-4333-8333-000000000803', 'SR-1.8', 'Certificados de chave pública (PKI)', 'Uso de PKI para autenticação de dispositivos e processos.', 'FR1 - IAC', 2, 17),

-- FR2: Use Control (UC)
('a8c1f2d4-3333-4333-8333-000000000803', 'SR-2.1', 'Aplicação de autorização', 'Aplicar autorização a todos os usuários humanos, processos e dispositivos.', 'FR2 - UC', 3, 18),
('a8c1f2d4-3333-4333-8333-000000000803', 'SR-2.2', 'Controle de uso wireless', 'Autorização e monitoramento de uso wireless.', 'FR2 - UC', 2, 19),
('a8c1f2d4-3333-4333-8333-000000000803', 'SR-2.3', 'Controle de uso de dispositivos portáteis', 'Controlar uso de dispositivos portáteis e móveis em IACS.', 'FR2 - UC', 2, 20),
('a8c1f2d4-3333-4333-8333-000000000803', 'SR-2.4', 'Código móvel', 'Restrições e controles sobre código móvel em sistemas IACS.', 'FR2 - UC', 2, 21),
('a8c1f2d4-3333-4333-8333-000000000803', 'SR-2.5', 'Bloqueio de sessão', 'Bloqueio automático de sessão após inatividade.', 'FR2 - UC', 2, 22),
('a8c1f2d4-3333-4333-8333-000000000803', 'SR-2.6', 'Encerramento de sessão remota', 'Encerramento de sessões remotas após critérios definidos.', 'FR2 - UC', 2, 23),
('a8c1f2d4-3333-4333-8333-000000000803', 'SR-2.7', 'Sessões concorrentes', 'Limitar número de sessões concorrentes por conta.', 'FR2 - UC', 2, 24),
('a8c1f2d4-3333-4333-8333-000000000803', 'SR-2.8', 'Eventos auditáveis', 'Geração de registros de auditoria para eventos relevantes.', 'FR2 - UC', 3, 25),
('a8c1f2d4-3333-4333-8333-000000000803', 'SR-2.9', 'Capacidade de armazenamento de auditoria', 'Capacidade de armazenamento adequada para registros de auditoria.', 'FR2 - UC', 2, 26),
('a8c1f2d4-3333-4333-8333-000000000803', 'SR-2.10', 'Resposta a falhas de auditoria', 'Resposta apropriada a falhas no processo de auditoria.', 'FR2 - UC', 2, 27),
('a8c1f2d4-3333-4333-8333-000000000803', 'SR-2.11', 'Carimbos de tempo', 'Sincronização de tempo confiável para registros de auditoria.', 'FR2 - UC', 2, 28),
('a8c1f2d4-3333-4333-8333-000000000803', 'SR-2.12', 'Não-repúdio', 'Garantir não-repúdio para ações em sistemas críticos.', 'FR2 - UC', 2, 29),

-- FR3: System Integrity (SI)
('a8c1f2d4-3333-4333-8333-000000000803', 'SR-3.1', 'Integridade de comunicações', 'Proteção da integridade de comunicações entre componentes IACS.', 'FR3 - SI', 3, 30),
('a8c1f2d4-3333-4333-8333-000000000803', 'SR-3.2', 'Proteção contra código malicioso', 'Proteção contra malware em hosts e dispositivos IACS.', 'FR3 - SI', 3, 31),
('a8c1f2d4-3333-4333-8333-000000000803', 'SR-3.3', 'Verificação de funcionalidade de segurança', 'Verificação periódica de funcionalidades de segurança.', 'FR3 - SI', 2, 32),
('a8c1f2d4-3333-4333-8333-000000000803', 'SR-3.4', 'Integridade de software e informação', 'Verificar integridade de software, firmware e informação.', 'FR3 - SI', 3, 33),
('a8c1f2d4-3333-4333-8333-000000000803', 'SR-3.5', 'Validação de entrada', 'Validação de inputs em interfaces de sistemas IACS.', 'FR3 - SI', 2, 34),
('a8c1f2d4-3333-4333-8333-000000000803', 'SR-3.6', 'Saída determinística', 'Garantir saída determinística em caso de falha.', 'FR3 - SI', 2, 35),
('a8c1f2d4-3333-4333-8333-000000000803', 'SR-3.7', 'Tratamento de erros', 'Tratamento robusto de erros sem expor informação sensível.', 'FR3 - SI', 2, 36),
('a8c1f2d4-3333-4333-8333-000000000803', 'SR-3.8', 'Integridade de sessão', 'Proteção da integridade de sessões de comunicação.', 'FR3 - SI', 2, 37),
('a8c1f2d4-3333-4333-8333-000000000803', 'SR-3.9', 'Proteção de logs de auditoria', 'Proteção da integridade de logs de auditoria.', 'FR3 - SI', 3, 38),

-- FR4: Data Confidentiality (DC)
('a8c1f2d4-3333-4333-8333-000000000803', 'SR-4.1', 'Confidencialidade de informação', 'Proteção da confidencialidade de informações sensíveis em repouso e trânsito.', 'FR4 - DC', 3, 39),
('a8c1f2d4-3333-4333-8333-000000000803', 'SR-4.2', 'Persistência de informação', 'Gestão da persistência de informação confidencial.', 'FR4 - DC', 2, 40),
('a8c1f2d4-3333-4333-8333-000000000803', 'SR-4.3', 'Uso de criptografia', 'Uso adequado de criptografia para proteção de dados.', 'FR4 - DC', 3, 41),

-- FR5: Restricted Data Flow (RDF)
('a8c1f2d4-3333-4333-8333-000000000803', 'SR-5.1', 'Segmentação de rede', 'Segmentação lógica e física de redes IACS em zonas.', 'FR5 - RDF', 3, 42),
('a8c1f2d4-3333-4333-8333-000000000803', 'SR-5.2', 'Proteção de fronteiras de zona', 'Controle de fluxo de dados nas fronteiras de zona via conduits.', 'FR5 - RDF', 3, 43),
('a8c1f2d4-3333-4333-8333-000000000803', 'SR-5.3', 'Restrições de comunicação geral', 'Restrições gerais de comunicação para sistemas críticos.', 'FR5 - RDF', 2, 44),
('a8c1f2d4-3333-4333-8333-000000000803', 'SR-5.4', 'Particionamento de aplicações', 'Particionamento de aplicações em zonas distintas.', 'FR5 - RDF', 2, 45),

-- FR6: Timely Response to Events (TRE)
('a8c1f2d4-3333-4333-8333-000000000803', 'SR-6.1', 'Acessibilidade de logs de auditoria', 'Logs de auditoria acessíveis para análise e resposta.', 'FR6 - TRE', 2, 46),
('a8c1f2d4-3333-4333-8333-000000000803', 'SR-6.2', 'Monitoramento contínuo', 'Monitoramento contínuo de eventos de segurança em IACS.', 'FR6 - TRE', 3, 47),

-- FR7: Resource Availability (RA)
('a8c1f2d4-3333-4333-8333-000000000803', 'SR-7.1', 'Proteção contra negação de serviço', 'Proteção de recursos contra ataques de DoS.', 'FR7 - RA', 3, 48),
('a8c1f2d4-3333-4333-8333-000000000803', 'SR-7.2', 'Gestão de recursos', 'Gestão adequada de recursos para garantir disponibilidade.', 'FR7 - RA', 2, 49),
('a8c1f2d4-3333-4333-8333-000000000803', 'SR-7.3', 'Backup do sistema de controle', 'Backup completo de sistema de controle (configurações, lógica).', 'FR7 - RA', 3, 50),
('a8c1f2d4-3333-4333-8333-000000000803', 'SR-7.4', 'Recuperação e reconstituição', 'Capacidade de recuperação e reconstituição em estado seguro.', 'FR7 - RA', 3, 51),
('a8c1f2d4-3333-4333-8333-000000000803', 'SR-7.5', 'Energia de emergência', 'Fornecimento de energia de emergência para sistemas críticos.', 'FR7 - RA', 2, 52),
('a8c1f2d4-3333-4333-8333-000000000803', 'SR-7.6', 'Configurações de rede e segurança', 'Gestão segura de configurações de rede e segurança.', 'FR7 - RA', 2, 53),

-- 62443-4-1: Secure Product Development Lifecycle (SDL)
('a8c1f2d4-3333-4333-8333-000000000803', 'SDL-01', 'Gestão de segurança no SDL', 'Processo formal de gestão de segurança no ciclo de desenvolvimento de produtos.', 'SDL', 2, 54),
('a8c1f2d4-3333-4333-8333-000000000803', 'SDL-02', 'Tratamento de vulnerabilidades de produto', 'Processo de gestão e disclosure de vulnerabilidades em produtos IACS.', 'SDL', 3, 55);
