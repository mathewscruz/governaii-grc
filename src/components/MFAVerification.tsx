import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { Loader2, Mail, RefreshCw, ShieldCheck } from 'lucide-react';
import logoImage from '@/assets/akuris-logo.png';
import { useLanguage } from '@/contexts/LanguageContext';

interface MFAVerificationProps {
  userId: string;
  email: string;
  onVerified: () => void;
  onCancel: () => void;
}

export const MFAVerification: React.FC<MFAVerificationProps> = ({
  userId,
  email,
  onVerified,
  onCancel,
}) => {
  const { t } = useLanguage();
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast.error(t('mfaScreen.enterFullCode'));
      return;
    }

    setIsVerifying(true);
    try {
      const response = await supabase.functions.invoke('verify-mfa-code', {
        body: { userId, code },
      });

      if (response.error) throw response.error;

      const data = response.data;
      if (data.success) {
        onVerified();
      } else {
        toast.error(data.error || t('mfaScreen.invalidCode'));
        setCode('');
      }
    } catch (error: any) {
      toast.error(t('mfaScreen.verifyError'));
      setCode('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      const response = await supabase.functions.invoke('send-mfa-code', {
        body: { userId, email },
      });

      if (response.error) throw response.error;

      const data = response.data;
      if (data.success) {
        toast.success(t('mfaScreen.newCodeSent'));
        setCountdown(60);
        setCanResend(false);
        setCode('');
      } else {
        toast.error(data.error || t('mfaScreen.resendError'));
      }
    } catch (error: any) {
      toast.error(t('mfaScreen.resendError'));
    } finally {
      setIsResending(false);
    }
  };

  // Auto-submit quando 6 dígitos
  useEffect(() => {
    if (code.length === 6) {
      handleVerify();
    }
  }, [code]);

  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(216,60%,8%)] via-[hsl(216,45%,12%)] to-[hsl(216,60%,8%)] px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <img src={logoImage} alt="Akuris" className="h-16 mx-auto" />
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/15 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-white">{t('mfaScreen.title')}</h2>
            <div className="space-y-1">
              <p className="text-sm text-white/50">
                {t('mfaScreen.description')}
              </p>
              <div className="flex items-center justify-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <span className="text-sm text-white/80 font-medium">{maskedEmail}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={(value) => setCode(value)}
              disabled={isVerifying}
            >
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <InputOTPSlot
                    key={index}
                    index={index}
                    className="w-12 h-14 text-lg font-bold bg-white/5 border-white/10 text-white"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button
            onClick={handleVerify}
            variant="gradient"
            className="w-full h-11 font-semibold"
            disabled={isVerifying || code.length !== 6}
          >
            {isVerifying ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('mfaScreen.verifying')}</>
            ) : (
              t('mfaScreen.verify')
            )}
          </Button>

          <div className="text-center space-y-3">
            <button
              onClick={handleResend}
              disabled={!canResend || isResending}
              className="text-sm text-primary hover:text-primary/80 disabled:text-white/30 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
            >
              {isResending ? (
                <><Loader2 className="w-3 h-3 animate-spin" /> {t('mfaScreen.resending')}</>
              ) : canResend ? (
                <><RefreshCw className="w-3 h-3" /> {t('mfaScreen.resendCode')}</>
              ) : (
                <>{t('mfaScreen.resendIn', { seconds: String(countdown) })}</>
              )}
            </button>

            <button
              onClick={onCancel}
              className="block w-full text-xs text-white/30 hover:text-white/50 transition-colors"
            >
              {t('mfaScreen.cancelBack')}
            </button>
          </div>
        </div>

        <p className="text-white/20 text-xs text-center">© {new Date().getFullYear()} Akuris — {t('mfaScreen.allRightsReserved')}</p>
      </div>
    </div>
  );
};
