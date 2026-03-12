import akurisLogo from '@/assets/akuris-logo.png';

interface PageSkeletonProps {
  variant?: 'table' | 'cards' | 'dashboard';
}

export function PageSkeleton({ variant: _variant = 'table' }: PageSkeletonProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] w-full gap-4">
      <img
        src={akurisLogo}
        alt="Akuris"
        className="h-10 animate-pulse"
      />
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
        <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
        <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}
