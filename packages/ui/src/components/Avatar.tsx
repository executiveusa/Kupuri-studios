import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

const avatarVariants = cva(
  'relative flex shrink-0 overflow-hidden rounded-full',
  {
    variants: {
      size: {
        xs: 'h-6 w-6',
        sm: 'h-8 w-8',
        md: 'h-10 w-10',
        lg: 'h-12 w-12',
        xl: 'h-16 w-16',
        '2xl': 'h-24 w-24'
      }
    },
    defaultVariants: {
      size: 'md'
    }
  }
);

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string;
  alt?: string;
  fallback?: string;
  status?: 'online' | 'offline' | 'busy' | 'away';
}

/**
 * Avatar - User avatar with status indicator
 * Part of @kupuri/ui shared component library
 */
export function Avatar({
  className,
  size,
  src,
  alt,
  fallback,
  status,
  ...props
}: AvatarProps) {
  const [imageError, setImageError] = React.useState(false);

  const initials = fallback
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    busy: 'bg-red-500',
    away: 'bg-yellow-500'
  };

  const statusSizes = {
    xs: 'h-1.5 w-1.5',
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
    xl: 'h-3.5 w-3.5',
    '2xl': 'h-4 w-4'
  };

  return (
    <div className={cn(avatarVariants({ size }), className)} {...props}>
      {src && !imageError ? (
        <img
          src={src}
          alt={alt || 'Avatar'}
          className="aspect-square h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
          <span className={cn(
            'font-medium',
            size === 'xs' && 'text-[8px]',
            size === 'sm' && 'text-[10px]',
            size === 'md' && 'text-xs',
            size === 'lg' && 'text-sm',
            size === 'xl' && 'text-base',
            size === '2xl' && 'text-xl'
          )}>
            {initials}
          </span>
        </div>
      )}
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-background',
            statusColors[status],
            statusSizes[size || 'md']
          )}
        />
      )}
    </div>
  );
}

// Avatar Group
interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export function AvatarGroup({ children, max = 4, size = 'md', className, ...props }: AvatarGroupProps) {
  const childArray = React.Children.toArray(children);
  const visibleChildren = childArray.slice(0, max);
  const remainingCount = childArray.length - max;

  return (
    <div className={cn('flex -space-x-2', className)} {...props}>
      {visibleChildren.map((child, index) => (
        <div key={index} className="ring-2 ring-background rounded-full">
          {React.isValidElement(child) && React.cloneElement(child as React.ReactElement<AvatarProps>, { size })}
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            avatarVariants({ size }),
            'flex items-center justify-center bg-muted text-muted-foreground ring-2 ring-background'
          )}
        >
          <span className="text-xs font-medium">+{remainingCount}</span>
        </div>
      )}
    </div>
  );
}
