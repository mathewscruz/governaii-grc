-- 1) Backfill de permissões para usuários sem nenhuma permissão de módulo
DO $$
DECLARE u RECORD;
BEGIN
  FOR u IN
    SELECT p.user_id FROM public.profiles p
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_module_permissions ump WHERE ump.user_id = p.user_id
    )
  LOOP
    PERFORM public.apply_default_permissions_for_user(u.user_id);
  END LOOP;
END $$;

-- 2) Backfill de user_roles a partir de profiles.role
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id,
  CASE
    WHEN p.role::text = 'super_admin' THEN 'super_admin'::public.app_role
    WHEN p.role::text = 'admin' THEN 'admin'::public.app_role
    ELSE 'user'::public.app_role
  END
FROM public.profiles p
WHERE p.role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;