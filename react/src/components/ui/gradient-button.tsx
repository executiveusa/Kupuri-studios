/**
 * Kupuri Studios - Gradient Button Component
 * ==========================================
 * Animated gradient buttons with glow effects
 */

import { cn } from '@/lib/utils';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'brand' | 'ghost' | 'outline';
  /** Button size */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Loading state */
  loading?: boolean;
  /** Icon to display before text */
  leftIcon?: ReactNode;
  /** Icon to display after text */
  rightIcon?: ReactNode;
  /** Enable glow effect */
  glow?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Children */
  children?: ReactNode;
}

const sizeClasses = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
  xl: 'h-14 px-8 text-lg gap-3',
};

const iconSizes = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
  xl: 'w-6 h-6',
};

export const GradientButton = forwardRef<HTMLButtonElement, GradientButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      glow = true,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          // Base styles
          'relative inline-flex items-center justify-center',
          'font-medium rounded-xl',
          'transition-all duration-200 ease-out',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          
          // Size
          sizeClasses[size],
          
          // Full width
          fullWidth && 'w-full',
          
          // Variants
          variant === 'primary' && [
            'bg-gradient-to-r from-purple-600 to-purple-700',
            'hover:from-purple-500 hover:to-purple-600',
            'text-white',
            'focus:ring-purple-500',
            glow && 'hover:shadow-[0_0_30px_rgba(124,58,237,0.4)]',
          ],
          
          variant === 'secondary' && [
            'bg-gradient-to-r from-orange-500 to-orange-600',
            'hover:from-orange-400 hover:to-orange-500',
            'text-white',
            'focus:ring-orange-500',
            glow && 'hover:shadow-[0_0_30px_rgba(255,107,53,0.4)]',
          ],
          
          variant === 'brand' && [
            'bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500',
            'hover:from-purple-500 hover:via-pink-400 hover:to-orange-400',
            'text-white',
            'focus:ring-purple-500',
            glow && 'hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]',
            'animate-gradient-x bg-[length:200%_100%]',
          ],
          
          variant === 'ghost' && [
            'bg-transparent',
            'hover:bg-white/10 dark:hover:bg-neutral-800/50',
            'text-neutral-700 dark:text-neutral-200',
            'focus:ring-neutral-400',
          ],
          
          variant === 'outline' && [
            'bg-transparent',
            'border-2 border-purple-500/50',
            'hover:border-purple-500 hover:bg-purple-500/10',
            'text-purple-600 dark:text-purple-400',
            'focus:ring-purple-500',
          ],
          
          // Disabled state
          isDisabled && [
            'opacity-50 cursor-not-allowed',
            'hover:shadow-none hover:transform-none',
          ],
          
          className
        )}
        {...props}
      >
        {/* Animated shine effect */}
        {(variant === 'primary' || variant === 'secondary' || variant === 'brand') && !isDisabled && (
          <span
            className={cn(
              'absolute inset-0 rounded-xl overflow-hidden',
              'before:absolute before:inset-0',
              'before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent',
              'before:translate-x-[-200%]',
              'hover:before:translate-x-[200%]',
              'before:transition-transform before:duration-700'
            )}
          />
        )}
        
        {/* Content */}
        <span className="relative flex items-center justify-center gap-inherit">
          {loading ? (
            <Loader2 className={cn('animate-spin', iconSizes[size])} />
          ) : leftIcon ? (
            <span className={iconSizes[size]}>{leftIcon}</span>
          ) : null}
          
          {children}
          
          {!loading && rightIcon && (
            <span className={iconSizes[size]}>{rightIcon}</span>
          )}
        </span>
      </button>
    );
  }
);

GradientButton.displayName = 'GradientButton';

/**
 * Icon Button variant
 */
interface IconButtonProps extends Omit<GradientButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  icon: ReactNode;
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, icon, size = 'md', ...props }, ref) => {
    const iconOnlySizes = {
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-12 w-12',
      xl: 'h-14 w-14',
    };

    return (
      <GradientButton
        ref={ref}
        size={size}
        className={cn(iconOnlySizes[size], 'px-0', className)}
        {...props}
      >
        <span className={iconSizes[size]}>{icon}</span>
      </GradientButton>
    );
  }
);

IconButton.displayName = 'IconButton';

export default GradientButton;

// Add gradient animation keyframes
const style = document.createElement('style');
style.textContent = `
  @keyframes gradient-x {
    0%, 100% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
  }
  .animate-gradient-x {
    animation: gradient-x 3s ease infinite;
  }
`;
if (typeof document !== 'undefined' && !document.querySelector('#gradient-button-styles')) {
  style.id = 'gradient-button-styles';
  document.head.appendChild(style);
}
