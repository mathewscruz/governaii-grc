/**
 * Single source of truth for framework short descriptions.
 * Used in PageHeader, FrameworkCatalog and onboarding fallback.
 */
export const FRAMEWORK_DESCRIPTIONS: Record<string, string> = {
  'ISO/IEC 27001': 'Padrão internacional para gestão de segurança da informação (SGSI) com 117 requisitos.',
  'ISO 27001': 'Padrão internacional para gestão de segurança da informação (SGSI) com 117 requisitos.',
  'NIST CSF 2.0': 'Framework de cibersegurança do NIST: Governar, Identificar, Proteger, Detectar, Responder e Recuperar.',
  'NIST CSF': 'Framework de cibersegurança do NIST com 6 pilares e 116 subcategorias.',
  'PCI DSS': 'Padrão de segurança para empresas que processam dados de cartões de pagamento — 12 requisitos em 6 domínios.',
  'PCI DSS 4.0': 'Padrão de segurança para empresas que processam dados de cartões de pagamento — 12 requisitos em 6 domínios.',
  'CIS Controls': 'Controles priorizados de cibersegurança organizados em 18 controles e 3 grupos de implementação.',
  'CIS Controls v8': 'Controles priorizados de cibersegurança organizados em 18 controles e 3 grupos de implementação.',
  'HIPAA': 'Lei americana de proteção de dados de saúde com salvaguardas administrativas, físicas e técnicas.',
  'GDPR': 'Regulamento europeu de proteção de dados pessoais — 99 artigos organizados em 11 capítulos.',
  'SOC 2': 'Framework de auditoria baseado em Trust Services Criteria: Security, Availability, Confidentiality, Privacy e Processing Integrity.',
  'LGPD': 'Lei Geral de Proteção de Dados — conformidade obrigatória para empresas que tratam dados pessoais no Brasil.',
  'ISO 9001': 'Padrão internacional para Sistemas de Gestão da Qualidade (SGQ) — ciclo PDCA.',
  'ISO 9001:2015': 'Padrão internacional para Sistemas de Gestão da Qualidade (SGQ) — ciclo PDCA.',
  'ISO 27701': 'Extensão da ISO 27001 focada em gestão de privacidade, alinhada à LGPD e GDPR.',
  'ISO/IEC 27701': 'Extensão da ISO 27001 focada em gestão de privacidade, alinhada à LGPD e GDPR.',
  'NIS2': 'Diretiva europeia de cibersegurança para entidades essenciais e importantes — 45 requisitos.',
  'ISO 14001': 'Padrão internacional para Sistemas de Gestão Ambiental (SGA) — ciclo PDCA.',
  'ISO 14001:2015': 'Padrão internacional para Sistemas de Gestão Ambiental (SGA) — ciclo PDCA.',
  'ISO 37301': 'Padrão internacional para Sistemas de Gestão de Compliance — foco em integridade e ética.',
  'ISO 37301:2021': 'Padrão internacional para Sistemas de Gestão de Compliance — foco em integridade e ética.',
  'COBIT': 'Framework de governança e gestão de TI — 5 domínios e 40 processos.',
  'COBIT 2019': 'Framework de governança e gestão de TI — 5 domínios e 40 processos.',
  'ISO 20000': 'Padrão internacional para Gestão de Serviços de TI, alinhado com ITIL.',
  'ISO/IEC 20000': 'Padrão internacional para Gestão de Serviços de TI, alinhado com ITIL.',
  'ITIL': 'Framework de melhores práticas para gestão de serviços de TI — 34 práticas.',
  'ITIL 4': 'Framework de melhores práticas para gestão de serviços de TI — 34 práticas.',
  'SOX': 'Sarbanes-Oxley Act — controles internos sobre relatórios financeiros para empresas de capital aberto.',
  'ISO 31000': 'Diretrizes internacionais para gestão de riscos — princípios, framework e processo.',
  'ISO 31000:2018': 'Diretrizes internacionais para gestão de riscos — princípios, framework e processo.',
  'CCPA': 'California Consumer Privacy Act — proteção de privacidade dos consumidores da Califórnia.',
  'COSO ERM': 'Framework de gestão de riscos corporativos — integra estratégia e desempenho.',
  'COSO IC': 'Framework de controles internos — 5 componentes e 17 princípios.',
  'COSO': 'Framework de referência para controles internos e gestão de riscos corporativos.',
};

export function getFrameworkDescription(nome: string, tipo?: string, fallback?: string): string {
  if (fallback) return fallback;
  return FRAMEWORK_DESCRIPTIONS[nome] || `Avaliação de conformidade ${tipo || ''}`.trim();
}
