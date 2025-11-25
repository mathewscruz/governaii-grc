-- Inserir requisitos PCI DSS 4.0 (64 requisitos detalhados)
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
  -- Build and Maintain a Secure Network and Systems
  ('1.1', 'Install and Maintain Network Security Controls', 'Install and maintain network security controls (NSCs) to protect data in network environments.', 'Network Security', 'Segurança', 3, true, 1),
  ('1.1.1', 'Security Policies and Procedures', 'Processes and mechanisms for installing and maintaining network security controls are defined and documented.', 'Network Security', 'Segurança', 3, true, 2),
  ('1.2', 'Configure Network Security Controls', 'Network security controls (NSCs) are configured and maintained to restrict network connections and traffic.', 'Network Security', 'Segurança', 3, true, 3),
  ('1.2.1', 'Configuration Standards', 'Configuration standards are defined and implemented for NSCs.', 'Network Security', 'Segurança', 3, true, 4),
  ('1.2.2', 'Inbound Traffic Restriction', 'All inbound traffic from untrusted networks to trusted networks is restricted.', 'Network Security', 'Segurança', 3, true, 5),
  ('1.2.3', 'Outbound Traffic Restriction', 'All outbound traffic from the CDE is restricted.', 'Network Security', 'Segurança', 3, true, 6),
  ('1.2.4', 'Anti-Spoofing Measures', 'Anti-spoofing measures are implemented to detect and block forged source IP addresses.', 'Network Security', 'Segurança', 3, true, 7),
  ('1.2.5', 'Network Segmentation', 'The cardholder data environment is segmented from all other networks.', 'Network Security', 'Segurança', 3, true, 8),
  ('1.3', 'Network Access Control', 'Network access to and from the cardholder data environment is controlled.', 'Network Security', 'Segurança', 3, true, 9),
  ('1.3.1', 'Direct Access Restriction', 'Inbound traffic to the CDE is restricted as necessary such that only traffic from explicitly authorized IP addresses is permitted.', 'Network Security', 'Segurança', 3, true, 10),
  ('1.4', 'Wireless Security', 'Network connections between trusted and untrusted networks are controlled.', 'Network Security', 'Segurança', 3, true, 11),
  ('1.4.1', 'Wireless Standards', 'NSCs are implemented on wireless networks connected to the CDE or transmitting account data.', 'Network Security', 'Segurança', 3, true, 12),
  ('1.5', 'Security Configuration', 'Risks to the CDE from computing devices that are able to connect to both untrusted networks and the CDE are mitigated.', 'Network Security', 'Segurança', 3, true, 13),
  ('2.1', 'Secure Configuration Standards', 'Processes and mechanisms for implementing secure configurations for all system components are defined and understood.', 'System Configuration', 'TI', 3, true, 14),
  ('2.2', 'Vendor Defaults Management', 'System components are configured and managed securely and in accordance with industry-accepted hardening standards.', 'System Configuration', 'TI', 3, true, 15),
  ('2.2.1', 'Change Default Passwords', 'Vendor-supplied defaults are changed before a system component is connected to an untrusted network or the CDE.', 'System Configuration', 'TI', 3, true, 16),
  ('2.2.2', 'Remove Unnecessary Services', 'All unnecessary functionality is removed or disabled on system components.', 'System Configuration', 'TI', 3, true, 17),
  ('2.2.3', 'Primary Function Per Server', 'Primary functions requiring different security levels are managed via different system components or network segments.', 'System Configuration', 'TI', 2, true, 18),
  ('2.2.4', 'System Hardening', 'Industry-recognized hardening standards are applied to all system components.', 'System Configuration', 'TI', 3, true, 19),
  ('2.2.5', 'Configuration Management', 'Configuration management standards for system components are defined and implemented.', 'System Configuration', 'TI', 3, true, 20),
  
  -- Protect Account Data
  ('3.1', 'Account Data Storage', 'Processes and mechanisms for protecting stored account data are defined and understood.', 'Data Protection', 'Compliance', 3, true, 21),
  ('3.2', 'Data Retention Policy', 'Storage of account data is kept to a minimum through implementation of data retention and disposal policies.', 'Data Protection', 'Compliance', 3, true, 22),
  ('3.2.1', 'Minimize Data Storage', 'Account data storage is kept to a minimum through implementation of data retention policies.', 'Data Protection', 'Compliance', 3, true, 23),
  ('3.3', 'Sensitive Authentication Data', 'Sensitive authentication data (SAD) is not stored after authorization.', 'Data Protection', 'Compliance', 3, true, 24),
  ('3.3.1', 'Full Track Data', 'Sensitive authentication data is not retained after authorization.', 'Data Protection', 'Compliance', 3, true, 25),
  ('3.3.2', 'Card Verification Code', 'The card verification code or value is not retained after authorization.', 'Data Protection', 'Compliance', 3, true, 26),
  ('3.3.3', 'PIN and PIN Block', 'PINs and PIN blocks are not retained after authorization.', 'Data Protection', 'Compliance', 3, true, 27),
  ('3.4', 'PAN Protection', 'Access to displays of full primary account number (PAN) is restricted.', 'Data Protection', 'Compliance', 3, true, 28),
  ('3.4.1', 'PAN Masking', 'PAN is masked when displayed such that only personnel with a legitimate business need can see more than the first six and last four digits.', 'Data Protection', 'Compliance', 3, true, 29),
  ('3.5', 'PAN Rendering', 'Primary account number (PAN) is secured wherever it is stored.', 'Data Protection', 'Segurança', 3, true, 30),
  ('3.5.1', 'Disk Encryption', 'PAN is rendered unreadable anywhere it is stored through cryptographic methods.', 'Data Protection', 'Segurança', 3, true, 31),
  ('3.6', 'Cryptographic Keys', 'Cryptographic keys used to protect stored account data are secured.', 'Data Protection', 'Segurança', 3, true, 32),
  ('3.6.1', 'Key Management Procedures', 'Procedures are defined and implemented to protect cryptographic keys used to protect stored account data.', 'Data Protection', 'Segurança', 3, true, 33),
  ('3.7', 'Cryptographic Key Security', 'Where cryptography is used to protect stored account data, key management processes are in place.', 'Data Protection', 'Segurança', 3, true, 34),
  ('4.1', 'Transmission Security', 'Processes and mechanisms for protecting account data with strong cryptography during transmission over open, public networks are defined and documented.', 'Data Transmission', 'Segurança', 3, true, 35),
  ('4.2', 'Encryption in Transit', 'PAN is protected with strong cryptography whenever it is transmitted over open, public networks.', 'Data Transmission', 'Segurança', 3, true, 36),
  ('4.2.1', 'Strong Cryptography', 'Strong cryptography and security protocols are implemented to safeguard PAN during transmission.', 'Data Transmission', 'Segurança', 3, true, 37),
  
  -- Maintain a Vulnerability Management Program
  ('5.1', 'Malware Protection', 'Processes and mechanisms for protecting all systems and networks from malicious software are defined and understood.', 'Vulnerability Management', 'Segurança', 3, true, 38),
  ('5.2', 'Anti-Malware Software', 'Malicious software (malware) is prevented, detected, and addressed.', 'Vulnerability Management', 'Segurança', 3, true, 39),
  ('5.2.1', 'Anti-Malware Deployment', 'Anti-malware software is deployed on all system components, except those for which the entity has an accepted risk showing the system is not at risk from malware.', 'Vulnerability Management', 'Segurança', 3, true, 40),
  ('5.3', 'Anti-Malware Updates', 'Anti-malware mechanisms and processes are active, maintained, and monitored.', 'Vulnerability Management', 'Segurança', 3, true, 41),
  ('5.3.1', 'Anti-Malware Currency', 'Anti-malware software is kept current via automatic updates.', 'Vulnerability Management', 'Segurança', 3, true, 42),
  ('5.4', 'Phishing Protection', 'Anti-phishing mechanisms protect users against phishing attacks.', 'Vulnerability Management', 'Segurança', 2, true, 43),
  ('6.1', 'Vulnerability Management Process', 'Processes and mechanisms for identifying and addressing security vulnerabilities are defined and understood.', 'Vulnerability Management', 'Segurança', 3, true, 44),
  ('6.2', 'Security Patches', 'Bespoke and custom software are developed securely.', 'Vulnerability Management', 'TI', 3, true, 45),
  ('6.3', 'Secure Development', 'Security vulnerabilities are identified and addressed.', 'Vulnerability Management', 'TI', 3, true, 46),
  ('6.3.1', 'Vulnerability Identification', 'Security vulnerabilities are identified and managed through a vulnerability management program.', 'Vulnerability Management', 'Segurança', 3, true, 47),
  ('6.3.2', 'Critical Patches', 'An inventory of system components is maintained.', 'Vulnerability Management', 'TI', 3, true, 48),
  ('6.4', 'Public-Facing Applications', 'Public-facing web applications are protected against attacks.', 'Vulnerability Management', 'Segurança', 3, true, 49),
  ('6.5', 'Change Control', 'Changes to all system components are managed securely.', 'Vulnerability Management', 'TI', 3, true, 50),
  
  -- Implement Strong Access Control Measures
  ('7.1', 'Access Control Systems', 'Processes and mechanisms for limiting access to system components and cardholder data by business need to know are defined and understood.', 'Access Control', 'Segurança', 3, true, 51),
  ('7.2', 'User Access Management', 'Access to system components and data is appropriately defined and assigned.', 'Access Control', 'Segurança', 3, true, 52),
  ('7.3', 'Least Privilege', 'Access to system components and data is managed via an access control system(s).', 'Access Control', 'Segurança', 3, true, 53),
  ('8.1', 'User Identification', 'Processes and mechanisms for identifying users and authenticating access to system components are defined and understood.', 'Authentication', 'Segurança', 3, true, 54),
  ('8.2', 'User Authentication', 'User identity is verified before granting access to system components.', 'Authentication', 'Segurança', 3, true, 55),
  ('8.3', 'Multi-Factor Authentication', 'Strong authentication for users and administrators is established and managed.', 'Authentication', 'Segurança', 3, true, 56),
  ('8.4', 'MFA Implementation', 'Multi-factor authentication (MFA) is implemented to secure access into the CDE.', 'Authentication', 'Segurança', 3, true, 57),
  ('8.5', 'Password Requirements', 'Multi-factor authentication (MFA) systems are configured to prevent misuse.', 'Authentication', 'Segurança', 3, true, 58),
  ('8.6', 'Application Authentication', 'Use of application and system accounts and associated authentication factors is strictly managed.', 'Authentication', 'TI', 3, true, 59),
  ('9.1', 'Physical Access Controls', 'Processes and mechanisms for restricting physical access to cardholder data are defined and understood.', 'Physical Security', 'Facilities', 3, true, 60),
  ('9.2', 'Physical Security Controls', 'Physical access to the CDE is controlled.', 'Physical Security', 'Facilities', 3, true, 61),
  ('9.3', 'Physical Access Monitoring', 'Physical access to sensitive areas is controlled and monitored.', 'Physical Security', 'Facilities', 3, true, 62),
  
  -- Regularly Monitor and Test Networks + Maintain Information Security Policy
  ('10.1', 'Logging and Monitoring', 'Processes and mechanisms for logging and monitoring all access to system components and cardholder data are defined and documented.', 'Monitoring', 'Segurança', 3, true, 63),
  ('10.2', 'Audit Trails', 'Audit logs are implemented to support the detection of anomalies and suspicious activity.', 'Monitoring', 'Segurança', 3, true, 64)
) AS req(codigo, titulo, descricao, categoria, area_responsavel, peso, obrigatorio, ordem)
WHERE f.nome = 'PCI DSS' AND f.versao = '4.0';