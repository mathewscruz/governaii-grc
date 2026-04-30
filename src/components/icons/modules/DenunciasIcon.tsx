import * as React from 'react';
import { BaseModuleIcon, type ModuleIconProps } from './_BaseModuleIcon';

/** Denúncias — Balão de fala com ponto de exclamação (canal de reporte). */
export const DenunciasIcon = React.forwardRef<SVGSVGElement, ModuleIconProps>((props, ref) => (
  <BaseModuleIcon ref={ref} {...props}>
    <path d="M4 5 H20 V16 H13 L8.5 20 V16 H4 Z" />
    <line x1="12" y1="8.5" x2="12" y2="12" />
    <circle cx="12" cy="13.6" r="0.6" fill="currentColor" stroke="none" />
  </BaseModuleIcon>
));
DenunciasIcon.displayName = 'DenunciasIcon';
