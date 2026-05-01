import React, { useState, useEffect, useRef } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Eye, EyeOff, CheckCircle2, Shield, BarChart3, FileCheck, Mail, Lock } from 'lucide-react';
import logoImage from '@/assets/akuris-logo.png';
import { ForgotPasswordDialog } from '@/components/ForgotPasswordDialog';
import { LanguageSelector } from '@/components/LanguageSelector';
import { MFAVerification } from '@/components/MFAVerification';
import { useLanguage } from '@/contexts/LanguageContext';
import { z } from 'zod';
import { logger } from '@/lib/logger';

import { AkurisPulse } from '@/components/ui/AkurisPulse';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
const Auth = () => {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [forgotPasswordDialogOpen, setForgotPasswordDialogOpen] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  // MFA state
  const mfaInProgressRef = useRef(false);
  const [mfaPending, setMfaPending] = useState(false);
  const [mfaUserId, setMfaUserId] = useState('');
  const [mfaEmail, setMfaEmail] = useState('');
  const [mfaPassword, setMfaPassword] = useState('');

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

  const features = [
    { icon: Shield, title: t('auth.featureGovernance'), desc: t('auth.featureGovernanceDesc') },
    { icon: BarChart3, title: t('auth.featureRisks'), desc: t('auth.featureRisksDesc') },
    { icon: FileCheck, title: t('auth.featureCompliance'), desc: t('auth.featureComplianceDesc') },
  ];

  useEffect(() => {
    const savedEmail = localStorage.getItem('akuris_remember_email');
    const savedRemember = localStorage.getItem('akuris_remember_me') === 'true';
    if (savedEmail && savedRemember) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  if (!loading && user && !mfaInProgressRef.current) return <Navigate to="/dashboard" replace />;

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
    setIsLoading(true);
    mfaInProgressRef.current = true;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      
      const userId = data.user?.id;

      if (rememberMe) {
        localStorage.setItem('akuris_remember_email', email.trim());
        localStorage.setItem('akuris_remember_me', 'true');
      } else {
        localStorage.removeItem('akuris_remember_email');
        localStorage.removeItem('akuris_remember_me');
      }

      if (userId) {
        await supabase.auth.signOut();

        try {
          const mfaResponse = await supabase.functions.invoke('send-mfa-code', {
            body: { userId, email: email.trim() },
          });

          if (mfaResponse.error) {
            logger.error('Erro ao enviar MFA, login direto', { module: 'Auth', error: String(mfaResponse.error) });
            mfaInProgressRef.current = false;
            setMfaPending(false);
            setMfaPassword('');
            const { error: reAuthError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
            if (!reAuthError) {
              setLoginSuccess(true);
              toast.success(t('auth.loginSuccess'));
            } else {
              toast.error(t('auth.errorAuth'));
            }
          } else if (mfaResponse.data?.success && mfaResponse.data?.skipped) {
            logger.debug('MFA skipped - sessão válida encontrada', { module: 'Auth' });
            mfaInProgressRef.current = false;
            setMfaPending(false);
            setMfaPassword('');
            const { error: reAuthError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
            if (!reAuthError) {
              setLoginSuccess(true);
              toast.success(t('auth.loginSuccess'));
            } else {
              toast.error(t('auth.errorAuth'));
            }
          } else if (mfaResponse.data?.success) {
            setMfaPending(true);
            setMfaUserId(userId);
            setMfaEmail(email.trim());
            setMfaPassword(password);
          } else {
            if (mfaResponse.data?.error) {
              toast.warning(mfaResponse.data.error);
            }
            mfaInProgressRef.current = false;
            setMfaPending(false);
            setMfaPassword('');
            const { error: reAuthError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
            if (!reAuthError) {
              setLoginSuccess(true);
            }
          }
        } catch (mfaError) {
          logger.error('Exceção MFA', { module: 'Auth', error: String(mfaError) });
          mfaInProgressRef.current = false;
          setMfaPending(false);
          setMfaPassword('');
          const { error: reAuthError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
          if (!reAuthError) {
            setLoginSuccess(true);
            toast.success(t('auth.loginSuccess'));
          }
        }
      }
    } catch (error: any) {
      mfaInProgressRef.current = false;
      logger.warn('Login failed', { module: 'Auth', action: 'login', details: error.message });
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleMFAVerified = async () => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ 
        email: mfaEmail, 
        password: mfaPassword 
      });
      setMfaPassword('');
      mfaInProgressRef.current = false;
      setMfaPending(false);
      
      if (error) {
        toast.error(t('auth.errorAuthAfterMFA'));
        return;
      }
      
      setLoginSuccess(true);
      toast.success(t('auth.loginSuccess'));
    } catch (err) {
      setMfaPassword('');
      mfaInProgressRef.current = false;
      setMfaPending(false);
      toast.error(t('auth.errorAuth'));
    }
  };

  const handleMFACancel = () => {
    mfaInProgressRef.current = false;
    setMfaPending(false);
    setMfaUserId('');
    setMfaEmail('');
    setMfaPassword('');
    toast.info(t('auth.loginCancelled'));
  };

  if (mfaPending) {
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
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ===== BRAND PANEL (desktop only) ===== */}
      <div className="hidden lg:flex lg:w-[60%] relative flex-col items-center justify-center sidebar-gradient overflow-hidden">
        <div className="landing-grid-bg absolute inset-0 opacity-30" />
        <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-[hsl(252,100%,66%,0.08)] rounded-full blur-[100px] glow-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[hsl(252,100%,66%,0.06)] rounded-full blur-[120px] glow-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative z-10 flex flex-col items-center gap-10 px-12 max-w-lg landing-fade-in-1">
          <img src={logoImage} alt="Akuris Logo" className="h-20 object-contain landing-fade-in-1" />
          <div className="text-center space-y-3 landing-fade-in-2">
            <h1 className="text-3xl font-bold text-white">
              {t('auth.platformTitle')} <span className="text-gradient">{t('auth.platformHighlight')}</span>
            </h1>
            <p className="text-white/50 text-sm">{t('auth.platformDesc')}</p>
          </div>

          <div className="w-full space-y-3 landing-fade-in-3">
            {features.map((f, i) => (
              <div
                key={i}
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
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-[hsl(230,25%,7%)] to-[hsl(228,20%,9%)] px-6 py-12 relative overflow-hidden">
        <div className="absolute top-4 right-4 z-20">
          <LanguageSelector variant="dark" />
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="w-full max-w-sm relative z-10 space-y-8">
          <div className="lg:hidden text-center landing-fade-in-1">
            <img src={logoImage} alt="Akuris Logo" className="h-16 mx-auto object-contain" />
            <p className="text-white/40 text-xs mt-2">{t('auth.mobileSubtitle')}</p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md p-8 shadow-2xl space-y-6 landing-fade-in-2">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold text-white">{t('auth.systemAccess')}</h2>
              <p className="text-sm text-white/50">{t('auth.enterCredentials')}</p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-5">
              <div className="space-y-1.5 landing-fade-in-3">
                <Label htmlFor="email" className="text-white/70 text-sm font-medium">{t('auth.email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('auth.emailPlaceholder')}
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(p => ({ ...p, email: undefined })); }}
                    autoFocus
                    className={`h-11 pl-9 rounded-lg bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/25 focus:border-primary focus:ring-primary ${errors.email ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-1.5 landing-fade-in-4">
                <Label htmlFor="password" className="text-white/70 text-sm font-medium">{t('auth.password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors(p => ({ ...p, password: undefined })); }}
                    className={`h-11 pl-9 pr-11 rounded-lg bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/25 focus:border-primary focus:ring-primary ${errors.password ? 'border-destructive' : ''}`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>

              <div className="flex items-center justify-between landing-fade-in-5">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" checked={rememberMe} onCheckedChange={(c) => setRememberMe(c as boolean)} />
                  <Label htmlFor="remember" className="text-xs text-white/50 cursor-pointer">{t('auth.rememberMe')}</Label>
                </div>
                <button type="button" onClick={() => setForgotPasswordDialogOpen(true)} className="text-xs text-primary hover:text-primary/80 hover:underline transition-colors">
                  {t('auth.forgotPassword')}
                </button>
              </div>

              <Button
                type="submit"
                variant="gradient"
                className="w-full h-11 font-semibold text-sm landing-glow-btn"
                disabled={isLoading || loginSuccess}
              >
                {loginSuccess ? (
                  <><CheckCircle2 className="mr-2 h-4 w-4 text-green-400" />{t('auth.success')}</>
                ) : isLoading ? (
                  <><AkurisPulse size={16} className="mr-2" />{t('auth.signingIn')}</>
                ) : (
                  t('auth.signIn')
                )}
              </Button>
            </form>

          </div>

          <div className="text-center space-y-2 landing-fade-in-5">
            <p className="text-white/40 text-sm">
              {t('auth.noAccount')}{' '}
              <Link to="/registro" className="text-primary hover:text-primary/80 hover:underline font-medium">{t('auth.createFreeAccount')}</Link>
            </p>
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
