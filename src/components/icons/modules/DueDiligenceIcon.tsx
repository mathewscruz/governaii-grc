import * as React from 'react';
import { BaseModuleIcon, type ModuleIconProps } from './_BaseModuleIcon';

/** Due Diligence — Lupa com mini check (verificação aprovada). */
export const DueDiligenceIcon = React.forwardRef<SVGSVGElement, ModuleIconProps>((props, ref) => (
  <BaseModuleIcon ref={ref} {...props}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M15.5 15.5 L20 20" />
    <path d="M8 10.5 L10 12.5 L13.5 9" />
  </BaseModuleIcon>
));
DueDiligenceIcon.displayName = 'DueDiligenceIcon';
