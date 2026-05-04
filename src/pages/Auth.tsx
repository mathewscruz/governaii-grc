import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import logoImage from '@/assets/akuris-logo.png';
import { ForgotPasswordDialog } from '@/components/ForgotPasswordDialog';
import { LanguageSelector } from '@/components/LanguageSelector';
import { MFAVerification } from '@/components/MFAVerification';
import { useLanguage } from '@/contexts/LanguageContext';
import { z } from 'zod';
import { logger } from '@/lib/logger';

import { AkurisPulse } from '@/components/ui/AkurisPulse';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { AkurisMarkPattern } from '@/components/identity/AkurisMarkPattern';
import { CornerAccent } from '@/components/identity/CornerAccent';
import { RiscosIcon, ControlesIcon, GapAnalysisIcon } from '@/components/icons';
const Auth = () => {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [forgotPasswordDialogOpen, setForgotPasswordDialogOpen] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Máquina de estados única do fluxo de login.
  // - idle: form normal
  // - authenticating: validando credenciais e decidindo MFA → overlay
  // - mfa_required: precisa código MFA → tela MFA
  // - verifying_mfa: validando OTP + restabelecendo sessão → overlay
  // - finalizing: sessão pronta, aguardando AuthProvider propagar user → overlay
  type AuthPhase = 'idle' | 'authenticating' | 'mfa_required' | 'verifying_mfa' | 'finalizing';
  const [phase, setPhase] = useState<AuthPhase>('idle');
  const [mfaUserId, setMfaUserId] = useState('');
  const [mfaEmail, setMfaEmail] = useState('');
  const [mfaPassword, setMfaPassword] = useState('');

  const isBusy = phase !== 'idle';
  const showOverlay = phase === 'authenticating' || phase === 'verifying_mfa' || phase === 'finalizing';

  const loginSchema = z.object({
    email: z.string().min(1, t('auth.validationEmailRequired')).email(t('auth.validationEmailInvalid')),
    password: z.string().min(6, t('auth.validationPasswordMin'))
  });

  const getErrorMessage = (error: any): string => {
    const message = error?.message || '';
    if (message.includes('Invalid login credentials')) return t('auth.errorInvalidCredentials');
    if (message.includes('Email not confirmed')) return t('auth.errorEmailNotConfirmed');
    if (message.includes('User not found')) return t('auth.errorUserNotFound');
    if (message.includes('Too many requests')) return t('auth.errorTooManyRequests');
    if (message.includes('Network')) return t('auth.errorNetwork');
    return t('auth.errorGeneric');
  };

  const pillars = [
    { Icon: RiscosIcon, title: t('auth.pillarRiscos'), desc: t('auth.pillarRiscosDesc') },
    { Icon: ControlesIcon, title: t('auth.pillarControles'), desc: t('auth.pillarControlesDesc') },
    { Icon: GapAnalysisIcon, title: t('auth.pillarGapAnalysis'), desc: t('auth.pillarGapAnalysisDesc') },
  ];

  useEffect(() => {
    const savedEmail = localStorage.getItem('akuris_remember_email');
    const savedRemember = localStorage.getItem('akuris_remember_me') === 'true';
    if (savedEmail && savedRemember) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Só navega para dashboard quando o fluxo NÃO está aguardando MFA.
  // Durante 'authenticating', 'verifying_mfa' e 'finalizing' o overlay cobre tudo.
  if (!loading && user && phase !== 'mfa_required') {
    return <Navigate to="/dashboard" replace />;
  }

  if (showOverlay) {
    return <LoadingOverlay />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(230,25%,7%)]">
        <div className="text-center">
          <AkurisPulse size={48} />
          <p className="mt-4 text-muted-foreground">{t('common.loading')}</p>
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

    setPhase('authenticating');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;

      const userId = data.user?.id;

      if (rememberMe) {
        localStorage.setItem('akuris_remember_email', email.trim());
        localStorage.setItem('akuris_remember_me', 'true');
      } else {
        localStorage.removeItem('akuris_remember_email');
        localStorage.removeItem('akuris_remember_me');
      }

      if (!userId) {
        // Caso degenerado — sem userId não há como continuar.
        await supabase.auth.signOut();
        toast.error(t('auth.errorAuth'));
        setPhase('idle');
        return;
      }

      // Decide se MFA é necessário. Política: MFA é OBRIGATÓRIO sempre, exceto
      // quando o backend confirma explicitamente uma sessão MFA válida nas últimas 24h.
      // Qualquer falha de envio mantém o usuário no fluxo de MFA — nunca libera direto.
      let mfaSkipped = false;
      let mfaSendFailed = false;
      try {
        const mfaResponse = await supabase.functions.invoke('send-mfa-code', {
          body: { userId, email: email.trim() },
        });

        if (mfaResponse.error) {
          logger.error('Erro ao invocar send-mfa-code', {
            module: 'Auth',
            error: String(mfaResponse.error),
          });
          mfaSendFailed = true;
        } else if (mfaResponse.data?.success && mfaResponse.data?.skipped) {
          // Único caminho legítimo de bypass: sessão MFA válida nas últimas 24h.
          mfaSkipped = true;
        } else if (mfaResponse.data?.success) {
          // success=true cobre tanto novo envio quanto alreadySent → segue para MFA.
          mfaSkipped = false;
        } else {
          // Backend retornou erro controlado (ex.: 500). Tratar como falha de envio.
          logger.error('send-mfa-code retornou erro controlado', {
            module: 'Auth',
            error: String(mfaResponse.data?.error || 'desconhecido'),
          });
          mfaSendFailed = true;
        }
      } catch (mfaError) {
        logger.error('Exceção ao chamar send-mfa-code', {
          module: 'Auth',
          error: String(mfaError),
        });
        mfaSendFailed = true;
      }

      if (mfaSendFailed) {
        // Falha de envio NÃO pode liberar acesso. Aborta o login.
        await supabase.auth.signOut();
        toast.error(t('auth.errorAuth'));
        setPhase('idle');
        return;
      }

      if (!mfaSkipped) {
        // Preparar a tela de MFA ANTES de derrubar a sessão, para evitar
        // que o <Navigate> dispare durante o flush do onAuthStateChange.
        setMfaUserId(userId);
        setMfaEmail(email.trim());
        setMfaPassword(password);
        setPhase('mfa_required');
        await supabase.auth.signOut();
        return;
      }

      // Fluxo direto (sessão MFA válida nas últimas 24h).
      toast.success(t('auth.loginSuccess'));
      setPhase('finalizing');
    } catch (error: any) {
      logger.warn('Login failed', {
        module: 'Auth',
        action: 'login',
        details: error?.message,
      });
      toast.error(getErrorMessage(error));
      setPhase('idle');
    }
  };

  const handleMFAVerified = async () => {
    setPhase('verifying_mfa');
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: mfaEmail,
        password: mfaPassword,
      });
      setMfaPassword('');

      if (error) {
        toast.error(t('auth.errorAuthAfterMFA'));
        setPhase('idle');
        return;
      }

      toast.success(t('auth.loginSuccess'));
      setPhase('finalizing');
    } catch (err) {
      setMfaPassword('');
      toast.error(t('auth.errorAuth'));
      setPhase('idle');
    }
  };

  const handleMFACancel = () => {
    setMfaUserId('');
    setMfaEmail('');
    setMfaPassword('');
    setPhase('idle');
    toast.info(t('auth.loginCancelled'));
  };

  if (phase === 'mfa_required') {
    return (
      <MFAVerification
        userId={mfaUserId}
        email={mfaEmail}
        onVerified={handleMFAVerified}
        onCancel={handleMFACancel}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[hsl(230,25%,7%)]">
      {/* ===== BRAND PANEL (desktop only) ===== */}
      <div className="hidden lg:flex lg:w-[58%] relative flex-col justify-between sidebar-gradient overflow-hidden p-14">
        {/* Pattern de marca + glow único */}
        <AkurisMarkPattern opacity={0.05} />
        <div className="absolute top-1/3 -left-24 w-[420px] h-[420px] bg-[hsl(252,100%,66%,0.08)] rounded-full blur-[120px] pointer-events-none" />

        {/* Topo: logo */}
        <div className="relative z-10 landing-fade-in-1">
          <img src={logoImage} alt="Akuris" className="h-9 object-contain" />
        </div>

        {/* Centro: narrativa editorial */}
        <div className="relative z-10 max-w-xl space-y-10 landing-fade-in-2">
          <div className="space-y-5">
            <h1 className="text-4xl lg:text-5xl font-semibold text-white leading-[1.05] tracking-tight">
              {t('auth.platformTitle')}{' '}
              <span className="text-gradient">{t('auth.platformHighlight')}</span>
            </h1>
            <p className="text-white/55 text-base max-w-md leading-relaxed">
              {t('auth.platformDesc')}
            </p>
          </div>

          {/* Pilares como lista editorial — sem caixas */}
          <ul className="space-y-5 landing-fade-in-3">
            {pillars.map((p, i) => (
              <li key={i} className="flex items-start gap-4">
                <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 text-primary shrink-0">
                  <p.Icon size={18} />
                </span>
                <div className="pt-1">
                  <p className="text-sm font-semibold text-white tracking-tight">{p.title}</p>
                  <p className="text-xs text-white/45 mt-0.5">{p.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Rodapé: selo de confiança */}
        <div className="relative z-10 landing-fade-in-4">
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-5" />
          <p className="text-white/35 text-[11px] tracking-[0.18em] uppercase font-medium">
            {t('auth.complianceBadges')}
          </p>
        </div>
      </div>

      {/* ===== LOGIN PANEL ===== */}
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-[hsl(230,25%,7%)] to-[hsl(228,20%,9%)] px-6 py-12 relative overflow-hidden">
        <AkurisMarkPattern opacity={0.04} />
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Header utilitário */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-3">
          <Link
            to="/"
            className="hidden sm:inline-flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            {t('auth.backToSite')}
          </Link>
          <LanguageSelector variant="dark" />
        </div>

        <div className="w-full max-w-sm relative z-10 space-y-8">
          <div className="lg:hidden text-center landing-fade-in-1">
            <img src={logoImage} alt="Akuris" className="h-12 mx-auto object-contain" />
            <p className="text-white/40 text-xs mt-2 tracking-wide">{t('auth.mobileSubtitle')}</p>
          </div>

          <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-8 shadow-2xl space-y-7 landing-fade-in-2 overflow-hidden">
            <CornerAccent />

            <div className="space-y-2">
              <span className="block text-primary/70 text-[10px] tracking-[0.22em] font-medium uppercase">
                {t('auth.eyebrowWelcome')}
              </span>
              <h2 className="text-2xl font-semibold text-white tracking-tight">
                {t('auth.heading')}
              </h2>
            </div>

            <form onSubmit={handleSignIn} className="space-y-5">
              <div className="space-y-1.5 landing-fade-in-3">
                <Label htmlFor="email" className="text-white/65 text-[11px] tracking-wide font-medium uppercase">{t('auth.email')}</Label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40 group-focus-within:text-primary transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('auth.emailPlaceholder')}
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(p => ({ ...p, email: undefined })); }}
                    autoFocus
                    className={`h-12 pl-10 rounded-lg bg-[hsl(230,25%,9%)] border-white/[0.08] text-white placeholder:text-white/25 focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all ${errors.email ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-1.5 landing-fade-in-4">
                <Label htmlFor="password" className="text-white/65 text-[11px] tracking-wide font-medium uppercase">{t('auth.password')}</Label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40 group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors(p => ({ ...p, password: undefined })); }}
                    className={`h-12 pl-10 pr-11 rounded-lg bg-[hsl(230,25%,9%)] border-white/[0.08] text-white placeholder:text-white/25 focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all ${errors.password ? 'border-destructive' : ''}`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>

              <div className="flex items-center justify-between landing-fade-in-5">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" checked={rememberMe} onCheckedChange={(c) => setRememberMe(c as boolean)} />
                  <Label htmlFor="remember" className="text-xs text-white/55 cursor-pointer">{t('auth.rememberMe')}</Label>
                </div>
                <button type="button" onClick={() => setForgotPasswordDialogOpen(true)} className="text-xs text-primary hover:text-primary/80 hover:underline transition-colors">
                  {t('auth.forgotPassword')}
                </button>
              </div>

              <Button
                type="submit"
                className="group w-full h-12 font-semibold text-sm bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.5)] hover:shadow-[0_10px_30px_-8px_hsl(var(--primary)/0.6)] transition-all rounded-lg"
                disabled={isBusy}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  {t('auth.signIn')}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Button>
            </form>

          </div>

          <div className="text-center space-y-2 landing-fade-in-5">
            <Link to="/politica-privacidade" target="_blank" className="text-white/30 hover:text-primary text-xs transition-colors block">
              {t('auth.privacyPolicy')}
            </Link>
            <p className="text-white/20 text-xs">© {new Date().getFullYear()} Akuris — {t('auth.allRightsReserved')}</p>
          </div>
        </div>
      </div>

      <ForgotPasswordDialog open={forgotPasswordDialogOpen} onOpenChange={setForgotPasswordDialogOpen} />
    </div>
  );
};

export default Auth;
