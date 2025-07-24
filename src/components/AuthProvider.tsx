
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  empresa_id: string | null;
  nome: string;
  email: string;
  role: 'super_admin' | 'admin' | 'user' | 'readonly';
  ativo: boolean;
}

interface Company {
  id: string;
  nome: string;
  logo_url: string | null;
  cnpj: string | null;
  contato: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  company: Company | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refetchProfile: () => Promise<void>;
  hasTemporaryPassword: boolean;
  checkTemporaryPassword: () => Promise<void>;
  logoUpdateKey: number;
  forceLogoUpdate: () => void;
  initializeUserPermissions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasTemporaryPassword, setHasTemporaryPassword] = useState(false);
  const [logoUpdateKey, setLogoUpdateKey] = useState(0);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          empresas:empresa_id (
            id,
            nome,
            logo_url,
            cnpj,
            contato
          )
        `)
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      
      console.log('Profile fetched:', data);
      setProfile(data);
      
      const newCompany = data.empresas || null;
      console.log('Company updated:', newCompany);
      setCompany(newCompany);
      
      // Incrementar a chave para forçar re-render dos componentes que usam logo
      setLogoUpdateKey(prev => prev + 1);
      console.log('Logo update key incremented');
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
      setCompany(null);
    }
  };

  const forceLogoUpdate = () => {
    console.log('Forcing logo update...');
    setLogoUpdateKey(prev => prev + 1);
    // Força um re-render adicional após pequeno delay para garantir que todos os componentes sejam atualizados
    setTimeout(() => {
      setLogoUpdateKey(prev => prev + 1);
    }, 100);
  };

  const initializeUserPermissions = async () => {
    if (!user) return;

    try {
      console.log('Initializing permissions for user:', user.id);
      const { error } = await supabase.rpc('apply_default_permissions_for_user', {
        user_id_param: user.id
      });

      if (error) {
        console.error('Error initializing user permissions:', error);
      } else {
        console.log('User permissions initialized successfully');
      }
    } catch (error) {
      console.error('Error calling apply_default_permissions_for_user:', error);
    }
  };


  const checkTemporaryPassword = async () => {
    if (!user) {
      console.log('No user found, setting hasTemporaryPassword to false');
      setHasTemporaryPassword(false);
      return;
    }

    try {
      console.log('Checking temporary password for user:', user.id);
      const { data, error } = await supabase
        .from('temporary_passwords')
        .select('is_temporary, created_at, expires_at')
        .eq('user_id', user.id)
        .eq('is_temporary', true)
        .single();

      if (error) {
        console.log('No temporary password record found or error:', error.message);
        setHasTemporaryPassword(false);
        return;
      }

      console.log('Temporary password data:', data);
      
      // Verificar se a senha temporária não expirou
      if (data.expires_at) {
        const expirationDate = new Date(data.expires_at);
        const now = new Date();
        if (now > expirationDate) {
          console.log('Temporary password expired');
          setHasTemporaryPassword(false);
          return;
        }
      }

      const hasTemp = !!data?.is_temporary;
      console.log('Has temporary password:', hasTemp);
      setHasTemporaryPassword(hasTemp);
    } catch (error) {
      console.error('Error checking temporary password:', error);
      setHasTemporaryPassword(false);
    }
  };

  const refetchProfile = async () => {
    if (user) {
      console.log('Refetching profile...');
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    let isSubscribed = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isSubscribed) return;

        console.log('Auth state changed:', event, 'User:', session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Usar setTimeout para não bloquear o callback
          setTimeout(async () => {
            if (isSubscribed) {
              await fetchProfile(session.user.id);
              await checkTemporaryPassword();
              await initializeUserPermissions();
            }
          }, 0);
        } else {
          setProfile(null);
          setCompany(null);
          setHasTemporaryPassword(false);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isSubscribed) return;

      console.log('Initial session check:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(async () => {
          if (isSubscribed) {
            await fetchProfile(session.user.id);
            await checkTemporaryPassword();
            await initializeUserPermissions();
          }
        }, 0);
      }
      setLoading(false);
    });

    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    session,
    profile,
    company,
    loading,
    signOut,
    refetchProfile,
    hasTemporaryPassword,
    checkTemporaryPassword,
    logoUpdateKey,
    forceLogoUpdate,
    initializeUserPermissions,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
