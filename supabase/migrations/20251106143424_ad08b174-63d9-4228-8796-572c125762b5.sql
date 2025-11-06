-- Atualizar todos os frameworks padrão/referência conhecidos
UPDATE gap_analysis_frameworks 
SET tipo = 'padrao'
WHERE nome IN (
  -- ISO Standards
  'ISO/IEC 27001', 'ISO/IEC 27701', 'ISO/IEC 20000',
  'ISO 9001', 'ISO 31000', 'ISO 14001', 'ISO 37301',
  
  -- Privacy Regulations
  'LGPD', 'GDPR', 'HIPAA',
  
  -- Security Frameworks
  'NIST CSF', 'PCI DSS', 'CIS Controls', 'SOC 2',
  
  -- Governance & IT
  'COBIT', 'ITIL',
  
  -- Internal Controls & Risk
  'COSO Internal Control', 'COSO ERM', 'SOX'
);