import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/80',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        success: 'bg-green-500/20 text-green-700 dark:text-green-400',
        warning: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
        info: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
        // Kupuri ecosystem variants
        jaaz: 'bg-purple-500/20 text-purple-700 dark:text-purple-400',
        postiz: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
        premium: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
}

/**
 * Badge - Status and label indicator
 * Part of @kupuri/ui shared component library
 */
export function Badge({ className, variant, icon, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {icon && <span className="mr-1 -ml-0.5">{icon}</span>}
      {children}
    </div>
  );
}

// Status Badge with animated dot
interface StatusBadgeProps {
  status: 'online' | 'offline' | 'busy' | 'away' | 'processing';
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const statusConfig = {
    online: { color: 'bg-green-500', text: 'Online' },
    offline: { color: 'bg-gray-400', text: 'Offline' },
    busy: { color: 'bg-red-500', text: 'Busy' },
    away: { color: 'bg-yellow-500', text: 'Away' },
    processing: { color: 'bg-blue-500', text: 'Processing' }
  };

  const config = statusConfig[status];

  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 rounded-full border bg-background px-2 py-0.5 text-xs font-medium',
      className
    )}>
      <span className={cn('h-2 w-2 rounded-full', config.color, status === 'processing' && 'animate-pulse')} />
      {label || config.text}
    </div>
  );
}

// Token Count Badge
interface TokenBadgeProps {
  count: number;
  className?: string;
}

export function TokenBadge({ count, className }: TokenBadgeProps) {
  const formatted = count >= 1000 
    ? `${(count / 1000).toFixed(1)}k` 
    : count.toString();

  return (
    <div className={cn(
      'inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 px-2 py-0.5 text-xs font-mono font-semibold',
      className
    )}>
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v12M6 12h12" />
      </svg>
      {formatted}
    </div>
  );
}

// Plan Badge
interface PlanBadgeProps {
  plan: 'free' | 'pro' | 'enterprise';
  className?: string;
}

export function PlanBadge({ plan, className }: PlanBadgeProps) {
  const planConfig = {
    free: { variant: 'outline' as const, label: 'FREE' },
    pro: { variant: 'premium' as const, label: 'PRO' },
    enterprise: { variant: 'premium' as const, label: 'ENTERPRISE' }
  };

  const config = planConfig[plan];

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
