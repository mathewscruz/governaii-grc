import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
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
        "h-8 gap-1.5 text-base px-2",
        variant === 'dark' && "hover:bg-white/10"
      )}
      onClick={() => setLocale(locale === 'pt' ? 'en' : 'pt')}
      title={locale === 'pt' ? 'Switch to English' : 'Mudar para Português'}
    >
      {locale === 'pt' ? '🇧🇷' : '🇬🇧'}
    </Button>
  );
}
