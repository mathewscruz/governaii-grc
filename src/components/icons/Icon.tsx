import * as React from 'react';
import type { LucideIcon, LucideProps } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Akuris Icon System
 * --------------------------------------------------------------------------
 * Wrapper que aplica o "feel" Akuris a qualquer Lucide icon.
 *
 * Assinatura visual da marca:
 *   - strokeWidth 1.5 (vs. 2.0 padrão Lucide) → linhas mais finas, premium.
 *   - Tamanhos canônicos via prop semântica (sem h-N w-N solto).
 *
 * NUNCA importe Lucide direto em componentes novos para os conceitos
 * mapeados em `@/components/icons` — use o catálogo semântico.
 */

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZE_MAP: Record<IconSize, number> = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
};

export interface IconProps extends Omit<LucideProps, 'size'> {
  as: LucideIcon;
  size?: IconSize | number;
}

export const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ as: LucideIcon, size = 'md', strokeWidth = 1.5, className, ...rest }, ref) => {
    const numericSize = typeof size === 'number' ? size : SIZE_MAP[size];
    return (
      <LucideIcon
        ref={ref}
        size={numericSize}
        strokeWidth={strokeWidth}
        className={cn(className)}
        {...rest}
      />
    );
  }
);

Icon.displayName = 'AkurisIcon';
