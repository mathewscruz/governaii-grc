import * as React from 'react';
import { BaseModuleIcon, type ModuleIconProps } from './_BaseModuleIcon';

/** Riscos — Diamante (rombo) com ponto central de impacto. */
export const RiscosIcon = React.forwardRef<SVGSVGElement, ModuleIconProps>((props, ref) => (
  <BaseModuleIcon ref={ref} {...props}>
    <path d="M12 3 L21 12 L12 21 L3 12 Z" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </BaseModuleIcon>
));
RiscosIcon.displayName = 'RiscosIcon';
