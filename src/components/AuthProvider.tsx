
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
  getCompanyByEmail: (email: string) => Promise<Company | null>;
  logoUpdateKey: number;
  forceLogoUpdate: () => void;
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

  const getCompanyByEmail = async (email: string): Promise<Company | null> => {
    if (!email || !email.includes('@')) return null;

    try {
      // Primeiro, tenta encontrar um usuário com esse email
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          empresa_id,
          empresas:empresa_id (
            id,
            nome,
            logo_url,
            cnpj,
            contato
          )
        `)
        .eq('email', email)
        .single();

      if (!profileError && profileData?.empresas) {
        return profileData.empresas as Company;
      }

      // Se não encontrar pelo email exato, tenta pelo domínio
      const domain = email.split('@')[1];
      if (!domain) return null;

      const { data: domainData, error: domainError } = await supabase
        .from('profiles')
        .select(`
          empresa_id,
          empresas:empresa_id (
            id,
            nome,
            logo_url,
            cnpj,
            contato
          )
        `)
        .like('email', `%@${domain}`)
        .limit(1)
        .single();

      if (!domainError && domainData?.empresas) {
        return domainData.empresas as Company;
      }

      return null;
    } catch (error) {
      console.error('Error fetching company by email:', error);
      return null;
    }
  };

  const checkTemporaryPassword = async () => {
    if (!user) {
      console.log('No user for temporary password check');
      setHasTemporaryPassword(false);
      return;
    }

    try {
      console.log('Checking temporary password for user:', user.id);
      const { data, error } = await supabase
        .from('temporary_passwords')
        .select('is_temporary')
        .eq('user_id', user.id)
        .eq('is_temporary', true)
        .single();

      console.log('Temporary password check result:', data, error);
      const hasTemp = !!data;
      setHasTemporaryPassword(hasTemp);
      console.log('Has temporary password:', hasTemp);
    } catch (error) {
      console.log('Error checking temporary password:', error);
      // Se não encontrar registro, assume que não tem senha temporária
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
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
          // Garantir que verificação de senha temporária aconteça após login
          if (event === 'SIGNED_IN') {
            console.log('User signed in, checking temporary password...');
            setTimeout(async () => {
              await checkTemporaryPassword();
            }, 500);
          }
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
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
        checkTemporaryPassword();
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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
    getCompanyByEmail,
    logoUpdateKey,
    forceLogoUpdate,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
