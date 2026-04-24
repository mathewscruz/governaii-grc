ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS preferred_locale text NOT NULL DEFAULT 'pt';

ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_preferred_locale_check;

ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_preferred_locale_check 
  CHECK (preferred_locale IN ('pt', 'en'));