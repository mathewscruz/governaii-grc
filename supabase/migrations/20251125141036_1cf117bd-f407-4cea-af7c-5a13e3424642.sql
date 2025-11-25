-- Inserir requisitos SOC 2 Type II (64 critérios dos 5 Trust Services)
INSERT INTO gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, area_responsavel, peso, obrigatorio, ordem)
SELECT 
  f.id as framework_id,
  req.codigo,
  req.titulo,
  req.descricao,
  req.categoria,
  req.area_responsavel,
  req.peso,
  req.obrigatorio,
  req.ordem
FROM gap_analysis_frameworks f
CROSS JOIN (VALUES
  -- Common Criteria (Security)
  ('CC1.1', 'Control Environment - Integrity and Ethics', 'The entity demonstrates a commitment to integrity and ethical values.', 'Control Environment', 'Compliance', 3, true, 1),
  ('CC1.2', 'Board Independence and Oversight', 'The board of directors demonstrates independence from management and exercises oversight.', 'Control Environment', 'Compliance', 3, true, 2),
  ('CC1.3', 'Management Structure', 'Management establishes structure, authority, and responsibility.', 'Control Environment', 'Compliance', 3, true, 3),
  ('CC1.4', 'Competence Commitment', 'The entity demonstrates a commitment to recruit, develop, and retain competent individuals.', 'Control Environment', 'Compliance', 2, true, 4),
  ('CC1.5', 'Accountability', 'The entity holds individuals accountable for their internal control responsibilities.', 'Control Environment', 'Compliance', 3, true, 5),
  ('CC2.1', 'Objectives Specification', 'The entity specifies objectives with sufficient clarity to enable identification of risks.', 'Risk Assessment', 'Compliance', 3, true, 6),
  ('CC2.2', 'Risk Identification', 'The entity identifies risks to the achievement of its objectives.', 'Risk Assessment', 'Compliance', 3, true, 7),
  ('CC2.3', 'Fraud Risk Assessment', 'The entity considers the potential for fraud in assessing risks.', 'Risk Assessment', 'Compliance', 3, true, 8),
  ('CC3.1', 'Control Activities', 'The entity specifies control activities to achieve objectives and respond to risks.', 'Control Activities', 'TI', 3, true, 9),
  ('CC3.2', 'Technology Controls', 'The entity implements control activities through policies and procedures.', 'Control Activities', 'TI', 3, true, 10),
  ('CC3.3', 'Technology Deployment', 'The entity deploys control activities through policies and relevant technology.', 'Control Activities', 'TI', 3, true, 11),
  ('CC4.1', 'Information Quality', 'The entity obtains or generates and uses relevant, quality information to support internal control.', 'Information', 'TI', 3, true, 12),
  ('CC4.2', 'Internal Communication', 'The entity internally communicates information necessary to support internal control.', 'Information', 'Compliance', 2, true, 13),
  ('CC5.1', 'Control Evaluation', 'The entity selects, develops, and performs ongoing or separate evaluations to ascertain whether components of internal control are present.', 'Monitoring', 'Compliance', 3, true, 14),
  ('CC5.2', 'Deficiency Communication', 'The entity evaluates and communicates internal control deficiencies.', 'Monitoring', 'Compliance', 3, true, 15),
  ('CC6.1', 'Logical Access - Identification', 'The entity implements logical access security software to protect against threats from sources outside its system boundaries.', 'Logical Access', 'Segurança', 3, true, 16),
  ('CC6.2', 'Authentication', 'Prior to issuing system credentials and granting access, the entity registers and authorizes new internal and external users.', 'Logical Access', 'Segurança', 3, true, 17),
  ('CC6.3', 'Authorization', 'The entity authorizes, modifies, or removes access to data, software, functions, and services based on policies.', 'Logical Access', 'Segurança', 3, true, 18),
  ('CC6.4', 'Physical Access', 'The entity restricts physical access to facilities and protected information assets to authorized personnel.', 'Logical Access', 'Facilities', 3, true, 19),
  ('CC6.5', 'Access Termination', 'The entity discontinues logical and physical protections over physical assets only after the ability to read or recover data has been diminished.', 'Logical Access', 'Segurança', 3, true, 20),
  ('CC6.6', 'Vulnerability Management', 'The entity implements logical access security measures to protect against threats from sources outside its system boundaries.', 'Logical Access', 'Segurança', 3, true, 21),
  ('CC6.7', 'Encryption Key Management', 'The entity restricts the transmission, movement, and removal of information to authorized internal and external users and processes.', 'Logical Access', 'Segurança', 3, true, 22),
  ('CC6.8', 'Access Reviews', 'The entity implements controls to prevent or detect and act upon the introduction of unauthorized or malicious software.', 'Logical Access', 'Segurança', 3, true, 23),
  ('CC7.1', 'System Operations - Detection', 'To meet its objectives, the entity uses detection and monitoring procedures to identify anomalies.', 'System Operations', 'Segurança', 3, true, 24),
  ('CC7.2', 'Incident Response', 'The entity monitors system components and the operation of those components for anomalies.', 'System Operations', 'Segurança', 3, true, 25),
  ('CC7.3', 'Incident Escalation', 'The entity evaluates security events to determine whether they could or have resulted in a failure of the entity to meet its objectives.', 'System Operations', 'Segurança', 3, true, 26),
  ('CC7.4', 'Communication Protocols', 'The entity responds to identified security incidents by executing a defined incident response program.', 'System Operations', 'Segurança', 3, true, 27),
  ('CC7.5', 'Containment and Recovery', 'The entity identifies, develops, and implements activities to recover from identified security incidents.', 'System Operations', 'Segurança', 3, true, 28),
  ('CC8.1', 'Change Management', 'The entity authorizes, designs, develops or acquires, configures, documents, tests, approves, and implements changes to infrastructure, data, software, and procedures.', 'Change Management', 'TI', 3, true, 29),
  ('CC9.1', 'Risk Mitigation', 'The entity identifies, selects, and develops risk mitigation activities for risks arising from potential business disruptions.', 'Risk Mitigation', 'Compliance', 3, true, 30),
  ('CC9.2', 'Vendor Management', 'The entity assesses and manages risks associated with vendors and business partners.', 'Risk Mitigation', 'Compliance', 3, true, 31),
  
  -- Availability Criteria
  ('A1.1', 'Capacity Planning', 'The entity maintains, monitors, and evaluates current processing capacity and use of system components.', 'Availability', 'TI', 3, true, 32),
  ('A1.2', 'System Monitoring', 'The entity authorizes, designs, develops, implements, operates, approves, maintains, and monitors environmental protections, software, data backup processes, and recovery infrastructure.', 'Availability', 'TI', 3, true, 33),
  ('A1.3', 'Recovery and Continuity', 'The entity tests recovery plan procedures supporting system recovery to meet its objectives.', 'Availability', 'TI', 3, true, 34),
  
  -- Processing Integrity Criteria
  ('PI1.1', 'Processing Accuracy', 'The entity obtains or generates, uses, and communicates relevant, quality information regarding objectives related to processing.', 'Processing Integrity', 'TI', 3, true, 35),
  ('PI1.2', 'Processing Completeness', 'The entity implements policies and procedures over system inputs, including those within the boundaries of the system.', 'Processing Integrity', 'TI', 3, true, 36),
  ('PI1.3', 'Data Validation', 'The entity implements policies and procedures over system processing to result in products, services, and reporting to meet objectives.', 'Processing Integrity', 'TI', 3, true, 37),
  ('PI1.4', 'Output Management', 'The entity implements policies and procedures to make available or deliver output completely, accurately, and timely.', 'Processing Integrity', 'TI', 3, true, 38),
  ('PI1.5', 'Error Correction', 'The entity implements policies and procedures to store inputs, items in processing, and outputs completely, accurately, and timely.', 'Processing Integrity', 'TI', 3, true, 39),
  
  -- Confidentiality Criteria
  ('C1.1', 'Confidential Information Identification', 'The entity identifies and maintains confidential information to meet objectives related to confidentiality.', 'Confidentiality', 'Compliance', 3, true, 40),
  ('C1.2', 'Confidential Information Disposal', 'The entity disposes of confidential information to meet objectives related to confidentiality.', 'Confidentiality', 'TI', 3, true, 41),
  
  -- Privacy Criteria
  ('P1.1', 'Privacy Notice', 'The entity provides notice to data subjects about its privacy practices to meet objectives related to privacy.', 'Privacy', 'Compliance', 3, true, 42),
  ('P2.1', 'Choice and Consent', 'The entity communicates choices available regarding the collection, use, retention, disclosure, and disposal of personal information.', 'Privacy', 'Compliance', 3, true, 43),
  ('P3.1', 'Collection Limitation', 'The entity collects personal information only for purposes identified in the notice.', 'Privacy', 'Compliance', 3, true, 44),
  ('P3.2', 'Data Minimization', 'For information requiring explicit consent, the entity obtains such consent prior to collection.', 'Privacy', 'Compliance', 3, true, 45),
  ('P4.1', 'Data Use', 'The entity limits the use of personal information to purposes identified in the notice.', 'Privacy', 'Compliance', 3, true, 46),
  ('P4.2', 'Purpose Limitation', 'The entity retains personal information consistent with its objectives related to privacy.', 'Privacy', 'Compliance', 3, true, 47),
  ('P4.3', 'Consent Withdrawal', 'The entity securely disposes of personal information to meet its objectives related to privacy.', 'Privacy', 'TI', 3, true, 48),
  ('P5.1', 'Data Access Requests', 'The entity grants identified and authenticated data subjects the ability to access their stored personal information.', 'Privacy', 'Compliance', 3, true, 49),
  ('P5.2', 'Data Correction', 'The entity corrects, amends, or appends personal information based on information provided by data subjects.', 'Privacy', 'Compliance', 3, true, 50),
  ('P6.1', 'Disclosure to Third Parties', 'The entity discloses personal information to third parties with the explicit consent of data subjects.', 'Privacy', 'Compliance', 3, true, 51),
  ('P6.2', 'Third Party Agreements', 'The entity creates and retains a complete, accurate, and timely record of authorized disclosures of personal information.', 'Privacy', 'Compliance', 3, true, 52),
  ('P7.1', 'Data Quality', 'The entity collects and maintains accurate, up-to-date, complete, and relevant personal information.', 'Privacy', 'TI', 3, true, 53),
  ('P7.2', 'Data Integrity', 'The entity implements procedures to receive, address, resolve, and communicate resolution of inquiries, complaints, and disputes.', 'Privacy', 'Compliance', 2, true, 54),
  ('P8.1', 'Onward Transfer', 'The entity obtains commitments from vendors and other third parties to notify the entity if they can no longer meet privacy obligations.', 'Privacy', 'Compliance', 3, true, 55),
  ('P8.2', 'Vendor Assessment', 'The entity assesses vendors and third parties regarding privacy practices prior to sharing personal information.', 'Privacy', 'Compliance', 3, true, 56),
  
  -- Additional Security Common Criteria
  ('CC6.9', 'Configuration Management', 'The entity implements configuration management processes to maintain consistent security configurations.', 'Logical Access', 'TI', 3, true, 57),
  ('CC7.6', 'Logging and Monitoring', 'The entity implements comprehensive logging and monitoring of system activities.', 'System Operations', 'Segurança', 3, true, 58),
  ('CC8.2', 'System Development Lifecycle', 'The entity implements system development lifecycle processes to ensure secure development.', 'Change Management', 'TI', 3, true, 59),
  ('CC9.3', 'Business Continuity', 'The entity implements business continuity and disaster recovery plans.', 'Risk Mitigation', 'TI', 3, true, 60),
  ('A1.4', 'Performance Monitoring', 'The entity monitors system performance and capacity to ensure availability objectives are met.', 'Availability', 'TI', 3, true, 61),
  ('PI1.6', 'Quality Assurance', 'The entity implements quality assurance procedures to ensure processing integrity.', 'Processing Integrity', 'TI', 2, true, 62),
  ('C1.3', 'Data Classification', 'The entity classifies data based on sensitivity and implements appropriate protection controls.', 'Confidentiality', 'Compliance', 3, true, 63),
  ('P8.3', 'International Transfers', 'The entity implements appropriate safeguards for international transfers of personal information.', 'Privacy', 'Compliance', 3, true, 64)
) AS req(codigo, titulo, descricao, categoria, area_responsavel, peso, obrigatorio, ordem)
WHERE f.nome = 'SOC 2 Type II' AND f.versao = '2017';