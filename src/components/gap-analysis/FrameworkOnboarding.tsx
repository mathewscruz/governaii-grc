import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, Target, Lightbulb, ArrowRight, Shield, Scale, Lock, Users, Award, Database, FileCheck, Globe, Server, Landmark, Settings, Layers } from 'lucide-react';

interface FrameworkOnboardingProps {
  frameworkNome: string;
  frameworkVersao: string;
  frameworkTipo: string;
  totalRequirements: number;
  onStart: () => void;
}

interface FrameworkInfo {
  icon: React.ReactNode;
  description: string;
  timeEstimate: string;
  steps: string[];
  quickTips: string[];
}

interface FrameworkBenefits {
  audience: string;
  benefits: string[];
}

interface OnboardingData {
  info: FrameworkInfo;
  benefits: FrameworkBenefits;
}

function getOnboardingData(nome: string, tipo: string, total: number): OnboardingData {
  const lower = nome.toLowerCase();

  // ISO 27001
  if (lower.includes('iso') && nome.includes('27001')) {
    return {
      info: {
        icon: <Shield className="h-8 w-8 text-primary" />,
        description: 'A ISO/IEC 27001 é o padrão internacional para Sistemas de Gestão de Segurança da Informação (SGSI). Ela define requisitos para estabelecer, implementar, manter e melhorar continuamente a segurança da informação.',
        timeEstimate: '3 a 6 meses para primeira avaliação completa',
        steps: [
          'Comece pelos requisitos do SGSI (Cláusulas 4 a 10) — são a base obrigatória',
          'Em seguida, avalie os controles do Anexo A aplicáveis ao seu contexto',
          'Foque primeiro nos controles organizacionais (A.5) pois são documentais',
          'Deixe controles tecnológicos (A.8) por último pois exigem evidências técnicas',
        ],
        quickTips: [
          'Se você já tem uma política de segurança, vários requisitos do capítulo 5 provavelmente já são "Parcial"',
          'Requisitos marcados como "Não Aplicável" precisam de justificativa formal (SoA)',
          'Comece documentando o que já existe antes de criar novos processos',
        ],
      },
      benefits: {
        audience: 'Empresas que tratam informações sensíveis de clientes, parceiros ou que participam de licitações e contratos que exigem certificação.',
        benefits: ['Diferencial competitivo em licitações e contratos corporativos', 'Redução comprovada de incidentes de segurança', 'Conformidade com requisitos regulatórios (LGPD, SOX, etc.)', 'Certificação reconhecida internacionalmente'],
      },
    };
  }

  // NIST CSF
  if (lower.includes('nist')) {
    return {
      info: {
        icon: <Target className="h-8 w-8 text-primary" />,
        description: 'O NIST Cybersecurity Framework (CSF) organiza práticas de segurança em 6 funções: Governar, Identificar, Proteger, Detectar, Responder e Recuperar. É flexível e baseado em maturidade.',
        timeEstimate: '2 a 4 meses para avaliação inicial',
        steps: [
          'Inicie pelo pilar "GOVERN" — é a base de governança e direcionamento',
          'Avalie "IDENTIFY" para mapear ativos e riscos conhecidos',
          'Depois avance para "PROTECT" e "DETECT" em paralelo',
          '"RESPOND" e "RECOVER" geralmente dependem dos anteriores',
        ],
        quickTips: [
          'O NIST usa escala de maturidade (0-5), não binário conforme/não conforme',
          'Nível 2-3 já é considerado adequado para maioria das organizações',
          'Foque em ter processos documentados e repetíveis para subir de nível',
        ],
      },
      benefits: {
        audience: 'Organizações que buscam melhorar continuamente sua postura de cibersegurança, especialmente empresas com operações nos EUA.',
        benefits: ['Framework flexível e adaptável ao tamanho da organização', 'Linguagem comum para comunicar riscos para a alta direção', 'Alinhamento com requisitos de clientes internacionais', 'Base para implementação de outras certificações'],
      },
    };
  }

  // LGPD
  if (lower.includes('lgpd')) {
    return {
      info: {
        icon: <Scale className="h-8 w-8 text-primary" />,
        description: 'A LGPD (Lei Geral de Proteção de Dados) regulamenta o tratamento de dados pessoais no Brasil. A conformidade é obrigatória para todas as empresas que tratam dados de pessoas físicas.',
        timeEstimate: '2 a 3 meses para avaliação completa',
        steps: [
          'Comece mapeando as bases legais de tratamento (Art. 7)',
          'Avalie os direitos dos titulares (Art. 18) — são os mais cobrados pela ANPD',
          'Verifique medidas de segurança (Art. 46) e governança (Art. 50)',
          'Documente o processo de notificação de incidentes (Art. 48)',
        ],
        quickTips: [
          'Se você já tem um DPO/Encarregado nomeado, vários itens já são "Parcial"',
          'Política de Privacidade publicada cobre múltiplos requisitos',
          'Mapeamento de dados (ROPA) é evidência para diversos artigos',
        ],
      },
      benefits: {
        audience: 'Toda empresa que coleta, armazena ou processa dados pessoais de pessoas físicas no Brasil — obrigatório por lei desde 2020.',
        benefits: ['Evitar multas de até 2% do faturamento (R$ 50 milhões por infração)', 'Transparência e confiança com clientes e parceiros', 'Redução de riscos de vazamento de dados', 'Conformidade legal perante a ANPD'],
      },
    };
  }

  // PCI DSS
  if (lower.includes('pci')) {
    return {
      info: {
        icon: <Lock className="h-8 w-8 text-primary" />,
        description: 'O PCI DSS (Payment Card Industry Data Security Standard) define requisitos de segurança para empresas que processam, armazenam ou transmitem dados de cartões de pagamento.',
        timeEstimate: '3 a 6 meses para avaliação completa',
        steps: [
          'Identifique o escopo: quais sistemas tocam dados de cartão (CDE)',
          'Comece pelos controles de rede e firewall (Req. 1-2)',
          'Avalie proteção de dados armazenados e em trânsito (Req. 3-4)',
          'Finalize com monitoramento, testes e políticas (Req. 10-12)',
        ],
        quickTips: [
          'Reduzir o escopo do CDE é a forma mais eficiente de acelerar a conformidade',
          'Tokenização e criptografia eliminam vários requisitos de uma vez',
          'Evidências de scan de vulnerabilidade (ASV) são obrigatórias trimestralmente',
        ],
      },
      benefits: {
        audience: 'Empresas que processam pagamentos com cartão de crédito/débito, e-commerces, gateways e processadores.',
        benefits: ['Aceitar pagamentos com cartão de forma segura', 'Evitar multas das bandeiras de cartão', 'Redução de fraudes e chargebacks', 'Confiança do consumidor em transações online'],
      },
    };
  }

  // SOC 2
  if (lower.includes('soc')) {
    return {
      info: {
        icon: <FileCheck className="h-8 w-8 text-primary" />,
        description: 'O SOC 2 avalia controles de uma organização de serviços baseado nos Trust Services Criteria: Security, Availability, Processing Integrity, Confidentiality e Privacy.',
        timeEstimate: '3 a 6 meses para primeira avaliação',
        steps: [
          'Security (CC) é obrigatório — comece por ele',
          'Avalie Availability se oferece SLAs de uptime',
          'Confidentiality para dados sensíveis de clientes',
          'Privacy se processa dados pessoais (PII)',
        ],
        quickTips: [
          'SOC 2 Type I avalia design dos controles; Type II avalia eficácia operacional',
          'Comece com Type I e evolua para Type II no ano seguinte',
          'Muitos controles de Security já cobrem outros critérios',
        ],
      },
      benefits: {
        audience: 'Empresas SaaS, provedores de serviços em nuvem e qualquer organização que processa dados de terceiros.',
        benefits: ['Requisito comercial para vender para empresas americanas', 'Diferencial competitivo no mercado SaaS', 'Demonstra maturidade de controles internos', 'Base para outras certificações (ISO 27001, etc.)'],
      },
    };
  }

  // GDPR
  if (lower.includes('gdpr')) {
    return {
      info: {
        icon: <Globe className="h-8 w-8 text-primary" />,
        description: 'O GDPR (General Data Protection Regulation) é a lei europeia de proteção de dados, aplicável a qualquer empresa que trata dados de residentes da UE.',
        timeEstimate: '3 a 5 meses para avaliação completa',
        steps: [
          'Avalie os princípios de tratamento (Art. 5) — são a base de tudo',
          'Mapeie bases legais de processamento (Art. 6)',
          'Verifique direitos dos titulares (Art. 12-23)',
          'Avalie transferências internacionais de dados (Art. 44-49)',
        ],
        quickTips: [
          'Se já é conforme com a LGPD, grande parte do GDPR já está coberta',
          'DPIAs (Art. 35) são obrigatórias para processamento de alto risco',
          'Multas podem chegar a 4% do faturamento global anual',
        ],
      },
      benefits: {
        audience: 'Empresas que oferecem produtos/serviços para cidadãos europeus ou monitoram seu comportamento.',
        benefits: ['Acesso ao mercado europeu sem restrições', 'Proteção contra multas severas', 'Confiança de clientes internacionais', 'Alinhamento com melhores práticas globais de privacidade'],
      },
    };
  }

  // HIPAA
  if (lower.includes('hipaa')) {
    return {
      info: {
        icon: <Database className="h-8 w-8 text-primary" />,
        description: 'O HIPAA (Health Insurance Portability and Accountability Act) protege informações de saúde (PHI) nos EUA, exigindo salvaguardas administrativas, físicas e técnicas.',
        timeEstimate: '3 a 6 meses para avaliação completa',
        steps: [
          'Comece pelas Salvaguardas Administrativas — são as mais abrangentes',
          'Avalie as Salvaguardas Técnicas (criptografia, controle de acesso)',
          'Verifique as Salvaguardas Físicas (instalações e estações de trabalho)',
          'Documente análise de risco e plano de contingência',
        ],
        quickTips: [
          'BAAs (Business Associate Agreements) são obrigatórios com todos os parceiros',
          'Criptografia de PHI em repouso e em trânsito é requisito fundamental',
          'Treinamento anual de funcionários é obrigatório',
        ],
      },
      benefits: {
        audience: 'Empresas de saúde, planos de saúde, e qualquer parceiro que trate dados de saúde protegidos (PHI) nos EUA.',
        benefits: ['Conformidade legal obrigatória no setor de saúde americano', 'Proteção contra multas de até US$ 1,9 milhão por violação', 'Confiança de pacientes e parceiros', 'Proteção de dados sensíveis de saúde'],
      },
    };
  }

  // CIS Controls
  if (lower.includes('cis')) {
    return {
      info: {
        icon: <Shield className="h-8 w-8 text-primary" />,
        description: 'Os CIS Controls são um conjunto priorizado de ações de cibersegurança que formam um roteiro prático para defesa contra os ataques mais comuns.',
        timeEstimate: '2 a 4 meses para avaliação inicial',
        steps: [
          'Comece pelos controles do Implementation Group 1 (IG1) — são os essenciais',
          'Avalie inventário de ativos de hardware e software (CIS 1-2)',
          'Verifique proteção de dados e configuração segura (CIS 3-4)',
          'Evolua para IG2 e IG3 conforme maturidade',
        ],
        quickTips: [
          'IG1 é o mínimo para qualquer organização — foque nele primeiro',
          'Muitos controles CIS mapeiam diretamente para NIST CSF',
          'Automatize o máximo possível — ferramentas de scan ajudam muito',
        ],
      },
      benefits: {
        audience: 'Organizações de qualquer porte que desejam um roteiro prático e priorizado de cibersegurança.',
        benefits: ['Roteiro prático e priorizado de implementação', 'Defesa contra os ataques mais frequentes', 'Mapeamento direto com NIST, ISO 27001 e PCI DSS', 'Gratuito e mantido pela comunidade de segurança'],
      },
    };
  }

  // COBIT
  if (lower.includes('cobit')) {
    return {
      info: {
        icon: <Layers className="h-8 w-8 text-primary" />,
        description: 'O COBIT é um framework de governança e gestão de TI que ajuda organizações a alinhar TI com objetivos de negócio, gerenciar riscos e otimizar recursos.',
        timeEstimate: '3 a 5 meses para avaliação completa',
        steps: [
          'Inicie pelo domínio EDM (Avaliar, Dirigir e Monitorar)',
          'Avalie APO (Alinhar, Planejar e Organizar) — estratégia de TI',
          'BAI e DSS cobrem implementação e operação',
          'MEA fecha o ciclo com monitoramento e avaliação',
        ],
        quickTips: [
          'COBIT é complementar ao ITIL — podem ser usados juntos',
          'Foque nos processos que suportam seus objetivos de negócio prioritários',
          'Use a cascata de objetivos do COBIT para priorizar',
        ],
      },
      benefits: {
        audience: 'Organizações que buscam alinhar TI com estratégia de negócios, especialmente empresas com governança corporativa madura.',
        benefits: ['Alinhamento de TI com objetivos de negócio', 'Framework reconhecido para governança de TI', 'Complementar a ITIL e ISO 20000', 'Linguagem comum entre TI e negócios'],
      },
    };
  }

  // SOX
  if (lower.includes('sox')) {
    return {
      info: {
        icon: <Landmark className="h-8 w-8 text-primary" />,
        description: 'A SOX (Sarbanes-Oxley Act) estabelece controles internos sobre relatórios financeiros para empresas de capital aberto, focando em transparência e responsabilidade.',
        timeEstimate: '3 a 6 meses para avaliação completa',
        steps: [
          'Comece pela Seção 302 — certificação de controles pela diretoria',
          'Avalie a Seção 404 — avaliação de controles internos sobre relatórios financeiros',
          'Documente a matriz de riscos e controles (RCM)',
          'Implemente testes de eficácia operacional dos controles',
        ],
        quickTips: [
          'A documentação é essencial — controles não documentados não existem para SOX',
          'Automatize controles quando possível para reduzir risco de erro humano',
          'Segregação de funções (SoD) é um dos pontos mais auditados',
        ],
      },
      benefits: {
        audience: 'Empresas de capital aberto (ou em processo de IPO) listadas em bolsas americanas ou com ADRs.',
        benefits: ['Conformidade legal obrigatória para empresas listadas', 'Confiança de investidores e mercado', 'Melhoria nos controles internos financeiros', 'Redução de riscos de fraude'],
      },
    };
  }

  // NIS2
  if (lower.includes('nis2') || lower.includes('nis 2')) {
    return {
      info: {
        icon: <Globe className="h-8 w-8 text-primary" />,
        description: 'A Diretiva NIS2 da União Europeia estabelece requisitos de cibersegurança para entidades essenciais e importantes, expandindo significativamente o escopo da NIS original.',
        timeEstimate: '3 a 5 meses para avaliação completa',
        steps: [
          'Determine se sua organização é "essencial" ou "importante"',
          'Avalie as medidas de gestão de riscos de cibersegurança (Art. 21)',
          'Implemente obrigações de notificação de incidentes (Art. 23)',
          'Verifique segurança da cadeia de fornecedores',
        ],
        quickTips: [
          'NIS2 tem multas de até €10M ou 2% do faturamento global',
          'A responsabilidade é da alta direção — treinamento é obrigatório',
          'Se já é conforme com ISO 27001, grande parte da NIS2 está coberta',
        ],
      },
      benefits: {
        audience: 'Entidades essenciais e importantes que operam na UE: energia, transporte, saúde, infraestrutura digital, serviços financeiros.',
        benefits: ['Conformidade com a diretiva europeia de cibersegurança', 'Proteção contra multas significativas', 'Melhoria da postura de segurança', 'Resiliência operacional'],
      },
    };
  }

  // ISO 27701
  if (lower.includes('27701')) {
    return {
      info: {
        icon: <Shield className="h-8 w-8 text-primary" />,
        description: 'A ISO 27701 é uma extensão da ISO 27001 focada em gestão de privacidade (PIMS). Ela mapeia requisitos da LGPD e GDPR, facilitando a conformidade com múltiplas regulamentações.',
        timeEstimate: '2 a 4 meses (se já tiver ISO 27001)',
        steps: [
          'Pré-requisito: ter a ISO 27001 implementada ou em implementação',
          'Avalie os controles específicos de PII Controller (Anexo A)',
          'Avalie controles de PII Processor (Anexo B) se aplicável',
          'Mapeie para LGPD/GDPR usando os anexos de correspondência',
        ],
        quickTips: [
          'Se já tem ISO 27001, muitos controles são extensões dos existentes',
          'A ISO 27701 facilita demonstrar conformidade com LGPD e GDPR simultaneamente',
          'Foque primeiro no papel que sua organização desempenha (Controller vs Processor)',
        ],
      },
      benefits: {
        audience: 'Organizações já certificadas em ISO 27001 que desejam estender para gestão de privacidade.',
        benefits: ['Certificação reconhecida de gestão de privacidade', 'Conformidade com LGPD e GDPR em um único framework', 'Extensão natural da ISO 27001', 'Diferencial competitivo em proteção de dados'],
      },
    };
  }

  // ISO 9001
  if (lower.includes('9001')) {
    return {
      info: {
        icon: <Award className="h-8 w-8 text-primary" />,
        description: 'A ISO 9001 é o padrão internacional para Sistemas de Gestão da Qualidade (SGQ), baseado no ciclo PDCA e foco na satisfação do cliente.',
        timeEstimate: '3 a 6 meses para avaliação completa',
        steps: [
          'Comece pelo contexto da organização (Cláusula 4)',
          'Avalie liderança e comprometimento (Cláusula 5)',
          'Mapeie processos de operação (Cláusula 8)',
          'Implemente avaliação de desempenho e melhoria (Cláusulas 9-10)',
        ],
        quickTips: [
          'Abordagem por processos é a chave — mapeie seus processos principais',
          'Muitos requisitos são comuns a outras ISOs (Anexo SL)',
          'Indicadores de satisfação do cliente são fundamentais',
        ],
      },
      benefits: {
        audience: 'Qualquer organização que deseja demonstrar capacidade de fornecer produtos/serviços que atendam requisitos do cliente.',
        benefits: ['Certificação mais reconhecida do mundo', 'Melhoria contínua de processos', 'Maior satisfação do cliente', 'Redução de custos com retrabalho'],
      },
    };
  }

  // ISO 14001
  if (lower.includes('14001')) {
    return {
      info: {
        icon: <Settings className="h-8 w-8 text-primary" />,
        description: 'A ISO 14001 define requisitos para Sistemas de Gestão Ambiental (SGA), ajudando organizações a gerenciar suas responsabilidades ambientais.',
        timeEstimate: '3 a 6 meses para avaliação completa',
        steps: [
          'Identifique aspectos e impactos ambientais significativos',
          'Avalie requisitos legais aplicáveis (Cláusula 6)',
          'Implemente controles operacionais (Cláusula 8)',
          'Monitore e avalie desempenho ambiental (Cláusula 9)',
        ],
        quickTips: [
          'O levantamento de aspectos ambientais é a base de todo o sistema',
          'Integre com ISO 9001 se já tiver — compartilham a mesma estrutura',
          'Requisitos legais ambientais variam por localidade — mantenha atualizado',
        ],
      },
      benefits: {
        audience: 'Organizações que desejam demonstrar responsabilidade ambiental e atender requisitos regulatórios.',
        benefits: ['Conformidade ambiental e redução de riscos', 'Redução de custos com recursos naturais', 'Imagem corporativa sustentável', 'Acesso a mercados que exigem certificação ambiental'],
      },
    };
  }

  // ISO 37301
  if (lower.includes('37301')) {
    return {
      info: {
        icon: <Scale className="h-8 w-8 text-primary" />,
        description: 'A ISO 37301 especifica requisitos para sistemas de gestão de compliance, ajudando organizações a estabelecer uma cultura de integridade e compliance.',
        timeEstimate: '3 a 5 meses para avaliação completa',
        steps: [
          'Mapeie obrigações de compliance aplicáveis',
          'Avalie riscos de compliance (Cláusula 6)',
          'Implemente controles e treinamento (Cláusula 7-8)',
          'Estabeleça canal de denúncias e investigação (Cláusula 8)',
        ],
        quickTips: [
          'Canal de denúncias é requisito fundamental',
          'Due diligence de terceiros é cada vez mais cobrado',
          'Tone at the top — liderança precisa estar visivelmente comprometida',
        ],
      },
      benefits: {
        audience: 'Organizações que desejam demonstrar programa robusto de compliance e ética nos negócios.',
        benefits: ['Programa de compliance reconhecido internacionalmente', 'Mitigação de riscos legais e regulatórios', 'Cultura organizacional de integridade', 'Proteção da reputação corporativa'],
      },
    };
  }

  // ISO 20000
  if (lower.includes('20000')) {
    return {
      info: {
        icon: <Server className="h-8 w-8 text-primary" />,
        description: 'A ISO/IEC 20000 define requisitos para Sistemas de Gestão de Serviços de TI (SGSTI), alinhada com as práticas ITIL.',
        timeEstimate: '3 a 6 meses para avaliação completa',
        steps: [
          'Defina o escopo dos serviços de TI (Cláusula 4)',
          'Mapeie o catálogo de serviços e SLAs',
          'Avalie processos de entrega e suporte (Cláusula 8)',
          'Implemente melhoria contínua de serviços (Cláusula 10)',
        ],
        quickTips: [
          'Se já usa ITIL, muitos processos já estão alinhados',
          'SLAs bem definidos são a base de vários requisitos',
          'Integre com ISO 27001 para segurança dos serviços',
        ],
      },
      benefits: {
        audience: 'Provedores de serviços de TI, internos ou externos, que desejam demonstrar qualidade na gestão de serviços.',
        benefits: ['Certificação de qualidade em gestão de serviços de TI', 'Melhoria na entrega de serviços', 'Alinhamento com melhores práticas ITIL', 'Satisfação de clientes de serviços de TI'],
      },
    };
  }

  // ISO 31000
  if (lower.includes('31000')) {
    return {
      info: {
        icon: <Target className="h-8 w-8 text-primary" />,
        description: 'A ISO 31000 fornece diretrizes para gestão de riscos, aplicável a qualquer tipo de organização e qualquer tipo de risco.',
        timeEstimate: '1 a 3 meses para avaliação completa',
        steps: [
          'Estabeleça o contexto e escopo da gestão de riscos',
          'Avalie o framework de gestão de riscos (princípios e estrutura)',
          'Mapeie o processo de gestão de riscos (identificação, análise, avaliação)',
          'Implemente tratamento e monitoramento de riscos',
        ],
        quickTips: [
          'ISO 31000 é um guia, não uma norma certificável',
          'Os princípios devem estar integrados à governança',
          'Use como base para implementar gestão de riscos em outros frameworks',
        ],
      },
      benefits: {
        audience: 'Qualquer organização que deseja estruturar sua gestão de riscos de forma sistemática.',
        benefits: ['Abordagem estruturada para gestão de riscos', 'Base para outros frameworks de risco (COSO, etc.)', 'Melhoria na tomada de decisão', 'Proteção de valor organizacional'],
      },
    };
  }

  // ITIL
  if (lower.includes('itil')) {
    return {
      info: {
        icon: <Settings className="h-8 w-8 text-primary" />,
        description: 'O ITIL (Information Technology Infrastructure Library) é o framework mais adotado para gestão de serviços de TI, organizado em práticas de gestão.',
        timeEstimate: '2 a 4 meses para avaliação completa',
        steps: [
          'Avalie as práticas de gestão geral (estratégia, portfólio)',
          'Mapeie práticas de gestão de serviço (incidentes, problemas, mudanças)',
          'Verifique práticas técnicas (deploy, monitoramento)',
          'Implemente melhoria contínua como prática transversal',
        ],
        quickTips: [
          'Comece pelas práticas que geram mais valor imediato (Incident, Change)',
          'ITIL 4 foca em co-criação de valor — entenda o conceito de cadeia de valor',
          'Não tente implementar todas as práticas ao mesmo tempo',
        ],
      },
      benefits: {
        audience: 'Departamentos de TI e provedores de serviços que desejam melhorar a qualidade e eficiência dos serviços.',
        benefits: ['Framework mais adotado mundialmente para gestão de TI', 'Melhoria na qualidade dos serviços de TI', 'Alinhamento com ISO 20000', 'Redução de custos operacionais'],
      },
    };
  }

  // CCPA
  if (lower.includes('ccpa')) {
    return {
      info: {
        icon: <Scale className="h-8 w-8 text-primary" />,
        description: 'O CCPA (California Consumer Privacy Act) protege os direitos de privacidade dos consumidores da Califórnia, similar ao GDPR em escopo.',
        timeEstimate: '2 a 3 meses para avaliação completa',
        steps: [
          'Mapeie dados pessoais coletados de consumidores californianos',
          'Implemente mecanismo de opt-out de venda de dados',
          'Verifique direitos dos consumidores (acesso, exclusão, portabilidade)',
          'Atualize política de privacidade com divulgações obrigatórias',
        ],
        quickTips: [
          'Se já é conforme com GDPR, grande parte do CCPA está coberta',
          'O link "Do Not Sell My Personal Information" é obrigatório no site',
          'Responder a solicitações em até 45 dias é requisito legal',
        ],
      },
      benefits: {
        audience: 'Empresas que coletam dados de consumidores residentes na Califórnia, independente da localização da empresa.',
        benefits: ['Conformidade com a lei de privacidade da Califórnia', 'Acesso ao mercado californiano sem restrições', 'Alinhamento com tendências globais de privacidade', 'Redução de riscos de ações judiciais'],
      },
    };
  }

  // COSO ERM
  if (lower.includes('coso') && lower.includes('erm')) {
    return {
      info: {
        icon: <Target className="h-8 w-8 text-primary" />,
        description: 'O COSO ERM (Enterprise Risk Management) é o framework de referência para gestão de riscos corporativos, integrando estratégia e desempenho.',
        timeEstimate: '2 a 4 meses para avaliação completa',
        steps: [
          'Avalie Governança e Cultura de gestão de riscos',
          'Mapeie Estratégia e definição de objetivos',
          'Implemente processos de identificação e avaliação de riscos',
          'Estabeleça Revisão e mecanismos de monitoramento contínuo',
        ],
        quickTips: [
          'COSO ERM 2017 integra gestão de riscos com estratégia — comece pela estratégia',
          'Apetite e tolerância a riscos devem ser definidos pela alta direção',
          'Use em conjunto com ISO 31000 para maior abrangência',
        ],
      },
      benefits: {
        audience: 'Organizações que desejam integrar gestão de riscos à estratégia corporativa e tomada de decisão.',
        benefits: ['Gestão integrada de riscos e estratégia', 'Framework de referência para governança corporativa', 'Melhoria na tomada de decisão estratégica', 'Reconhecido por reguladores e auditores'],
      },
    };
  }

  // COSO IC
  if (lower.includes('coso') && (lower.includes('ic') || lower.includes('interno') || lower.includes('internal'))) {
    return {
      info: {
        icon: <Landmark className="h-8 w-8 text-primary" />,
        description: 'O COSO IC (Internal Control) é o framework de referência para controles internos, composto por 5 componentes e 17 princípios.',
        timeEstimate: '2 a 4 meses para avaliação completa',
        steps: [
          'Avalie o Ambiente de Controle (comprometimento com integridade)',
          'Mapeie a Avaliação de Riscos da organização',
          'Verifique as Atividades de Controle implementadas',
          'Avalie Informação/Comunicação e atividades de Monitoramento',
        ],
        quickTips: [
          'COSO IC é a base para conformidade SOX Seção 404',
          'Os 17 princípios devem estar todos presentes e funcionando',
          'Ambiente de Controle é o fundamento — se for fraco, todo o resto sofre',
        ],
      },
      benefits: {
        audience: 'Empresas que precisam demonstrar controles internos robustos, especialmente para conformidade SOX.',
        benefits: ['Base para conformidade SOX', 'Controles internos estruturados', 'Reconhecido por auditores e reguladores', 'Prevenção de fraudes e erros materiais'],
      },
    };
  }

  // Generic fallback
  return {
    info: {
      icon: <BookOpen className="h-8 w-8 text-primary" />,
      description: `Este framework contém ${total} requisitos para avaliação de conformidade. Avalie cada requisito conforme a situação atual da sua organização.`,
      timeEstimate: `${Math.ceil(total / 10)} a ${Math.ceil(total / 5)} semanas estimadas`,
      steps: [
        'Faça uma primeira passagem rápida marcando os itens que claramente você já atende',
        'Depois revise os itens parciais — muitos podem ser resolvidos com documentação',
        'Foque nos itens de maior peso/criticidade para maximizar o score',
        'Use a IA para obter orientação específica nos itens que geram dúvida',
      ],
      quickTips: [
        'Não tente avaliar tudo de uma vez — divida por categorias',
        'Marque como "Não Aplicável" apenas quando realmente não se aplica ao seu contexto',
        'Evidências são fundamentais — anexe documentos, prints e registros sempre que possível',
      ],
    },
    benefits: {
      audience: 'Organizações que desejam elevar seu nível de maturidade e demonstrar conformidade com padrões reconhecidos do mercado.',
      benefits: ['Processos mais organizados e documentados', 'Redução de riscos operacionais', 'Maior confiança de clientes e parceiros', 'Base para certificações futuras'],
    },
  };
}

export function FrameworkOnboarding({ frameworkNome, frameworkVersao, frameworkTipo, totalRequirements, onStart }: FrameworkOnboardingProps) {
  const { info, benefits } = getOnboardingData(frameworkNome, frameworkTipo, totalRequirements);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="pt-8 pb-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            {info.icon}
          </div>
          <h2 className="text-2xl font-bold mb-2">{frameworkNome} {frameworkVersao}</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">{info.description}</p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <Badge variant="outline" className="gap-1">
              <BookOpen className="h-3 w-3" /> {totalRequirements} requisitos
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" /> {info.timeEstimate}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Para quem é este framework?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{benefits.audience}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              O que você ganha?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {benefits.benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Roteiro Recomendado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {info.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm">{step}</p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Dicas de Quem Já Passou Por Isso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {info.quickTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-amber-500 mt-0.5">💡</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="text-center pb-4">
        <Button size="lg" onClick={onStart} className="gap-2">
          Começar Avaliação <ArrowRight className="h-4 w-4" />
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Você pode usar a IA a qualquer momento para tirar dúvidas sobre cada requisito
        </p>
      </div>
    </div>
  );
}
