-- Normalizar CNPJ vazio para NULL
UPDATE public.empresas SET cnpj = NULL WHERE cnpj IS NOT NULL AND btrim(cnpj) = '';

-- Unique parcial para CNPJ (apenas quando preenchido e não vazio)
CREATE UNIQUE INDEX IF NOT EXISTS empresas_cnpj_unique
  ON public.empresas (cnpj)
  WHERE cnpj IS NOT NULL AND btrim(cnpj) <> '';