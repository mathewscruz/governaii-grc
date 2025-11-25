import { Shield, ShieldCheck, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PlanBadgeProps {
  planCode: 'compliance_start' | 'grc_manager' | 'governaii_enterprise';
  planName: string;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

export function PlanBadge({ planCode, planName, size = 'md', showName = true }: PlanBadgeProps) {
  const configs = {
    compliance_start: {
      icon: Shield,
      color: 'bg-gray-500',
      textColor: 'text-gray-500',
      borderColor: 'border-gray-500',
      label: 'Compliance Start'
    },
    grc_manager: {
      icon: ShieldCheck,
      color: 'bg-blue-500',
      textColor: 'text-blue-500',
      borderColor: 'border-blue-500',
      label: 'GRC Manager'
    },
    governaii_enterprise: {
      icon: Crown,
      color: 'bg-amber-500',
      textColor: 'text-amber-500',
      borderColor: 'border-amber-500',
      label: 'GovernAII Enterprise'
    }
  };

  const config = configs[planCode] || configs.compliance_start;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const badgeSizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  if (!showName) {
    return (
      <div className={cn(
        'inline-flex items-center justify-center rounded-full p-2',
        config.color,
        'shadow-md'
      )}>
        <Icon className={cn(sizeClasses[size], 'text-white')} />
      </div>
    );
  }

  return (
    <Badge 
      variant="outline" 
      className={cn(
        'inline-flex items-center gap-1.5 font-medium',
        config.borderColor,
        config.textColor,
        badgeSizeClasses[size]
      )}
    >
      <Icon className={sizeClasses[size]} />
      {planName || config.label}
    </Badge>
  );
}
