import * as React from 'react';
import { BaseModuleIcon, type ModuleIconProps } from './_BaseModuleIcon';

/** Ativos — Cubo isométrico com base (representa inventário/inventários técnicos). */
export const AtivosIcon = React.forwardRef<SVGSVGElement, ModuleIconProps>((props, ref) => (
  <BaseModuleIcon ref={ref} {...props}>
    <path d="M12 3 L20 7 L20 17 L12 21 L4 17 L4 7 Z" />
    <path d="M4 7 L12 11 L20 7" />
    <line x1="12" y1="11" x2="12" y2="21" />
  </BaseModuleIcon>
));
AtivosIcon.displayName = 'AtivosIcon';
