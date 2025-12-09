import React, { useState } from 'react';
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
import { ForgotPasswordDialog } from '@/components/ForgotPasswordDialog';

const getErrorMessage = (error: any): string => {
  const message = error?.message || '';
  
  if (message.includes('Invalid login credentials')) {
    return 'Email ou senha incorretos';
  }
  if (message.includes('Email not confirmed')) {
    return 'Email não confirmado. Verifique sua caixa de entrada.';
  }
  if (message.includes('User not found')) {
    return 'Usuário não encontrado';
  }
  if (message.includes('Too many requests')) {
    return 'Muitas tentativas. Aguarde alguns minutos.';
  }
  if (message.includes('Network')) {
    return 'Erro de conexão. Verifique sua internet.';
  }
  
  return 'Erro ao fazer login. Tente novamente.';
};

const Auth = () => {
  const { user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [forgotPasswordDialogOpen, setForgotPasswordDialogOpen] = useState(false);

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(200,25%,8%)] via-[hsl(200,22%,11%)] to-[hsl(200,25%,8%)]">
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
      toast.error(getErrorMessage(error));
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setForgotPasswordDialogOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[hsl(200,25%,8%)] via-[hsl(200,22%,11%)] to-[hsl(200,25%,8%)] p-4">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src={logoImage} 
            alt="GovernAII Logo" 
            className="h-20 mx-auto object-contain"
          />
        </div>
        
        <Card className="shadow-2xl border border-border/50 bg-card backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-card-foreground mb-2">
              Acesso ao Sistema
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Entre com suas credenciais
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSignIn} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-card-foreground font-medium">
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@empresa.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 px-4 border-border focus:border-primary focus:ring-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-card-foreground font-medium">
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
                    className="h-12 px-4 pr-12 border-border focus:border-primary focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    Lembrar-me
                  </Label>
                </div>
                
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-primary hover:text-primary/80 hover:underline transition-colors"
                >
                  Esqueci minha senha
                </button>
              </div>

              <Button 
                type="submit" 
                variant="gradient"
                className="w-full h-12 font-semibold text-base"
                disabled={isLoading}
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <div className="text-center mt-8">
          <p className="text-muted-foreground text-sm">
            © 2025 - GovernAII - Todos os direitos reservados
          </p>
        </div>
      </div>

      <ForgotPasswordDialog
        open={forgotPasswordDialogOpen}
        onOpenChange={setForgotPasswordDialogOpen}
      />
    </div>
  );
};

export default Auth;