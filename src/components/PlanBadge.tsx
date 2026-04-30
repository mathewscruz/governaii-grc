import { Shield, ShieldCheck, Crown, Sparkles, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PlanBadgeProps {
  planCode?: string;
  planName: string;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

// Maps a plan code or ordering hint to a visual configuration. Falls back gracefully
// for custom plans created by super-admins.
const ICON_MAP: Record<string, React.ElementType> = {
  free: Sparkles,
  trial: Sparkles,
  compliance_start: Shield,
  starter: Shield,
  basic: Shield,
  grc_manager: ShieldCheck,
  professional: ShieldCheck,
  pro: ShieldCheck,
  governaii_enterprise: Crown,
  enterprise: Crown,
};

export function PlanBadge({ planCode = '', planName, size = 'md', showName = true }: PlanBadgeProps) {
  const Icon = ICON_MAP[planCode.toLowerCase()] || Star;

  const sizeClasses = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const badgeSizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  if (!showName) {
    return (
      <div className="inline-flex items-center justify-center rounded-full p-2 bg-primary/10 text-primary">
        <Icon className={sizeClasses[size]} />
      </div>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1.5 font-medium border-primary/40 text-primary bg-primary/5',
        badgeSizeClasses[size]
      )}
    >
      <Icon className={sizeClasses[size]} />
      {planName}
    </Badge>
  );
}
