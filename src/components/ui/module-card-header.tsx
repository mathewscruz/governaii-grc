import React from 'react';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/icons/Icon';
import type { LucideIcon } from 'lucide-react';

interface ModuleCardHeaderProps {
  icon?: LucideIcon | React.ComponentType<any>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Header unificado para cards de módulo do Akuris.
 * Garante padrão visual: ícone proprietário (stroke 1.5) + título + ação opcional.
 */
export const ModuleCardHeader: React.FC<ModuleCardHeaderProps> = ({
  icon: IconComponent,
  title,
  description,
  action,
  className,
  size = 'md',
}) => {
  const titleSize = size === 'lg' ? 'text-lg' : size === 'sm' ? 'text-sm' : 'text-base';
  const iconSize = size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'md';

  return (
    <div className={cn('flex items-start justify-between gap-3 mb-4', className)}>
      <div className="flex items-center gap-3 min-w-0">
        {IconComponent && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
            <Icon as={IconComponent as any} size={iconSize} />
          </div>
        )}
        <div className="min-w-0">
          <h3 className={cn('font-semibold text-foreground tracking-tight truncate', titleSize)}>
            {title}
          </h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
};

export default ModuleCardHeader;
