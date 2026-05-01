
-- ============================================================================
-- 1. Tabela: evidence_library (repositório central de evidências por empresa)
-- ============================================================================
CREATE TABLE public.evidence_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  tags TEXT[] DEFAULT '{}'::text[],
  arquivo_url TEXT,
  arquivo_nome TEXT,
  arquivo_tipo TEXT,
  arquivo_tamanho BIGINT,
  arquivo_hash TEXT, -- sha256 para deduplicação automática
  link_externo TEXT,
  origem_evaluation_id UUID REFERENCES public.gap_analysis_evaluations(id) ON DELETE SET NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT evidence_library_has_source CHECK (arquivo_url IS NOT NULL OR link_externo IS NOT NULL)
);

CREATE INDEX idx_evidence_library_empresa ON public.evidence_library(empresa_id);
CREATE INDEX idx_evidence_library_hash ON public.evidence_library(empresa_id, arquivo_hash) WHERE arquivo_hash IS NOT NULL;
CREATE INDEX idx_evidence_library_tags ON public.evidence_library USING GIN(tags);

ALTER TABLE public.evidence_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "evidence_library_select_empresa" ON public.evidence_library
FOR SELECT USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "evidence_library_insert_empresa" ON public.evidence_library
FOR INSERT WITH CHECK (empresa_id = public.get_user_empresa_id());

CREATE POLICY "evidence_library_update_empresa" ON public.evidence_library
FOR UPDATE USING (empresa_id = public.get_user_empresa_id())
WITH CHECK (empresa_id = public.get_user_empresa_id());

CREATE POLICY "evidence_library_delete_empresa" ON public.evidence_library
FOR DELETE USING (empresa_id = public.get_user_empresa_id());

CREATE TRIGGER trg_evidence_library_updated_at
BEFORE UPDATE ON public.evidence_library
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 2. Tabela: evidence_library_links (vínculos N:N evidência ↔ avaliação)
-- ============================================================================
CREATE TABLE public.evidence_library_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  evidence_id UUID NOT NULL REFERENCES public.evidence_library(id) ON DELETE CASCADE,
  evaluation_id UUID NOT NULL REFERENCES public.gap_analysis_evaluations(id) ON DELETE CASCADE,
  requirement_id UUID NOT NULL,
  framework_id UUID NOT NULL,
  vinculo_tipo TEXT NOT NULL DEFAULT 'manual' CHECK (vinculo_tipo IN ('manual','sugestao_ia')),
  ia_score NUMERIC(3,2) CHECK (ia_score IS NULL OR (ia_score >= 0 AND ia_score <= 1)),
  ia_justificativa TEXT,
  aceito_em TIMESTAMPTZ,
  aceito_por UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_evidence_evaluation UNIQUE (evidence_id, evaluation_id)
);

CREATE INDEX idx_evidence_links_empresa ON public.evidence_library_links(empresa_id);
CREATE INDEX idx_evidence_links_evidence ON public.evidence_library_links(evidence_id);
CREATE INDEX idx_evidence_links_evaluation ON public.evidence_library_links(evaluation_id);
CREATE INDEX idx_evidence_links_requirement ON public.evidence_library_links(requirement_id);
CREATE INDEX idx_evidence_links_framework ON public.evidence_library_links(framework_id);
CREATE INDEX idx_evidence_links_pendentes ON public.evidence_library_links(empresa_id, vinculo_tipo) WHERE aceito_em IS NULL;

ALTER TABLE public.evidence_library_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "evidence_links_select_empresa" ON public.evidence_library_links
FOR SELECT USING (empresa_id = public.get_user_empresa_id());

CREATE POLICY "evidence_links_insert_empresa" ON public.evidence_library_links
FOR INSERT WITH CHECK (
  empresa_id = public.get_user_empresa_id()
  AND public.evaluation_pertence_empresa(evaluation_id)
);

CREATE POLICY "evidence_links_update_empresa" ON public.evidence_library_links
FOR UPDATE USING (empresa_id = public.get_user_empresa_id())
WITH CHECK (empresa_id = public.get_user_empresa_id());

CREATE POLICY "evidence_links_delete_empresa" ON public.evidence_library_links
FOR DELETE USING (empresa_id = public.get_user_empresa_id());

CREATE TRIGGER trg_evidence_links_updated_at
BEFORE UPDATE ON public.evidence_library_links
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 3. Storage bucket: gap-evidence-library (privado, isolado por empresa)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('gap-evidence-library', 'gap-evidence-library', false)
ON CONFLICT (id) DO NOTHING;

-- Policies de storage: o primeiro segmento do path é o empresa_id do usuário
CREATE POLICY "gap_evidence_library_select"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'gap-evidence-library'
  AND (storage.foldername(name))[1] = public.get_user_empresa_id()::text
);

CREATE POLICY "gap_evidence_library_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'gap-evidence-library'
  AND (storage.foldername(name))[1] = public.get_user_empresa_id()::text
);

CREATE POLICY "gap_evidence_library_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'gap-evidence-library'
  AND (storage.foldername(name))[1] = public.get_user_empresa_id()::text
);

CREATE POLICY "gap_evidence_library_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'gap-evidence-library'
  AND (storage.foldername(name))[1] = public.get_user_empresa_id()::text
);
