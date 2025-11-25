-- Inserir requisitos CIS Controls v8 - Parte 2 (Controles 10-18, ~78 safeguards)
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
  -- Control 10: Malware Defenses
  ('10.1', 'Deploy Anti-Malware Software', 'Deploy and maintain anti-malware software on all enterprise assets.', 'Malware Defense', 'Segurança', 3, true, 76),
  ('10.2', 'Configure Anti-Malware Scanning', 'Configure automatic anti-malware scanning of removable media.', 'Malware Defense', 'Segurança', 3, true, 77),
  ('10.3', 'Disable Autorun', 'Disable autorun and autoplay auto-execute functionality for removable media.', 'Malware Defense', 'Segurança', 3, true, 78),
  ('10.4', 'Configure Anti-Exploit Features', 'Configure anti-exploitation features on enterprise assets and software.', 'Malware Defense', 'Segurança', 2, true, 79),
  ('10.5', 'Enable Anti-Exploitation Features', 'Enable anti-exploitation features on enterprise assets and software.', 'Malware Defense', 'Segurança', 3, true, 80),
  ('10.6', 'Centrally Manage Anti-Malware', 'Centrally manage anti-malware software.', 'Malware Defense', 'Segurança', 3, true, 81),
  ('10.7', 'Use Behavior-Based Anti-Malware', 'Use behavior-based anti-malware software.', 'Malware Defense', 'Segurança', 2, false, 82),
  
  -- Control 11: Data Recovery
  ('11.1', 'Establish Backup Process', 'Establish and maintain a data recovery process.', 'Data Recovery', 'TI', 3, true, 83),
  ('11.2', 'Perform Automated Backups', 'Perform automated backups of in-scope enterprise assets.', 'Data Recovery', 'TI', 3, true, 84),
  ('11.3', 'Protect Recovery Data', 'Protect recovery data with equivalent controls to the original data.', 'Data Recovery', 'TI', 3, true, 85),
  ('11.4', 'Test Data Recovery', 'Establish and maintain an isolated instance of recovery data.', 'Data Recovery', 'TI', 3, true, 86),
  ('11.5', 'Retain Backups', 'Retain backups in accordance with the enterprises data management process.', 'Data Recovery', 'Compliance', 3, true, 87),
  
  -- Control 12: Network Infrastructure Management
  ('12.1', 'Ensure Network Infrastructure', 'Ensure network infrastructure is up-to-date and secure.', 'Network Management', 'TI', 3, true, 88),
  ('12.2', 'Establish Network Boundary', 'Establish and maintain a secure network architecture.', 'Network Management', 'TI', 3, true, 89),
  ('12.3', 'Securely Manage Infrastructure', 'Securely manage network infrastructure.', 'Network Management', 'Segurança', 3, true, 90),
  ('12.4', 'Deny Communication Over Unauthorized', 'Deny communications with known malicious or unused Internet IP addresses.', 'Network Management', 'Segurança', 3, true, 91),
  ('12.5', 'Centralize Network Authentication', 'Centralize network authentication, authorization, and auditing (AAA).', 'Network Management', 'Segurança', 3, true, 92),
  ('12.6', 'Use Secure Network Management', 'Use secure network management and communication protocols.', 'Network Management', 'Segurança', 3, true, 93),
  ('12.7', 'Ensure Remote Devices Use VPN', 'Ensure remote devices utilize a VPN and are connecting to an enterprises AAA infrastructure.', 'Network Management', 'Segurança', 3, true, 94),
  ('12.8', 'Establish Process for Network', 'Establish and maintain dedicated computing resources for all administrative work.', 'Network Management', 'TI', 2, true, 95),
  
  -- Control 13: Network Monitoring and Defense
  ('13.1', 'Centralize Security Event Alerting', 'Centralize security event alerting across enterprise assets.', 'Network Monitoring', 'Segurança', 3, true, 96),
  ('13.2', 'Deploy Network-Based IDS', 'Deploy a network-based intrusion detection system (NIDS).', 'Network Monitoring', 'Segurança', 3, true, 97),
  ('13.3', 'Deploy Network-Based IPS', 'Deploy a network-based intrusion prevention system (NIPS).', 'Network Monitoring', 'Segurança', 3, true, 98),
  ('13.4', 'Perform Traffic Filtering', 'Perform traffic filtering between network segments.', 'Network Monitoring', 'Segurança', 3, true, 99),
  ('13.5', 'Manage Access Control for Assets', 'Manage access control for remote assets through a centralized AAA infrastructure.', 'Network Monitoring', 'Segurança', 3, true, 100),
  ('13.6', 'Collect Network Traffic Flow Logs', 'Collect network traffic flow logs and/or network traffic to review and alert upon.', 'Network Monitoring', 'Segurança', 3, true, 101),
  ('13.7', 'Deploy Host-Based IDS', 'Deploy a host-based intrusion detection system (HIDS).', 'Network Monitoring', 'Segurança', 2, true, 102),
  ('13.8', 'Deploy Network-Based DLP', 'Deploy a network-based Data Loss Prevention (DLP) solution.', 'Network Monitoring', 'Segurança', 2, false, 103),
  ('13.9', 'Deploy Port-Level Access Control', 'Deploy port-level access control utilizing 802.1x.', 'Network Monitoring', 'Segurança', 2, false, 104),
  ('13.10', 'Perform Application Layer Filtering', 'Perform application layer filtering.', 'Network Monitoring', 'Segurança', 2, false, 105),
  ('13.11', 'Tune Security Event Alerting', 'Tune security event alerting thresholds.', 'Network Monitoring', 'Segurança', 2, false, 106),
  
  -- Control 14: Security Awareness and Skills Training
  ('14.1', 'Establish Security Awareness Program', 'Establish and maintain a security awareness program.', 'Security Training', 'RH', 3, true, 107),
  ('14.2', 'Train Workforce Members', 'Train workforce members to recognize social engineering attacks.', 'Security Training', 'RH', 3, true, 108),
  ('14.3', 'Train Workforce on Authentication', 'Train workforce members on authentication best practices.', 'Security Training', 'RH', 3, true, 109),
  ('14.4', 'Train Workforce on Data Handling', 'Train workforce members on how to identify and properly store, transfer, and dispose of sensitive data.', 'Security Training', 'RH', 3, true, 110),
  ('14.5', 'Train Workforce on Causes of Data', 'Train workforce members on causes of unintentional data exposure.', 'Security Training', 'RH', 3, true, 111),
  ('14.6', 'Train Workforce on Recognizing Attacks', 'Train workforce members to recognize suspicious communications and report them.', 'Security Training', 'RH', 3, true, 112),
  ('14.7', 'Train Workforce on How to Identify', 'Train workforce on how to identify and report security incidents.', 'Security Training', 'RH', 3, true, 113),
  ('14.8', 'Train Workforce on Causes of Exposure', 'Train workforce on the dangers of connecting to and transmitting enterprise data over insecure networks.', 'Security Training', 'RH', 2, true, 114),
  ('14.9', 'Conduct Role-Specific Training', 'Conduct role-specific security awareness and skills training.', 'Security Training', 'RH', 2, true, 115),
  
  -- Control 15: Service Provider Management
  ('15.1', 'Establish Service Provider Process', 'Establish and maintain an inventory of service providers.', 'Service Provider Mgmt', 'Compliance', 3, true, 116),
  ('15.2', 'Establish Service Provider Assessment', 'Establish and maintain a service provider management policy.', 'Service Provider Mgmt', 'Compliance', 3, true, 117),
  ('15.3', 'Classify Service Providers', 'Classify service providers based on the sensitivity of data processed.', 'Service Provider Mgmt', 'Compliance', 3, true, 118),
  ('15.4', 'Ensure Service Providers Are', 'Ensure service providers are assessed prior to acquisition.', 'Service Provider Mgmt', 'Compliance', 3, true, 119),
  ('15.5', 'Assess Service Providers', 'Assess service providers consistent with the enterprises assessment process.', 'Service Provider Mgmt', 'Compliance', 3, true, 120),
  ('15.6', 'Monitor Service Providers', 'Monitor service providers for changes that may impact security.', 'Service Provider Mgmt', 'Compliance', 2, true, 121),
  ('15.7', 'Securely Decommission Providers', 'Securely decommission service providers when the relationship ends.', 'Service Provider Mgmt', 'Compliance', 2, true, 122),
  
  -- Control 16: Application Software Security
  ('16.1', 'Establish Secure Application Process', 'Establish and maintain a secure application development process.', 'Application Security', 'TI', 3, true, 123),
  ('16.2', 'Establish Process for Accepting Vulnerabilities', 'Establish and maintain a process to accept and address software vulnerabilities.', 'Application Security', 'TI', 3, true, 124),
  ('16.3', 'Perform Root Cause Analysis', 'Perform root cause analysis on security vulnerabilities.', 'Application Security', 'TI', 2, true, 125),
  ('16.4', 'Establish a Process for Secure App Dev', 'Establish and maintain a process to ensure acquired software is still supported by the vendor.', 'Application Security', 'TI', 3, true, 126),
  ('16.5', 'Use Up-to-Date Scanning Tools', 'Use up-to-date and trusted vulnerability scanning tools to ensure testing accuracy.', 'Application Security', 'Segurança', 3, true, 127),
  ('16.6', 'Establish Secure Coding Practices', 'Establish and maintain a severity rating system and process for application vulnerabilities.', 'Application Security', 'TI', 3, true, 128),
  ('16.7', 'Use Standard Hardening Configuration', 'Use standard hardening configuration templates for application infrastructure.', 'Application Security', 'TI', 3, true, 129),
  ('16.8', 'Separate Production and Non-Production', 'Maintain separate environments for production and non-production systems.', 'Application Security', 'TI', 3, true, 130),
  ('16.9', 'Train Developers in Application Security', 'Train developers in secure coding techniques.', 'Application Security', 'TI', 3, true, 131),
  ('16.10', 'Apply Secure Design Principles', 'Apply secure design principles in application architectures.', 'Application Security', 'TI', 2, true, 132),
  ('16.11', 'Leverage Vetted Modules', 'Leverage vetted modules or services for application security components.', 'Application Security', 'TI', 2, true, 133),
  ('16.12', 'Implement Code-Level Security Checks', 'Implement code-level security checks into the application during development.', 'Application Security', 'TI', 2, false, 134),
  ('16.13', 'Conduct Application Penetration Testing', 'Conduct application penetration testing.', 'Application Security', 'Segurança', 2, false, 135),
  ('16.14', 'Conduct Threat Modeling', 'Conduct threat modeling during application design.', 'Application Security', 'TI', 1, false, 136),
  
  -- Control 17: Incident Response Management
  ('17.1', 'Designate Incident Response Personnel', 'Designate personnel to manage incident handling.', 'Incident Response', 'Segurança', 3, true, 137),
  ('17.2', 'Establish Incident Response Process', 'Establish and maintain contact information for parties that need to be informed of security incidents.', 'Incident Response', 'Segurança', 3, true, 138),
  ('17.3', 'Establish Incident Response Plan', 'Establish and maintain an enterprise process for the reporting of security incidents.', 'Incident Response', 'Segurança', 3, true, 139),
  ('17.4', 'Establish Escalation Path', 'Establish and maintain an escalation path for incident response.', 'Incident Response', 'Segurança', 3, true, 140),
  ('17.5', 'Assign Key Roles and Responsibilities', 'Assign key roles and responsibilities for incident response.', 'Incident Response', 'Segurança', 3, true, 141),
  ('17.6', 'Define Response Mechanisms', 'Define mechanisms for communicating during incident response.', 'Incident Response', 'Segurança', 3, true, 142),
  ('17.7', 'Conduct Routine Incident Response', 'Conduct routine incident response exercises and scenarios.', 'Incident Response', 'Segurança', 2, true, 143),
  ('17.8', 'Conduct Post-Incident Reviews', 'Conduct post-incident reviews to improve response processes.', 'Incident Response', 'Segurança', 2, true, 144),
  ('17.9', 'Establish Incident Response Legal Team', 'Establish and maintain security incident thresholds.', 'Incident Response', 'Jurídico', 2, false, 145),
  
  -- Control 18: Penetration Testing
  ('18.1', 'Establish Penetration Testing Program', 'Establish and maintain a penetration testing program.', 'Penetration Testing', 'Segurança', 2, true, 146),
  ('18.2', 'Perform Periodic External Testing', 'Perform periodic external penetration tests.', 'Penetration Testing', 'Segurança', 2, true, 147),
  ('18.3', 'Remediate Penetration Test Findings', 'Remediate penetration test findings based on severity and impact.', 'Penetration Testing', 'TI', 2, true, 148),
  ('18.4', 'Validate Security Measures', 'Validate security measures after penetration tests.', 'Penetration Testing', 'Segurança', 2, true, 149),
  ('18.5', 'Perform Periodic Internal Testing', 'Perform periodic internal penetration tests.', 'Penetration Testing', 'Segurança', 2, false, 150),
  ('18.6', 'Use Qualified Penetration Testers', 'Use qualified penetration testers for testing activities.', 'Penetration Testing', 'Segurança', 1, false, 151),
  ('18.7', 'Conduct Red Team Exercises', 'Conduct red team exercises to test detective and responsive controls.', 'Penetration Testing', 'Segurança', 1, false, 152),
  ('18.8', 'Perform Application Security Testing', 'Perform application security testing prior to deployment.', 'Penetration Testing', 'Segurança', 1, false, 153)
) AS req(codigo, titulo, descricao, categoria, area_responsavel, peso, obrigatorio, ordem)
WHERE f.nome = 'CIS Controls' AND f.versao = 'v8';