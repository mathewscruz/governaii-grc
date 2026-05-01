import * as React from 'react';
import { BaseModuleIcon, type ModuleIconProps } from './_BaseModuleIcon';

/**
 * Akuris AI — Marca proprietária para qualquer ação de IA do sistema.
 * Conceito: spark de 4 pontas (gema/diamante) circundado por um anel sutil,
 * sem clichês de robô/cérebro. Substitui Brain/Sparkles/Wand2/ScanSearch.
 */
export const AkurisAIIcon = React.forwardRef<SVGSVGElement, ModuleIconProps>((props, ref) => (
  <BaseModuleIcon ref={ref} {...props}>
    {/* Anel externo sutil (presença de IA orbitando) */}
    <circle cx="12" cy="12" r="9" opacity="0.35" />
    {/* Spark principal — 4 pontas (estrela Akuris) */}
    <path d="M12 4.5 L13.6 10.4 L19.5 12 L13.6 13.6 L12 19.5 L10.4 13.6 L4.5 12 L10.4 10.4 Z" />
    {/* Núcleo */}
    <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
  </BaseModuleIcon>
));
AkurisAIIcon.displayName = 'AkurisAIIcon';
