
CREATE UNIQUE INDEX IF NOT EXISTS docgen_templates_system_nome_tipo_unique
  ON public.docgen_templates (nome, tipo_documento)
  WHERE is_system = true;

INSERT INTO public.docgen_templates (empresa_id, nome, tipo_documento, is_system, estrutura)
VALUES
  ('00000000-0000-0000-0000-000000000000', 'Política de Senhas', 'politica', true,
   '{"secoes":[{"nome":"Objetivo"},{"nome":"Escopo"},{"nome":"Definições"},{"nome":"Diretrizes de Senha"},{"nome":"Autenticação Multifator (MFA)"},{"nome":"Armazenamento e Transmissão"},{"nome":"Responsabilidades"},{"nome":"Penalidades"},{"nome":"Revisão e Aprovação"}]}'::jsonb),
  ('00000000-0000-0000-0000-000000000000', 'Política de Mesa Limpa e Tela Limpa', 'politica', true,
   '{"secoes":[{"nome":"Objetivo"},{"nome":"Escopo"},{"nome":"Definições"},{"nome":"Diretrizes de Mesa Limpa"},{"nome":"Diretrizes de Tela Limpa"},{"nome":"Responsabilidades"},{"nome":"Penalidades"},{"nome":"Revisão e Aprovação"}]}'::jsonb),
  ('00000000-0000-0000-0000-000000000000', 'Política de Privacidade e Proteção de Dados (LGPD)', 'politica', true,
   '{"secoes":[{"nome":"Objetivo"},{"nome":"Escopo"},{"nome":"Bases Legais"},{"nome":"Direitos dos Titulares"},{"nome":"Princípios"},{"nome":"Encarregado (DPO)"},{"nome":"Compartilhamento e Transferência Internacional"},{"nome":"Incidentes com Dados Pessoais"},{"nome":"Responsabilidades"},{"nome":"Revisão e Aprovação"}]}'::jsonb),
  ('00000000-0000-0000-0000-000000000000', 'Política de Backup', 'politica', true,
   '{"secoes":[{"nome":"Objetivo"},{"nome":"Escopo"},{"nome":"Definições"},{"nome":"Estratégia de Backup"},{"nome":"Testes de Restauração"},{"nome":"Responsabilidades"},{"nome":"Monitoramento e Relatórios"},{"nome":"Revisão e Aprovação"}]}'::jsonb),
  ('00000000-0000-0000-0000-000000000000', 'Plano de Continuidade de Negócios (PCN)', 'politica', true,
   '{"secoes":[{"nome":"Objetivo"},{"nome":"Escopo"},{"nome":"Análise de Impacto (BIA)"},{"nome":"Cenários de Risco"},{"nome":"Estratégias de Continuidade"},{"nome":"Equipes de Resposta"},{"nome":"Procedimentos de Acionamento"},{"nome":"Comunicação"},{"nome":"Testes e Exercícios"},{"nome":"Revisão e Aprovação"}]}'::jsonb),
  ('00000000-0000-0000-0000-000000000000', 'Análise de Impacto no Negócio (BIA)', 'politica', true,
   '{"secoes":[{"nome":"Objetivo"},{"nome":"Escopo"},{"nome":"Metodologia"},{"nome":"Mapeamento de Processos"},{"nome":"Impactos Financeiros e Operacionais"},{"nome":"Requisitos de Recuperação (RTO/RPO)"},{"nome":"Recursos Necessários"},{"nome":"Conclusões e Recomendações"},{"nome":"Aprovação e Revisão"}]}'::jsonb),
  ('00000000-0000-0000-0000-000000000000', 'Código de Ética e Conduta', 'codigo', true,
   '{"secoes":[{"nome":"Mensagem da Liderança"},{"nome":"Objetivo"},{"nome":"Abrangência"},{"nome":"Princípios e Valores"},{"nome":"Conduta no Ambiente de Trabalho"},{"nome":"Conflitos de Interesse"},{"nome":"Anticorrupção e Antissuborno"},{"nome":"Uso de Recursos e Informações"},{"nome":"Canal de Denúncias"},{"nome":"Sanções"},{"nome":"Vigência e Revisão"}]}'::jsonb),
  ('00000000-0000-0000-0000-000000000000', 'Política de Controle de Acesso', 'politica', true,
   '{"secoes":[{"nome":"Objetivo"},{"nome":"Escopo"},{"nome":"Princípios"},{"nome":"Ciclo de Vida do Acesso"},{"nome":"Acessos Privilegiados"},{"nome":"Acesso Remoto"},{"nome":"Acesso de Terceiros"},{"nome":"Auditoria e Logs"},{"nome":"Responsabilidades"},{"nome":"Revisão e Aprovação"}]}'::jsonb)
ON CONFLICT (nome, tipo_documento) WHERE is_system = true DO NOTHING;
