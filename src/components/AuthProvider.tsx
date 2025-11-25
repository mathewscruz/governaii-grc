
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger, measurePerformance } from '@/lib/logger';

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
  ativo: boolean;
  status_licenca: 'trial' | 'em_operacao';
  data_inicio_trial: string | null;
  plano_id: string | null;
  creditos_consumidos: number;
  plano?: {
    nome: string;
    codigo: string;
    creditos_franquia: number;
    icone: string;
    cor_primaria: string;
  };
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
  debugAuthState: () => void;
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
      logger.debug('Fetching profile for user', { userId, module: 'auth' });
      
      const { data, error } = await measurePerformance(
        'fetchProfile',
        () => supabase
          .from('profiles')
          .select(`
            *,
            empresas:empresa_id (
              id,
              nome,
              logo_url,
              cnpj,
              contato,
              ativo,
              status_licenca,
              data_inicio_trial,
              plano_id,
              creditos_consumidos,
              plano:planos (
                nome,
                codigo,
                creditos_franquia,
                icone,
                cor_primaria
              )
            )
          `)
          .eq('user_id', userId)
          .single(),
        { userId, module: 'auth' }
      );

      if (error) throw error;
      
      logger.info('Profile fetched successfully', { 
        userId, 
        profileId: data.id, 
        empresaId: data.empresa_id,
        role: data.role 
      });
      setProfile(data);
      
      const newCompany = data.empresas ? {
        ...data.empresas,
        status_licenca: (data.empresas.status_licenca || 'em_operacao') as 'trial' | 'em_operacao',
        data_inicio_trial: data.empresas.data_inicio_trial || null,
      } : null;
      logger.debug('Company updated', { 
        empresaId: newCompany?.id, 
        empresaNome: newCompany?.nome 
      });
      setCompany(newCompany);
      
      // Incrementar a chave para forçar re-render dos componentes que usam logo
      setLogoUpdateKey(prev => prev + 1);
      logger.debug('Logo update key incremented');
    } catch (error) {
      logger.error('Error fetching profile', { 
        error: error instanceof Error ? error.message : String(error), 
        userId 
      });
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
      logger.info('Initializing permissions for user', { userId: user.id, module: 'auth' });
      const { error } = await supabase.rpc('apply_default_permissions_for_user', {
        user_id_param: user.id
      });

      if (error) {
        logger.error('Error initializing user permissions', { 
          error: error.message, 
          userId: user.id 
        });
      } else {
        logger.info('User permissions initialized successfully', { userId: user.id });
      }
    } catch (error) {
      logger.error('Error calling apply_default_permissions_for_user', { 
        error: error instanceof Error ? error.message : String(error),
        userId: user.id 
      });
    }
  };

  // Função para debug do estado de autenticação
  const debugAuthState = () => {
    logger.debug('Current auth state', {
      userId: user?.id,
      sessionExists: !!session,
      profileExists: !!profile,
      companyExists: !!company,
      profileRole: profile?.role,
      profileEmpresaId: profile?.empresa_id,
      module: 'auth'
    });
  };


  const checkTemporaryPassword = async () => {
    if (!user) {
      logger.debug('No user found, setting hasTemporaryPassword to false');
      setHasTemporaryPassword(false);
      return;
    }

    try {
      logger.debug('Checking temporary password for user', { userId: user.id });
      
      const { data, error } = await measurePerformance(
        'checkTemporaryPassword',
        () => supabase
          .from('temporary_passwords')
          .select('is_temporary, created_at, expires_at')
          .eq('user_id', user.id)
          .eq('is_temporary', true)
          .maybeSingle(),
        { userId: user.id, module: 'auth' }
      );

      if (error) {
        logger.error('Error checking temporary password', { 
          error: error.message, 
          userId: user.id 
        });
        setHasTemporaryPassword(false);
        return;
      }

      if (!data) {
        logger.debug('No temporary password record found', { userId: user.id });
        setHasTemporaryPassword(false);
        return;
      }

      logger.debug('Temporary password data retrieved', { 
        userId: user.id, 
        hasData: !!data 
      });
      
      // Verificar se a senha temporária não expirou
      if (data.expires_at) {
        const expirationDate = new Date(data.expires_at);
        const now = new Date();
        if (now > expirationDate) {
          logger.info('Temporary password expired', { userId: user.id });
          setHasTemporaryPassword(false);
          return;
        }
      }

      const hasTemp = !!data?.is_temporary;
      logger.info('Temporary password check completed', { 
        userId: user.id, 
        hasTemporaryPassword: hasTemp 
      });
      setHasTemporaryPassword(hasTemp);
    } catch (error) {
      logger.error('Error checking temporary password', { 
        error: error instanceof Error ? error.message : String(error),
        userId: user.id 
      });
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

        logger.info('Auth state changed', { 
          event, 
          userId: session?.user?.id,
          module: 'auth' 
        });
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Verificar senha temporária PRIMEIRO e de forma síncrona
          await checkTemporaryPassword();
          // Depois fazer outras operações
          setTimeout(async () => {
            if (isSubscribed) {
              await fetchProfile(session.user.id);
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
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isSubscribed) return;

      logger.debug('Initial session check', { 
        userId: session?.user?.id,
        module: 'auth' 
      });
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Verificar senha temporária PRIMEIRO e de forma síncrona
        await checkTemporaryPassword();
        setTimeout(async () => {
          if (isSubscribed) {
            await fetchProfile(session.user.id);
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
    debugAuthState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
