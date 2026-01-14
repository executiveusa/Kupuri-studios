/**
 * Kupuri Studios - Glass Card Component
 * ======================================
 * Pickaxe.io inspired glassmorphism card with hover effects
 */

import { cn } from '@/lib/utils';
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Card variant */
  variant?: 'default' | 'elevated' | 'bordered' | 'gradient';
  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /** Enable hover effects */
  hoverable?: boolean;
  /** Enable glow effect on hover */
  glow?: boolean;
  /** Glow color */
  glowColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  /** Children */
  children?: ReactNode;
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
};

const glowClasses = {
  primary: 'hover:shadow-[0_0_30px_rgba(124,58,237,0.3)]',
  secondary: 'hover:shadow-[0_0_30px_rgba(255,107,53,0.3)]',
  success: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]',
  warning: 'hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]',
  error: 'hover:shadow-[0_0_30px_rgba(239,68,68,0.3)]',
};

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      className,
      variant = 'default',
      padding = 'md',
      hoverable = true,
      glow = false,
      glowColor = 'primary',
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base glass styles
          'relative overflow-hidden rounded-xl',
          'bg-white/70 dark:bg-neutral-900/80',
          'backdrop-blur-xl',
          'border border-white/30 dark:border-neutral-700/50',
          'shadow-lg shadow-black/5 dark:shadow-black/20',
          
          // Transitions
          'transition-all duration-200 ease-out',
          
          // Padding
          paddingClasses[padding],
          
          // Variant styles
          variant === 'elevated' && [
            'shadow-xl',
            'border-white/40 dark:border-neutral-600/50',
          ],
          variant === 'bordered' && [
            'border-2',
            'border-purple-500/30 dark:border-purple-400/30',
          ],
          variant === 'gradient' && [
            'bg-gradient-to-br from-white/80 to-white/60',
            'dark:from-neutral-900/90 dark:to-neutral-900/70',
          ],
          
          // Hoverable
          hoverable && [
            'cursor-pointer',
            'hover:bg-white/85 dark:hover:bg-neutral-800/90',
            'hover:border-white/50 dark:hover:border-neutral-600/60',
            'hover:shadow-xl',
            'hover:-translate-y-0.5',
          ],
          
          // Glow effect
          glow && hoverable && glowClasses[glowColor],
          
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

/**
 * Glass Card Header
 */
interface GlassCardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export const GlassCardHeader = forwardRef<HTMLDivElement, GlassCardHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col space-y-1.5 pb-4',
          'border-b border-white/20 dark:border-neutral-700/30',
          '-mx-4 px-4 mb-4',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCardHeader.displayName = 'GlassCardHeader';

/**
 * Glass Card Title
 */
interface GlassCardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children?: ReactNode;
}

export const GlassCardTitle = forwardRef<HTMLHeadingElement, GlassCardTitleProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn(
          'text-lg font-semibold leading-tight tracking-tight',
          'text-neutral-900 dark:text-neutral-50',
          className
        )}
        {...props}
      >
        {children}
      </h3>
    );
  }
);

GlassCardTitle.displayName = 'GlassCardTitle';

/**
 * Glass Card Description
 */
interface GlassCardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children?: ReactNode;
}

export const GlassCardDescription = forwardRef<HTMLParagraphElement, GlassCardDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn(
          'text-sm text-neutral-500 dark:text-neutral-400',
          className
        )}
        {...props}
      >
        {children}
      </p>
    );
  }
);

GlassCardDescription.displayName = 'GlassCardDescription';

/**
 * Glass Card Content
 */
interface GlassCardContentProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export const GlassCardContent = forwardRef<HTMLDivElement, GlassCardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCardContent.displayName = 'GlassCardContent';

/**
 * Glass Card Footer
 */
interface GlassCardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export const GlassCardFooter = forwardRef<HTMLDivElement, GlassCardFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center pt-4',
          'border-t border-white/20 dark:border-neutral-700/30',
          '-mx-4 px-4 mt-4',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCardFooter.displayName = 'GlassCardFooter';

export default GlassCard;
