-- Inserir requisitos CIS Controls v8 - Parte 1 (Controles 1-9, ~75 safeguards)
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
  -- Control 1: Inventory and Control of Enterprise Assets
  ('1.1', 'Establish Enterprise Asset Inventory', 'Establish and maintain detailed enterprise asset inventory of all enterprise assets with the potential to store or process data.', 'Asset Management', 'TI', 3, true, 1),
  ('1.2', 'Address Unauthorized Assets', 'Ensure that a process exists to address unauthorized assets on a weekly or more frequent basis.', 'Asset Management', 'TI', 3, true, 2),
  ('1.3', 'Utilize Asset Inventory Tool', 'Utilize an active discovery tool to identify assets connected to the enterprise network.', 'Asset Management', 'TI', 3, true, 3),
  ('1.4', 'Use Dynamic Host Configuration', 'Use Dynamic Host Configuration Protocol (DHCP) logging on all DHCP servers.', 'Asset Management', 'TI', 2, true, 4),
  ('1.5', 'Use Asset Management Tool', 'Use a passive asset discovery tool to identify assets connected to the enterprise network.', 'Asset Management', 'TI', 2, false, 5),
  
  -- Control 2: Inventory and Control of Software Assets
  ('2.1', 'Establish Software Inventory', 'Establish and maintain detailed software inventory with authorized software needed for business operations.', 'Software Management', 'TI', 3, true, 6),
  ('2.2', 'Authorized Software Registry', 'Ensure that only currently supported software is designated as authorized in the software inventory.', 'Software Management', 'TI', 3, true, 7),
  ('2.3', 'Address Unauthorized Software', 'Ensure that unauthorized software is either removed or the inventory is updated.', 'Software Management', 'TI', 3, true, 8),
  ('2.4', 'Utilize Automated Software Inventory', 'Utilize software inventory tools throughout the enterprise.', 'Software Management', 'TI', 3, true, 9),
  ('2.5', 'Allowlist Authorized Software', 'Use application allowlisting technology on all assets to ensure that only authorized software executes.', 'Software Management', 'TI', 3, true, 10),
  ('2.6', 'Allowlist Authorized Libraries', 'Use application allowlisting technology to prevent execution of unauthorized libraries and scripts.', 'Software Management', 'TI', 2, true, 11),
  ('2.7', 'Allowlist Authorized Scripts', 'Use application allowlisting technology on all assets to prevent execution of unauthorized scripts.', 'Software Management', 'TI', 2, false, 12),
  
  -- Control 3: Data Protection
  ('3.1', 'Establish Data Management Process', 'Establish and maintain a data management process including data retention policies.', 'Data Protection', 'Compliance', 3, true, 13),
  ('3.2', 'Establish Data Inventory', 'Establish and maintain a data inventory of sensitive data.', 'Data Protection', 'Compliance', 3, true, 14),
  ('3.3', 'Configure Data Access Control Lists', 'Configure data access control lists based on a users need to know.', 'Data Protection', 'Segurança', 3, true, 15),
  ('3.4', 'Enforce Data Retention', 'Retain data according to the enterprises data management process.', 'Data Protection', 'Compliance', 3, true, 16),
  ('3.5', 'Securely Dispose of Data', 'Securely dispose of data as outlined in the enterprises data management process.', 'Data Protection', 'TI', 3, true, 17),
  ('3.6', 'Encrypt Data on End-User Devices', 'Encrypt data on end-user devices containing sensitive data.', 'Data Protection', 'Segurança', 3, true, 18),
  ('3.7', 'Establish Secure Disposal Process', 'Establish and maintain a process for the secure disposal of electronic media.', 'Data Protection', 'TI', 3, true, 19),
  ('3.8', 'Document Data Flows', 'Document data flows for sensitive data.', 'Data Protection', 'Compliance', 2, true, 20),
  ('3.9', 'Encrypt Data on Removable Media', 'Encrypt data on removable media.', 'Data Protection', 'Segurança', 3, true, 21),
  ('3.10', 'Encrypt Sensitive Data in Transit', 'Encrypt sensitive data in transit using approved encryption protocols.', 'Data Protection', 'Segurança', 3, true, 22),
  ('3.11', 'Encrypt Sensitive Data at Rest', 'Encrypt sensitive data at rest on servers, applications, and databases.', 'Data Protection', 'Segurança', 3, true, 23),
  ('3.12', 'Segment Data Processing', 'Segment data processing and storage based on sensitivity of data.', 'Data Protection', 'TI', 2, true, 24),
  ('3.13', 'Deploy Dedicated Storage', 'Deploy a data loss prevention (DLP) solution to enforce data handling policies.', 'Data Protection', 'Segurança', 2, false, 25),
  ('3.14', 'Log Sensitive Data Access', 'Log sensitive data access including modification and disposal.', 'Data Protection', 'Segurança', 3, true, 26),
  
  -- Control 4: Secure Configuration of Enterprise Assets
  ('4.1', 'Establish Configuration Standards', 'Establish and maintain secure configuration standards.', 'Configuration Management', 'TI', 3, true, 27),
  ('4.2', 'Manage Default Accounts', 'Manage default accounts on enterprise assets.', 'Configuration Management', 'Segurança', 3, true, 28),
  ('4.3', 'Configure Automatic Updates', 'Configure automatic session locking on enterprise assets after a defined period of inactivity.', 'Configuration Management', 'TI', 3, true, 29),
  ('4.4', 'Implement Configuration Mgmt Process', 'Implement and follow a configuration management process.', 'Configuration Management', 'TI', 3, true, 30),
  ('4.5', 'Implement Automated Mgmt Tool', 'Implement automated configuration management tools.', 'Configuration Management', 'TI', 3, true, 31),
  ('4.6', 'Securely Manage Assets', 'Securely manage enterprise assets and software.', 'Configuration Management', 'TI', 3, true, 32),
  ('4.7', 'Manage Default Passwords', 'Manage default passwords on enterprise assets and software.', 'Configuration Management', 'Segurança', 3, true, 33),
  ('4.8', 'Uninstall Unnecessary Software', 'Uninstall or disable unnecessary services on enterprise assets.', 'Configuration Management', 'TI', 3, true, 34),
  ('4.9', 'Configure Trusted DNS Servers', 'Configure trusted DNS servers on enterprise assets.', 'Configuration Management', 'TI', 2, true, 35),
  ('4.10', 'Enforce Automatic Device Lockout', 'Enforce automatic device lockout on portable end-user devices.', 'Configuration Management', 'Segurança', 3, true, 36),
  ('4.11', 'Enforce Remote Wipe Capability', 'Enforce remote wipe capability on portable end-user devices.', 'Configuration Management', 'Segurança', 2, true, 37),
  ('4.12', 'Separate Network Infrastructure', 'Separate enterprise workstations from enterprise servers on different network segments.', 'Configuration Management', 'TI', 2, false, 38),
  
  -- Control 5: Account Management
  ('5.1', 'Establish Account Management Process', 'Establish and maintain an inventory of all accounts.', 'Account Management', 'Segurança', 3, true, 39),
  ('5.2', 'Use Unique Passwords', 'Use unique passwords for all accounts.', 'Account Management', 'Segurança', 3, true, 40),
  ('5.3', 'Disable Dormant Accounts', 'Delete or disable any dormant accounts after a period of 45 days of inactivity.', 'Account Management', 'Segurança', 3, true, 41),
  ('5.4', 'Restrict Administrator Privileges', 'Restrict administrator privileges to dedicated administrator accounts.', 'Account Management', 'Segurança', 3, true, 42),
  ('5.5', 'Establish Centralized Account Mgmt', 'Establish and maintain an enterprise-wide account management system.', 'Account Management', 'TI', 3, true, 43),
  ('5.6', 'Centralize Account Management', 'Centralize account management through a directory or identity service.', 'Account Management', 'TI', 3, true, 44),
  
  -- Control 6: Access Control Management
  ('6.1', 'Establish Access Granting Process', 'Establish and follow a process for granting access to enterprise assets.', 'Access Control', 'Segurança', 3, true, 45),
  ('6.2', 'Establish Access Revoking Process', 'Establish and follow a process for revoking access to enterprise assets.', 'Access Control', 'Segurança', 3, true, 46),
  ('6.3', 'Require MFA', 'Require multi-factor authentication (MFA) for all access to the CDE.', 'Access Control', 'Segurança', 3, true, 47),
  ('6.4', 'Require MFA for Remote Access', 'Require MFA for remote network access.', 'Access Control', 'Segurança', 3, true, 48),
  ('6.5', 'Require MFA for Admin Access', 'Require MFA for administrative access.', 'Access Control', 'Segurança', 3, true, 49),
  ('6.6', 'Establish Access Based on Need', 'Establish and follow a process for granting access based on need-to-know.', 'Access Control', 'Segurança', 3, true, 50),
  ('6.7', 'Centralize Access Control', 'Centralize access control for all enterprise assets through a directory service.', 'Access Control', 'TI', 3, true, 51),
  ('6.8', 'Define Access Roles', 'Define and maintain role-based access control through determining and documenting roles.', 'Access Control', 'Compliance', 2, true, 52),
  
  -- Control 7: Continuous Vulnerability Management
  ('7.1', 'Establish Vulnerability Scanning', 'Establish and maintain a vulnerability management process.', 'Vulnerability Management', 'Segurança', 3, true, 53),
  ('7.2', 'Remediate Vulnerabilities', 'Establish a process for remediating vulnerabilities on enterprise assets.', 'Vulnerability Management', 'TI', 3, true, 54),
  ('7.3', 'Perform Automated Scanning', 'Perform automated vulnerability scans of enterprise assets.', 'Vulnerability Management', 'Segurança', 3, true, 55),
  ('7.4', 'Perform Authenticated Scanning', 'Perform authenticated vulnerability scans.', 'Vulnerability Management', 'Segurança', 3, true, 56),
  ('7.5', 'Perform Automated Patch Mgmt', 'Perform automated operating system patch management.', 'Vulnerability Management', 'TI', 3, true, 57),
  ('7.6', 'Perform Software Patch Mgmt', 'Perform automated application patch management.', 'Vulnerability Management', 'TI', 3, true, 58),
  ('7.7', 'Remediate High-Risk Vulnerabilities', 'Remediate detected vulnerabilities in software through processes and tooling.', 'Vulnerability Management', 'TI', 3, true, 59),
  
  -- Control 8: Audit Log Management
  ('8.1', 'Establish Audit Log Process', 'Establish and maintain an audit log management process.', 'Audit Logging', 'Segurança', 3, true, 60),
  ('8.2', 'Collect Audit Logs', 'Collect audit logs across enterprise assets.', 'Audit Logging', 'Segurança', 3, true, 61),
  ('8.3', 'Standardize Time Synchronization', 'Standardize time synchronization across enterprise assets.', 'Audit Logging', 'TI', 3, true, 62),
  ('8.4', 'Standardize Logs', 'Standardize log formats across enterprise assets.', 'Audit Logging', 'TI', 2, true, 63),
  ('8.5', 'Collect Detailed Logs', 'Collect detailed audit logs across enterprise assets.', 'Audit Logging', 'Segurança', 3, true, 64),
  ('8.6', 'Collect DNS Query Logs', 'Collect DNS query audit logs across enterprise assets.', 'Audit Logging', 'Segurança', 2, true, 65),
  ('8.7', 'Collect URL Request Logs', 'Collect URL request audit logs across enterprise assets.', 'Audit Logging', 'Segurança', 2, true, 66),
  ('8.8', 'Collect Logs from Cloud Services', 'Collect audit logs from enterprise assets and software deployed in cloud environments.', 'Audit Logging', 'TI', 3, true, 67),
  ('8.9', 'Centralize Logs', 'Centralize audit logs across enterprise assets.', 'Audit Logging', 'Segurança', 3, true, 68),
  ('8.10', 'Retain Logs', 'Retain audit logs across enterprise assets for a minimum of 90 days.', 'Audit Logging', 'Compliance', 3, true, 69),
  ('8.11', 'Conduct Log Reviews', 'Conduct reviews of audit logs to detect anomalies or abnormal events.', 'Audit Logging', 'Segurança', 3, true, 70),
  ('8.12', 'Collect Service Provider Logs', 'Collect service provider logs.', 'Audit Logging', 'Compliance', 2, false, 71),
  
  -- Control 9: Email and Web Browser Protections
  ('9.1', 'Ensure Email Security', 'Ensure that only fully supported web browsers and email clients are allowed.', 'Email & Web Security', 'Segurança', 3, true, 72),
  ('9.2', 'Use DNS Filtering Services', 'Use DNS filtering services on all enterprise assets to block access to known malicious domains.', 'Email & Web Security', 'Segurança', 3, true, 73),
  ('9.3', 'Maintain Email Protections', 'Maintain and enforce network-based URL filters on all enterprise assets.', 'Email & Web Security', 'Segurança', 3, true, 74),
  ('9.4', 'Restrict Unnecessary Browser Plugins', 'Restrict unnecessary browser and email client extensions.', 'Email & Web Security', 'Segurança', 3, true, 75)
) AS req(codigo, titulo, descricao, categoria, area_responsavel, peso, obrigatorio, ordem)
WHERE f.nome = 'CIS Controls' AND f.versao = 'v8';