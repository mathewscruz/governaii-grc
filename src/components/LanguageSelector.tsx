import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export function LanguageSelector() {
  const { locale, setLocale } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 gap-1.5 text-xs font-medium"
      onClick={() => setLocale(locale === 'pt' ? 'en' : 'pt')}
    >
      <Globe className="h-3.5 w-3.5" />
      {locale === 'pt' ? 'PT' : 'EN'}
    </Button>
  );
}
