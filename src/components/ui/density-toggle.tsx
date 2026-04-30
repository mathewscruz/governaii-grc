import * as React from 'react';
import { Rows3, Rows2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Icon } from '@/components/icons/Icon';
import { useTableDensity } from '@/hooks/useTableDensity';
import { useLanguage } from '@/contexts/LanguageContext';

interface DensityToggleProps {
  className?: string;
}

/**
 * Toggle compact/comfortable para tabelas. Persiste em localStorage e propaga
 * via custom event para todas as tabelas conectadas a `useTableDensity`.
 */
export const DensityToggle: React.FC<DensityToggleProps> = ({ className }) => {
  const [density, , toggle] = useTableDensity();
  const { t } = useLanguage();
  const isCompact = density === 'compact';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={toggle}
          className={className}
          aria-label={isCompact ? t('table.densityComfortable') : t('table.densityCompact')}
        >
          <Icon as={isCompact ? Rows3 : Rows2} size="sm" className="mr-1.5" />
          <span className="text-xs">
            {isCompact ? t('table.densityCompact') : t('table.densityComfortable')}
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {isCompact ? t('table.densityComfortable') : t('table.densityCompact')}
      </TooltipContent>
    </Tooltip>
  );
};

export default DensityToggle;
