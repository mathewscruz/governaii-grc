import React from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
  routeKey: string;
}

/**
 * Aplica `animate-page-enter` a cada mudança de rota.
 * O `key` força remount do wrapper, fazendo a animação re-disparar
 * em todas as transições (não apenas no primeiro mount).
 */
const PageTransition: React.FC<PageTransitionProps> = ({ children, routeKey }) => {
  return (
    <div key={routeKey} className="animate-page-enter will-change-[opacity,transform]">
      {children}
    </div>
  );
};

export default PageTransition;
