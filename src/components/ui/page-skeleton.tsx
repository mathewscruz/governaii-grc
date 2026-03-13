import akurisLogo from '@/assets/akuris-logo.png';

interface PageSkeletonProps {
  variant?: 'table' | 'cards' | 'dashboard';
  fullScreen?: boolean;
}

export function PageSkeleton({ variant: _variant = 'table', fullScreen = false }: PageSkeletonProps) {
  return (
    <div className={`flex items-center justify-center w-full bg-primary ${fullScreen ? 'min-h-screen fixed inset-0 z-50' : 'min-h-[40vh] rounded-2xl'}`}>
      <div className="relative flex items-center justify-center animate-fade-in">
        {/* Spinning ring */}
        <div className="absolute h-24 w-24 animate-spin rounded-full border-4 border-primary-foreground/20 border-t-primary-foreground" />
        {/* Logo */}
        <img
          src={akurisLogo}
          alt="Akuris"
          className="h-10 brightness-0 invert"
        />
      </div>
    </div>
  );
}
