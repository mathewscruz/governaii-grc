import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LanguageSelectorProps {
  variant?: 'default' | 'dark';
}

export function LanguageSelector({ variant = 'default' }: LanguageSelectorProps) {
  const { locale, setLocale } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "h-8 gap-1.5 text-xs font-medium",
        variant === 'dark' && "text-white/60 hover:text-white hover:bg-white/10"
      )}
      onClick={() => setLocale(locale === 'pt' ? 'en' : 'pt')}
    >
      <Globe className="h-3.5 w-3.5" />
      {locale === 'pt' ? 'PT' : 'EN'}
    </Button>
  );
}
