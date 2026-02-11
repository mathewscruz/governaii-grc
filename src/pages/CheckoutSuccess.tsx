import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2 } from 'lucide-react';
import logoImage from '@/assets/akuris-logo.png';

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
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
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(216,60%,8%)] via-[hsl(216,45%,12%)] to-[hsl(216,60%,8%)] px-4">
      <div className="text-center space-y-6 max-w-md">
        <img src={logoImage} alt="Akuris" className="h-14 mx-auto object-contain" />
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">Assinatura confirmada!</h1>
        <p className="text-white/50 text-sm">
          Sua conta está pronta. Você será redirecionado para o dashboard em {countdown} segundos...
        </p>
        <Loader2 className="w-5 h-5 text-primary animate-spin mx-auto" />
      </div>
    </div>
  );
};

export default CheckoutSuccess;
