-- Inserir 119 requisitos da ISO 27001:2022 no framework do usuário
-- Framework ID: 45d3129e-0c60-48e0-99f9-6433f23ecb83

-- ============================================
-- PARTE 1: REQUISITOS DO SGSI (Cláusulas 4-10)
-- ============================================

-- Cláusula 4: Contexto da Organização (4 requisitos)
INSERT INTO public.gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, peso, obrigatorio, ordem) VALUES
('45d3129e-0c60-48e0-99f9-6433f23ecb83', '4.1', 'Entendendo a organização e seu contexto', 'A organização deve determinar questões externas e internas relevantes para seu propósito e que afetem sua capacidade de alcançar os resultados pretendidos do SGSI', 'Contexto', 3, true, 1),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', '4.2', 'Entendendo as necessidades e expectativas das partes interessadas', 'A organização deve determinar as partes interessadas relevantes para o SGSI e seus requisitos', 'Contexto', 2, true, 2),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', '4.3', 'Determinando o escopo do SGSI', 'A organização deve determinar os limites e aplicabilidade do SGSI para estabelecer seu escopo', 'Contexto', 3, true, 3),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', '4.4', 'Sistema de gestão de segurança da informação', 'A organização deve estabelecer, implementar, manter e melhorar continuamente o SGSI', 'Contexto', 3, true, 4);

-- Cláusula 5: Liderança (3 requisitos)
INSERT INTO public.gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, peso, obrigatorio, ordem) VALUES
('45d3129e-0c60-48e0-99f9-6433f23ecb83', '5.1', 'Liderança e comprometimento', 'A Alta Direção deve demonstrar liderança e comprometimento com o SGSI', 'Liderança', 3, true, 5),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', '5.2', 'Política de segurança da informação', 'A Alta Direção deve estabelecer uma política de segurança da informação', 'Liderança', 3, true, 6),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', '5.3', 'Papéis, responsabilidades e autoridades organizacionais', 'A Alta Direção deve assegurar que responsabilidades e autoridades para papéis pertinentes sejam atribuídas', 'Liderança', 2, true, 7);

-- Cláusula 6: Planejamento (4 requisitos)
INSERT INTO public.gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, peso, obrigatorio, ordem) VALUES
('45d3129e-0c60-48e0-99f9-6433f23ecb83', '6.1.1', 'Generalidades - Ações para abordar riscos e oportunidades', 'Ao planejar o SGSI, a organização deve considerar as questões e requisitos e determinar riscos e oportunidades', 'Planejamento', 3, true, 8),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', '6.1.2', 'Avaliação de riscos de segurança da informação', 'A organização deve definir e aplicar um processo de avaliação de riscos', 'Planejamento', 3, true, 9),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', '6.1.3', 'Tratamento de riscos de segurança da informação', 'A organização deve definir e aplicar um processo de tratamento de riscos', 'Planejamento', 3, true, 10),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', '6.2', 'Objetivos de segurança da informação e planejamento para alcançá-los', 'A organização deve estabelecer objetivos de segurança da informação', 'Planejamento', 2, true, 11);

-- Cláusula 7: Apoio (5 requisitos)
INSERT INTO public.gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, peso, obrigatorio, ordem) VALUES
('45d3129e-0c60-48e0-99f9-6433f23ecb83', '7.1', 'Recursos', 'A organização deve determinar e prover os recursos necessários para estabelecer, implementar, manter e melhorar o SGSI', 'Apoio', 2, true, 12),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', '7.2', 'Competência', 'A organização deve determinar a competência necessária de pessoas que fazem trabalhos sob seu controle', 'Apoio', 2, true, 13),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', '7.3', 'Conscientização', 'Pessoas que fazem trabalhos sob controle da organização devem estar conscientes da política de segurança da informação', 'Apoio', 2, true, 14),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', '7.4', 'Comunicação', 'A organização deve determinar a necessidade de comunicações internas e externas pertinentes ao SGSI', 'Apoio', 2, true, 15),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', '7.5', 'Informação documentada', 'O SGSI da organização deve incluir informação documentada requerida pela norma e necessária para eficácia', 'Apoio', 2, true, 16);

-- Cláusula 8: Operação (3 requisitos)
INSERT INTO public.gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, peso, obrigatorio, ordem) VALUES
('45d3129e-0c60-48e0-99f9-6433f23ecb83', '8.1', 'Planejamento e controle operacionais', 'A organização deve planejar, implementar e controlar processos necessários para atender requisitos de segurança da informação', 'Operação', 3, true, 17),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', '8.2', 'Avaliação de riscos de segurança da informação', 'A organização deve realizar avaliações de riscos de segurança da informação em intervalos planejados', 'Operação', 3, true, 18),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', '8.3', 'Tratamento de riscos de segurança da informação', 'A organização deve implementar o plano de tratamento de riscos', 'Operação', 3, true, 19);

-- Cláusula 9: Avaliação de Desempenho (3 requisitos)
INSERT INTO public.gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, peso, obrigatorio, ordem) VALUES
('45d3129e-0c60-48e0-99f9-6433f23ecb83', '9.1', 'Monitoramento, medição, análise e avaliação', 'A organização deve avaliar o desempenho de segurança da informação e a eficácia do SGSI', 'Avaliação', 3, true, 20),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', '9.2', 'Auditoria interna', 'A organização deve conduzir auditorias internas em intervalos planejados', 'Avaliação', 3, true, 21),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', '9.3', 'Análise crítica pela direção', 'A Alta Direção deve analisar criticamente o SGSI da organização em intervalos planejados', 'Avaliação', 3, true, 22);

-- Cláusula 10: Melhoria (2 requisitos)
INSERT INTO public.gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, peso, obrigatorio, ordem) VALUES
('45d3129e-0c60-48e0-99f9-6433f23ecb83', '10.1', 'Não conformidade e ação corretiva', 'Quando uma não conformidade ocorrer, a organização deve reagir e tomar ação para controlá-la e corrigi-la', 'Melhoria', 3, true, 23),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', '10.2', 'Melhoria contínua', 'A organização deve melhorar continuamente a adequação, suficiência e eficácia do SGSI', 'Melhoria', 2, true, 24);

-- ============================================
-- PARTE 2: CONTROLES DO ANEXO A
-- ============================================

-- A.5: Controles Organizacionais (37 controles)
INSERT INTO public.gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, peso, obrigatorio, ordem) VALUES
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.5.1', 'Políticas para segurança da informação', 'Conjunto de políticas de segurança da informação definido, aprovado, publicado e comunicado', 'Segurança', 3, true, 25),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.5.2', 'Papéis e responsabilidades para segurança da informação', 'Papéis e responsabilidades para segurança da informação alocados conforme políticas', 'Segurança', 2, true, 26),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.5.3', 'Segregação de funções', 'Funções e áreas de responsabilidade conflitantes segregadas', 'Segurança', 3, true, 27),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.5.4', 'Responsabilidades da direção', 'Direção deve requerer que pessoal aplique segurança da informação conforme políticas', 'Segurança', 2, true, 28),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.5.5', 'Contato com autoridades', 'Contatos apropriados com autoridades relevantes estabelecidos e mantidos', 'Segurança', 2, true, 29),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.5.6', 'Contato com grupos especiais de interesse', 'Contatos apropriados com grupos especiais de interesse e fóruns mantidos', 'Segurança', 1, true, 30),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.5.7', 'Inteligência de ameaças', 'Informações relacionadas a ameaças de segurança da informação coletadas e analisadas', 'Segurança', 3, true, 31),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.5.8', 'Segurança da informação em gerenciamento de projetos', 'Segurança da informação integrada no gerenciamento de projetos', 'Segurança', 2, true, 32),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.5.9', 'Inventário de informação e outros ativos associados', 'Inventário de informação e outros ativos desenvolvido e mantido', 'Segurança', 3, true, 33),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.5.10', 'Uso aceitável de informação e outros ativos associados', 'Regras de uso aceitável de informação e ativos identificadas, documentadas e implementadas', 'Segurança', 2, true, 34),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.5.11', 'Devolução de ativos', 'Pessoal e partes externas devem devolver todos os ativos da organização em seu poder', 'Segurança', 2, true, 35),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.5.12', 'Classificação da informação', 'Informação classificada de acordo com necessidades de segurança da informação', 'Segurança', 3, true, 36),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.5.13', 'Rotulagem de informação', 'Conjunto apropriado de procedimentos para rotulagem de informação desenvolvido e implementado', 'Segurança', 2, true, 37),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.5.14', 'Transferência de informação', 'Regras, procedimentos ou acordos de transferência de informação implementados para todos os tipos de meios', 'Segurança', 3, true, 38),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.5.15', 'Controle de acesso', 'Regras de controle de acesso lógico e físico estabelecidas e implementadas com base em requisitos', 'Segurança', 3, true, 39),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.5.16', 'Gerenciamento de identidade', 'Ciclo de vida completo de identidades gerenciado', 'Segurança', 3, true, 40),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.5.17', 'Informações de autenticação', 'Alocação e gerenciamento de informações de autenticação controlados por processo de gerenciamento', 'Segurança', 3, true, 41),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.5.18', 'Direitos de acesso', 'Direitos de acesso a informação e outros ativos provisionados, revisados, modificados e removidos', 'Segurança', 3, true, 42),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.5.19', 'Segurança da informação em relacionamento com fornecedores', 'Processos e procedimentos definidos e implementados para gerenciar riscos associados a fornecedores', 'Segurança', 3, true, 43),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.5.20', 'Tratamento de segurança da informação em contratos com fornecedores', 'Requisitos de segurança da informação relevantes estabelecidos e acordados com cada fornecedor', 'Segurança', 3, true, 44),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.5.21', 'Gerenciamento de segurança da informação em cadeia de suprimentos de TIC', 'Processos e procedimentos para gerenciar riscos de segurança em cadeia de suprimentos TIC', 'Segurança', 3, true, 45),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.5.22', 'Monitoramento, análise crítica e gerenciamento de mudanças de serviços de fornecedores', 'Organização deve monitorar, analisar criticamente e gerenciar mudanças em serviços de fornecedores', 'Segurança', 2, true, 46),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.5.23', 'Segurança da informação no uso de serviços em nuvem', 'Processos de aquisição, uso, gerenciamento e saída de serviços em nuvem estabelecidos', 'Segurança', 3, true, 47),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.5.24', 'Planejamento e preparação de gerenciamento de incidentes de segurança da informação', 'Organização deve planejar e preparar o gerenciamento de incidentes definindo, estabelecendo e comunicando processos', 'Segurança', 3, true, 48),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.5.25', 'Avaliação e decisão sobre eventos de segurança da informação', 'Eventos de segurança da informação avaliados e decisões tomadas sobre classificação como incidentes', 'Segurança', 3, true, 49),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.5.26', 'Resposta a incidentes de segurança da informação', 'Incidentes de segurança da informação respondidos de acordo com procedimentos documentados', 'Segurança', 3, true, 50),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.5.27', 'Aprendizado com incidentes de segurança da informação', 'Conhecimento obtido de incidentes usado para fortalecer e melhorar controles', 'Segurança', 2, true, 51),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.5.28', 'Coleta de evidências', 'Procedimentos estabelecidos e implementados para identificação, coleta, aquisição e preservação de evidências', 'Segurança', 3, true, 52),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.5.29', 'Segurança da informação durante interrupção', 'Organização deve planejar como manter segurança da informação em nível apropriado durante interrupção', 'Segurança', 3, true, 53),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.5.30', 'Prontidão de TIC para continuidade de negócio', 'Prontidão de TIC deve ser planejada, implementada, mantida e testada baseada em objetivos', 'Segurança', 3, true, 54),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.5.31', 'Requisitos legais, estatutários, regulamentares e contratuais', 'Requisitos legais, estatutários, regulamentares e contratuais identificados, documentados e mantidos', 'Segurança', 3, true, 55),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.5.32', 'Direitos de propriedade intelectual', 'Organização deve implementar procedimentos apropriados para proteger direitos de propriedade intelectual', 'Segurança', 2, true, 56),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.5.33', 'Proteção de registros', 'Registros protegidos contra perda, destruição, falsificação, acesso não autorizado e liberação', 'Segurança', 3, true, 57),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.5.34', 'Privacidade e proteção de informações de identificação pessoal', 'Organização deve identificar e atender requisitos para preservação de privacidade e proteção de PII', 'Segurança', 3, true, 58),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.5.35', 'Análise crítica independente de segurança da informação', 'Abordagem da organização para gerenciar segurança da informação analisada criticamente de forma independente', 'Segurança', 2, true, 59),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.5.36', 'Conformidade com políticas, regras e normas para segurança da informação', 'Conformidade com políticas, procedimentos e normas de segurança analisada criticamente regularmente', 'Segurança', 2, true, 60),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.5.37', 'Procedimentos operacionais documentados', 'Procedimentos operacionais para instalações de processamento de informação documentados e disponibilizados', 'Segurança', 2, true, 61);

-- A.6: Controles de Pessoas (8 controles)
INSERT INTO public.gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, peso, obrigatorio, ordem) VALUES
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.6.1', 'Seleção', 'Verificações de antecedentes de todos os candidatos realizadas antes da contratação', 'Pessoas', 2, true, 62),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.6.2', 'Termos e condições de contratação', 'Acordos contratuais com pessoal e contratados devem declarar responsabilidades de segurança', 'Pessoas', 2, true, 63),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.6.3', 'Conscientização, educação e treinamento em segurança da informação', 'Pessoal da organização e partes interessadas devem receber treinamento adequado de conscientização', 'Pessoas', 3, true, 64),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.6.4', 'Processo disciplinar', 'Processo disciplinar formal e comunicado implementado para ações tomadas contra pessoal que cometeu violação', 'Pessoas', 2, true, 65),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.6.5', 'Responsabilidades após término ou mudança de contratação', 'Responsabilidades de segurança da informação após término ou mudança permanecem válidas por período definido', 'Pessoas', 2, true, 66),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.6.6', 'Acordos de confidencialidade ou não divulgação', 'Acordos de confidencialidade ou não divulgação refletindo necessidades de proteção identificados e revisados', 'Pessoas', 2, true, 67),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.6.7', 'Trabalho remoto', 'Medidas de segurança implementadas quando pessoal trabalha remotamente para proteger informação', 'Pessoas', 3, true, 68),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.6.8', 'Relato de eventos de segurança da informação', 'Organização deve fornecer mecanismo para relato de eventos de segurança observados ou suspeitos', 'Pessoas', 3, true, 69);

-- A.7: Controles Físicos (14 controles)
INSERT INTO public.gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, peso, obrigatorio, ordem) VALUES
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.7.1', 'Perímetros de segurança física', 'Perímetros de segurança definidos e usados para proteger áreas que contêm informação e outros ativos', 'Físico', 3, true, 70),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.7.2', 'Controles de entrada física', 'Áreas seguras protegidas por controles de entrada apropriados e pontos de acesso', 'Físico', 3, true, 71),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.7.3', 'Segurança de escritórios, salas e instalações', 'Segurança física para escritórios, salas e instalações projetada e implementada', 'Físico', 2, true, 72),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.7.4', 'Monitoramento de segurança física', 'Instalações continuamente monitoradas para acesso físico não autorizado', 'Físico', 3, true, 73),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.7.5', 'Proteção contra ameaças físicas e ambientais', 'Proteção contra ameaças físicas e ambientais como desastres naturais e ataques projetada e implementada', 'Físico', 3, true, 74),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.7.6', 'Trabalho em áreas seguras', 'Medidas de segurança para trabalho em áreas seguras projetadas e implementadas', 'Físico', 2, true, 75),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.7.7', 'Mesa limpa e tela limpa', 'Regras de mesa limpa para papéis e mídias removíveis e tela limpa para instalações de processamento', 'Físico', 2, true, 76),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.7.8', 'Localização e proteção de equipamento', 'Equipamento localizado e protegido para reduzir riscos de ameaças e perigos ambientais', 'Físico', 2, true, 77),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.7.9', 'Segurança de ativos fora das instalações', 'Ativos fora das instalações protegidos', 'Físico', 2, true, 78),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.7.10', 'Mídias de armazenamento', 'Mídias de armazenamento gerenciadas durante seu ciclo de vida de aquisição, uso, transporte e descarte', 'Físico', 3, true, 79),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.7.11', 'Serviços de suporte', 'Instalações de processamento de informação protegidas contra falhas de energia e outras interrupções', 'Físico', 3, true, 80),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.7.12', 'Segurança de cabeamento', 'Cabos de energia e telecomunicações que portam dados ou suportam serviços protegidos contra interceptação, interferência ou dano', 'Físico', 2, true, 81),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.7.13', 'Manutenção de equipamento', 'Equipamento mantido corretamente para assegurar disponibilidade, integridade e confidencialidade de informação', 'Físico', 2, true, 82),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.7.14', 'Descarte ou reuso seguro de equipamento', 'Itens de equipamento contendo mídias de armazenamento verificados para garantir que dados sensíveis e software sejam removidos ou sobrescritos', 'Físico', 3, true, 83);

-- A.8: Controles Tecnológicos (34 controles)
INSERT INTO public.gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, peso, obrigatorio, ordem) VALUES
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.8.1', 'Dispositivos de ponto de usuário final', 'Informação armazenada em, processada por ou acessível via dispositivos de ponto de usuário final protegida', 'Tecnologia', 3, true, 84),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.8.2', 'Direitos de acesso privilegiados', 'Alocação e uso de direitos de acesso privilegiados restringidos e gerenciados', 'Tecnologia', 3, true, 85),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.8.3', 'Restrição de acesso a informação', 'Acesso a informação e outros ativos associados restrito de acordo com política de controle de acesso', 'Tecnologia', 3, true, 86),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.8.4', 'Acesso a código-fonte', 'Acesso de leitura e gravação a código-fonte, ferramentas de desenvolvimento e bibliotecas gerenciado', 'Tecnologia', 2, true, 87),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.8.5', 'Autenticação segura', 'Tecnologias e procedimentos de autenticação segura implementados baseados em restrições de acesso e política', 'Tecnologia', 3, true, 88),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.8.6', 'Gerenciamento de capacidade', 'Uso de recursos monitorado e ajustado conforme requisitos de desempenho atuais e esperados', 'Tecnologia', 2, true, 89),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.8.7', 'Proteção contra malware', 'Proteção contra malware implementada e suportada por conscientização de usuário', 'Tecnologia', 3, true, 90),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.8.8', 'Gerenciamento de vulnerabilidades técnicas', 'Informação sobre vulnerabilidades técnicas de sistemas em uso obtida, exposição avaliada e medidas tomadas', 'Tecnologia', 3, true, 91),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.8.9', 'Gerenciamento de configuração', 'Configurações incluindo de segurança de hardware, software, serviços e redes estabelecidas, documentadas, implementadas, monitoradas e analisadas', 'Tecnologia', 3, true, 92),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.8.10', 'Exclusão de informação', 'Informação armazenada em sistemas, dispositivos ou qualquer outra mídia de armazenamento excluída quando não mais necessária', 'Tecnologia', 3, true, 93),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.8.11', 'Mascaramento de dados', 'Mascaramento de dados usado conforme política de controle de acesso e outros requisitos de negócio', 'Tecnologia', 2, true, 94),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.8.12', 'Prevenção de vazamento de dados', 'Medidas de prevenção de vazamento de dados aplicadas a sistemas, redes e outros dispositivos que processam, armazenam ou transmitem informação sensível', 'Tecnologia', 3, true, 95),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.8.13', 'Cópia de segurança de informação', 'Cópias de segurança de informação, software e sistemas mantidas e testadas regularmente', 'Tecnologia', 3, true, 96),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.8.14', 'Redundância de instalações de processamento de informação', 'Instalações de processamento de informação implementadas com redundância suficiente para atender requisitos de disponibilidade', 'Tecnologia', 3, true, 97),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.8.15', 'Registro de log', 'Logs que registram atividades, exceções, falhas e outros eventos relevantes produzidos, armazenados, protegidos e analisados', 'Tecnologia', 3, true, 98),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.8.16', 'Atividades de monitoramento', 'Redes, sistemas e aplicações monitorados para comportamento anômalo e ações apropriadas tomadas', 'Tecnologia', 3, true, 99),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.8.17', 'Sincronização de relógio', 'Relógios de sistemas de processamento de informação sincronizados com fontes de tempo aprovadas', 'Tecnologia', 2, true, 100),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.8.18', 'Uso de programas utilitários privilegiados', 'Uso de programas utilitários que podem substituir controles de sistema e aplicação restringido e controlado', 'Tecnologia', 3, true, 101),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.8.19', 'Instalação de software em sistemas operacionais', 'Procedimentos e medidas implementados para gerenciar seguramente instalação de software em sistemas operacionais', 'Tecnologia', 2, true, 102),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.8.20', 'Segurança de redes', 'Redes e dispositivos de rede protegidos, gerenciados e controlados para proteger informação em sistemas e aplicações', 'Tecnologia', 3, true, 103),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.8.21', 'Segurança de serviços de rede', 'Mecanismos de segurança, níveis de serviço e requisitos de serviço de rede identificados, implementados e monitorados', 'Tecnologia', 3, true, 104),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.8.22', 'Segregação de redes', 'Grupos de serviços de informação, usuários e sistemas segregados em redes', 'Tecnologia', 3, true, 105),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.8.23', 'Filtragem de web', 'Acesso a sites externos gerenciado para reduzir exposição a conteúdo malicioso', 'Tecnologia', 2, true, 106),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.8.24', 'Uso de criptografia', 'Regras de uso efetivo de criptografia incluindo gerenciamento de chave criptográfica definidas e implementadas', 'Tecnologia', 3, true, 107),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.8.25', 'Ciclo de vida de desenvolvimento seguro', 'Regras de desenvolvimento seguro de software e sistemas estabelecidas e aplicadas', 'Tecnologia', 3, true, 108),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.8.26', 'Requisitos de segurança da aplicação', 'Requisitos de segurança da informação identificados, especificados e aprovados ao desenvolver ou adquirir aplicações', 'Tecnologia', 3, true, 109),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.8.27', 'Arquitetura de sistema e princípios de engenharia segura', 'Princípios de engenharia de sistemas seguros estabelecidos, documentados, mantidos e aplicados', 'Tecnologia', 3, true, 110),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.8.28', 'Codificação segura', 'Princípios de codificação segura aplicados ao desenvolvimento de software', 'Tecnologia', 3, true, 111),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.8.29', 'Teste de segurança em desenvolvimento e aceitação', 'Processos de teste de segurança definidos e implementados no ciclo de vida de desenvolvimento', 'Tecnologia', 3, true, 112),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.8.30', 'Desenvolvimento terceirizado', 'Organização deve direcionar, monitorar e revisar atividades relacionadas ao desenvolvimento de sistemas terceirizado', 'Tecnologia', 2, true, 113),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.8.31', 'Separação de ambientes de desenvolvimento, teste e produção', 'Ambientes de desenvolvimento, teste e produção separados e protegidos', 'Tecnologia', 3, true, 114),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.8.32', 'Gerenciamento de mudanças', 'Mudanças a instalações e sistemas de processamento de informação sujeitas a procedimentos de gerenciamento de mudanças', 'Tecnologia', 3, true, 115),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.8.33', 'Informação de teste', 'Dados de teste selecionados, protegidos e gerenciados cuidadosamente', 'Tecnologia', 2, true, 116),
('45d3129e-0c60-48e0-99f9-6433f23ecb83', 'A.8.34', 'Proteção de sistemas de informação durante testes de auditoria', 'Testes de auditoria e outras atividades de garantia envolvendo avaliação de sistemas operacionais planejados e acordados', 'Tecnologia', 2, true, 117);