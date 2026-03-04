
-- Tabela de changelog entries
CREATE TABLE public.changelog_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  release_date date NOT NULL DEFAULT CURRENT_DATE,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.changelog_entries ENABLE ROW LEVEL SECURITY;

-- Todos os usuários autenticados podem ler
CREATE POLICY "Authenticated users can read changelog"
  ON public.changelog_entries FOR SELECT
  TO authenticated
  USING (true);

-- Apenas super_admin pode inserir/atualizar
CREATE POLICY "Super admins can manage changelog"
  ON public.changelog_entries FOR ALL
  TO authenticated
  USING (public.has_super_admin_role())
  WITH CHECK (public.has_super_admin_role());

-- Trigger: ao inserir changelog, criar notificação para todos os usuários ativos
CREATE OR REPLACE FUNCTION public.notify_changelog_entry()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  v_items_summary text;
  v_profile record;
BEGIN
  -- Build summary from first 3 items
  SELECT string_agg(item->>'text', ', ')
  INTO v_items_summary
  FROM (
    SELECT jsonb_array_elements(NEW.items) AS item
    LIMIT 3
  ) sub;

  -- Insert notification for each active user
  FOR v_profile IN
    SELECT p.user_id
    FROM public.profiles p
    INNER JOIN public.empresas e ON p.empresa_id = e.id
    WHERE e.ativo = true
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type, link_to)
    VALUES (
      v_profile.user_id,
      'Nova versão ' || NEW.version,
      COALESCE(v_items_summary, 'Novas atualizações disponíveis'),
      'info',
      NULL
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_changelog
  AFTER INSERT ON public.changelog_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_changelog_entry();
