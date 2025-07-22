
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import logoImage from '@/assets/governaii-logo-main.png';

const Auth = () => {
  const { user, loading, getCompanyByEmail, logoUpdateKey } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [isLoadingLogo, setIsLoadingLogo] = useState(false);

  // Redirect if already authenticated - usando useEffect para evitar loops
  useEffect(() => {
    if (!loading && user) {
      window.location.replace('/');
    }
  }, [user, loading]);

  // Debounce para buscar logo da empresa
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (email && email.includes('@')) {
        setIsLoadingLogo(true);
        try {
          const company = await getCompanyByEmail(email);
          setCompanyLogo(company?.logo_url || null);
        } catch (error) {
          console.error('Erro ao buscar logo da empresa:', error);
        } finally {
          setIsLoadingLogo(false);
        }
      } else {
        setCompanyLogo(null);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [email, getCompanyByEmail]);

  // Early return AFTER all hooks
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      toast.success('Login realizado com sucesso!');
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast.error(error.message || 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    toast.info('Funcionalidade em desenvolvimento');
  };

  const getCurrentLogo = () => {
    if (companyLogo) {
      // Se o logo da empresa já tem timestamp, usar como está; senão, adicionar timestamp
      const hasTimestamp = companyLogo.includes('?t=');
      return hasTimestamp ? companyLogo : `${companyLogo}?t=${Date.now()}`;
    }
    return logoImage;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* Logo fora do card */}
        <div className="text-center mb-8">
          <div className="relative">
            <img 
              key={`auth-logo-${logoUpdateKey}-${Date.now()}-${companyLogo || 'default'}`} // Chave única que força re-render completo
              src={getCurrentLogo()} 
              alt="Logo" 
              className={`h-20 mx-auto object-contain transition-opacity duration-300 ${
                isLoadingLogo ? 'opacity-50' : 'opacity-100'
              }`}
              onError={(e) => {
                // Fallback para logo padrão em caso de erro
                const target = e.target as HTMLImageElement;
                target.src = logoImage;
              }}
            />
            {isLoadingLogo && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white/50"></div>
              </div>
            )}
          </div>
        </div>
        
        <Card className="shadow-2xl border-0 bg-white">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-800 mb-2">
              Acesso ao Sistema
            </CardTitle>
            <CardDescription className="text-gray-600">
              Entre com suas credenciais
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSignIn} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu.email@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 px-4 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 px-4 pr-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <Label 
                    htmlFor="remember" 
                    className="text-sm text-gray-600 cursor-pointer"
                  >
                    Lembrar-me
                  </Label>
                </div>
                
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base rounded-md transition-colors"
                disabled={isLoading}
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <div className="text-center mt-8">
          <p className="text-gray-400 text-sm">
            © 2025 - GovernAII - Todos os direitos reservados
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
