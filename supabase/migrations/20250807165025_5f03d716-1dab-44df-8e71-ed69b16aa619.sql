-- Tabela para layouts visuais reutilizáveis
CREATE TABLE public.docgen_layouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  logo_url TEXT,
  header_config JSONB NOT NULL DEFAULT '{}',
  footer_config JSONB NOT NULL DEFAULT '{}',
  classificacao_padrao TEXT,
  responsaveis_padrao JSONB DEFAULT '[]',
  frequencia_revisao TEXT,
  cores JSONB DEFAULT '{}',
  fontes JSONB DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para conversas do chat
CREATE TABLE public.docgen_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  user_id UUID NOT NULL,
  titulo TEXT,
  mensagens JSONB NOT NULL DEFAULT '[]',
  contexto JSONB DEFAULT '{}',
  tipo_documento_identificado TEXT,
  status TEXT NOT NULL DEFAULT 'ativa',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para templates de documentos
CREATE TABLE public.docgen_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  tipo_documento TEXT NOT NULL,
  nome TEXT NOT NULL,
  estrutura JSONB NOT NULL,
  campos_obrigatorios JSONB DEFAULT '[]',
  tooltips JSONB DEFAULT '{}',
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para documentos gerados
CREATE TABLE public.docgen_generated_docs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  conversation_id UUID NOT NULL,
  layout_id UUID,
  template_id UUID,
  nome TEXT NOT NULL,
  tipo_documento TEXT NOT NULL,
  conteudo JSONB NOT NULL,
  framework_vinculado TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho',
  documento_id UUID, -- Referência para documentos salvos no sistema
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.docgen_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.docgen_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.docgen_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.docgen_generated_docs ENABLE ROW LEVEL SECURITY;

-- RLS Policies para docgen_layouts
CREATE POLICY "Users can view layouts from their empresa" 
ON public.docgen_layouts FOR SELECT 
USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can insert layouts in their empresa" 
ON public.docgen_layouts FOR INSERT 
WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can update layouts from their empresa" 
ON public.docgen_layouts FOR UPDATE 
USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can delete layouts from their empresa" 
ON public.docgen_layouts FOR DELETE 
USING (empresa_id = get_user_empresa_id());

-- RLS Policies para docgen_conversations
CREATE POLICY "Users can view conversations from their empresa" 
ON public.docgen_conversations FOR SELECT 
USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can insert conversations in their empresa" 
ON public.docgen_conversations FOR INSERT 
WITH CHECK (empresa_id = get_user_empresa_id() AND user_id = auth.uid());

CREATE POLICY "Users can update conversations from their empresa" 
ON public.docgen_conversations FOR UPDATE 
USING (empresa_id = get_user_empresa_id() AND user_id = auth.uid());

CREATE POLICY "Users can delete conversations from their empresa" 
ON public.docgen_conversations FOR DELETE 
USING (empresa_id = get_user_empresa_id() AND user_id = auth.uid());

-- RLS Policies para docgen_templates
CREATE POLICY "Users can view templates from their empresa or system templates" 
ON public.docgen_templates FOR SELECT 
USING (empresa_id = get_user_empresa_id() OR is_system = true);

CREATE POLICY "Users can insert templates in their empresa" 
ON public.docgen_templates FOR INSERT 
WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can update templates from their empresa" 
ON public.docgen_templates FOR UPDATE 
USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can delete templates from their empresa" 
ON public.docgen_templates FOR DELETE 
USING (empresa_id = get_user_empresa_id());

-- RLS Policies para docgen_generated_docs
CREATE POLICY "Users can view generated docs from their empresa" 
ON public.docgen_generated_docs FOR SELECT 
USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can insert generated docs in their empresa" 
ON public.docgen_generated_docs FOR INSERT 
WITH CHECK (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can update generated docs from their empresa" 
ON public.docgen_generated_docs FOR UPDATE 
USING (empresa_id = get_user_empresa_id());

CREATE POLICY "Users can delete generated docs from their empresa" 
ON public.docgen_generated_docs FOR DELETE 
USING (empresa_id = get_user_empresa_id());

-- Triggers para updated_at
CREATE TRIGGER update_docgen_layouts_updated_at
  BEFORE UPDATE ON public.docgen_layouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_docgen_conversations_updated_at
  BEFORE UPDATE ON public.docgen_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_docgen_templates_updated_at
  BEFORE UPDATE ON public.docgen_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_docgen_generated_docs_updated_at
  BEFORE UPDATE ON public.docgen_generated_docs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir templates do sistema
INSERT INTO public.docgen_templates (empresa_id, tipo_documento, nome, estrutura, campos_obrigatorios, tooltips, is_system) VALUES
('00000000-0000-0000-0000-000000000000', 'politica', 'Política de Segurança da Informação', 
'{"secoes": ["objetivo", "escopo", "definicoes", "responsabilidades", "diretrizes", "disposicoes_finais"]}',
'["objetivo", "escopo", "responsabilidades"]',
'{"BIA": "Business Impact Analysis - Análise de Impacto no Negócio. Processo que identifica e avalia os efeitos potenciais de interrupções nas operações críticas da organização.", "ROPA": "Record of Processing Activities - Registro das Atividades de Tratamento. Documento que lista todos os tratamentos de dados pessoais realizados pela organização.", "RTO": "Recovery Time Objective - Tempo máximo aceitável para restaurar um sistema após uma interrupção.", "ISO": "International Organization for Standardization - Organização internacional que desenvolve padrões técnicos.", "LGPD": "Lei Geral de Proteção de Dados - Lei brasileira que regula o tratamento de dados pessoais."}',
true),
('00000000-0000-0000-0000-000000000000', 'procedimento', 'Procedimento Operacional Padrão', 
'{"secoes": ["objetivo", "aplicabilidade", "definicoes", "procedimento", "responsabilidades", "registros"]}',
'["objetivo", "procedimento", "responsabilidades"]',
'{"SLA": "Service Level Agreement - Acordo de Nível de Serviço que define padrões de qualidade esperados.", "KPI": "Key Performance Indicator - Indicador-chave de performance usado para medir eficiência.", "PDCA": "Plan-Do-Check-Act - Metodologia de melhoria contínua em quatro etapas."}',
true);