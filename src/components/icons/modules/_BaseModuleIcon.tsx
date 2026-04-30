import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Base SVG component compartilhado por todos os ícones de módulo Akuris.
 * Define a "linguagem visual" comum:
 *   - viewBox 24x24
 *   - stroke 1.75 (ligeiramente mais grosso que ações para "peso de marca")
 *   - currentColor (herda do contexto, theme-safe)
 *   - linecap/linejoin round
 */

export interface ModuleIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export const BaseModuleIcon = React.forwardRef<
  SVGSVGElement,
  ModuleIconProps & { children: React.ReactNode }
>(({ size = 18, className, children, ...rest }, ref) => (
  <svg
    ref={ref}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn(className)}
    aria-hidden="true"
    {...rest}
  >
    {children}
  </svg>
));

BaseModuleIcon.displayName = 'BaseModuleIcon';
