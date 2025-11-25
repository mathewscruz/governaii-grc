-- Criar tabela de planos
CREATE TABLE planos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  codigo text UNIQUE NOT NULL,
  creditos_franquia integer NOT NULL,
  descricao text,
  icone text,
  cor_primaria text,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Inserir os 3 planos
INSERT INTO planos (nome, codigo, creditos_franquia, descricao, icone, cor_primaria) VALUES
('Compliance Start', 'compliance_start', 10, 'Plano inicial para pequenas empresas', 'Shield', '#6B7280'),
('GRC Manager', 'grc_manager', 50, 'Plano intermediário para gestão de GRC', 'ShieldCheck', '#3B82F6'),
('GovernAII Enterprise', 'governaii_enterprise', 200, 'Plano empresarial completo', 'Crown', '#F59E0B');

-- Adicionar campos na tabela empresas
ALTER TABLE empresas 
ADD COLUMN IF NOT EXISTS plano_id uuid REFERENCES planos(id),
ADD COLUMN IF NOT EXISTS creditos_consumidos integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS data_inicio_ciclo timestamptz DEFAULT now();

-- Criar tabela de histórico de consumo de créditos
CREATE TABLE creditos_consumo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id) NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  quantidade integer DEFAULT 1,
  funcionalidade text NOT NULL,
  descricao text,
  created_at timestamptz DEFAULT now()
);

-- RLS para creditos_consumo
ALTER TABLE creditos_consumo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view credits from their empresa" ON creditos_consumo
  FOR SELECT USING (empresa_id = get_user_empresa_id());

CREATE POLICY "System can insert credits" ON creditos_consumo
  FOR INSERT WITH CHECK (empresa_id = get_user_empresa_id());