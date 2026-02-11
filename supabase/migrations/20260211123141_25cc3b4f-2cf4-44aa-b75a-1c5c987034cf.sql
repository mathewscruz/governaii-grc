
-- Create permission_profiles table
CREATE TABLE public.permission_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create permission_profile_modules table
CREATE TABLE public.permission_profile_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.permission_profiles(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.system_modules(id) ON DELETE CASCADE,
  can_access BOOLEAN NOT NULL DEFAULT false,
  can_create BOOLEAN NOT NULL DEFAULT false,
  can_read BOOLEAN NOT NULL DEFAULT false,
  can_update BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(profile_id, module_id)
);

-- Add permission_profile_id to profiles
ALTER TABLE public.profiles 
ADD COLUMN permission_profile_id UUID REFERENCES public.permission_profiles(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.permission_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_profile_modules ENABLE ROW LEVEL SECURITY;

-- Security definer function to get user empresa_id
CREATE OR REPLACE FUNCTION public.get_user_empresa_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT empresa_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- RLS for permission_profiles
CREATE POLICY "Users can view permission profiles of their empresa"
ON public.permission_profiles
FOR SELECT
TO authenticated
USING (empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "Admins can insert permission profiles"
ON public.permission_profiles
FOR INSERT
TO authenticated
WITH CHECK (
  empresa_id = public.get_user_empresa_id(auth.uid())
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
);

CREATE POLICY "Admins can update permission profiles"
ON public.permission_profiles
FOR UPDATE
TO authenticated
USING (
  empresa_id = public.get_user_empresa_id(auth.uid())
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
);

CREATE POLICY "Admins can delete permission profiles"
ON public.permission_profiles
FOR DELETE
TO authenticated
USING (
  empresa_id = public.get_user_empresa_id(auth.uid())
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
);

-- RLS for permission_profile_modules
CREATE POLICY "Users can view profile modules of their empresa"
ON public.permission_profile_modules
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.permission_profiles pp
    WHERE pp.id = profile_id
    AND pp.empresa_id = public.get_user_empresa_id(auth.uid())
  )
);

CREATE POLICY "Admins can insert profile modules"
ON public.permission_profile_modules
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.permission_profiles pp
    WHERE pp.id = profile_id
    AND pp.empresa_id = public.get_user_empresa_id(auth.uid())
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  )
);

CREATE POLICY "Admins can update profile modules"
ON public.permission_profile_modules
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.permission_profiles pp
    WHERE pp.id = profile_id
    AND pp.empresa_id = public.get_user_empresa_id(auth.uid())
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  )
);

CREATE POLICY "Admins can delete profile modules"
ON public.permission_profile_modules
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.permission_profiles pp
    WHERE pp.id = profile_id
    AND pp.empresa_id = public.get_user_empresa_id(auth.uid())
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_permission_profiles_updated_at
BEFORE UPDATE ON public.permission_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to apply profile permissions to a user
CREATE OR REPLACE FUNCTION public.apply_permission_profile(
  _user_id uuid,
  _profile_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete existing user permissions
  DELETE FROM public.user_module_permissions WHERE user_id = _user_id;
  
  -- Insert permissions from profile
  INSERT INTO public.user_module_permissions (user_id, module_id, can_access, can_create, can_read, can_update, can_delete, granted_by, granted_at)
  SELECT _user_id, ppm.module_id, ppm.can_access, ppm.can_create, ppm.can_read, ppm.can_update, ppm.can_delete, auth.uid(), now()
  FROM public.permission_profile_modules ppm
  WHERE ppm.profile_id = _profile_id;
  
  -- Update user profile with the profile_id
  UPDATE public.profiles SET permission_profile_id = _profile_id WHERE user_id = _user_id;
END;
$$;
