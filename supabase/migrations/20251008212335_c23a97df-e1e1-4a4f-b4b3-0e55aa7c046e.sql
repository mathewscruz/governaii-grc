-- Atualizar função para corrigir schema das tabelas
CREATE OR REPLACE FUNCTION public.popular_dados_demonstracao_direto(p_empresa_id uuid, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_categoria_risco_id uuid;
  v_categoria_controle_id uuid;
  v_categoria_doc_id uuid;
  v_categoria_denuncia_id uuid;
  v_matriz_id uuid;
  v_localizacao_id uuid;
  v_sistema_id uuid;
  v_fornecedor_dd_id uuid;
  v_fornecedor_id uuid;
  v_framework_id uuid;
  v_template_dd_id uuid;
BEGIN
  -- Verificar se já existem riscos
  IF EXISTS (SELECT 1 FROM public.riscos WHERE empresa_id = p_empresa_id LIMIT 1) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Dados já existem para esta empresa');
  END IF;

  -- Categorias Riscos
  INSERT INTO public.riscos_categorias (nome, descricao, cor, empresa_id)
  VALUES ('Segurança da Informação', 'Riscos de segurança', '#ef4444', p_empresa_id)
  RETURNING id INTO v_categoria_risco_id;

  -- Matriz Riscos (SEM coluna ativo)
  INSERT INTO public.riscos_matrizes (nome, descricao, empresa_id)
  VALUES ('Matriz Corporativa 2025', 'Matriz principal', p_empresa_id)
  RETURNING id INTO v_matriz_id;

  -- Categorias Controles
  INSERT INTO public.controles_categorias (nome, descricao, cor, empresa_id)
  VALUES ('Segurança da Informação', 'Controles de segurança', '#3b82f6', p_empresa_id)
  RETURNING id INTO v_categoria_controle_id;

  -- Categorias Documentos
  INSERT INTO public.documentos_categorias (nome, descricao, cor, empresa_id)
  VALUES ('Políticas', 'Políticas organizacionais', '#8b5cf6', p_empresa_id)
  RETURNING id INTO v_categoria_doc_id;

  -- Localizações
  INSERT INTO public.ativos_localizacoes (nome, descricao, empresa_id)
  VALUES ('Datacenter Principal', 'Sala servidores', p_empresa_id)
  RETURNING id INTO v_localizacao_id;

  -- Sistemas
  INSERT INTO public.contas_privilegiadas_sistemas (nome, descricao, tipo_sistema, criticidade, empresa_id)
  VALUES ('Active Directory', 'Controlador de domínio', 'Autenticação', 'critico', p_empresa_id)
  RETURNING id INTO v_sistema_id;

  -- Categorias Denúncia
  INSERT INTO public.denuncias_categorias (nome, descricao, cor, empresa_id)
  VALUES ('Assédio', 'Casos de assédio', '#ef4444', p_empresa_id)
  RETURNING id INTO v_categoria_denuncia_id;

  -- RISCOS (7 registros)
  INSERT INTO public.riscos (empresa_id, nome, descricao, categoria_id, matriz_id, probabilidade_inicial, impacto_inicial, nivel_risco_inicial, status, responsavel, data_identificacao, created_by)
  VALUES 
    (p_empresa_id, 'Vazamento de Dados de Clientes', 'Risco de exposição de dados pessoais por ataque', v_categoria_risco_id, v_matriz_id, 'provavel', 'catastrofico', 'critico', 'tratado', 'João Silva - CISO', CURRENT_DATE - 45, p_user_id),
    (p_empresa_id, 'Falha Sistema de Backup', 'Falha nos procedimentos de backup', v_categoria_risco_id, v_matriz_id, 'possivel', 'maior', 'alto', 'monitorado', 'Carlos Santos - TI', CURRENT_DATE - 60, p_user_id),
    (p_empresa_id, 'Acesso Não Autorizado', 'Tentativas de acesso indevido', v_categoria_risco_id, v_matriz_id, 'provavel', 'maior', 'alto', 'tratado', 'João Silva - CISO', CURRENT_DATE - 30, p_user_id),
    (p_empresa_id, 'Fraude Financeira', 'Risco de fraude em transações', v_categoria_risco_id, v_matriz_id, 'improvavel', 'catastrofico', 'alto', 'identificado', 'Maria Costa - CFO', CURRENT_DATE - 15, p_user_id),
    (p_empresa_id, 'Não Conformidade LGPD', 'Descumprimento de requisitos LGPD', v_categoria_risco_id, v_matriz_id, 'possivel', 'maior', 'alto', 'em_tratamento', 'Ana Paula - DPO', CURRENT_DATE - 90, p_user_id),
    (p_empresa_id, 'Ataque Ransomware', 'Risco de sequestro de dados', v_categoria_risco_id, v_matriz_id, 'possivel', 'catastrofico', 'critico', 'monitorado', 'João Silva - CISO', CURRENT_DATE - 120, p_user_id),
    (p_empresa_id, 'Perda de Ativos Físicos', 'Furto de equipamentos', v_categoria_risco_id, v_matriz_id, 'possivel', 'moderado', 'medio', 'identificado', 'Pedro - Facilities', CURRENT_DATE - 20, p_user_id);

  -- CONTROLES (8 registros)
  INSERT INTO public.controles (empresa_id, nome, descricao, tipo, categoria_id, status, criticidade, frequencia_teste, responsavel, created_by)
  VALUES 
    (p_empresa_id, 'Controle de Acesso Lógico', 'Gestão de permissões e MFA', 'preventivo', v_categoria_controle_id, 'ativo', 'critico', 'mensal', 'João Silva - CISO', p_user_id),
    (p_empresa_id, 'Backup Automático Diário', 'Backup incremental com restore', 'preventivo', v_categoria_controle_id, 'ativo', 'critico', 'semanal', 'Carlos Santos - TI', p_user_id),
    (p_empresa_id, 'Revisão Logs Segurança', 'Análise diária de logs', 'detectivo', v_categoria_controle_id, 'ativo', 'alto', 'diario', 'João Silva - CISO', p_user_id),
    (p_empresa_id, 'Segregação Funções', 'Separação responsabilidades financeiras', 'preventivo', v_categoria_controle_id, 'ativo', 'alto', 'mensal', 'Maria Costa - CFO', p_user_id),
    (p_empresa_id, 'Monitoramento Firewall', 'Monitoramento 24x7 tráfego', 'detectivo', v_categoria_controle_id, 'ativo', 'critico', 'continuo', 'João Silva - CISO', p_user_id),
    (p_empresa_id, 'Análise Vulnerabilidades', 'Scans mensais infraestrutura', 'detectivo', v_categoria_controle_id, 'ativo', 'alto', 'mensal', 'Carlos Santos - TI', p_user_id),
    (p_empresa_id, 'Treinamento Segurança', 'Capacitação trimestral', 'preventivo', v_categoria_controle_id, 'ativo', 'medio', 'trimestral', 'Ana Paula - RH', p_user_id),
    (p_empresa_id, 'Gestão de Patches', 'Atualização sistemas', 'preventivo', v_categoria_controle_id, 'ativo', 'alto', 'mensal', 'Carlos Santos - TI', p_user_id);

  -- DOCUMENTOS (7 registros)
  INSERT INTO public.documentos (empresa_id, nome, descricao, tipo, status, classificacao, tags, data_vencimento, created_by)
  VALUES 
    (p_empresa_id, 'Política Segurança da Informação', 'Política corporativa de segurança', 'politica', 'ativo', 'confidencial', ARRAY['seguranca', 'politica'], CURRENT_DATE + 365, p_user_id),
    (p_empresa_id, 'Manual Boas Práticas LGPD', 'Guia completo LGPD', 'manual', 'ativo', 'interna', ARRAY['lgpd', 'privacidade'], CURRENT_DATE + 730, p_user_id),
    (p_empresa_id, 'Procedimento Backup', 'Procedimento operacional backup', 'procedimento', 'ativo', 'interna', ARRAY['backup', 'ti'], CURRENT_DATE + 365, p_user_id),
    (p_empresa_id, 'Política Dispositivos Móveis', 'Normas uso dispositivos', 'politica', 'ativo', 'interna', ARRAY['mobile', 'byod'], CURRENT_DATE + 365, p_user_id),
    (p_empresa_id, 'Termo Confidencialidade', 'Modelo termo colaboradores', 'contrato', 'ativo', 'confidencial', ARRAY['confidencialidade', 'rh'], NULL, p_user_id),
    (p_empresa_id, 'Instrução Tratamento Incidentes', 'Resposta a incidentes', 'procedimento', 'ativo', 'interna', ARRAY['incidente', 'seguranca'], CURRENT_DATE + 365, p_user_id),
    (p_empresa_id, 'Política Controle Acesso', 'Normas criação acessos', 'politica', 'ativo', 'confidencial', ARRAY['acesso', 'iam'], CURRENT_DATE + 365, p_user_id);

  -- INCIDENTES (5 registros)
  INSERT INTO public.incidentes (empresa_id, titulo, descricao, tipo, gravidade, status, data_ocorrencia, data_deteccao, responsavel_id, created_by)
  VALUES 
    (p_empresa_id, 'Tentativa Phishing Detectada', 'Campanha phishing bloqueada', 'seguranca', 'alta', 'resolvido', CURRENT_DATE - 30, CURRENT_DATE - 30, p_user_id, p_user_id),
    (p_empresa_id, 'Acesso Não Autorizado Servidor', 'Tentativa acesso detectada IDS', 'seguranca', 'critica', 'em_investigacao', CURRENT_DATE - 5, CURRENT_DATE - 5, p_user_id, p_user_id),
    (p_empresa_id, 'Perda Notebook Corporativo', 'Colaborador reportou perda', 'privacidade', 'media', 'contido', CURRENT_DATE - 15, CURRENT_DATE - 14, p_user_id, p_user_id),
    (p_empresa_id, 'Falha Sistema Autenticação', 'SSO indisponível 2h', 'disponibilidade', 'alta', 'resolvido', CURRENT_DATE - 45, CURRENT_DATE - 45, p_user_id, p_user_id),
    (p_empresa_id, 'Malware Detectado Estação', 'Antivírus removeu malware', 'seguranca', 'media', 'resolvido', CURRENT_DATE - 60, CURRENT_DATE - 60, p_user_id, p_user_id);

  -- ATIVOS (12 registros)
  INSERT INTO public.ativos (empresa_id, nome, tipo, descricao, proprietario, localizacao, valor_negocio, criticidade, status, data_aquisicao, fornecedor, versao, created_by)
  VALUES 
    (p_empresa_id, 'Servidor Aplicação Principal', 'tecnologia', 'Dell PowerEdge R740 - Produção', 'TI', 'Datacenter Principal', 350000, 'critico', 'ativo', CURRENT_DATE - 730, 'Dell Technologies', 'R740', p_user_id),
    (p_empresa_id, 'Banco Dados PostgreSQL Prod', 'tecnologia', 'Cluster PostgreSQL 15', 'TI', 'Datacenter Principal', 500000, 'critico', 'ativo', CURRENT_DATE - 365, 'PostgreSQL', '15.2', p_user_id),
    (p_empresa_id, 'Firewall FortiGate 600E', 'tecnologia', 'Firewall principal perímetro', 'TI', 'Datacenter Principal', 180000, 'critico', 'ativo', CURRENT_DATE - 500, 'Fortinet', '600E', p_user_id),
    (p_empresa_id, 'Laptop Dell Latitude #001', 'tecnologia', 'Notebook CEO', 'João Silva - CEO', 'Escritório Central', 8500, 'alto', 'ativo', CURRENT_DATE - 200, 'Dell', 'Latitude 5420', p_user_id),
    (p_empresa_id, 'Laptop Dell Latitude #002', 'tecnologia', 'Notebook CFO', 'Maria Costa - CFO', 'Escritório Central', 8500, 'alto', 'ativo', CURRENT_DATE - 200, 'Dell', 'Latitude 5420', p_user_id),
    (p_empresa_id, 'Laptop Dell Latitude #003', 'tecnologia', 'Notebook CTO', 'Carlos Santos - CTO', 'Escritório Central', 8500, 'alto', 'ativo', CURRENT_DATE - 200, 'Dell', 'Latitude 5420', p_user_id),
    (p_empresa_id, 'Switch Core Cisco Catalyst', 'tecnologia', 'Switch core datacenter', 'TI', 'Datacenter Principal', 95000, 'critico', 'ativo', CURRENT_DATE - 900, 'Cisco', 'C9300-48P', p_user_id),
    (p_empresa_id, 'Storage NetApp FAS2750', 'tecnologia', 'Storage backups', 'TI', 'Datacenter Principal', 280000, 'critico', 'ativo', CURRENT_DATE - 600, 'NetApp', 'FAS2750', p_user_id),
    (p_empresa_id, 'Impressora HP LaserJet', 'escritorio', 'Multifuncional departamento', 'Facilities', 'Escritório Central', 12000, 'medio', 'ativo', CURRENT_DATE - 400, 'HP', 'M607', p_user_id),
    (p_empresa_id, 'Mobiliário Sala Reunião A', 'escritorio', 'Mesa reunião + 12 cadeiras', 'Facilities', 'Escritório Central', 15000, 'baixo', 'ativo', CURRENT_DATE - 800, 'MobEx', 'Executive', p_user_id),
    (p_empresa_id, 'Ar Condicionado Precision', 'escritorio', 'Sistema climatização DC', 'Facilities', 'Datacenter Principal', 45000, 'alto', 'ativo', CURRENT_DATE - 1000, 'Schneider', 'InRow', p_user_id),
    (p_empresa_id, 'Nobreak APC Smart-UPS', 'tecnologia', 'Sistema UPS', 'TI', 'Datacenter Principal', 38000, 'critico', 'ativo', CURRENT_DATE - 800, 'APC', 'SURT10K', p_user_id);

  -- FORNECEDORES (4 registros)
  INSERT INTO public.fornecedores (nome, cnpj, email, telefone, endereco, status, categoria, empresa_id)
  VALUES 
    ('Microsoft Brasil Ltda', '04.712.500/0001-07', 'contato@microsoft.com.br', '(11) 4002-8922', 'São Paulo - SP', 'ativo', 'tecnologia', p_empresa_id),
    ('TechSupport Consultoria', '12.345.678/0001-90', 'contato@techsupport.com.br', '(11) 3456-7890', 'São Paulo - SP', 'ativo', 'servicos', p_empresa_id),
    ('CleanPro Serviços', '98.765.432/0001-10', 'contato@cleanpro.com.br', '(11) 2345-6789', 'São Paulo - SP', 'ativo', 'servicos', p_empresa_id),
    ('SecureIT Consultoria', '11.222.333/0001-44', 'contato@secureit.com.br', '(11) 4567-8901', 'Rio de Janeiro - RJ', 'ativo', 'consultoria', p_empresa_id)
  RETURNING id INTO v_fornecedor_id;

  -- CONTRATOS (4 registros)
  INSERT INTO public.contratos (empresa_id, numero_contrato, nome, tipo, fornecedor_id, valor_total, valor_mensal, data_inicio, data_fim, data_assinatura, status, objeto, created_by)
  VALUES 
    (p_empresa_id, 'CTR-2024-001', 'Licenciamento Microsoft 365', 'licenciamento', v_fornecedor_id, 600000, 50000, CURRENT_DATE - 180, CURRENT_DATE + 545, CURRENT_DATE - 200, 'ativo', 'Licenças Microsoft 365 E3 para 200 usuários', p_user_id),
    (p_empresa_id, 'CTR-2024-002', 'Manutenção e Suporte TI', 'servicos', v_fornecedor_id, 360000, 30000, CURRENT_DATE - 150, CURRENT_DATE + 575, CURRENT_DATE - 165, 'ativo', 'Suporte técnico 24x7 infraestrutura', p_user_id),
    (p_empresa_id, 'CTR-2024-003', 'Limpeza e Conservação', 'servicos', v_fornecedor_id, 180000, 15000, CURRENT_DATE - 90, CURRENT_DATE + 635, CURRENT_DATE - 100, 'ativo', 'Serviços limpeza predial', p_user_id),
    (p_empresa_id, 'CTR-2024-004', 'Consultoria Segurança', 'consultoria', v_fornecedor_id, 240000, NULL, CURRENT_DATE - 60, CURRENT_DATE + 305, CURRENT_DATE - 70, 'ativo', 'Implementação framework segurança', p_user_id);

  -- DADOS PESSOAIS (5 registros)
  INSERT INTO public.dados_pessoais (empresa_id, nome, descricao, categoria_dados, tipo_dados, sensibilidade, origem_coleta, finalidade_tratamento, base_legal, prazo_retencao, created_by)
  VALUES 
    (p_empresa_id, 'Dados Identificação Colaboradores', 'Nome, CPF, RG, nascimento', 'colaboradores', 'identificacao', 'sensivel', 'RH', 'Gestão RH e folha', 'contrato_trabalho', '5 anos após desligamento', p_user_id),
    (p_empresa_id, 'Dados Contato Clientes', 'Email, telefone, endereço', 'clientes', 'contato', 'comum', 'Vendas/Marketing', 'Comunicação comercial', 'consentimento', '2 anos após última interação', p_user_id),
    (p_empresa_id, 'Dados Financeiros Fornecedores', 'Conta bancária, PIX', 'fornecedores', 'financeiro', 'sensivel', 'Financeiro', 'Realização pagamentos', 'contrato', '5 anos', p_user_id),
    (p_empresa_id, 'Dados Médicos Funcionários', 'Atestados, exames', 'colaboradores', 'saude', 'critico', 'Medicina Trabalho', 'Legislação trabalhista', 'obrigacao_legal', '20 anos', p_user_id),
    (p_empresa_id, 'Credenciais Acesso Sistemas', 'Login, senha hash, logs', 'usuarios', 'autenticacao', 'sensivel', 'TI', 'Controle acesso', 'interesse_legitimo', 'Durante vínculo + 1 ano', p_user_id);

  -- AUDITORIAS (3 registros)
  INSERT INTO public.auditorias (empresa_id, titulo, tipo, escopo, objetivo, data_inicio, data_fim, status, lider_auditoria, equipe, metodologia, created_by)
  VALUES 
    (p_empresa_id, 'Auditoria Conformidade LGPD 2025', 'conformidade', 'Processos tratamento dados pessoais', 'Verificar conformidade LGPD', CURRENT_DATE - 30, CURRENT_DATE + 30, 'em_andamento', 'Ana Paula Silva - DPO', ARRAY['João Silva', 'Maria Costa'], 'ISO 19011', p_user_id),
    (p_empresa_id, 'Auditoria Controles Financeiros Q4', 'interna', 'Processos financeiros e contábeis', 'Avaliar efetividade controles', CURRENT_DATE - 90, CURRENT_DATE - 30, 'concluida', 'Maria Costa - CFO', ARRAY['Pedro Oliveira', 'Auditor Externo'], 'COSO', p_user_id),
    (p_empresa_id, 'Auditoria Segurança Informação', 'seguranca', 'Infraestrutura TI', 'Avaliar postura segurança', CURRENT_DATE + 45, CURRENT_DATE + 105, 'planejada', 'João Silva - CISO', ARRAY['Carlos Santos', 'Consultor'], 'ISO 27001', p_user_id);

  -- GAP ANALYSIS (2 frameworks + requirements)
  INSERT INTO public.gap_analysis_frameworks (empresa_id, nome, versao, tipo_framework, descricao, ativo, created_by)
  VALUES 
    (p_empresa_id, 'ISO/IEC 27001:2022', '2022', 'seguranca_informacao', 'Framework internacional segurança', true, p_user_id),
    (p_empresa_id, 'LGPD - Lei Geral Proteção Dados', '2020', 'privacidade', 'Legislação brasileira privacidade', true, p_user_id)
  RETURNING id INTO v_framework_id;

  INSERT INTO public.gap_analysis_requirements (framework_id, codigo, titulo, descricao, categoria, peso, obrigatorio, ordem)
  VALUES 
    (v_framework_id, 'A.5.1', 'Políticas Segurança Informação', 'Estabelecer políticas documentadas', 'Políticas', 3, true, 1),
    (v_framework_id, 'A.5.2', 'Revisão das Políticas', 'Revisar políticas periodicamente', 'Políticas', 3, true, 2),
    (v_framework_id, 'A.8.1', 'Inventário de Ativos', 'Manter inventário atualizado', 'Ativos', 3, true, 3),
    (v_framework_id, 'A.9.1', 'Controle de Acesso', 'Implementar política acesso', 'Acesso', 3, true, 4),
    (v_framework_id, 'A.12.1', 'Backup', 'Realizar backups regulares', 'Operações', 3, true, 5);

  INSERT INTO public.gap_analysis_assessments (empresa_id, framework_id, nome, descricao, status, data_inicio, responsavel_geral, percentual_conclusao, created_by)
  VALUES 
    (p_empresa_id, v_framework_id, 'Assessment ISO 27001 - 2025', 'Avaliação conformidade ISO', 'em_andamento', CURRENT_DATE - 60, p_user_id, 65, p_user_id);

  -- DUE DILIGENCE (3 fornecedores + assessments)
  SELECT id INTO v_template_dd_id FROM public.due_diligence_templates WHERE padrao = true LIMIT 1;

  INSERT INTO public.due_diligence_fornecedores (empresa_id, nome, cnpj, email, contato, telefone, categoria, porte, pais, status, created_by)
  VALUES 
    (p_empresa_id, 'Tech Solutions Ltda', '12.345.678/0001-90', 'contato@techsolutions.com', 'Roberto Silva', '(11) 98765-4321', 'tecnologia', 'medio', 'Brasil', 'ativo', p_user_id),
    (p_empresa_id, 'Cloud Services Brasil', '98.765.432/0001-10', 'comercial@cloudservices.com', 'Ana Santos', '(11) 91234-5678', 'tecnologia', 'grande', 'Brasil', 'ativo', p_user_id),
    (p_empresa_id, 'SecureIT Consultoria', '11.222.333/0001-44', 'contato@secureit.com', 'Carlos Mendes', '(21) 99876-5432', 'consultoria', 'pequeno', 'Brasil', 'ativo', p_user_id)
  RETURNING id INTO v_fornecedor_dd_id;

  INSERT INTO public.due_diligence_assessments (empresa_id, fornecedor_id, template_id, nome, descricao, status, data_inicio, data_conclusao, responsavel_id, score_final, observacoes, created_by)
  VALUES 
    (p_empresa_id, v_fornecedor_dd_id, v_template_dd_id, 'Due Diligence - Tech Solutions', 'Avaliação contratação cloud', 'concluido', CURRENT_DATE - 90, CURRENT_DATE - 60, p_user_id, 85, 'Fornecedor aprovado - Score excelente', p_user_id);

  INSERT INTO public.due_diligence_scores (assessment_id, score_total, classificacao, observacoes_ia)
  SELECT id, 85, 'excelente', 'Fornecedor demonstra alto nível de maturidade'
  FROM public.due_diligence_assessments 
  WHERE empresa_id = p_empresa_id 
  ORDER BY created_at DESC LIMIT 1;

  -- DENÚNCIAS (3 registros)
  INSERT INTO public.denuncias (empresa_id, protocolo, titulo, descricao, tipo_denuncia, categoria_id, gravidade, status, canal_denuncia, data_ocorrencia, anonima, created_by)
  VALUES 
    (p_empresa_id, gerar_protocolo_denuncia(), 'Assédio Moral Departamento', 'Relato comportamento inadequado gestor', 'assedio_moral', v_categoria_denuncia_id, 'media', 'em_investigacao', 'formulario_web', CURRENT_DATE - 10, false, p_user_id),
    (p_empresa_id, gerar_protocolo_denuncia(), 'Suspeita Fraude Financeira', 'Indícios manipulação notas', 'fraude', v_categoria_denuncia_id, 'alta', 'nova', 'email', CURRENT_DATE - 3, true, p_user_id),
    (p_empresa_id, gerar_protocolo_denuncia(), 'Descumprimento Normas Segurança', 'Colaboradores sem EPIs', 'violacao_normas', v_categoria_denuncia_id, 'baixa', 'resolvida', 'telefone', CURRENT_DATE - 45, false, p_user_id);

  -- CONTAS PRIVILEGIADAS (4 registros)
  INSERT INTO public.contas_privilegiadas (empresa_id, sistema_id, nome_conta, descricao, tipo_conta, nivel_privilegio, proprietario, aprovador, data_criacao, data_expiracao, status, utiliza_mfa, rotacao_senha_dias, ultima_rotacao_senha, created_by)
  VALUES 
    (p_empresa_id, v_sistema_id, 'Administrator', 'Conta admin domínio principal', 'administrativa', 'critico', 'João Silva - CISO', 'CEO', CURRENT_DATE - 730, CURRENT_DATE + 365, 'ativa', true, 90, CURRENT_DATE - 45, p_user_id),
    (p_empresa_id, v_sistema_id, 'root', 'Conta root servidor produção', 'sistema', 'critico', 'Carlos Santos - TI', 'CTO', CURRENT_DATE - 600, CURRENT_DATE + 365, 'ativa', true, 60, CURRENT_DATE - 30, p_user_id),
    (p_empresa_id, v_sistema_id, 'postgres', 'Superuser PostgreSQL', 'administrativa', 'critico', 'Carlos Santos - TI', 'CTO', CURRENT_DATE - 500, CURRENT_DATE + 365, 'ativa', true, 90, CURRENT_DATE - 60, p_user_id),
    (p_empresa_id, v_sistema_id, 'service_backup', 'Conta serviço backup', 'servico', 'alto', 'TI Operations', 'CTO', CURRENT_DATE - 400, CURRENT_DATE + 730, 'ativa', false, 180, CURRENT_DATE - 90, p_user_id);

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Dados de demonstração criados com sucesso!',
    'total', '7 riscos, 8 controles, 7 documentos, 5 incidentes, 12 ativos, 4 contratos, 5 dados pessoais, 3 auditorias, 2 frameworks, 3 fornecedores DD, 3 denúncias, 4 contas privilegiadas'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;