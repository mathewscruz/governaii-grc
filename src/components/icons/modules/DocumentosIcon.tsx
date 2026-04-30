import * as React from 'react';
import { BaseModuleIcon, type ModuleIconProps } from './_BaseModuleIcon';

/** Documentos — Folha com canto dobrado e selo de aprovação. */
export const DocumentosIcon = React.forwardRef<SVGSVGElement, ModuleIconProps>((props, ref) => (
  <BaseModuleIcon ref={ref} {...props}>
    <path d="M6 3 H14 L19 8 V21 H6 Z" />
    <path d="M14 3 V8 H19" />
    <line x1="9" y1="13" x2="16" y2="13" />
    <line x1="9" y1="16" x2="14" y2="16" />
    <circle cx="9.25" cy="13" r="0.1" />
  </BaseModuleIcon>
));
DocumentosIcon.displayName = 'DocumentosIcon';
