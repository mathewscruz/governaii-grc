import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Icon } from '@/components/icons/Icon';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const isDark = theme === 'dark';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={toggleTheme}
          aria-label={isDark ? t('theme.toggleLight') : t('theme.toggleDark')}
        >
          <Icon as={isDark ? Sun : Moon} size="md" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {isDark ? t('theme.toggleLight') : t('theme.toggleDark')}
      </TooltipContent>
    </Tooltip>
  );
};

export default ThemeToggle;
