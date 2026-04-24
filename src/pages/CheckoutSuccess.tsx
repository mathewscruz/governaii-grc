import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, LogIn } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import logoImage from '@/assets/akuris-logo.png';
import { useLanguage } from '@/contexts/LanguageContext';

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [countdown, setCountdown] = useState(5);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });
  }, []);

  useEffect(() => {
    if (isAuthenticated === null) return;
    if (!isAuthenticated) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate, isAuthenticated]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(216,60%,8%)] via-[hsl(216,45%,12%)] to-[hsl(216,60%,8%)] px-4">
      <div className="text-center space-y-6 max-w-md">
        <img src={logoImage} alt="Akuris" className="h-14 mx-auto object-contain" />
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">{t('checkoutSuccessPage.title')}</h1>

        {isAuthenticated === null && (
          <Loader2 className="w-5 h-5 text-primary animate-spin mx-auto" />
        )}

        {isAuthenticated === true && (
          <>
            <p className="text-white/50 text-sm">
              {t('checkoutSuccessPage.redirectMessage', { seconds: countdown })}
            </p>
            <Loader2 className="w-5 h-5 text-primary animate-spin mx-auto" />
          </>
        )}

        {isAuthenticated === false && (
          <>
            <p className="text-white/50 text-sm">
              {t('checkoutSuccessPage.notLoggedMessage')}
            </p>
            <Button onClick={() => navigate('/auth')} className="gap-2">
              <LogIn className="w-4 h-4" />
              {t('checkoutSuccessPage.loginButton')}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default CheckoutSuccess;
