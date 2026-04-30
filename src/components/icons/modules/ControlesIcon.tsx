import * as React from 'react';
import { BaseModuleIcon, type ModuleIconProps } from './_BaseModuleIcon';

/** Controles — Escudo com 3 linhas internas (controles ativos). */
export const ControlesIcon = React.forwardRef<SVGSVGElement, ModuleIconProps>((props, ref) => (
  <BaseModuleIcon ref={ref} {...props}>
    <path d="M12 3 L20 6 V12 C20 16.5 16.5 19.8 12 21 C7.5 19.8 4 16.5 4 12 V6 Z" />
    <line x1="8.5" y1="10" x2="15.5" y2="10" />
    <line x1="8.5" y1="13" x2="15.5" y2="13" />
    <line x1="8.5" y1="16" x2="13" y2="16" />
  </BaseModuleIcon>
));
ControlesIcon.displayName = 'ControlesIcon';
