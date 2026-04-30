import * as React from 'react';
import { BaseModuleIcon, type ModuleIconProps } from './_BaseModuleIcon';

/** Gap Analysis — Alvo com seta indicando o "gap" entre atual e meta. */
export const GapAnalysisIcon = React.forwardRef<SVGSVGElement, ModuleIconProps>((props, ref) => (
  <BaseModuleIcon ref={ref} {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    <path d="M19 5 L12 12" />
  </BaseModuleIcon>
));
GapAnalysisIcon.displayName = 'GapAnalysisIcon';
