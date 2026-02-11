import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Eye, EyeOff, CheckCircle2, Loader2, Shield, BarChart3, FileCheck, Mail, Lock } from 'lucide-react';
import logoImage from '@/assets/akuris-logo.png';
import { ForgotPasswordDialog } from '@/components/ForgotPasswordDialog';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const loginSchema = z.object({
  email: z.string().min(1, 'Email é obrigatório').email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres')
});

const getErrorMessage = (error: any): string => {
  const message = error?.message || '';
  if (message.includes('Invalid login credentials')) return 'Email ou senha incorretos';
  if (message.includes('Email not confirmed')) return 'Email não confirmado. Verifique sua caixa de entrada.';
  if (message.includes('User not found')) return 'Usuário não encontrado';
  if (message.includes('Too many requests')) return 'Muitas tentativas. Aguarde alguns minutos.';
  if (message.includes('Network')) return 'Erro de conexão. Verifique sua internet.';
  return 'Erro ao fazer login. Tente novamente.';
};

const features = [
  { icon: Shield, title: 'Governança', desc: 'Políticas, documentos e conformidade centralizada' },
  { icon: BarChart3, title: 'Riscos', desc: 'Matriz de riscos e tratamentos integrados' },
  { icon: FileCheck, title: 'Compliance', desc: 'Gap analysis, auditorias e controles' },
];

const Auth = () => {
  const { user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [forgotPasswordDialogOpen, setForgotPasswordDialogOpen] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    const savedEmail = localStorage.getItem('governaii_remember_email');
    const savedRemember = localStorage.getItem('governaii_remember_me') === 'true';
    if (savedEmail && savedRemember) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(216,60%,8%)] via-[hsl(216,45%,12%)] to-[hsl(216,60%,8%)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const validation = loginSchema.safeParse({ email: email.trim(), password });
    if (!validation.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0] === 'email') fieldErrors.email = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      if (rememberMe) {
        localStorage.setItem('governaii_remember_email', email.trim());
        localStorage.setItem('governaii_remember_me', 'true');
      } else {
        localStorage.removeItem('governaii_remember_email');
        localStorage.removeItem('governaii_remember_me');
      }
      setLoginSuccess(true);
      toast.success('Login realizado com sucesso!');
    } catch (error: any) {
      logger.warn('Login failed', { module: 'Auth', action: 'login', details: error.message });
      toast.error(getErrorMessage(error));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ===== BRAND PANEL (desktop only) ===== */}
      <div className="hidden lg:flex lg:w-[60%] relative flex-col items-center justify-center bg-gradient-to-br from-[hsl(216,60%,8%)] via-[hsl(216,45%,10%)] to-[hsl(216,60%,8%)] overflow-hidden">
        {/* Grid background */}
        <div className="landing-grid-bg absolute inset-0 opacity-30" />

        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-primary/10 rounded-full blur-[100px] glow-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/8 rounded-full blur-[120px] glow-pulse" style={{ animationDelay: '1s' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-10 px-12 max-w-lg landing-fade-in-1">
          <img src={logoImage} alt="Akuris Logo" className="h-20 object-contain landing-fade-in-1" />
          <div className="text-center space-y-3 landing-fade-in-2">
            <h1 className="text-3xl font-bold text-white">
              Plataforma de <span className="text-gradient">Governança, Risco e Compliance</span>
            </h1>
            <p className="text-white/50 text-sm">Gerencie todo o ciclo GRC da sua organização em um só lugar.</p>
          </div>

          {/* Feature cards */}
          <div className="w-full space-y-3 landing-fade-in-3">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm px-5 py-4 landing-fade-in-4"
                style={{ animationDelay: `${0.5 + i * 0.15}s` }}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/15 text-primary shrink-0">
                  <f.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-xs text-white/45">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== LOGIN PANEL ===== */}
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-[hsl(216,50%,10%)] to-[hsl(216,45%,12%)] px-6 py-12 relative overflow-hidden">
        {/* Subtle orb for mobile */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="w-full max-w-sm relative z-10 space-y-8">
          {/* Logo (mobile only) */}
          <div className="lg:hidden text-center landing-fade-in-1">
            <img src={logoImage} alt="Akuris Logo" className="h-16 mx-auto object-contain" />
            <p className="text-white/40 text-xs mt-2">Governança, Risco e Compliance</p>
          </div>

          {/* Form card */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md p-8 shadow-2xl space-y-6 landing-fade-in-2">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold text-white">Acesso ao Sistema</h2>
              <p className="text-sm text-white/50">Entre com suas credenciais</p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5 landing-fade-in-3">
                <Label htmlFor="email" className="text-white/70 text-sm font-medium">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@empresa.com.br"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(p => ({ ...p, email: undefined })); }}
                    autoFocus
                    className={`h-11 pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary focus:ring-primary ${errors.email ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1.5 landing-fade-in-4">
                <Label htmlFor="password" className="text-white/70 text-sm font-medium">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors(p => ({ ...p, password: undefined })); }}
                    className={`h-11 pl-10 pr-11 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary focus:ring-primary ${errors.password ? 'border-destructive' : ''}`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>

              {/* Remember / Forgot */}
              <div className="flex items-center justify-between landing-fade-in-5">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" checked={rememberMe} onCheckedChange={(c) => setRememberMe(c as boolean)} />
                  <Label htmlFor="remember" className="text-xs text-white/50 cursor-pointer">Lembrar-me</Label>
                </div>
                <button type="button" onClick={() => setForgotPasswordDialogOpen(true)} className="text-xs text-primary hover:text-primary/80 hover:underline transition-colors">
                  Esqueci minha senha
                </button>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                variant="gradient"
                className="w-full h-11 font-semibold text-sm landing-glow-btn"
                disabled={isLoading || loginSuccess}
              >
                {loginSuccess ? (
                  <><CheckCircle2 className="mr-2 h-4 w-4 text-green-400" />Sucesso!</>
                ) : isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Entrando...</>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>

          </div>

          {/* Footer */}
          <div className="text-center space-y-1.5 landing-fade-in-5">
            <Link to="/politica-privacidade" target="_blank" className="text-white/30 hover:text-primary text-xs transition-colors">
              Política de Privacidade
            </Link>
            <p className="text-white/20 text-xs">© {new Date().getFullYear()} Akuris — Todos os direitos reservados</p>
          </div>
        </div>
      </div>

      <ForgotPasswordDialog open={forgotPasswordDialogOpen} onOpenChange={setForgotPasswordDialogOpen} />
    </div>
  );
};

export default Auth;
