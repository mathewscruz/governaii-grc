import React from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
  routeKey: string;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children, routeKey }) => {
  return (
    <div 
      key={routeKey}
      className="animate-page-enter will-change-[opacity]"
    >
      {children}
    </div>
  );
};

export default PageTransition;
