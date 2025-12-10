-- Create a trigger function to prevent users from modifying their own role
-- This prevents privilege escalation attacks where users try to make themselves admin/super_admin
CREATE OR REPLACE FUNCTION public.prevent_role_self_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If role is being changed
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    -- Check if the user is trying to modify their own role
    IF OLD.user_id = auth.uid() THEN
      -- Only super_admins can modify roles (including their own)
      IF NOT is_super_admin() THEN
        RAISE EXCEPTION 'Você não tem permissão para modificar funções de usuário. Apenas super administradores podem alterar roles.';
      END IF;
    ELSE
      -- Modifying someone else's role - must be admin or super_admin
      IF NOT is_admin_or_super_admin() THEN
        RAISE EXCEPTION 'Você não tem permissão para modificar funções de outros usuários.';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger on profiles table
DROP TRIGGER IF EXISTS trigger_prevent_role_self_modification ON public.profiles;
CREATE TRIGGER trigger_prevent_role_self_modification
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_self_modification();

-- Add a comment explaining the security purpose
COMMENT ON FUNCTION public.prevent_role_self_modification() IS 'Security trigger to prevent privilege escalation attacks by blocking unauthorized role modifications';