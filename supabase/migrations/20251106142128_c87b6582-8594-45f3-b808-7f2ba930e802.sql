-- Criar tabela de licenças
CREATE TABLE ativos_licencas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  nome TEXT NOT NULL,
  tipo_licenca TEXT NOT NULL,
  fornecedor TEXT,
  numero_licenca TEXT,
  quantidade_licencas INTEGER DEFAULT 1,
  data_aquisicao DATE,
  data_inicio DATE NOT NULL,
  data_vencimento DATE NOT NULL,
  data_renovacao DATE,
  valor_aquisicao NUMERIC(12,2),
  valor_renovacao NUMERIC(12,2),
  periodicidade TEXT,
  renovacao_automatica BOOLEAN DEFAULT false,
  responsavel UUID,
  departamento TEXT,
  criticidade TEXT DEFAULT 'media',
  status TEXT DEFAULT 'ativa',
  observacoes TEXT,
  tags TEXT[],
  arquivo_url TEXT,
  arquivo_nome TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para licenças
CREATE INDEX idx_ativos_licencas_empresa_id ON ativos_licencas(empresa_id);
CREATE INDEX idx_ativos_licencas_data_vencimento ON ativos_licencas(data_vencimento);
CREATE INDEX idx_ativos_licencas_status ON ativos_licencas(status);

-- Habilitar RLS para licenças
ALTER TABLE ativos_licencas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para licenças
CREATE POLICY "Users can view licencas from their empresa"
ON ativos_licencas FOR SELECT
USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can insert licencas in their empresa"
ON ativos_licencas FOR INSERT
WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can update licencas from their empresa"
ON ativos_licencas FOR UPDATE
USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can delete licencas from their empresa"
ON ativos_licencas FOR DELETE
USING (empresa_id = get_user_empresa_id());

-- Criar tabela de chaves criptográficas
CREATE TABLE ativos_chaves_criptograficas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  nome TEXT NOT NULL,
  tipo_chave TEXT NOT NULL,
  ambiente TEXT NOT NULL,
  localizacao TEXT NOT NULL,
  sistema_aplicacao TEXT,
  responsavel UUID,
  data_criacao DATE NOT NULL,
  data_ultima_rotacao DATE,
  data_proxima_rotacao DATE NOT NULL,
  periodicidade_rotacao TEXT,
  rotacao_automatica BOOLEAN DEFAULT false,
  criticidade TEXT DEFAULT 'media',
  status TEXT DEFAULT 'ativa',
  algoritmo TEXT,
  observacoes TEXT,
  tags TEXT[],
  arquivo_publico_url TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para chaves
CREATE INDEX idx_ativos_chaves_empresa_id ON ativos_chaves_criptograficas(empresa_id);
CREATE INDEX idx_ativos_chaves_data_proxima_rotacao ON ativos_chaves_criptograficas(data_proxima_rotacao);
CREATE INDEX idx_ativos_chaves_status ON ativos_chaves_criptograficas(status);

-- Habilitar RLS para chaves
ALTER TABLE ativos_chaves_criptograficas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para chaves
CREATE POLICY "Users can view chaves from their empresa"
ON ativos_chaves_criptograficas FOR SELECT
USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can insert chaves in their empresa"
ON ativos_chaves_criptograficas FOR INSERT
WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can update chaves from their empresa"
ON ativos_chaves_criptograficas FOR UPDATE
USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can delete chaves from their empresa"
ON ativos_chaves_criptograficas FOR DELETE
USING (empresa_id = get_user_empresa_id());

-- Criar tabela de notificações enviadas
CREATE TABLE ativos_notificacoes_enviadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  modulo TEXT NOT NULL,
  registro_id UUID NOT NULL,
  tipo_notificacao TEXT NOT NULL,
  canal TEXT NOT NULL,
  destinatario_email TEXT,
  enviado_em TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'enviado'
);

-- Criar índices para notificações
CREATE INDEX idx_ativos_notificacoes_empresa_id ON ativos_notificacoes_enviadas(empresa_id);
CREATE INDEX idx_ativos_notificacoes_registro_id ON ativos_notificacoes_enviadas(registro_id);
CREATE INDEX idx_ativos_notificacoes_modulo ON ativos_notificacoes_enviadas(modulo);

-- Habilitar RLS para notificações
ALTER TABLE ativos_notificacoes_enviadas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para notificações
CREATE POLICY "Users can view notificacoes from their empresa"
ON ativos_notificacoes_enviadas FOR SELECT
USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can insert notificacoes in their empresa"
ON ativos_notificacoes_enviadas FOR INSERT
WITH CHECK (empresa_id = get_user_empresa_id());

-- Trigger para updated_at em licenças
CREATE TRIGGER update_ativos_licencas_updated_at
BEFORE UPDATE ON ativos_licencas
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger para updated_at em chaves
CREATE TRIGGER update_ativos_chaves_updated_at
BEFORE UPDATE ON ativos_chaves_criptograficas
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();