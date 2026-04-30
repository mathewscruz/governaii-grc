import * as React from 'react';
import { BaseModuleIcon, type ModuleIconProps } from './_BaseModuleIcon';

/** Incidentes — Raio dentro de círculo de impacto. */
export const IncidentesIcon = React.forwardRef<SVGSVGElement, ModuleIconProps>((props, ref) => (
  <BaseModuleIcon ref={ref} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M13 6 L8.5 13 L11.5 13 L11 18 L15.5 11 L12.5 11 Z" />
  </BaseModuleIcon>
));
IncidentesIcon.displayName = 'IncidentesIcon';
